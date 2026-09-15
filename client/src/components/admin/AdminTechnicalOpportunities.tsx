"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  Filter,
  GraduationCap,
  LoaderCircle,
  MapPin,
  PencilLine,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  UserRoundCheck,
  UsersRound,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { listTechnicalInstitutesAdmin, type TechnicalInstituteAdminRecord } from "@/services/technical-institutes-admin.service";
import {
  createTechnicalOpportunityAdmin,
  getTechnicalOpportunityAdmin,
  getTechnicalOpportunityMatchesAdmin,
  listTechnicalOpportunitiesAdmin,
  submitTechnicalOpportunityCandidateAdmin,
  updateTechnicalOpportunityAdmin,
  updateTechnicalOpportunityApplicationStatusAdmin,
  type TechnicalOpportunityApplicationRecord,
  type TechnicalOpportunityApplicationStatus,
  type TechnicalOpportunityInput,
  type TechnicalOpportunityListResult,
  type TechnicalOpportunityMatchResult,
  type TechnicalOpportunityRecord,
  type TechnicalOpportunityStatus,
  type TechnicalOpportunityType,
} from "@/services/technical-opportunities-admin.service";
import "@/styles/admin-technical-opportunities.css";

const typeOptions: TechnicalOpportunityType[] = ["JOB", "INTERNSHIP", "APPRENTICESHIP", "TRAINING"];
const statusOptions: TechnicalOpportunityStatus[] = ["DRAFT", "OPEN", "CLOSED", "ARCHIVED"];

function typeLabel(value: TechnicalOpportunityType) {
  return value === "JOB" ? "Job" : value === "INTERNSHIP" ? "Internship" : value === "APPRENTICESHIP" ? "Apprenticeship" : "Training";
}

function statusLabel(value: TechnicalOpportunityStatus) {
  return value === "DRAFT" ? "Draft" : value === "OPEN" ? "Open" : value === "CLOSED" ? "Closed" : "Archived";
}

function applicationStatusLabel(value: TechnicalOpportunityApplicationStatus) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function qualificationLabel(value: string) {
  return value === "iti" ? "ITI" : "Diploma / Polytechnic";
}

