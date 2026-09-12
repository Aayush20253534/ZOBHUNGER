"use client";

import { PrivateResume } from "@/components/worker/WorkflowUI";
import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCheck, FileText, Search, Send, ShieldCheck, X } from "lucide-react";
import { ApiError } from "@/lib/api";
import { getCurrentUser } from "@/services/auth.service";
import { getCandidateOptions, shareCandidate } from "@/services/business-candidates.service";
import type { ApplicationOption, CandidateRequirement } from "@/types/business-candidates.types";
import { requirementServiceLabel, useBusinessResource } from "@/components/business/BusinessDashboardUI";
import { CandidateWorkspace } from "@/components/business/candidates/CandidateWorkspace";
import { CandidateError, CandidateLoading, CandidatePagination, reviewError, safeCvLink } from "@/components/business/candidates/CandidateUI";
import "@/styles/business.css";
import "@/styles/business-candidates.css";

export function AdminCandidateManagement({ requirementId }: { requirementId?: string }) {
  const [version, setVersion] = useState(0);
  const [authVersion, setAuthVersion] = useState(0);
  const request = useCallback(() => getCurrentUser(), []);
  const { data, error, loading } = useBusinessResource(`candidate-admin:${authVersion}`, request);
  return <div className="zb-biz zb-cand zb-cand-admin"><Link className="zb-biz-text-link" href="/admin"><ArrowLeft aria-hidden="true" />Operations dashboard</Link>{loading ? <CandidateLoading /> : error ? <CandidateError error={error} retry={() => setAuthVersion(value => value + 1)} admin /> : data?.user.role !== "ADMIN" ? <CandidateError error={new ApiError("Use your administrator account to manage candidate sharing.", 403)} retry={() => setAuthVersion(value => value + 1)} admin /> : <>
    <header className="zb-cand-heading"><div><p className="zb-biz-eyebrow">ZOBHUNGER OPERATIONS</p><h1>Connect the right people.</h1><p>Share a reviewed application with a business, then follow the conversation through to a decision.</p></div><span className="zb-cand-admin-label"><ShieldCheck aria-hidden="true" />Administrator access</span></header>
    <CandidateShareForm key={data.user.id} accountId={data.user.id} onShared={() => setVersion(value => value + 1)} />
    <div id="candidate-review-desk"><CandidateWorkspace key={`${data.user.id}:${requirementId ?? "all"}`} admin accountId={data.user.id} requirementId={requirementId} refreshToken={version} /></div>
  </>}</div>;
}

