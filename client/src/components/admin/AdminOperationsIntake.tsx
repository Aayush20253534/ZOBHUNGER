"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Building2, CheckCircle2, ChevronLeft, ChevronRight, CircleUserRound,
  ClipboardList, Download, FileText, Filter, Inbox, Landmark, LoaderCircle, Mail, MapPin, MessageSquareText,
  Phone, RefreshCw, Search, Send, ShieldCheck, UserRoundCheck, UsersRound, XCircle,
  type LucideIcon,
} from "lucide-react";
import { apiFetch, ApiError, type ApiSuccessEnvelope } from "@/lib/api";
import { adminDepartmentLabel } from "@/data/admin-experience";
import { getCurrentUser } from "@/services/auth.service";
import type { AdminDepartment, AuthUser } from "@/types/auth.types";
import "@/styles/admin-operations-intake.css";

type IntakeStatus = "SUBMITTED" | "IN_REVIEW" | "CONTACTED" | "RESOLVED" | "REJECTED" | "ARCHIVED";
type IntakeSource = "CONTACT_ENQUIRY" | "WORKFORCE_REQUIREMENT" | "PARTNER_APPLICATION" | "VENDOR_APPLICATION" | "CAREER_APPLICATION" | "PLACEMENT_CELL_APPLICATION" | "EMPLOYEE_JOINING" | "JOB_APPLICATION";
type AssignmentFilter = "ALL" | "MINE" | "UNASSIGNED";

interface Assignee { id: string; email: string; adminDepartment: AdminDepartment | null; lastLoginAt?: string | null; isActive?: boolean }
interface IntakeRow {
  id: string; sourceType: IntakeSource; sourceId: string; department: AdminDepartment; status: IntakeStatus; sourceStatus?: string | null;
  subject: string; contactName: string; contactEmail?: string | null; contactPhone?: string | null; organizationName?: string | null; city?: string | null;
  summary?: string | null; assignedAdminId?: string | null; revision: number; submittedAt: string; updatedAt: string;
  assignedAdmin?: Assignee | null; _count: { notes: number };
}
interface IntakeNote { id: string; body: string; createdAt: string; author: { id: string; email: string; adminDepartment: AdminDepartment | null } }
interface IntakeDetail extends IntakeRow { details?: Record<string, unknown> | null; sourceUpdatedAt?: string | null; notes: IntakeNote[] }
interface IntakeListData {
  items: IntakeRow[]; total: number; page: number; pageSize: number; totalPages: number;
  counts: { status: Record<string, number>; source: Record<string, number>; department: Record<string, number> };
  assignees: Assignee[];
}
interface IntakeDetailData { item: IntakeDetail; assignees: Assignee[] }

const statuses: IntakeStatus[] = ["SUBMITTED", "IN_REVIEW", "CONTACTED", "RESOLVED", "REJECTED", "ARCHIVED"];
const sources: IntakeSource[] = ["CONTACT_ENQUIRY", "WORKFORCE_REQUIREMENT", "PARTNER_APPLICATION", "VENDOR_APPLICATION", "CAREER_APPLICATION", "PLACEMENT_CELL_APPLICATION", "EMPLOYEE_JOINING", "JOB_APPLICATION"];
const departments: AdminDepartment[] = ["MAIN_ADMIN", "HR", "TECHNICAL", "PLACEMENT_CELL", "LEGAL"];

const sourceMeta: Record<IntakeSource, { label: string; icon: LucideIcon; href?: (id: string) => string }> = {
  CONTACT_ENQUIRY: { label: "Website enquiry", icon: Inbox },
  WORKFORCE_REQUIREMENT: { label: "Workforce requirement", icon: ClipboardList, href: id => `/admin/requirement-jobs/${id}` },
  PARTNER_APPLICATION: { label: "Partner application", icon: UsersRound, href: id => `/admin/partners/${id}` },
  VENDOR_APPLICATION: { label: "Vendor empanelment", icon: Building2, href: id => `/admin/vendors/${id}` },
  CAREER_APPLICATION: { label: "Career profile", icon: UserRoundCheck, href: id => `/admin/careers/${id}` },
  PLACEMENT_CELL_APPLICATION: { label: "Institution partnership", icon: Landmark },
  EMPLOYEE_JOINING: { label: "Employee joining", icon: BadgeCheck, href: id => `/admin/employee-joining/${id}` },
  JOB_APPLICATION: { label: "Job application", icon: FileText },
};

