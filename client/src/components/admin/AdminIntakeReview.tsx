"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, CheckCircle2, ClipboardCheck, Copy, Download, Eye, EyeOff, FileText, GraduationCap, Handshake, Inbox, KeyRound, LoaderCircle, Mail, MapPin, Phone, RefreshCw, Search, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { apiFetch, ApiError, type ApiSuccessEnvelope } from "@/lib/api";
import { getCurrentUser } from "@/services/auth.service";
import type { CareerEducation, CareerExperience } from "@/types/career-intake.types";
import "@/styles/admin-intake.css";

type Kind = "partners" | "careers";
interface History { id: string; action: string; createdAt: string; metadata?: { from?: string; to?: string; notes?: string } | null }
interface Application {
  id: string; fullName: string; email: string; status: string; createdAt: string; updatedAt: string;
  companyName?: string; mobileNumber?: string; currentCity?: string; currentProfession?: string;
  totalExperienceYears?: number; specialization?: string; industryExperience?: string; linkedInUrl?: string | null;
  contributionPreference?: string; expertiseDescription?: string; professionalNetwork?: string | null; preferredPartnershipArea?: string;
  phone?: string; city?: string; state?: string; preferredRole?: string; experienceYears?: number;
  education?: CareerEducation[]; workExperience?: CareerExperience[]; skills?: string[]; preferredLocations?: string[];
  availability?: string; portfolioUrl?: string | null; coverNote?: string | null; consentAt?: string;
  resumeFileName?: string | null; reviewNotes?: string | null; reviewedAt?: string | null;
  credentialsEmailStatus?: string | null;
  provisionedUser?: { partnerCode: string; mustChangePassword: boolean; temporaryPasswordExpiresAt: string | null; isActive: boolean } | null;
  history?: History[];
}
interface ListData { items: Application[]; total: number; page: number; totalPages: number; counts: Record<string, number> }
interface Credentials { partnerCode: string; temporaryPassword: string; expiresAt: string; loginUrl: string; emailAccepted: boolean }
const statusLabel = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, letter => letter.toUpperCase());
const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const partnerStatuses = ["SUBMITTED", "REVIEWED", "CONTACTED", "APPROVED", "REJECTED", "CLOSED"];
const careerStatuses = ["SUBMITTED", "REVIEWED", "SHORTLISTED", "CONTACTED", "HIRED", "REJECTED"];

