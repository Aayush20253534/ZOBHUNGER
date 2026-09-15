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
  ClipboardCheck,
  ExternalLink,
  Filter,
  GraduationCap,
  LoaderCircle,
  KeyRound,
  Mail,
  MapPin,
  Network,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
  Wrench,
  XCircle,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  getTechnicalInstituteAdmin,
  getTechnicalInstituteAdminSummary,
  issueTechnicalInstitutePortalAccess,
  listTechnicalInstitutesAdmin,
  reviewTechnicalInstituteAdmin,
  type TechnicalInstituteAdminList,
  type TechnicalInstituteAdminRecord,
  type TechnicalInstituteAdminSummary,
  type TechnicalInstituteStatus,
} from "@/services/technical-institutes-admin.service";
import "@/styles/admin-technical-institutes.css";

const statuses: TechnicalInstituteStatus[] = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"];

function statusLabel(status: TechnicalInstituteStatus) {
  return {
    SUBMITTED: "New",
    UNDER_REVIEW: "Under review",
    APPROVED: "Approved",
    REJECTED: "Not approved",
  }[status];
}

function typeLabel(value: string) {
  if (value === "iti") return "ITI";
  if (value === "polytechnic") return "Polytechnic";
  return "Technical institute";
}

function affiliationLabel(value: string) {
  if (value === "ncvt") return "NCVT";
  if (value === "scvt") return "SCVT";
  if (value === "aicte") return "AICTE";
  if (value === "state-board") return "State Board";
  return "Other";
}