const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/(^|\s)\S/g, letter => letter.toUpperCase());
const dateTime = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const phoneHref = (value: string) => `tel:${value.replace(/[^+\d]/g, "")}`;
const terminal = (status: IntakeStatus) => ["RESOLVED", "REJECTED", "ARCHIVED"].includes(status);

function statusDescription(status: IntakeStatus) {
  switch (status) {
    case "SUBMITTED": return "New and waiting for triage";
    case "IN_REVIEW": return "Actively being reviewed";
    case "CONTACTED": return "Follow-up has started";
    case "RESOLVED": return "Completed successfully";
    case "REJECTED": return "Closed without proceeding";
    case "ARCHIVED": return "Retained for record only";
  }
}

function FieldValue({ value }: { value: unknown }) {
  if (value == null || value === "") return <span className="zbo-intake-muted">Not supplied</span>;
  if (Array.isArray(value)) return <span>{value.map(String).join(", ") || "Not supplied"}</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "object") return <span>{JSON.stringify(value)}</span>;
  return <span>{String(value)}</span>;
}

function CaseSkeleton() {
  return <div className="zbo-intake-skeleton" aria-hidden="true">{Array.from({ length: 6 }).map((_, index) => <span key={index} />)}</div>;
}

export function AdminOperationsIntake() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<IntakeListData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<IntakeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<IntakeStatus | "">("");
  const [sourceType, setSourceType] = useState<IntakeSource | "">("");
  const [department, setDepartment] = useState<AdminDepartment | "">("");
  const [assignment, setAssignment] = useState<AssignmentFilter>("ALL");
  const [page, setPage] = useState(1);
  const [note, setNote] = useState("");
  const listRequest = useRef(0);
  const detailRequest = useRef(0);

  const mainAdmin = user?.adminDepartment === "MAIN_ADMIN";
  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), assignment });
    if (query) params.set("query", query);
    if (status) params.set("status", status);
    if (sourceType) params.set("sourceType", sourceType);
    if (mainAdmin && department) params.set("department", department);
    return params.toString();
  }, [assignment, department, mainAdmin, page, query, sourceType, status]);

  const loadList = useCallback(async () => {
    const request = ++listRequest.current;
    setLoading(true); setError("");
    try {
      const result = await apiFetch<ApiSuccessEnvelope<IntakeListData>>(`/admin/intake?${queryString}`);
      if (request !== listRequest.current) return;
      setData(result.data);
      setSelectedId(current => current && result.data.items.some(item => item.id === current) ? current : result.data.items[0]?.id ?? null);
    } catch (caught) {
      if (request !== listRequest.current) return;
      setError(caught instanceof ApiError ? caught.message : "The operations intake queue could not be loaded.");
    } finally { if (request === listRequest.current) setLoading(false); }
  }, [queryString]);

  const loadDetail = useCallback(async (id: string) => {
    const request = ++detailRequest.current;
    setDetailLoading(true); setDetailError("");
    try {
      const result = await apiFetch<ApiSuccessEnvelope<IntakeDetailData>>(`/admin/intake/${encodeURIComponent(id)}`);
      if (request === detailRequest.current) setDetail(result.data);
    } catch (caught) {
      if (request === detailRequest.current) setDetailError(caught instanceof ApiError ? caught.message : "This case could not be loaded.");
    } finally { if (request === detailRequest.current) setDetailLoading(false); }
  }, []);

  useEffect(() => {
    void getCurrentUser().then(result => setUser(result.data.user)).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadList(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadList]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (selectedId) {
        void loadDetail(selectedId);
        return;
      }
      detailRequest.current += 1;
      setDetail(null);
      setDetailError("");
      setDetailLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDetail, selectedId]);

  function submitSearch(event: FormEvent) { event.preventDefault(); setPage(1); setQuery(search.trim()); }
  function clearFilters() { setSearch(""); setQuery(""); setStatus(""); setSourceType(""); setDepartment(""); setAssignment("ALL"); setPage(1); }

  async function mutateCase(input: { status?: IntakeStatus; department?: AdminDepartment; assignedAdminId?: string | null }) {
    if (!detail || busy) return;
    setBusy(true); setDetailError(""); setNotice("");
    try {
      const result = await apiFetch<ApiSuccessEnvelope<IntakeDetailData>>(`/admin/intake/${encodeURIComponent(detail.item.id)}`, {
        method: "PATCH", body: JSON.stringify({ ...input, expectedRevision: detail.item.revision }),
      });
      setDetail(result.data); setNotice("Case updated."); await loadList();
    } catch (caught) { setDetailError(caught instanceof ApiError ? caught.message : "The case could not be updated."); }
    finally { setBusy(false); }
  }

  async function addNote(event: FormEvent) {
    event.preventDefault();
    if (!detail || busy || note.trim().length < 2) return;
    setBusy(true); setDetailError(""); setNotice("");
    try {
      const result = await apiFetch<ApiSuccessEnvelope<IntakeDetailData>>(`/admin/intake/${encodeURIComponent(detail.item.id)}/notes`, {
        method: "POST", body: JSON.stringify({ body: note.trim(), expectedRevision: detail.item.revision }),
      });
      setDetail(result.data); setNote(""); setNotice("Internal note added."); await loadList();
    } catch (caught) { setDetailError(caught instanceof ApiError ? caught.message : "The note could not be added."); }
    finally { setBusy(false); }
  }

  const activeCount = (data?.counts.status.SUBMITTED ?? 0) + (data?.counts.status.IN_REVIEW ?? 0) + (data?.counts.status.CONTACTED ?? 0);
  const unassigned = data?.items.filter(item => !item.assignedAdminId).length ?? 0;

  return <div className="zbo-intake">
    <section className="zbo-intake-hero">
      <div>
        <p className="zbo-eyebrow">Operations intake</p>
        <h1>Every request. One accountable queue.</h1>
        <p>Route website, workforce, partner, hiring, institution and onboarding submissions into the right department, owner and next action.</p>
      </div>
      <div className="zbo-intake-hero-actions">
        <button type="button" onClick={() => void loadList()} disabled={loading}><RefreshCw className={loading ? "zbo-intake-spin" : ""} aria-hidden="true" />Refresh</button>
        <a href={`/api/backend/admin/intake/export.csv?${queryString}`}><Download aria-hidden="true" />Export CSV</a>
      </div>
    </section>

    <section className="zbo-intake-summary" aria-label="Intake summary">
      <article><span><Inbox aria-hidden="true" /></span><div><small>Visible cases</small><strong>{data?.total ?? 0}</strong></div></article>
      <article><span><LoaderCircle aria-hidden="true" /></span><div><small>Active workflow</small><strong>{activeCount}</strong></div></article>
      <article><span><CircleUserRound aria-hidden="true" /></span><div><small>Unassigned on page</small><strong>{unassigned}</strong></div></article>
      <article><span><ShieldCheck aria-hidden="true" /></span><div><small>Department scope</small><strong>{user ? adminDepartmentLabel(user.adminDepartment) : "Secure"}</strong></div></article>
    </section>

    <form className="zbo-intake-filters" onSubmit={submitSearch}>
      <label className="zbo-intake-search"><span>Search cases</span><div><Search aria-hidden="true" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, company, email, city or reference" maxLength={120} /><button type="submit">Search</button></div></label>
      <label><span>Status</span><select value={status} onChange={event => { setStatus(event.target.value as IntakeStatus | ""); setPage(1); }}><option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{humanize(value)}</option>)}</select></label>
      <label><span>Source</span><select value={sourceType} onChange={event => { setSourceType(event.target.value as IntakeSource | ""); setPage(1); }}><option value="">All sources</option>{sources.map(value => <option key={value} value={value}>{sourceMeta[value].label}</option>)}</select></label>
      {mainAdmin && <label><span>Department</span><select value={department} onChange={event => { setDepartment(event.target.value as AdminDepartment | ""); setPage(1); }}><option value="">All departments</option>{departments.map(value => <option key={value} value={value}>{adminDepartmentLabel(value)}</option>)}</select></label>}
      <label><span>Ownership</span><select value={assignment} onChange={event => { setAssignment(event.target.value as AssignmentFilter); setPage(1); }}><option value="ALL">All cases</option><option value="MINE">My cases</option><option value="UNASSIGNED">Unassigned</option></select></label>
      <button className="zbo-intake-clear" type="button" onClick={clearFilters}><Filter aria-hidden="true" />Reset</button>
    </form>

    {error && <div className="zbo-intake-alert is-error" role="alert"><XCircle aria-hidden="true" /><div><strong>Queue unavailable</strong><span>{error}</span></div><button type="button" onClick={() => void loadList()}>Retry</button></div>}

    <section className="zbo-intake-workspace">
      <div className="zbo-intake-list" aria-label="Cases">
        <header><div><h2>Case queue</h2><p>{data ? `${data.total} matching ${data.total === 1 ? "case" : "cases"}` : "Loading cases"}</p></div><Inbox aria-hidden="true" /></header>
        {loading && !data ? <CaseSkeleton /> : data && data.items.length === 0 ? <div className="zbo-intake-empty"><CheckCircle2 aria-hidden="true" /><h3>No matching cases</h3><p>Your current department and filters have no records waiting here.</p><button type="button" onClick={clearFilters}>Clear filters</button></div> : <div className="zbo-intake-case-list">
          {data?.items.map(item => {
            const meta = sourceMeta[item.sourceType]; const Icon = meta.icon;
            return <button key={item.id} type="button" className={`zbo-intake-case${selectedId === item.id ? " is-selected" : ""}`} onClick={() => setSelectedId(item.id)}>
              <span className="zbo-intake-case-icon"><Icon aria-hidden="true" /></span>
              <span className="zbo-intake-case-copy"><span><strong>{item.subject}</strong><em data-status={item.status}>{humanize(item.status)}</em></span><small>{item.contactName}{item.organizationName ? ` · ${item.organizationName}` : ""}</small><small>{meta.label} · {adminDepartmentLabel(item.department)} · {dateTime(item.submittedAt)}</small></span>
              <span className="zbo-intake-case-side"><small>{item.assignedAdmin ? item.assignedAdmin.email.split("@")[0] : "Unassigned"}</small><ArrowRight aria-hidden="true" /></span>
            </button>;
          })}
        </div>}
        {data && data.totalPages > 1 && <footer className="zbo-intake-pages"><button type="button" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))}><ChevronLeft aria-hidden="true" />Previous</button><span>Page {page} of {data.totalPages}</span><button type="button" disabled={page >= data.totalPages} onClick={() => setPage(value => Math.min(data.totalPages, value + 1))}>Next<ChevronRight aria-hidden="true" /></button></footer>}
      </div>

      <aside className="zbo-intake-detail" aria-live="polite">
        {!selectedId ? <div className="zbo-intake-detail-empty"><Inbox aria-hidden="true" /><h2>Select a case</h2><p>Choose a submission from the queue to review its context, ownership and internal history.</p></div> : detailLoading && !detail ? <div className="zbo-intake-detail-empty"><LoaderCircle className="zbo-intake-spin" aria-hidden="true" /><h2>Loading case</h2><p>Retrieving the latest operational record.</p></div> : detailError && !detail ? <div className="zbo-intake-detail-empty is-error"><XCircle aria-hidden="true" /><h2>Case unavailable</h2><p>{detailError}</p><button type="button" onClick={() => selectedId && void loadDetail(selectedId)}>Retry</button></div> : detail && <CaseDetail data={detail} user={user} busy={busy} note={note} setNote={setNote} notice={notice} error={detailError} onMutate={mutateCase} onAddNote={addNote} />}
      </aside>
    </section>
  </div>;
}