function Badge({ value }: { value: string }) { return <span className="zb-review-badge" data-status={value}>{statusLabel(value)}</span>; }
function DetailBlock({ title, children, icon: Icon }: { title: string; children: ReactNode; icon: typeof FileText }) {
  return <section className="zb-review-block"><h2><Icon aria-hidden="true" />{title}</h2>{children}</section>;
}
function SafeExternalLink({ href }: { href: string }) {
  // Older partner records may contain links created before protocol validation.
  if (!/^https?:\/\//i.test(href)) return <span>{href}</span>;
  return <a href={href} target="_blank" rel="noopener noreferrer">{href}</a>;
}

function ApplicationDetails({ kind, initial, refresh }: { kind: Kind; initial: Application; refresh: () => void }) {
  const [application, setApplication] = useState(initial);
  const [notes, setNotes] = useState(initial.reviewNotes ?? "");
  const [status, setStatus] = useState(initial.status === "SUBMITTED" ? "REVIEWED" : initial.status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [intent, setIntent] = useState<"approve" | "reissue" | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const partner = kind === "partners";
  const approved = partner && application.status === "APPROVED";
  const contactPhone = partner ? application.mobileNumber : application.phone;
  const resumePath = partner ? `/admin/partner-applications/${application.id}/resume` : `/admin/careers/${application.id}/resume`;

  async function save(action: "review" | "approve" | "reissue") {
    if (busy) return;
    setBusy(true); setError(""); setMessage(""); setCredentials(null); setReveal(false); setCopied(false);
    try {
      const result = await apiFetch<ApiSuccessEnvelope<{ application: Application; credentials?: Credentials | null }>>(`/admin/${kind}/${encodeURIComponent(application.id)}/${action === "reissue" ? "credentials" : "review"}`, {
        method: "POST", headers: { "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify(action === "reissue" ? { expectedUpdatedAt: application.updatedAt } : { status: action === "approve" ? "APPROVED" : status, notes, expectedUpdatedAt: application.updatedAt }),
      });
      setApplication(result.data.application); setNotes(result.data.application.reviewNotes ?? ""); setStatus(result.data.application.status);
      setCredentials(result.data.credentials ?? null); setIntent(null);
      setMessage(action === "approve" ? "Application approved. Business access has been issued." : action === "reissue" ? "Fresh credentials issued. Previous temporary passwords and sessions are invalid." : "Review saved.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The review could not be saved."); }
    finally { setBusy(false); }
  }

  async function copyCredentials() {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(`Partner ID: ${credentials.partnerCode}\nTemporary password: ${credentials.temporaryPassword}\nLogin: ${credentials.loginUrl}\nExpires: ${formatDate(credentials.expiresAt)}\nChange this password on first login.`);
      setCopied(true);
    } catch { setError("Clipboard access is unavailable. Reveal the credentials and copy them manually."); }
  }

  return <>
    <header className="zb-review-detail-heading">
      <span className="zb-review-avatar" aria-hidden="true">{partner ? <Building2 /> : <UsersRound />}</span>
      <div><span className="zb-eyebrow">{partner ? "Partnership application" : "Career profile"}</span><h1>{application.fullName}</h1><p>{partner ? application.companyName : application.preferredRole}</p></div>
      <Badge value={application.status} />
    </header>
    <div className="zb-review-contact">
      <a href={`mailto:${application.email}`}><Mail aria-hidden="true" />{application.email}</a>
      {contactPhone && <a href={`tel:${contactPhone.replace(/[^+\d]/g, "")}`}><Phone aria-hidden="true" />{contactPhone}</a>}
      <span><MapPin aria-hidden="true" />{partner ? application.currentCity : `${application.city}, ${application.state}`}</span>
      <span>Received {formatDate(application.createdAt)}</span>
    </div>
    {message && <p className="zb-review-success" role="status"><CheckCircle2 aria-hidden="true" />{message}</p>}
    {error && <div className="zb-review-error" role="alert"><p>{error}</p><button type="button" onClick={refresh}>Refresh application</button></div>}
    {credentials && <section className="zb-review-credentials" aria-labelledby="issued-credentials-title">
      <h2 id="issued-credentials-title"><KeyRound aria-hidden="true" />Partner access issued</h2>
      <p>{credentials.emailAccepted ? "The email provider accepted the credentials message. Check with the partner if it does not arrive." : "The credentials email was not accepted. Share these credentials securely with the verified applicant, or fix email delivery and reissue them."}</p>
      <dl><div><dt>Partner ID</dt><dd>{credentials.partnerCode}</dd></div><div><dt>Temporary password</dt><dd><code>{reveal ? credentials.temporaryPassword : "••••••••••••••••"}</code><button type="button" onClick={() => setReveal(!reveal)} aria-label={reveal ? "Hide temporary password" : "Reveal temporary password"}>{reveal ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></dd></div><div><dt>Expires</dt><dd>{formatDate(credentials.expiresAt)}</dd></div></dl>
      <p>This password is shown only for this issuance. It cannot be retrieved after you leave or refresh this page.</p>
      <button className="zb-review-button" type="button" onClick={() => void copyCredentials()}><Copy aria-hidden="true" />{copied ? "Copied" : "Copy for secure handover"}</button>
    </section>}
    <div className="zb-review-detail-layout">
      <div>
        {partner ? <>
          <DetailBlock title="Professional background" icon={BriefcaseBusiness}><dl className="zb-review-facts">
            <div><dt>Current profession</dt><dd>{application.currentProfession}</dd></div><div><dt>Specialization</dt><dd>{application.specialization}</dd></div><div><dt>Experience</dt><dd>{application.totalExperienceYears} years</dd></div><div><dt>Industry experience</dt><dd>{application.industryExperience}</dd></div>
          </dl><p>{application.expertiseDescription}</p></DetailBlock>
          <DetailBlock title="Partnership interests" icon={Handshake}><dl className="zb-review-facts"><div><dt>Contribution</dt><dd>{application.contributionPreference}</dd></div><div><dt>Partnership area</dt><dd>{application.preferredPartnershipArea}</dd></div></dl>{application.professionalNetwork && <p>{application.professionalNetwork}</p>}{application.linkedInUrl && <SafeExternalLink href={application.linkedInUrl} />}</DetailBlock>
        </> : <>
          <DetailBlock title="Education" icon={GraduationCap}>{application.education?.map((entry, i) => <article className="zb-review-timeline-item" key={i}><h3>{entry.qualification}</h3><p>{entry.institution}</p><small>{[entry.fieldOfStudy, entry.graduationYear].filter(Boolean).join(" · ")}</small></article>)}</DetailBlock>
          <DetailBlock title="Work experience" icon={BriefcaseBusiness}><p>{application.experienceYears} completed years of experience</p>{application.workExperience?.length ? application.workExperience.map((entry, i) => <article className="zb-review-timeline-item" key={i}><h3>{entry.title} · {entry.company}</h3><small>{entry.startMonth} → {entry.current ? "Present" : entry.endMonth}</small>{entry.description && <p>{entry.description}</p>}</article>) : <p>No employment history supplied. Consider for entry-level opportunities.</p>}</DetailBlock>
          <DetailBlock title="Skills & preferences" icon={Sparkles}><ul className="zb-review-tags">{application.skills?.map(skill => <li key={skill}>{skill}</li>)}</ul><dl className="zb-review-facts"><div><dt>Availability</dt><dd>{application.availability}</dd></div><div><dt>Preferred locations</dt><dd>{application.preferredLocations?.join(", ") || "Not specified"}</dd></div></dl>{application.coverNote && <p>{application.coverNote}</p>}{application.portfolioUrl && <SafeExternalLink href={application.portfolioUrl} />}</DetailBlock>
        </>}
        <DetailBlock title={partner ? "Supporting profile" : "CV / resume"} icon={FileText}>
          {application.resumeFileName ? <><p>{application.resumeFileName}</p><a className="zb-review-button zb-review-button--secondary" href={`/api/backend${resumePath}`}><Download aria-hidden="true" />Download {partner ? "profile" : "resume"}</a></> : <p>No resume is attached. You can contact the applicant to request one.</p>}
          {application.consentAt && <small>Recruitment contact consent recorded {formatDate(application.consentAt)}</small>}
        </DetailBlock>
        <DetailBlock title="Review history" icon={ClipboardCheck}>
          {application.history?.length ? <ol className="zb-review-history">{application.history.map(event => <li key={event.id}><strong>{event.metadata?.to ? `Moved to ${statusLabel(event.metadata.to)}` : event.action.replaceAll(".", " ").replaceAll("_", " ")}</strong><time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>{event.metadata?.notes && <p>{event.metadata.notes}</p>}</li>)}</ol> : <p>No review activity yet.</p>}
        </DetailBlock>
      </div>
      <aside className="zb-review-decision">
        {approved ? <DetailBlock title="Business account" icon={ShieldCheck}>
          <p className="zb-review-partner-code">{application.provisionedUser?.partnerCode}</p>
          <p>{application.provisionedUser?.mustChangePassword ? "Waiting for the partner to set their own password." : "The partner has completed password setup."}</p>
          <p>Email status: <strong>{statusLabel(application.credentialsEmailStatus ?? "NOT_SENT")}</strong></p>
          {application.provisionedUser?.mustChangePassword && <button className="zb-review-button zb-review-button--secondary" type="button" disabled={busy} onClick={() => setIntent("reissue")}><RefreshCw aria-hidden="true" />Reissue temporary credentials</button>}
        </DetailBlock> : <DetailBlock title={partner ? "Review & approval" : "HR decision"} icon={ClipboardCheck}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); void save("review"); }} aria-busy={busy}>
            <label>Review status<select value={status} disabled={busy} onChange={event => setStatus(event.target.value)}>{(partner ? ["REVIEWED", "CONTACTED", "REJECTED", "CLOSED"] : careerStatuses.filter(value => value !== "SUBMITTED")).map(value => <option value={value} key={value}>{statusLabel(value)}</option>)}</select></label>
            <label>Internal review notes<textarea rows={5} maxLength={4000} disabled={busy} value={notes} onChange={event => setNotes(event.target.value)} placeholder={partner ? "Evaluation, contact outcome and reasons for your decision." : "Role fit, strengths, interview notes and follow-up details."} /></label>
            <p className="zb-review-muted">Notes are visible to the company team, not to applicants.</p>
            <button type="submit" className="zb-review-button zb-review-button--secondary" disabled={busy}>{busy ? <LoaderCircle aria-hidden="true" /> : <ClipboardCheck aria-hidden="true" />}Save review</button>
          </form>
          {partner && <><hr /><p>Approve only after checking the company and applicant details. Approval creates business access and issues credentials.</p><button className="zb-review-button" type="button" disabled={busy || ["REJECTED", "CLOSED"].includes(application.status)} onClick={() => setIntent("approve")}><BadgeCheck aria-hidden="true" />Approve & issue Partner ID</button>{["REJECTED", "CLOSED"].includes(application.status) && <small>Save a reviewed status to reopen this application first.</small>}</>}
        </DetailBlock>}
        {intent && <section className="zb-review-confirm" aria-labelledby="review-confirm-title">
          <h2 id="review-confirm-title">{intent === "approve" ? "Confirm business approval" : "Replace temporary credentials?"}</h2>
          <p>{intent === "approve" ? `Create or approve the business account for ${application.companyName} using ${application.email}.` : "The previous temporary password and existing sessions will stop working. A fresh message will be sent to the approved email."}</p>
          <button type="button" className="zb-review-button" disabled={busy} onClick={() => void save(intent)}>{busy ? "Saving…" : intent === "approve" ? "Confirm approval" : "Issue fresh credentials"}</button>
          <button type="button" className="zb-review-button zb-review-button--secondary" disabled={busy} onClick={() => setIntent(null)}>Cancel</button>
        </section>}
      </aside>
    </div>
  </>;
}