function opportunityLabel(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function dateLabel(value?: string | null) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: TechnicalInstituteStatus }) {
  return <span className="zti-status" data-status={status}>{status === "APPROVED" ? <BadgeCheck aria-hidden="true" /> : status === "REJECTED" ? <XCircle aria-hidden="true" /> : status === "UNDER_REVIEW" ? <ClipboardCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{statusLabel(status)}</span>;
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return <div className="zti-empty"><Building2 aria-hidden="true" /><strong>No institute records found</strong><span>{filtered ? "Try changing the search or filters." : "New ITI and Polytechnic partnership requests will appear here."}</span></div>;
}

function SummaryCards({ summary }: { summary: TechnicalInstituteAdminSummary }) {
  const cards = [
    { label: "Total institutes", value: summary.counts.total, icon: Building2, tone: "neutral" },
    { label: "Awaiting review", value: summary.counts.submitted, icon: CircleAlert, tone: "warning" },
    { label: "Under review", value: summary.counts.underReview, icon: ClipboardCheck, tone: "review" },
    { label: "Approved partners", value: summary.counts.approved, icon: BadgeCheck, tone: "success" },
    { label: "Final-year talent", value: summary.students.finalYear, icon: GraduationCap, tone: "talent" },
  ] as const;
  return <div className="zti-stats">{cards.map(({ label, value, icon: Icon, tone }) => <article key={label} data-tone={tone}><span><Icon aria-hidden="true" /></span><div><small>{label}</small><strong>{value.toLocaleString("en-IN")}</strong></div></article>)}</div>;
}

function InstituteRow({ item }: { item: TechnicalInstituteAdminRecord }) {
  return <article className="zti-record">
    <div className="zti-record-main">
      <span className="zti-record-icon"><Building2 aria-hidden="true" /></span>
      <div><div className="zti-record-title"><h2>{item.institutionName}</h2><StatusBadge status={item.status} /></div><p>{typeLabel(item.institutionType)} · {affiliationLabel(item.affiliationBody)}{item.affiliationNumber ? ` · ${item.affiliationNumber}` : ""}</p></div>
    </div>
    <div className="zti-record-cell"><small>Location</small><strong><MapPin aria-hidden="true" />{item.city}, {item.state}</strong></div>
    <div className="zti-record-cell"><small>Talent pool</small><strong><UsersRound aria-hidden="true" />{item.finalYearStudents.toLocaleString("en-IN")} final-year</strong><span>{item.totalStudents.toLocaleString("en-IN")} total students</span></div>
    <div className="zti-record-cell"><small>Passing batch</small><strong><CalendarDays aria-hidden="true" />{item.passingYear}</strong><span>{item.partnershipCode ?? "Code after approval"}</span></div>
    <div className="zti-record-actions"><time dateTime={item.createdAt}>{dateLabel(item.createdAt)}</time><Link href={`/admin/technical-institutes/${item.id}`}>Open record <ChevronRight aria-hidden="true" /></Link></div>
  </article>;
}

export function AdminTechnicalInstitutes() {
  const [summary, setSummary] = useState<TechnicalInstituteAdminSummary | null>(null);
  const [data, setData] = useState<TechnicalInstituteAdminList | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TechnicalInstituteStatus | "">("");
  const [institutionType, setInstitutionType] = useState<"" | "iti" | "polytechnic" | "technical-institute">("");
  const [affiliationBody, setAffiliationBody] = useState<"" | "ncvt" | "scvt" | "aicte" | "state-board" | "other">("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [summaryResponse, listResponse] = await Promise.all([
          getTechnicalInstituteAdminSummary(),
          listTechnicalInstitutesAdmin({ page, pageSize: 20, query: query || undefined, status, institutionType, affiliationBody, state: state || undefined }),
        ]);
        if (!active) return;
        setSummary(summaryResponse.data);
        setData(listResponse.data);
      } catch (caught) {
        if (!active || controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "Unable to load technical institute partnerships.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [page, query, status, institutionType, affiliationBody, state, version]);

  const hasFilters = Boolean(query || status || institutionType || affiliationBody || state);
  const topStateText = useMemo(() => summary?.topStates.slice(0, 3).map((item) => `${item.state} ${item.count}`).join(" · ") ?? "", [summary]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  function clearFilters() {
    setSearch("");
    setQuery("");
    setStatus("");
    setInstitutionType("");
    setAffiliationBody("");
    setState("");
    setPage(1);
  }

  return <div className="zti-page">
    <header className="zti-hero">
      <div>
        <span className="zti-kicker"><Wrench aria-hidden="true" /> ITI & Polytechnic College Cell</span>
        <h1>Technical institute partnerships</h1>
        <p>Review institute onboarding, verify technical profiles and maintain an approved partner network for jobs, apprenticeships, internships and training.</p>
      </div>
      <div className="zti-hero-actions"><a href="/iti-polytechnic-cell" target="_blank" rel="noreferrer">Public page <ExternalLink aria-hidden="true" /></a><button type="button" onClick={refresh} disabled={loading}><RefreshCw aria-hidden="true" />Refresh</button></div>
    </header>

    {error && <div className="zti-alert" role="alert"><CircleAlert aria-hidden="true" /><span>{error}</span><button type="button" onClick={refresh}>Retry</button></div>}
    {summary && <SummaryCards summary={summary} />}

    {summary && <section className="zti-insight-strip" aria-label="Technical partnership snapshot">
      <div><Network aria-hidden="true" /><span><small>Network footprint</small><strong>{topStateText || "Institute locations appear as applications arrive"}</strong></span></div>
      <div><UsersRound aria-hidden="true" /><span><small>Recorded student pool</small><strong>{summary.students.total.toLocaleString("en-IN")} students across submitted institutes</strong></span></div>
      <div><ShieldCheck aria-hidden="true" /><span><small>Approval rule</small><strong>Verified institute records only</strong></span></div>
    </section>}

    <section className="zti-workspace" aria-labelledby="technical-institute-records-title">
      <div className="zti-workspace-head"><div><span className="zti-section-kicker">Partnership queue</span><h2 id="technical-institute-records-title">Institute records</h2><p>Search by institute, contact, city, affiliation, trade or partnership code.</p></div><span>{data?.total ?? 0} matching records</span></div>
      <form className="zti-filters" onSubmit={submitSearch}>
        <label className="zti-search"><span>Search</span><div><Search aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Institute, email, city, trade or code" maxLength={160} /></div></label>
        <label><span>Status</span><select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as TechnicalInstituteStatus | ""); }}><option value="">All statuses</option>{statuses.map((value) => <option value={value} key={value}>{statusLabel(value)}</option>)}</select></label>
        <label><span>Institute type</span><select value={institutionType} onChange={(event) => { setPage(1); setInstitutionType(event.target.value as typeof institutionType); }}><option value="">All types</option><option value="iti">ITI</option><option value="polytechnic">Polytechnic</option><option value="technical-institute">Technical institute</option></select></label>
        <label><span>Affiliation</span><select value={affiliationBody} onChange={(event) => { setPage(1); setAffiliationBody(event.target.value as typeof affiliationBody); }}><option value="">All affiliations</option><option value="ncvt">NCVT</option><option value="scvt">SCVT</option><option value="aicte">AICTE</option><option value="state-board">State Board</option><option value="other">Other</option></select></label>
        <label><span>State</span><input value={state} onChange={(event) => { setPage(1); setState(event.target.value); }} placeholder="e.g. Uttar Pradesh" maxLength={120} /></label>
        <button className="zti-filter-submit" type="submit"><Filter aria-hidden="true" />Apply</button>
        {hasFilters && <button className="zti-filter-clear" type="button" onClick={clearFilters}>Clear</button>}
      </form>

      {loading && !data ? <div className="zti-loading" role="status"><LoaderCircle aria-hidden="true" /><strong>Loading institute network</strong><span>Retrieving the technical partnership queue.</span></div> : data && data.items.length ? <div className="zti-records">{data.items.map((item) => <InstituteRow key={item.id} item={item} />)}</div> : !loading && <EmptyState filtered={hasFilters} />}

      {data && data.totalPages > 1 && <div className="zti-pagination"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}><ArrowLeft aria-hidden="true" />Previous</button><span>Page {data.page} of {data.totalPages}</span><button type="button" disabled={page >= data.totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next<ArrowRight aria-hidden="true" /></button></div>}
    </section>
  </div>;
}