function CaseDetail({ data, user, busy, note, setNote, notice, error, onMutate, onAddNote }: {
  data: IntakeDetailData; user: AuthUser | null; busy: boolean; note: string; setNote: (value: string) => void; notice: string; error: string;
  onMutate: (input: { status?: IntakeStatus; department?: AdminDepartment; assignedAdminId?: string | null }) => Promise<void>;
  onAddNote: (event: FormEvent) => Promise<void>;
}) {
  const item = data.item; const meta = sourceMeta[item.sourceType]; const Icon = meta.icon; const mainAdmin = user?.adminDepartment === "MAIN_ADMIN";
  const details = item.details && typeof item.details === "object" ? Object.entries(item.details).filter(([, value]) => value != null && value !== "") : [];
  return <>
    <header className="zbo-intake-detail-head"><span><Icon aria-hidden="true" /></span><div><p className="zbo-eyebrow">{meta.label}</p><h2>{item.subject}</h2><small>#{item.id.slice(-8).toUpperCase()} · Received {dateTime(item.submittedAt)}</small></div><em data-status={item.status}>{humanize(item.status)}</em></header>
    <div className="zbo-intake-contact-grid">
      <div><small>Contact</small><strong>{item.contactName}</strong>{item.organizationName && <span>{item.organizationName}</span>}</div>
      {item.contactEmail && <a href={`mailto:${item.contactEmail}`}><Mail aria-hidden="true" /><span><small>Email</small><strong>{item.contactEmail}</strong></span></a>}
      {item.contactPhone && <a href={phoneHref(item.contactPhone)}><Phone aria-hidden="true" /><span><small>Phone</small><strong>{item.contactPhone}</strong></span></a>}
      {item.city && <div><MapPin aria-hidden="true" /><span><small>Location</small><strong>{item.city}</strong></span></div>}
    </div>
    {notice && <p className="zbo-intake-alert is-success" role="status"><CheckCircle2 aria-hidden="true" />{notice}</p>}
    {error && <p className="zbo-intake-alert is-error" role="alert"><XCircle aria-hidden="true" />{error}</p>}

    <section className="zbo-intake-control-panel"><div><h3>Workflow control</h3><p>{statusDescription(item.status)}</p></div><div className="zbo-intake-controls">
      <label><span>Status</span><select disabled={busy} value={item.status} onChange={event => void onMutate({ status: event.target.value as IntakeStatus })}>{statuses.map(value => <option key={value} value={value}>{humanize(value)}</option>)}</select></label>
      {mainAdmin && <label><span>Department</span><select disabled={busy} value={item.department} onChange={event => void onMutate({ department: event.target.value as AdminDepartment })}>{departments.map(value => <option key={value} value={value}>{adminDepartmentLabel(value)}</option>)}</select></label>}
      <label><span>Assigned admin</span><select disabled={busy} value={item.assignedAdminId ?? ""} onChange={event => void onMutate({ assignedAdminId: event.target.value || null })}><option value="">Unassigned</option>{data.assignees.map(admin => <option key={admin.id} value={admin.id}>{admin.email} · {adminDepartmentLabel(admin.adminDepartment)}</option>)}</select></label>
      {user && item.assignedAdminId !== user.id && <button type="button" disabled={busy} onClick={() => void onMutate({ assignedAdminId: user.id })}><CircleUserRound aria-hidden="true" />Assign to me</button>}
    </div></section>

    <section className="zbo-intake-source"><header><div><h3>Submitted context</h3><p>Privacy-minimised operational snapshot from the source workflow.</p></div>{meta.href && <Link href={meta.href(item.sourceId)}>Open source record<ArrowRight aria-hidden="true" /></Link>}</header>
      {item.summary && <blockquote>{item.summary}</blockquote>}
      <dl><div><dt>Source status</dt><dd>{item.sourceStatus ? humanize(item.sourceStatus) : "Received"}</dd></div><div><dt>Source reference</dt><dd>{item.sourceId}</dd></div>{details.map(([key, value]) => <div key={key}><dt>{humanize(key)}</dt><dd><FieldValue value={value} /></dd></div>)}</dl>
    </section>

    <section className="zbo-intake-notes"><header><div><h3>Internal notes</h3><p>Visible only inside the protected administrator workspace.</p></div><MessageSquareText aria-hidden="true" /></header>
      <form onSubmit={event => void onAddNote(event)}><textarea value={note} onChange={event => setNote(event.target.value)} maxLength={3000} rows={3} placeholder="Add the next action, call outcome or internal context…" disabled={busy} /><div><small>{note.length}/3000</small><button type="submit" disabled={busy || note.trim().length < 2}><Send aria-hidden="true" />Add note</button></div></form>
      <div className="zbo-intake-note-list">{item.notes.length ? item.notes.map(entry => <article key={entry.id}><span>{entry.author.email.slice(0, 2).toUpperCase()}</span><div><header><strong>{entry.author.email}</strong><small>{adminDepartmentLabel(entry.author.adminDepartment)} · {dateTime(entry.createdAt)}</small></header><p>{entry.body}</p></div></article>) : <div className="zbo-intake-note-empty">No internal notes yet. Add the first operational handoff above.</div>}</div>
    </section>
    {terminal(item.status) && <p className="zbo-intake-terminal"><ShieldCheck aria-hidden="true" />This case is in a terminal workflow state. Source updates will not silently reopen it.</p>}
  </>;
}