function dateLabel(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function splitList(value: string) {
  return value.split(/[,;|\n]/).map((item) => item.trim()).filter(Boolean);
}

function isoFromLocal(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function localDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

type OpportunityDraft = {
  title: string;
  employerName: string;
  opportunityType: TechnicalOpportunityType;
  status: TechnicalOpportunityStatus;
  description: string;
  location: string;
  city: string;
  state: string;
  workMode: string;
  eligibleQualifications: Array<"iti" | "diploma-polytechnic">;
  eligibleTradesBranches: string;
  eligiblePassingYears: string;
  requiredSkills: string;
  preferredSkills: string;
  eligibleStates: string;
  vacancies: string;
  compensation: string;
  duration: string;
  applicationDeadline: string;
  joiningDate: string;
  adminNotes: string;
};

const blankDraft: OpportunityDraft = {
  title: "",
  employerName: "",
  opportunityType: "JOB",
  status: "DRAFT",
  description: "",
  location: "",
  city: "",
  state: "",
  workMode: "On-site",
  eligibleQualifications: ["iti", "diploma-polytechnic"],
  eligibleTradesBranches: "",
  eligiblePassingYears: "",
  requiredSkills: "",
  preferredSkills: "",
  eligibleStates: "",
  vacancies: "",
  compensation: "",
  duration: "",
  applicationDeadline: "",
  joiningDate: "",
  adminNotes: "",
};

function draftFromRecord(record?: TechnicalOpportunityRecord): OpportunityDraft {
  if (!record) return { ...blankDraft, eligibleQualifications: [...blankDraft.eligibleQualifications] };
  return {
    title: record.title,
    employerName: record.employerName,
    opportunityType: record.opportunityType,
    status: record.status,
    description: record.description,
    location: record.location,
    city: record.city ?? "",
    state: record.state ?? "",
    workMode: record.workMode ?? "",
    eligibleQualifications: [...record.eligibleQualifications],
    eligibleTradesBranches: record.eligibleTradesBranches.join(", "),
    eligiblePassingYears: record.eligiblePassingYears.join(", "),
    requiredSkills: record.requiredSkills.join(", "),
    preferredSkills: record.preferredSkills.join(", "),
    eligibleStates: record.eligibleStates.join(", "),
    vacancies: record.vacancies ? String(record.vacancies) : "",
    compensation: record.compensation ?? "",
    duration: record.duration ?? "",
    applicationDeadline: localDateTime(record.applicationDeadline),
    joiningDate: localDateTime(record.joiningDate),
    adminNotes: record.adminNotes ?? "",
  };
}

function inputFromDraft(draft: OpportunityDraft): TechnicalOpportunityInput {
  const vacancies = draft.vacancies.trim() ? Number(draft.vacancies) : undefined;
  return {
    title: draft.title.trim(),
    employerName: draft.employerName.trim(),
    opportunityType: draft.opportunityType,
    status: draft.status,
    description: draft.description.trim(),
    location: draft.location.trim(),
    city: draft.city.trim() || undefined,
    state: draft.state.trim() || undefined,
    workMode: draft.workMode.trim() || undefined,
    eligibleQualifications: draft.eligibleQualifications,
    eligibleTradesBranches: splitList(draft.eligibleTradesBranches),
    eligiblePassingYears: splitList(draft.eligiblePassingYears),
    requiredSkills: splitList(draft.requiredSkills),
    preferredSkills: splitList(draft.preferredSkills),
    eligibleStates: splitList(draft.eligibleStates),
    vacancies: vacancies && Number.isFinite(vacancies) ? vacancies : undefined,
    compensation: draft.compensation.trim() || undefined,
    duration: draft.duration.trim() || undefined,
    applicationDeadline: isoFromLocal(draft.applicationDeadline),
    joiningDate: isoFromLocal(draft.joiningDate),
    adminNotes: draft.adminNotes.trim() || undefined,
  };
}

function inputFromRecord(record: TechnicalOpportunityRecord, status = record.status): TechnicalOpportunityInput {
  return {
    title: record.title,
    employerName: record.employerName,
    opportunityType: record.opportunityType,
    status,
    description: record.description,
    location: record.location,
    city: record.city ?? undefined,
    state: record.state ?? undefined,
    workMode: record.workMode ?? undefined,
    eligibleQualifications: record.eligibleQualifications,
    eligibleTradesBranches: record.eligibleTradesBranches,
    eligiblePassingYears: record.eligiblePassingYears,
    requiredSkills: record.requiredSkills,
    preferredSkills: record.preferredSkills,
    eligibleStates: record.eligibleStates,
    vacancies: record.vacancies ?? undefined,
    compensation: record.compensation ?? undefined,
    duration: record.duration ?? undefined,
    applicationDeadline: record.applicationDeadline ?? undefined,
    joiningDate: record.joiningDate ?? undefined,
    adminNotes: record.adminNotes ?? undefined,
  };
}

function OpportunityStatus({ status }: { status: TechnicalOpportunityStatus }) {
  return <span className="zto-status" data-status={status}>{status === "OPEN" ? <BadgeCheck aria-hidden="true" /> : status === "DRAFT" ? <PencilLine aria-hidden="true" /> : status === "CLOSED" ? <Clock3 aria-hidden="true" /> : <FileCheck2 aria-hidden="true" />}{statusLabel(status)}</span>;
}

function TypeBadge({ type }: { type: TechnicalOpportunityType }) {
  const Icon = type === "JOB" ? BriefcaseBusiness : type === "INTERNSHIP" ? GraduationCap : type === "APPRENTICESHIP" ? Wrench : Sparkles;
  return <span className="zto-type" data-type={type}><Icon aria-hidden="true" />{typeLabel(type)}</span>;
}

function OpportunityEditor({ record, onClose, onSaved }: { record?: TechnicalOpportunityRecord; onClose: () => void; onSaved: (record: TechnicalOpportunityRecord) => void }) {
  const [draft, setDraft] = useState(() => draftFromRecord(record));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function field<K extends keyof OpportunityDraft>(key: K, value: OpportunityDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleQualification(value: "iti" | "diploma-polytechnic") {
    setDraft((current) => ({
      ...current,
      eligibleQualifications: current.eligibleQualifications.includes(value)
        ? current.eligibleQualifications.filter((item) => item !== value)
        : [...current.eligibleQualifications, value],
    }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!draft.title.trim() || !draft.employerName.trim() || draft.description.trim().length < 20 || !draft.location.trim()) {
      setError("Add the opportunity title, employer, location and a useful role description before saving.");
      return;
    }
    const years = splitList(draft.eligiblePassingYears);
    if (years.some((year) => !/^20\d{2}$/.test(year))) {
      setError("Passing years must use four digits, for example 2026, 2027.");
      return;
    }
    setSaving(true);
    try {
      const input = inputFromDraft(draft);
      const response = record
        ? await updateTechnicalOpportunityAdmin(record.id, input)
        : await createTechnicalOpportunityAdmin(input);
      onSaved(response.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save the technical opportunity.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="zto-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="zto-editor" onSubmit={save}>
      <header><div><small>{record ? "Edit technical opportunity" : "Create opportunity"}</small><h2>{record ? record.title : "New technical hiring requirement"}</h2></div><button type="button" onClick={onClose} aria-label="Close opportunity editor"><X aria-hidden="true" /></button></header>
      {error && <div className="zto-form-error"><CircleAlert aria-hidden="true" />{error}</div>}
      <div className="zto-editor-scroll">
        <section><div className="zto-section-heading"><span><BriefcaseBusiness aria-hidden="true" /></span><div><small>Opportunity</small><h3>Role & employer</h3></div></div><div className="zto-form-grid">
          <label className="zto-span-2"><span>Opportunity title *</span><input value={draft.title} onChange={(e) => field("title", e.target.value)} placeholder="Electrical Maintenance Technician" /></label>
          <label><span>Employer / client *</span><input value={draft.employerName} onChange={(e) => field("employerName", e.target.value)} placeholder="Company name" /></label>
          <label><span>Opportunity type *</span><select value={draft.opportunityType} onChange={(e) => field("opportunityType", e.target.value as TechnicalOpportunityType)}>{typeOptions.map((item) => <option key={item} value={item}>{typeLabel(item)}</option>)}</select></label>
          <label><span>Status</span><select value={draft.status} onChange={(e) => field("status", e.target.value as TechnicalOpportunityStatus)}>{statusOptions.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}</select></label>
          <label><span>Vacancies</span><input inputMode="numeric" type="number" min="1" value={draft.vacancies} onChange={(e) => field("vacancies", e.target.value)} placeholder="50" /></label>
          <label className="zto-span-2"><span>Description *</span><textarea rows={4} value={draft.description} onChange={(e) => field("description", e.target.value)} placeholder="Role responsibilities, practical work involved, screening expectations and important eligibility context." /></label>
        </div></section>

        <section><div className="zto-section-heading"><span><MapPin aria-hidden="true" /></span><div><small>Deployment</small><h3>Location & engagement</h3></div></div><div className="zto-form-grid">
          <label className="zto-span-2"><span>Primary location *</span><input value={draft.location} onChange={(e) => field("location", e.target.value)} placeholder="Noida, Uttar Pradesh" /></label>
          <label><span>City</span><input value={draft.city} onChange={(e) => field("city", e.target.value)} /></label>
          <label><span>State</span><input value={draft.state} onChange={(e) => field("state", e.target.value)} /></label>
          <label><span>Work mode</span><input value={draft.workMode} onChange={(e) => field("workMode", e.target.value)} placeholder="On-site / Hybrid / Field" /></label>
          <label><span>Compensation / stipend</span><input value={draft.compensation} onChange={(e) => field("compensation", e.target.value)} placeholder="₹18,000–₹22,000 / month" /></label>
          <label><span>Duration</span><input value={draft.duration} onChange={(e) => field("duration", e.target.value)} placeholder="6 months / Permanent" /></label>
          <label><span>Application deadline</span><input type="datetime-local" value={draft.applicationDeadline} onChange={(e) => field("applicationDeadline", e.target.value)} /></label>
          <label><span>Expected joining</span><input type="datetime-local" value={draft.joiningDate} onChange={(e) => field("joiningDate", e.target.value)} /></label>
        </div></section>

        <section><div className="zto-section-heading"><span><Target aria-hidden="true" /></span><div><small>Matching rules</small><h3>Eligibility & technical fit</h3></div></div>
          <div className="zto-qualification-options"><span>Eligible qualification</span><div>{(["iti", "diploma-polytechnic"] as const).map((item) => <label key={item}><input type="checkbox" checked={draft.eligibleQualifications.includes(item)} onChange={() => toggleQualification(item)} /><span>{qualificationLabel(item)}</span></label>)}</div><small>Leave both unchecked only when qualification is intentionally open.</small></div>
          <div className="zto-form-grid">
            <label className="zto-span-2"><span>Eligible trades / branches</span><textarea rows={2} value={draft.eligibleTradesBranches} onChange={(e) => field("eligibleTradesBranches", e.target.value)} placeholder="Electrician, Fitter, Mechanical, Electrical" /><small>Comma separated. Empty means all technical branches.</small></label>
            <label><span>Passing years</span><input value={draft.eligiblePassingYears} onChange={(e) => field("eligiblePassingYears", e.target.value)} placeholder="2025, 2026, 2027" /></label>
            <label><span>Eligible states</span><input value={draft.eligibleStates} onChange={(e) => field("eligibleStates", e.target.value)} placeholder="Uttar Pradesh, Delhi, Haryana" /></label>
            <label className="zto-span-2"><span>Required skills</span><input value={draft.requiredSkills} onChange={(e) => field("requiredSkills", e.target.value)} placeholder="Industrial wiring, preventive maintenance" /></label>
            <label className="zto-span-2"><span>Preferred skills / certifications</span><input value={draft.preferredSkills} onChange={(e) => field("preferredSkills", e.target.value)} placeholder="PLC basics, safety certification" /></label>
          </div>
        </section>

        <section><div className="zto-section-heading"><span><FileCheck2 aria-hidden="true" /></span><div><small>Internal context</small><h3>Hiring team notes</h3></div></div><label className="zto-full-field"><span>Admin notes</span><textarea rows={3} value={draft.adminNotes} onChange={(e) => field("adminNotes", e.target.value)} placeholder="Client-specific screening instructions or coordination notes. Not shown to students." /></label></section>
      </div>
      <footer><button type="button" className="zto-secondary" onClick={onClose}>Cancel</button><button type="submit" className="zto-primary" disabled={saving}>{saving ? <LoaderCircle className="zto-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}{saving ? "Saving…" : record ? "Save changes" : draft.status === "OPEN" ? "Create & open" : "Create opportunity"}</button></footer>
    </form>
  </div>;
}

function OpportunitySummary({ data }: { data: TechnicalOpportunityListResult }) {
  const cards = [
    ["Technical opportunities", data.summary.opportunities.total, BriefcaseBusiness, "neutral"],
    ["Open now", data.summary.opportunities.open, BadgeCheck, "open"],
    ["Candidate submissions", data.summary.applications.total, UsersRound, "applications"],
    ["Selected", data.summary.applications.selected, UserRoundCheck, "selected"],
    ["Joined", data.summary.applications.joined, CheckCircle2, "joined"],
  ] as const;
  return <div className="zto-summary">{cards.map(([label, value, Icon, tone]) => <article key={label} data-tone={tone}><span><Icon aria-hidden="true" /></span><div><small>{label}</small><strong>{value.toLocaleString("en-IN")}</strong></div></article>)}</div>;
}

function OpportunityRow({ item, onEdit }: { item: TechnicalOpportunityRecord; onEdit: (item: TechnicalOpportunityRecord) => void }) {
  return <article className="zto-row">
    <div className="zto-row-main"><div className="zto-row-top"><TypeBadge type={item.opportunityType} /><OpportunityStatus status={item.status} /></div><h2>{item.title}</h2><p>{item.employerName} · <MapPin aria-hidden="true" />{item.location}</p></div>
    <div className="zto-row-eligibility"><small>Eligibility</small><div>{item.eligibleQualifications.length ? item.eligibleQualifications.map((value) => <span key={value}>{qualificationLabel(value)}</span>) : <span>Open qualification</span>}{item.eligibleTradesBranches.slice(0, 2).map((value) => <span key={value}>{value}</span>)}{item.eligibleTradesBranches.length > 2 && <span>+{item.eligibleTradesBranches.length - 2}</span>}</div></div>
    <div className="zto-row-meta"><small>Applications</small><strong>{item._count?.applications ?? 0}</strong><span>{item.vacancies ? `${item.vacancies} vacancies` : "Vacancies not set"}</span></div>
    <div className="zto-row-meta"><small>Timeline</small><strong>{item.applicationDeadline ? dateLabel(item.applicationDeadline) : "No deadline"}</strong><span>{item.compensation || item.duration || "Terms on selection"}</span></div>
    <div className="zto-row-actions"><button type="button" onClick={() => onEdit(item)} aria-label={`Edit ${item.title}`}><PencilLine aria-hidden="true" /></button><Link href={`/admin/technical-opportunities/${item.id}`}>Match talent <ChevronRight aria-hidden="true" /></Link></div>
  </article>;
}

export function AdminTechnicalOpportunities() {
  const [data, setData] = useState<TechnicalOpportunityListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [status, setStatus] = useState<TechnicalOpportunityStatus | "">("");
  const [opportunityType, setOpportunityType] = useState<TechnicalOpportunityType | "">("");
  const [editor, setEditor] = useState<TechnicalOpportunityRecord | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listTechnicalOpportunitiesAdmin({ page, pageSize: 20, search, status, opportunityType });
      setData(response.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load technical opportunities.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, opportunityType]);

  useEffect(() => { void load(); }, [load]);

  const filtered = Boolean(search || status || opportunityType);

  return <div className="zto-page">
    <header className="zto-hero"><div className="zto-hero-copy"><span><Target aria-hidden="true" /></span><div><small>Part 4 · Opportunity matching</small><h1>Technical opportunity desk</h1><p>Create jobs, internships, apprenticeships and training programs, then match them against verified ITI and Polytechnic talent.</p></div></div><div className="zto-hero-actions"><button type="button" className="zto-refresh" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "zto-spin" : ""} aria-hidden="true" />Refresh</button><button type="button" onClick={() => setEditor("new")}><BriefcaseBusiness aria-hidden="true" />New opportunity</button></div></header>

    {error && <div className="zto-alert" role="alert"><CircleAlert aria-hidden="true" />{error}</div>}
    {notice && <div className="zto-notice" role="status"><CheckCircle2 aria-hidden="true" />{notice}</div>}
    {data && <OpportunitySummary data={data} />}

    <section className="zto-workspace">
      <header><div><small>Requirement library</small><h2>Technical jobs & programs</h2></div><span>{data?.total ?? 0} records</span></header>
      <form className="zto-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchDraft.trim()); }}>
        <label className="zto-search"><Search aria-hidden="true" /><input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search role, employer, trade or location" /></label>
        <label><span>Status</span><select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as TechnicalOpportunityStatus | ""); }}><option value="">All statuses</option>{statusOptions.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}</select></label>
        <label><span>Type</span><select value={opportunityType} onChange={(event) => { setPage(1); setOpportunityType(event.target.value as TechnicalOpportunityType | ""); }}><option value="">All opportunity types</option>{typeOptions.map((item) => <option key={item} value={item}>{typeLabel(item)}</option>)}</select></label>
        <button type="submit"><Filter aria-hidden="true" />Apply</button>
        {filtered && <button type="button" className="zto-clear" onClick={() => { setPage(1); setSearch(""); setSearchDraft(""); setStatus(""); setOpportunityType(""); }}>Clear</button>}
      </form>

      <div className="zto-list">
        {loading && !data ? <div className="zto-loading"><LoaderCircle className="zto-spin" aria-hidden="true" /><strong>Loading technical opportunities</strong></div> : data?.items.length ? data.items.map((item) => <OpportunityRow key={item.id} item={item} onEdit={setEditor} />) : <div className="zto-empty"><BriefcaseBusiness aria-hidden="true" /><strong>No technical opportunities found</strong><span>{filtered ? "Change the search or filters." : "Create the first requirement to start eligibility matching."}</span><button type="button" onClick={() => setEditor("new")}>Create opportunity</button></div>}
      </div>

      {data && data.totalPages > 1 && <footer className="zto-pager"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}><ArrowLeft aria-hidden="true" />Previous</button><span>Page {data.page} of {data.totalPages}</span><button type="button" disabled={page >= data.totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next<ArrowRight aria-hidden="true" /></button></footer>}
    </section>

    {editor && <OpportunityEditor record={editor === "new" ? undefined : editor} onClose={() => setEditor(null)} onSaved={(record) => { setEditor(null); setNotice(`${record.title} saved successfully.`); void load(); }} />}
  </div>;
}

function nextApplicationStatuses(status: TechnicalOpportunityApplicationStatus): TechnicalOpportunityApplicationStatus[] {
  if (status === "SUBMITTED") return ["REVIEWED", "SHORTLISTED", "REJECTED"];
  if (status === "REVIEWED") return ["SHORTLISTED", "REJECTED"];
  if (status === "SHORTLISTED") return ["SELECTED", "REJECTED"];
  if (status === "SELECTED") return ["JOINED", "REJECTED"];
  return [];
}

function MatchScore({ value }: { value: number }) {
  const tone = value >= 85 ? "strong" : value >= 70 ? "good" : "eligible";
  return <span className="zto-score" data-tone={tone}><strong>{value}</strong><small>% match</small></span>;
}

function ApplicationStatus({ value }: { value: TechnicalOpportunityApplicationStatus }) {
  return <span className="zto-application-status" data-status={value}>{value === "JOINED" || value === "SELECTED" ? <BadgeCheck aria-hidden="true" /> : value === "REJECTED" ? <XCircle aria-hidden="true" /> : <FileCheck2 aria-hidden="true" />}{applicationStatusLabel(value)}</span>;
}

function ApplicationCard({ application, busy, onStatus }: { application: TechnicalOpportunityApplicationRecord; busy: boolean; onStatus: (status: TechnicalOpportunityApplicationStatus) => void }) {
  const next = nextApplicationStatuses(application.status);
  return <article className="zto-application-card">
    <div className="zto-application-person"><span><UserRoundCheck aria-hidden="true" /></span><div><strong>{application.student.fullName}</strong><small>{application.student.tradeBranch} · {application.student.passingYear} · {application.student.institute.institutionName}</small></div></div>
    <MatchScore value={application.matchScore} />
    <ApplicationStatus value={application.status} />
    <div className="zto-application-actions">{next.length ? <select disabled={busy} value="" onChange={(event) => { if (event.target.value) onStatus(event.target.value as TechnicalOpportunityApplicationStatus); }}><option value="">Update status…</option>{next.map((status) => <option key={status} value={status}>{applicationStatusLabel(status)}</option>)}</select> : <span>Pipeline complete</span>}</div>
  </article>;
}

export function AdminTechnicalOpportunityDetail({ id }: { id: string }) {
  const [record, setRecord] = useState<TechnicalOpportunityRecord | null>(null);
  const [matches, setMatches] = useState<TechnicalOpportunityMatchResult | null>(null);
  const [institutes, setInstitutes] = useState<TechnicalInstituteAdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [instituteId, setInstituteId] = useState("");
  const [minScore, setMinScore] = useState(55);
  const [tab, setTab] = useState<"matches" | "applications">("matches");
  const [editing, setEditing] = useState(false);

  const loadRecord = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [opportunityResponse, instituteResponse] = await Promise.all([
        getTechnicalOpportunityAdmin(id),
        listTechnicalInstitutesAdmin({ status: "APPROVED", page: 1, pageSize: 100 }),
      ]);
      setRecord(opportunityResponse.data);
      setInstitutes(instituteResponse.data.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load the technical opportunity.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadMatches = useCallback(async () => {
    setMatching(true);
    try {
      const response = await getTechnicalOpportunityMatchesAdmin(id, { search, instituteId: instituteId || undefined, minScore, limit: 150 });
      setMatches(response.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to calculate technical talent matches.");
    } finally {
      setMatching(false);
    }
  }, [id, search, instituteId, minScore]);

  useEffect(() => { void loadRecord(); }, [loadRecord]);
  useEffect(() => { if (record) void loadMatches(); }, [record?.id, loadMatches]);

  const applications = record?.applications ?? [];
  const applicationCounts = useMemo(() => applications.reduce<Record<string, number>>((acc, item) => { acc[item.status] = (acc[item.status] ?? 0) + 1; return acc; }, {}), [applications]);

  async function changeOpportunityStatus(status: TechnicalOpportunityStatus) {
    if (!record) return;
    setBusyId("opportunity-status");
    setError("");
    try {
      const response = await updateTechnicalOpportunityAdmin(record.id, inputFromRecord(record, status));
      setRecord((current) => current ? { ...current, ...response.data, applications: current.applications } : current);
      setNotice(`Opportunity moved to ${statusLabel(status).toLowerCase()}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update opportunity status.");
    } finally {
      setBusyId("");
    }
  }

  async function submitCandidate(studentId: string, studentName: string) {
    if (!record) return;
    setBusyId(studentId);
    setError("");
    setNotice("");
    try {
      await submitTechnicalOpportunityCandidateAdmin(record.id, studentId);
      setNotice(`${studentName} submitted to ${record.title}. The student notification has been queued.`);
      await Promise.all([loadRecord(), loadMatches()]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit the candidate.");
    } finally {
      setBusyId("");
    }
  }

  async function changeApplicationStatus(application: TechnicalOpportunityApplicationRecord, status: TechnicalOpportunityApplicationStatus) {
    if (!record) return;
    setBusyId(application.id);
    setError("");
    try {
      await updateTechnicalOpportunityApplicationStatusAdmin(record.id, application.id, status);
      setNotice(`${application.student.fullName} moved to ${applicationStatusLabel(status)}.`);
      await Promise.all([loadRecord(), loadMatches()]);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to update candidate status.");
    } finally {
      setBusyId("");
    }
  }

  if (loading && !record) return <div className="zto-page"><div className="zto-loading"><LoaderCircle className="zto-spin" aria-hidden="true" /><strong>Loading opportunity workspace</strong></div></div>;
  if (!record) return <div className="zto-page"><div className="zto-alert"><CircleAlert aria-hidden="true" />{error || "Technical opportunity could not be loaded."}<Link href="/admin/technical-opportunities">Return to opportunities</Link></div></div>;

  return <div className="zto-page">
    <nav className="zto-detail-nav"><Link href="/admin/technical-opportunities"><ArrowLeft aria-hidden="true" />Technical opportunities</Link><Link href="/admin/technical-institutes">Institute network <Building2 aria-hidden="true" /></Link></nav>
    <header className="zto-detail-hero">
      <div className="zto-detail-heading"><div className="zto-detail-badges"><TypeBadge type={record.opportunityType} /><OpportunityStatus status={record.status} /></div><h1>{record.title}</h1><p><strong>{record.employerName}</strong><span>•</span><MapPin aria-hidden="true" />{record.location}{record.workMode ? <><span>•</span>{record.workMode}</> : null}</p></div>
      <div className="zto-detail-actions"><button type="button" className="zto-secondary" onClick={() => setEditing(true)}><PencilLine aria-hidden="true" />Edit</button>{record.status === "DRAFT" && <button type="button" className="zto-primary" disabled={busyId === "opportunity-status"} onClick={() => void changeOpportunityStatus("OPEN")}><BadgeCheck aria-hidden="true" />Open opportunity</button>}{record.status === "OPEN" && <button type="button" className="zto-primary" disabled={busyId === "opportunity-status"} onClick={() => void changeOpportunityStatus("CLOSED")}><Clock3 aria-hidden="true" />Close opportunity</button>}{record.status === "CLOSED" && <><button type="button" className="zto-secondary" disabled={busyId === "opportunity-status"} onClick={() => void changeOpportunityStatus("OPEN")}>Reopen</button><button type="button" className="zto-primary" disabled={busyId === "opportunity-status"} onClick={() => void changeOpportunityStatus("ARCHIVED")}>Archive</button></>}</div>
    </header>

    {error && <div className="zto-alert" role="alert"><CircleAlert aria-hidden="true" />{error}</div>}
    {notice && <div className="zto-notice" role="status"><CheckCircle2 aria-hidden="true" />{notice}</div>}

    <section className="zto-detail-metrics">
      <article><Target aria-hidden="true" /><div><small>Eligible matches</small><strong>{matches?.totalMatches ?? 0}</strong></div></article>
      <article><UsersRound aria-hidden="true" /><div><small>Submitted</small><strong>{applications.length}</strong></div></article>
      <article><UserRoundCheck aria-hidden="true" /><div><small>Selected</small><strong>{applicationCounts.SELECTED ?? 0}</strong></div></article>
      <article><CheckCircle2 aria-hidden="true" /><div><small>Joined</small><strong>{applicationCounts.JOINED ?? 0}</strong></div></article>
      <article><BriefcaseBusiness aria-hidden="true" /><div><small>Vacancies</small><strong>{record.vacancies ?? "—"}</strong></div></article>
    </section>

    <section className="zto-criteria-strip">
      <div><small>Qualification</small><strong>{record.eligibleQualifications.length ? record.eligibleQualifications.map(qualificationLabel).join(" + ") : "Open"}</strong></div>
      <div><small>Trades / branches</small><strong>{record.eligibleTradesBranches.length ? record.eligibleTradesBranches.slice(0, 3).join(", ") : "All technical branches"}</strong></div>
      <div><small>Passing batches</small><strong>{record.eligiblePassingYears.length ? record.eligiblePassingYears.join(", ") : "Open"}</strong></div>
      <div><small>Deadline</small><strong>{dateLabel(record.applicationDeadline)}</strong></div>
      <div><small>Compensation</small><strong>{record.compensation || "Not specified"}</strong></div>
    </section>

    <div className="zto-detail-layout">
      <main className="zto-match-panel">
        <div className="zto-tabs"><button type="button" className={tab === "matches" ? "is-active" : ""} onClick={() => setTab("matches")}><Sparkles aria-hidden="true" />Eligible matches <span>{matches?.matches.length ?? 0}</span></button><button type="button" className={tab === "applications" ? "is-active" : ""} onClick={() => setTab("applications")}><FileCheck2 aria-hidden="true" />Application pipeline <span>{applications.length}</span></button></div>

        {tab === "matches" ? <>
          <form className="zto-match-filters" onSubmit={(event) => { event.preventDefault(); setSearch(searchDraft.trim()); }}>
            <label className="zto-search"><Search aria-hidden="true" /><input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search student, trade, institute or location" /></label>
            <label><span>Institute</span><select value={instituteId} onChange={(event) => setInstituteId(event.target.value)}><option value="">All approved institutes</option>{institutes.map((institute) => <option key={institute.id} value={institute.id}>{institute.institutionName}</option>)}</select></label>
            <label><span>Minimum match</span><select value={minScore} onChange={(event) => setMinScore(Number(event.target.value))}><option value={55}>55%+ eligible</option><option value={65}>65%+ relevant</option><option value={75}>75%+ strong</option><option value={85}>85%+ best fit</option></select></label>
            <button type="submit" disabled={matching}><Filter aria-hidden="true" />Match</button>
          </form>
          <div className="zto-match-explainer"><Target aria-hidden="true" /><div><strong>Qualification-led matching</strong><span>Verified students are filtered by qualification, trade/branch, passing batch and eligible states, then scored using skills, preferences and location alignment.</span></div></div>
          <div className="zto-match-list">{matching && !matches ? <div className="zto-loading"><LoaderCircle className="zto-spin" aria-hidden="true" /><strong>Calculating eligible talent</strong></div> : matches?.matches.length ? matches.matches.map((match) => <article className="zto-match-card" key={match.student.id}>
            <div className="zto-match-person"><span><GraduationCap aria-hidden="true" /></span><div><strong>{match.student.fullName}</strong><small>{qualificationLabel(match.student.qualification)} · {match.student.tradeBranch} · {match.student.passingYear}</small><p><Building2 aria-hidden="true" />{match.student.institute.institutionName}<span>•</span><MapPin aria-hidden="true" />{match.student.currentCity}, {match.student.currentState}</p></div></div>
            <MatchScore value={match.score} />
            <div className="zto-match-reasons">{match.reasons.slice(0, 4).map((reason) => <span key={reason}><CheckCircle2 aria-hidden="true" />{reason}</span>)}</div>
            <div className="zto-match-skills">{match.student.skills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}{match.student.skills.length > 4 && <span>+{match.student.skills.length - 4}</span>}</div>
            <div className="zto-match-action">{match.application ? <ApplicationStatus value={match.application.status} /> : <button type="button" disabled={record.status !== "OPEN" || busyId === match.student.id} onClick={() => void submitCandidate(match.student.id, match.student.fullName)}>{busyId === match.student.id ? <LoaderCircle className="zto-spin" aria-hidden="true" /> : <UserRoundCheck aria-hidden="true" />}{record.status === "OPEN" ? "Submit candidate" : "Open opportunity first"}</button>}</div>
          </article>) : <div className="zto-empty"><Search aria-hidden="true" /><strong>No eligible talent at this threshold</strong><span>Lower the minimum score, broaden institute scope, or review the opportunity eligibility rules.</span></div>}</div>
        </> : <div className="zto-application-list">{applications.length ? applications.map((application) => <ApplicationCard key={application.id} application={application} busy={busyId === application.id} onStatus={(status) => void changeApplicationStatus(application, status)} />) : <div className="zto-empty"><FileCheck2 aria-hidden="true" /><strong>No candidates submitted yet</strong><span>Open the Eligible matches tab and submit suitable verified students.</span></div>}</div>}
      </main>

      <aside className="zto-opportunity-sidebar">
        <section><div className="zto-section-heading"><span><BriefcaseBusiness aria-hidden="true" /></span><div><small>Opportunity brief</small><h2>Requirement details</h2></div></div><p>{record.description}</p><dl><div><dt>Type</dt><dd>{typeLabel(record.opportunityType)}</dd></div><div><dt>Work mode</dt><dd>{record.workMode || "Not specified"}</dd></div><div><dt>Duration</dt><dd>{record.duration || "Not specified"}</dd></div><div><dt>Joining</dt><dd>{dateLabel(record.joiningDate)}</dd></div></dl></section>
        <section><div className="zto-section-heading"><span><Wrench aria-hidden="true" /></span><div><small>Technical criteria</small><h2>Skills & geography</h2></div></div><div className="zto-chip-group"><small>Required skills</small><div>{record.requiredSkills.length ? record.requiredSkills.map((item) => <span key={item}>{item}</span>) : <span>No hard skill gate</span>}</div></div><div className="zto-chip-group"><small>Preferred skills</small><div>{record.preferredSkills.length ? record.preferredSkills.map((item) => <span key={item}>{item}</span>) : <span>Not specified</span>}</div></div><div className="zto-chip-group"><small>Eligible states</small><div>{record.eligibleStates.length ? record.eligibleStates.map((item) => <span key={item}>{item}</span>) : <span>Location open</span>}</div></div></section>
        {record.adminNotes && <section><div className="zto-section-heading"><span><FileCheck2 aria-hidden="true" /></span><div><small>Internal only</small><h2>Admin notes</h2></div></div><p>{record.adminNotes}</p></section>}
      </aside>
    </div>

    {editing && <OpportunityEditor record={record} onClose={() => setEditing(false)} onSaved={(updated) => { setEditing(false); setRecord((current) => current ? { ...current, ...updated, applications: current.applications } : current); setNotice("Opportunity details updated."); void loadMatches(); }} />}
  </div>;
}