function DetailBlock({ title, icon: Icon, children }: { title: string; icon: typeof Building2; children: React.ReactNode }) {
  return <section className="zti-detail-card"><header><span><Icon aria-hidden="true" /></span><h2>{title}</h2></header><div className="zti-detail-card-body">{children}</div></section>;
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="zti-detail-item"><dt>{label}</dt><dd>{children || "Not provided"}</dd></div>;
}

export function AdminTechnicalInstituteDetail({ id }: { id: string }) {
  const [record, setRecord] = useState<TechnicalInstituteAdminRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getTechnicalInstituteAdmin(id);
      setRecord(response.data);
      setReviewNotes(response.data.reviewNotes ?? "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load institute record.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(status: Exclude<TechnicalInstituteStatus, "SUBMITTED">) {
    if (!record || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await reviewTechnicalInstituteAdmin(record.id, { status, reviewNotes: reviewNotes.trim() || undefined });
      setRecord(response.data);
      setReviewNotes(response.data.reviewNotes ?? "");
      setNotice(status === "APPROVED" ? "Institute approved and partnership record activated." : status === "REJECTED" ? "Institute marked as not approved." : "Institute moved into active review.");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) setError(caught.message);
      else setError(caught instanceof Error ? caught.message : "Unable to update review.");
    } finally {
      setSaving(false);
    }
  }

  async function issuePortalAccess() {
    if (!record || portalBusy || record.status !== "APPROVED") return;
    setPortalBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await issueTechnicalInstitutePortalAccess(record.id);
      setRecord(response.data.entity);
      setNotice(response.data.portalAccess === "ACTIVATION"
        ? "Technical Institute Portal activation access sent to the official institute email."
        : "Portal access confirmed. Login instructions were sent to the official institute email.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to issue institute portal access.");
    } finally {
      setPortalBusy(false);
    }
  }

  if (loading) return <div className="zti-page"><div className="zti-loading" role="status"><LoaderCircle aria-hidden="true" /><strong>Loading institute record</strong><span>Retrieving partnership details.</span></div></div>;
  if (!record) return <div className="zti-page"><div className="zti-alert" role="alert"><CircleAlert aria-hidden="true" /><span>{error || "Institute record could not be loaded."}</span><Link href="/admin/technical-institutes">Return to institute network</Link></div></div>;

  const approved = record.status === "APPROVED";
  const tradeItems = record.tradesBranches.split(/[,\n;]/).map((item) => item.trim()).filter(Boolean).slice(0, 18);

  return <div className="zti-page">
    <nav className="zti-detail-nav"><Link href="/admin/technical-institutes"><ArrowLeft aria-hidden="true" />Technical institutes</Link><a href="/iti-polytechnic-cell" target="_blank" rel="noreferrer">Public cell <ExternalLink aria-hidden="true" /></a></nav>
    <header className="zti-detail-hero">
      <div className="zti-detail-identity"><span><Building2 aria-hidden="true" /></span><div><div><span className="zti-section-kicker">{typeLabel(record.institutionType)} partnership</span><StatusBadge status={record.status} /></div><h1>{record.institutionName}</h1><p><MapPin aria-hidden="true" />{record.city}, {record.district}, {record.state} · {affiliationLabel(record.affiliationBody)}</p></div></div>
      <div className="zti-code-card"><small>Partnership code</small><strong>{record.partnershipCode ?? "Assigned after approval"}</strong><span>Submitted {dateLabel(record.createdAt)}</span></div>
    </header>

    {error && <div className="zti-alert" role="alert"><CircleAlert aria-hidden="true" /><span>{error}</span></div>}
    {notice && <div className="zti-notice" role="status"><CheckCircle2 aria-hidden="true" /><span>{notice}</span></div>}

    <div className="zti-detail-metrics">
      <article><UsersRound aria-hidden="true" /><span><small>Total students</small><strong>{record.totalStudents.toLocaleString("en-IN")}</strong></span></article>
      <article><GraduationCap aria-hidden="true" /><span><small>Final-year students</small><strong>{record.finalYearStudents.toLocaleString("en-IN")}</strong></span></article>
      <article><CalendarDays aria-hidden="true" /><span><small>Primary passing batch</small><strong>{record.passingYear}</strong></span></article>
      <article><Network aria-hidden="true" /><span><small>Opportunity areas</small><strong>{record.preferredOpportunityTypes.length}</strong></span></article>
    </div>

    {approved && <section className="zti-student-roster-cta">
      <div><span><UsersRound aria-hidden="true" /></span><div><small>Part 3 · Technical student onboarding</small><h2>Build and verify the institute student roster.</h2><p>Add students manually, review self-registrations, or import an Excel/CSV batch with row-level validation.</p></div></div>
      <div><Link href={`/admin/technical-institutes/${record.id}/students`}>Manage student roster <ChevronRight aria-hidden="true" /></Link><a href={`/iti-polytechnic-cell/student-registration?code=${encodeURIComponent(record.partnershipCode ?? "")}`} target="_blank" rel="noreferrer">Open registration page <ExternalLink aria-hidden="true" /></a></div>
    </section>}

    {approved && <section className="zti-student-roster-cta zti-opportunity-cta">
      <div><span><BriefcaseBusiness aria-hidden="true" /></span><div><small>Part 4 · Opportunity matching</small><h2>Connect verified technical talent to live requirements.</h2><p>Create jobs, internships, apprenticeships and training programs, then rank eligible students by qualification, trade, batch, skills and location.</p></div></div>
      <div><Link href="/admin/technical-opportunities">Open opportunity desk <ChevronRight aria-hidden="true" /></Link></div>
    </section>}

    <div className="zti-detail-layout">
      <main className="zti-detail-main">
        <DetailBlock title="Institute profile" icon={Building2}><dl className="zti-detail-grid"><DetailItem label="Institute type">{typeLabel(record.institutionType)}</DetailItem><DetailItem label="Ownership">{opportunityLabel(record.ownershipType)}</DetailItem><DetailItem label="Affiliation">{affiliationLabel(record.affiliationBody)}</DetailItem><DetailItem label="Affiliation / registration no.">{record.affiliationNumber}</DetailItem><DetailItem label="PIN code">{record.postalCode}</DetailItem><DetailItem label="Website">{record.website ? <a href={record.website} target="_blank" rel="noreferrer">{record.website}<ExternalLink aria-hidden="true" /></a> : "Not provided"}</DetailItem></dl></DetailBlock>

        <DetailBlock title="Placement / TPO contact" icon={Mail}><dl className="zti-detail-grid"><DetailItem label="Contact person">{record.contactPersonName}</DetailItem><DetailItem label="Designation">{record.designation}</DetailItem><DetailItem label="Official email"><a href={`mailto:${record.officialEmail}`}><Mail aria-hidden="true" />{record.officialEmail}</a></DetailItem><DetailItem label="Mobile"><a href={`tel:${record.mobileNumber}`}><Phone aria-hidden="true" />{record.mobileNumber}</a></DetailItem><DetailItem label="Alternate number">{record.alternateNumber}</DetailItem><DetailItem label="Location">{record.city}, {record.district}, {record.state}</DetailItem></dl></DetailBlock>

        <DetailBlock title="Technical talent profile" icon={Wrench}><div className="zti-trades"><div><span className="zti-section-kicker">Trades / branches</span><div className="zti-chip-cloud">{tradeItems.length ? tradeItems.map((item) => <span key={item}>{item}</span>) : <span>Not specified</span>}</div></div><div><span className="zti-section-kicker">Requested partnership areas</span><div className="zti-chip-cloud zti-chip-cloud--opportunities">{record.preferredOpportunityTypes.map((item) => <span key={item}>{opportunityLabel(item)}</span>)}</div></div>{record.technicalHiringNotes && <div className="zti-notes-block"><span className="zti-section-kicker">Institute notes</span><p>{record.technicalHiringNotes}</p></div>}</div></DetailBlock>

        <DetailBlock title="Review trail" icon={ShieldCheck}><dl className="zti-detail-grid"><DetailItem label="Current status">{statusLabel(record.status)}</DetailItem><DetailItem label="Reviewed on">{dateLabel(record.reviewedAt)}</DetailItem><DetailItem label="Approved on">{dateLabel(record.approvedAt)}</DetailItem><DetailItem label="Last updated">{dateLabel(record.updatedAt)}</DetailItem></dl>{record.reviewNotes && <div className="zti-review-note-readonly"><span>Internal review notes</span><p>{record.reviewNotes}</p></div>}</DetailBlock>
      </main>

      <aside className="zti-review-panel">
        <div className="zti-review-panel-head"><span><ClipboardCheck aria-hidden="true" /></span><div><small>Admin decision</small><h2>Partnership review</h2></div></div>
        <p>Verify institute identity, affiliation, technical disciplines and contact details before approval.</p>
        <label><span>Internal review notes</span><textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} maxLength={3000} rows={6} placeholder="Verification notes, follow-up needed, or approval context…" disabled={approved || saving} /></label>
        {!approved ? <div className="zti-review-actions">
          {record.status !== "UNDER_REVIEW" && <button type="button" className="zti-review-secondary" disabled={saving} onClick={() => void updateStatus("UNDER_REVIEW")}><ClipboardCheck aria-hidden="true" />Move to review</button>}
          <button type="button" className="zti-review-approve" disabled={saving} onClick={() => void updateStatus("APPROVED")}><BadgeCheck aria-hidden="true" />Approve institute</button>
          <button type="button" className="zti-review-reject" disabled={saving} onClick={() => void updateStatus("REJECTED")}><XCircle aria-hidden="true" />Reject request</button>
        </div> : <>
          <div className="zti-approved-lock"><BadgeCheck aria-hidden="true" /><div><strong>Approved partnership</strong><span>The institute can now receive secure Technical Institute Portal access.</span></div></div>
          <div className="zti-portal-access-admin">
            <div><KeyRound aria-hidden="true" /><span><small>Part 5 · Institute portal</small><strong>{record.provisionedUserId ? (record.activationExpiresAt ? "Activation pending" : "Portal account linked") : "Portal access not issued"}</strong><em>{record.activationExpiresAt ? `Activation valid until ${dateLabel(record.activationExpiresAt)}` : record.provisionedUserId ? "Use reissue to resend secure access instructions." : "Issue an account to the official institute email."}</em></span></div>
            <button type="button" disabled={portalBusy} onClick={() => void issuePortalAccess()}>{portalBusy ? <LoaderCircle className="zti-spin-icon" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}{record.provisionedUserId ? "Reissue portal access" : "Issue portal access"}</button>
            <a href="/technical-institute-login" target="_blank" rel="noreferrer">Open partner login <ExternalLink aria-hidden="true" /></a>
          </div>
        </>}
        {saving && <span className="zti-saving"><LoaderCircle aria-hidden="true" />Saving review…</span>}
        <div className="zti-review-checklist"><span><CheckCircle2 aria-hidden="true" />Affiliation checked</span><span><CheckCircle2 aria-hidden="true" />TPO contact checked</span><span><CheckCircle2 aria-hidden="true" />Student profile reviewed</span><span><CheckCircle2 aria-hidden="true" />Collaboration areas reviewed</span></div>
      </aside>
    </div>
  </div>;
}