function CandidateShareForm({ accountId, onShared }: { accountId: string; onShared: () => void }) {
  const [requirement, setRequirement] = useState<CandidateRequirement | null>(null);
  const [application, setApplication] = useState<ApplicationOption | null>(null);
  const [skills, setSkills] = useState(""); const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !requirement || !application) return;
    const values = skills.split(",").map(value => value.trim()).filter(Boolean);
    if (values.length > 12 || values.some(value => value.length > 60)) { setError("Use up to 12 skills, with at most 60 characters per skill."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await shareCandidate({ requirementId: requirement.id, applicationId: application.id, summary, skills: values });
      setNotice(result.data.created ? `${application.name} was shared with ${requirement.companyName}. The profile is now in the pipeline below.` : "This application was already shared for that requirement. Its existing review was preserved.");
      setApplication(null); setSkills(""); setSummary(""); onShared();
    } catch (reason) { setError(reviewError(reason)); } finally { setBusy(false); }
  }
  const cv = safeCvLink(application?.resumeUrl ?? null);
  return <section className="zb-cand-share"><div className="zb-cand-section-title"><Send aria-hidden="true" /><div><h2>Share a candidate</h2><p>Choose the receiving business and the application you have reviewed.</p></div></div>
    <div className="zb-cand-share-pickers" aria-busy={busy}><div><h3><span>01</span> Receiving requirement</h3>{requirement ? <div className="zb-cand-selection"><strong>{requirement.companyName}</strong><p>{requirementServiceLabel(requirement.serviceRequired)} · {requirement.jobLocation}</p><small>Reference: {requirement.id}</small><button type="button" disabled={busy} onClick={() => { setRequirement(null); setApplication(null); }}><X aria-hidden="true" />Change requirement</button></div> : <RequirementPicker accountId={accountId} onSelect={setRequirement} />}</div>
    <div><h3><span>02</span> Reviewed application</h3>{application ? <div className="zb-cand-selection"><strong>{application.name}</strong><p>{application.job.title} · {application.city || "Location to confirm"}</p><p className="zb-cand-preserve">{application.experience || "Experience to discuss"}</p>{application.hasPrivateResume && <PrivateResume className="zb-biz-button zb-biz-button--secondary" path={`/admin/worker-applications/${application.id}/resume`} />}{cv && <a href={cv} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"><FileText aria-hidden="true" />Review submitted CV</a>}<button type="button" disabled={busy} onClick={() => setApplication(null)}><X aria-hidden="true" />Change application</button></div> : <ApplicationPicker key={requirement?.id || "all"} requirementId={requirement?.id} accountId={accountId} onSelect={item => { setApplication(item); setSkills(item.skills.join(", ")); }} />}</div></div>
    {requirement && application && <form onSubmit={submit} className="zb-cand-share-form"><fieldset disabled={busy}><h3><span>03</span> Brief the business</h3><label className="zb-cand-field"><span>Profile summary *</span><textarea value={summary} onChange={event => setSummary(event.target.value)} required minLength={10} maxLength={1500} rows={3} placeholder="Explain this person's relevant experience and suitability for the requirement." /></label><label className="zb-cand-field"><span>Relevant skills</span><input value={skills} onChange={event => setSkills(event.target.value)} maxLength={740} placeholder="For example: Retail sales, Customer service, Reporting" /></label><p className="zb-cand-muted">Separate skills with commas, up to 12. Confirm the details before sharing.</p><label className="zb-cand-check"><input type="checkbox" required />I have reviewed this application and its CV for sharing with {requirement.companyName}.</label><button className="zb-biz-button" type="submit">{busy ? "Sharing profile…" : "Share with this business"}<ArrowRight aria-hidden="true" /></button></fieldset></form>}
    {error && <p role="alert" className="zb-biz-error">{error}</p>}{notice && <p role="status" className="zb-biz-success-inline"><CheckCheck aria-hidden="true" />{notice}</p>}
    <p className="zb-cand-muted">Only reviewed or shortlisted applications from real openings can be shared. This keeps the business pipeline deliberate and auditable.</p>
  </section>;
}

function RequirementPicker({ accountId, onSelect }: { accountId: string; onSelect: (item: CandidateRequirement) => void }) {
  return <OptionPicker<CandidateRequirement> accountId={accountId} kind="requirements" placeholder="Company, service, city or reference" onSelect={onSelect} label={item => item.companyName} description={item => `${requirementServiceLabel(item.serviceRequired)} · ${item.jobLocation} · ${item.id.slice(-8)}`} />;
}
function ApplicationPicker({ accountId, onSelect, requirementId }: { requirementId?: string; accountId: string; onSelect: (item: ApplicationOption) => void }) {
  return <OptionPicker<ApplicationOption> requirementId={requirementId} accountId={accountId} kind="applications" placeholder="Applicant name, city or job title" onSelect={onSelect} label={item => item.name} description={item => `${item.job.title} · ${item.city || "Location to confirm"} · ${item.source === "WORKER_PORTAL" ? "Worker portal" : item.source === "PLACEMENT_CELL" ? "Placement Cell" : "Public application"}${item.job.requirementId ? " · Linked requirement" : ""}`} />;
}
function OptionPicker<T extends { id: string }>({ accountId, kind, placeholder, label, description, onSelect, requirementId }: { requirementId?: string; accountId: string; kind: "requirements" | "applications"; placeholder: string; label: (item: T) => string; description: (item: T) => string; onSelect: (item: T) => void }) {
  const [input, setInput] = useState(""); const [query, setQuery] = useState(""); const [page, setPage] = useState(1); const [version, setVersion] = useState(0);
  const request = useCallback((signal: AbortSignal) => getCandidateOptions<T>(kind, query, page, signal, requirementId), [kind, query, page, requirementId]);
  const { data, error, loading } = useBusinessResource(`${accountId}:${kind}:${query}:${page}:${version}:${requirementId ?? "all"}`, request);
  return <div className="zb-cand-picker"><form onSubmit={event => { event.preventDefault(); setQuery(input.trim()); setPage(1); }}><label className="zb-cand-search"><Search aria-hidden="true" /><span className="zb-cand-sr-only">Search {kind}</span><input value={input} onChange={event => setInput(event.target.value)} placeholder={placeholder} maxLength={100} /></label><button className="zb-cand-icon-button" aria-label={`Search ${kind}`}><ArrowRight aria-hidden="true" /></button></form>
    {loading ? <p role="status">Loading {kind}…</p> : error ? <CandidateError error={error} retry={() => setVersion(value => value + 1)} admin /> : data && <><ul>{data.items.map(item => <li key={item.id}><button type="button" onClick={() => onSelect(item)}><span><strong>{label(item)}</strong><small>{description(item)}</small></span><ArrowRight aria-hidden="true" /></button></li>)}</ul>{!data.total && <p>No eligible {kind} found. {query ? "Try a different search." : kind === "requirements" ? "The business must submit an owned requirement first." : "Review or shortlist applications in the Application desk before sharing them."}</p>}<CandidatePagination page={data.page} totalPages={data.totalPages} onChange={setPage} label={`${kind} pages`} /></>}
  </div>;
}