export function AdminIntakeReview({ kind, id }: { kind: Kind; id?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<ListData | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const partner = kind === "partners";
  const refresh = useCallback(() => setVersion(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      setLoading(true); setError(""); setData(null); setApplication(null);
      try {
        const current = await getCurrentUser();
        if (!active) return;
        if (current.data.user.role !== "ADMIN") { router.replace("/login"); return; }
        const params = new URLSearchParams({ page: String(page), query });
        if (status) params.set("status", status);
        if (id) {
          const response = await apiFetch<ApiSuccessEnvelope<Application>>(`/admin/${kind}/${encodeURIComponent(id)}`, { signal: controller.signal });
          if (active) setApplication(response.data);
        } else {
          const response = await apiFetch<ApiSuccessEnvelope<ListData>>(`/admin/${kind}?${params}`, { signal: controller.signal });
          if (active) setData(response.data);
        }
      } catch (caught) {
        if (!active || controller.signal.aborted) return;
        if (caught instanceof ApiError && (caught.status === 401 || caught.status === 403)) router.replace("/login");
        else setError(caught instanceof Error ? caught.message : "Unable to load applications.");
      } finally { if (active) setLoading(false); }
    }
    queueMicrotask(() => { if (active) void load(); });
    return () => { active = false; controller.abort(); };
  }, [kind, id, query, status, page, router, version]);

  return <div className="zb-review-page">
    <nav className="zb-review-nav" aria-label="Admin application navigation"><Link href={id ? `/admin/${kind}` : "/admin"}><ArrowLeft aria-hidden="true" />{id ? "All applications" : "Admin dashboard"}</Link><Link href={partner ? "/admin/careers" : "/admin/partners"}>{partner ? "Career profiles" : "Partner approvals"}<ArrowRight aria-hidden="true" /></Link></nav>
    {!id && <header className="zb-review-hero"><div><span className="zb-eyebrow">{partner ? "Partnerships · Company review" : "Talent inbox · HR review"}</span><h1>{partner ? "From application to approved partner." : "People worth getting to know."}</h1><p>{partner ? "Review the business, approve the fit and issue secure access. Every decision stays attached to the application." : "Explore candidate profiles, review their experience and resume, then contact the people who fit your opportunities."}</p></div><div className="zb-review-hero-art" aria-hidden="true"><span>{partner ? <Handshake /> : <UsersRound />}</span><span><ClipboardCheck /></span><span>{partner ? <KeyRound /> : <BadgeCheck />}</span></div></header>}
    {loading && <div className="zb-review-empty" role="status"><LoaderCircle aria-hidden="true" /><h2>Loading {partner ? "partner applications" : "career profiles"}…</h2></div>}
    {error && <div className="zb-review-error" role="alert"><p>{error}</p><button className="zb-review-button" onClick={refresh}><RefreshCw aria-hidden="true" />Try again</button></div>}
    {application && !loading && <ApplicationDetails key={`${application.id}:${version}`} kind={kind} initial={application} refresh={refresh} />}
    {data && !loading && <>
      <div className="zb-review-stats">
        {[{ label: "Total received", count: Object.values(data.counts).reduce((a, b) => a + b, 0), icon: Inbox }, { label: "Awaiting review", count: data.counts.SUBMITTED ?? 0, icon: ClipboardCheck }, { label: partner ? "Approved" : "Shortlisted", count: data.counts[partner ? "APPROVED" : "SHORTLISTED"] ?? 0, icon: BadgeCheck }, { label: "Contacted", count: data.counts.CONTACTED ?? 0, icon: Phone }].map(({ label, count, icon: Icon }) => <article key={label}><Icon aria-hidden="true" /><span>{label}</span><strong>{count}</strong></article>)}
      </div>
      <form className="zb-review-filters" onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search.trim()); }}>
        <label><span>Search applications</span><div><Search aria-hidden="true" /><input type="search" maxLength={160} value={search} onChange={event => setSearch(event.target.value)} placeholder={partner ? "Name, company, email or city" : "Name, role, email or city"} /></div></label>
        <label><span>Review status</span><select value={status} onChange={event => { setPage(1); setStatus(event.target.value); }}><option value="">All statuses</option>{(partner ? partnerStatuses : careerStatuses).map(value => <option value={value} key={value}>{statusLabel(value)}</option>)}</select></label>
        <button className="zb-review-button" type="submit">Search</button><button className="zb-review-icon-button" type="button" onClick={refresh} aria-label="Refresh applications"><RefreshCw aria-hidden="true" /></button>
      </form>
      <p className="zb-review-results">{data.total} matching {data.total === 1 ? "application" : "applications"}</p>
      {data.items.length ? <div className="zb-review-cards">{data.items.map(item => <article key={item.id}>
        <div className="zb-review-card-top"><span className="zb-review-avatar" aria-hidden="true">{partner ? <Building2 /> : <UsersRound />}</span><Badge value={item.status} /></div>
        <h2>{item.fullName}</h2><p>{partner ? item.companyName : item.preferredRole}</p>
        <div className="zb-review-card-meta"><span><MapPin aria-hidden="true" />{partner ? item.currentCity : item.city}</span><span><BriefcaseBusiness aria-hidden="true" />{partner ? item.totalExperienceYears : item.experienceYears} years</span></div>
        <p className="zb-review-card-note">{partner ? item.specialization : item.skills?.slice(0, 4).join(" · ")}</p>
        <div className="zb-review-card-foot"><span>{item.resumeFileName ? "Resume attached" : "Profile details available"}</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString("en-IN")}</time></div>
        <Link className="zb-review-button zb-review-button--secondary" href={`/admin/${kind}/${item.id}`}>Open {partner ? "application" : "profile"}<ArrowRight aria-hidden="true" /></Link>
      </article>)}</div> : <div className="zb-review-empty"><Inbox aria-hidden="true" /><h2>No matching applications</h2><p>{query || status ? "Try a different search or review status." : partner ? "New Become a Partner applications will appear here." : "Profiles submitted through Careers will appear here."}</p></div>}
      <div className="zb-review-pagination"><button className="zb-review-button zb-review-button--secondary" type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {data.page} of {data.totalPages}</span><button className="zb-review-button zb-review-button--secondary" type="button" disabled={page >= data.totalPages} onClick={() => setPage(value => value + 1)}>Next</button></div>
    </>}
  </div>;
}
