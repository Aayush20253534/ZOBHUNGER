"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { CalendarClock, CheckCheck, ExternalLink, FileText, History, MapPin, MessageSquareText, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { getCandidate, reviewCandidate, revokeCandidate } from "@/services/business-candidates.service";
import type { BusinessCandidate, CandidateEvent, CandidateReview, CandidateStatus } from "@/types/business-candidates.types";
import { businessDate, requirementServiceLabel, useBusinessResource } from "../BusinessDashboardUI";
import { CandidateBadge, CandidateError, CandidateLoading, CandidatePagination, candidateStages, reviewError, safeCvLink } from "./CandidateUI";

export function CandidateProfile({ id, accountId, admin = false, onChanged, compact = false }: { id: string; accountId: string; admin?: boolean; onChanged?: () => void; compact?: boolean }) {
  const [version, setVersion] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [notice, setNotice] = useState("");
  const request = useCallback((signal: AbortSignal) => getCandidate(admin, id, historyPage, signal), [admin, id, historyPage]);
  const resource = useBusinessResource(`${accountId}:${admin}:${id}:${version}:${historyPage}`, request, `${accountId}:${admin}:${id}:${version}`);
  const { loading, error } = resource;
  // Keep the same profile/form mounted while paging its history so unsaved
  // review text is not discarded. Never reuse another profile/account's data.
  const data = resource.data ?? resource.previousData;
  function refresh() { setVersion(value => value + 1); }
  function saved(message: string) { setNotice(message); setHistoryPage(1); refresh(); onChanged?.(); }
  if (loading && !data) return <CandidateLoading />;
  if (error) return <CandidateError error={error} retry={refresh} admin={admin} />;
  if (!data) return null;
  const { candidate: item, history } = data;
  const cv = safeCvLink(item.resumeUrl);
  const Heading = compact ? "h2" : "h1";
  return <div className="zb-cand-profile">
    <div className="zb-cand-profile-top"><span className="zb-cand-avatar" aria-hidden="true">{initials(item.name)}</span><div><p className="zb-biz-eyebrow">CANDIDATE PROFILE</p><Heading>{item.name}</Heading><p>{item.jobTitle}</p></div><button type="button" className="zb-cand-icon-button" onClick={refresh} aria-label="Refresh candidate profile"><RefreshCw aria-hidden="true" /></button></div>
    <div className="zb-cand-inline"><CandidateBadge status={item.status} />{item.revokedAt && <span className="zb-cand-badge">Access revoked</span>}<span><MapPin aria-hidden="true" />{item.city || "Location to confirm"}</span></div>
    <div className="zb-cand-context"><FileText aria-hidden="true" /><div><strong>{requirementServiceLabel(item.requirement.serviceRequired)}</strong><span>{item.requirement.companyName} · {item.requirement.jobLocation}</span>{!admin && <Link href={`/business/requirements/${item.requirementId}`}>View requirement</Link>}</div></div>
    {notice && <p className="zb-biz-success-inline" role="status"><CheckCheck aria-hidden="true" />{notice}</p>}
    {item.status === "SELECTED" && !item.revokedAt && <Link className="zb-biz-text-link" href={admin ? `/admin/deployments?requirementId=${item.requirementId}` : `/business/requirements/${item.requirementId}/deployments`}><CalendarClock aria-hidden="true" />{admin ? "Set up or review team assignments" : "View assigned team and weekly plan"}<ExternalLink aria-hidden="true" /></Link>}
    <section className="zb-cand-section"><h2><UserRound aria-hidden="true" />Profile at a glance</h2><p className="zb-cand-preserve">{item.summary}</p><dl className="zb-cand-facts"><div><dt>Experience</dt><dd>{item.experience || "To be discussed"}</dd></div><div><dt>Available from</dt><dd>{item.availableFrom ? businessDate(item.availableFrom) : "To be confirmed"}</dd></div></dl>
      <h3>Skills shared by our team</h3>{item.skills.length ? <ul className="zb-cand-skills">{item.skills.map(skill => <li key={skill}>{skill}</li>)}</ul> : <p className="zb-cand-muted">Skills have not been added to this submission.</p>}
      {cv ? <a className="zb-biz-button zb-biz-button--secondary" href={cv} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"><FileText aria-hidden="true" />Open CV<ExternalLink aria-hidden="true" /></a> : <p className="zb-cand-cv-note"><FileText aria-hidden="true" />CV not available. Ask the account team to provide it.</p>}
      {cv && <p className="zb-cand-muted">Opens the submitted CV in a new tab.</p>}
    </section>
    {item.revokedAt ? <p className="zb-cand-notice"><ShieldCheck aria-hidden="true" />This submission is no longer visible to the business.</p> : admin ? <><p className="zb-cand-notice"><MessageSquareText aria-hidden="true" />Review the business feedback below and coordinate any interview requests with the candidate.</p><RevokeForm item={item} onSaved={() => saved("Business access revoked.")} /></> : item.requirement.status === "CLOSED" ? <p className="zb-cand-notice">This requirement is closed. The profile and its review history remain available.</p> : <ReviewForm item={item} onSaved={saved} />}
    <section className="zb-cand-section" aria-busy={loading}><h2><History aria-hidden="true" />Review history <small>{history.total}</small></h2><p className="zb-cand-muted">{loading ? "Loading history…" : "Newest first · All times in IST"}</p><ol className="zb-cand-timeline">{history.items.map(event => <HistoryEvent key={event.id} event={event} />)}</ol><CandidatePagination page={history.page} totalPages={history.totalPages} onChange={setHistoryPage} label="Review history pages" /></section>
    <p className="zb-cand-muted">Shared {businessDate(item.createdAt)}. A selection records your decision; deployment is coordinated separately.</p>
    {compact && !admin && <Link className="zb-biz-text-link" href={`/business/candidates/${id}`}>Open full profile<ExternalLink aria-hidden="true" /></Link>}
  </div>;
}

export function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase(); }
function HistoryEvent({ event }: { event: CandidateEvent }) {
  const Icon = event.kind === "INTERVIEW_REQUESTED" ? CalendarClock : event.kind === "FEEDBACK" ? MessageSquareText : History;
  const title = event.kind === "INTERVIEW_REQUESTED" ? "Interview requested" : event.kind === "FEEDBACK" ? "Feedback added" : event.kind === "ACCESS_REVOKED" ? "Business access revoked" : event.kind === "SHARED" ? "Candidate shared" : `${event.fromStatus ? candidateStages[event.fromStatus].label : "Review"} → ${event.toStatus ? candidateStages[event.toStatus].label : "Updated"}`;
  return <li><span><Icon aria-hidden="true" /></span><div><h3>{title}</h3><time dateTime={event.createdAt}>{businessDate(event.createdAt, true)} IST · {event.actorRole === "BUSINESS" ? "Business team" : "ZOBHUNGER team"}</time><p className="zb-cand-preserve">{event.note}</p>{event.interviewAt && <div className="zb-cand-interview"><strong>{businessDate(event.interviewAt, true)} IST</strong><span>{event.interviewMode?.replaceAll("_", " ")}</span><p className="zb-cand-preserve">{event.interviewDetails}</p><small>Requested time; confirmation requires coordination with the account team.</small></div>}</div></li>;
}

function ReviewForm({ item, onSaved }: { item: BusinessCandidate; onSaved: (notice: string) => void }) {
  const [action, setAction] = useState("FEEDBACK");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const completed = item.status === "SELECTED" || item.status === "REJECTED";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    setError("");
    let payload: CandidateReview;
    if (action === "INTERVIEW") {
      // Use an explicit offset so a reviewer's device timezone cannot alter IST.
      const time = new Date(`${form.get("date")}T${form.get("time")}:00+05:30`);
      if (!Number.isFinite(time.getTime())) { setError("Choose a valid interview date and time in IST."); return; }
      payload = { action: "INTERVIEW", revision: item.revision, note, interviewAt: time.toISOString(), interviewMode: form.get("mode") as "PHONE" | "VIDEO" | "IN_PERSON", interviewDetails: String(form.get("details")) };
    } else if (action === "FEEDBACK") payload = { action: "FEEDBACK", revision: item.revision, note };
    else payload = { action: "STATUS", revision: item.revision, note, status: action as Exclude<CandidateStatus, "INTERVIEW_REQUESTED"> };
    setBusy(true);
    try { await reviewCandidate(item.id, payload); onSaved(action === "INTERVIEW" ? "Interview request recorded for the account team to coordinate." : "Your review has been saved."); }
    catch (reason) { setError(reviewError(reason)); setBusy(false); }
  }
  return <section className="zb-cand-section zb-cand-review"><h2><ListReviewIcon />Your next step</h2><form onSubmit={submit}><fieldset disabled={busy}>
    <label className="zb-cand-field"><span>Action</span><select value={action} onChange={event => { setAction(event.target.value); setError(""); }}><option value="FEEDBACK">Add feedback</option>{completed ? <option value="SHARED">Reopen review</option> : <><option value="INTERVIEW">{item.status === "INTERVIEW_REQUESTED" ? "Propose a new interview time" : "Request an interview"}</option>{item.status !== "SHORTLISTED" && <option value="SHORTLISTED">{item.status === "INTERVIEW_REQUESTED" ? "Return to shortlist" : "Shortlist candidate"}</option>}<option value="SELECTED">Select candidate</option><option value="REJECTED">Mark as not selected</option></>}</select></label>
    {action === "INTERVIEW" && <><div className="zb-cand-two-fields"><label className="zb-cand-field"><span>Date (IST)</span><input type="date" name="date" required /></label><label className="zb-cand-field"><span>Time (IST)</span><input type="time" name="time" required /></label></div><label className="zb-cand-field"><span>Interview format</span><select name="mode"><option value="PHONE">Phone</option><option value="VIDEO">Video call</option><option value="IN_PERSON">In person</option></select></label><label className="zb-cand-field"><span>Venue or coordination details</span><textarea name="details" required minLength={3} maxLength={1000} rows={2} placeholder="Office address, meeting details or person to coordinate with" /></label><p className="zb-cand-muted">Choose a time at least 5 minutes ahead, within 180 days. The team will coordinate confirmation; this does not send an email or calendar invitation.</p></>}
    {action === "SELECTED" && <p className="zb-cand-muted">Records your selection for this requirement. The account team will coordinate the next steps.</p>}
    <label className="zb-cand-field"><span>{action === "FEEDBACK" ? "Feedback" : "Reason or instructions"} *</span><textarea value={note} onChange={event => setNote(event.target.value)} required minLength={3} maxLength={2000} rows={3} placeholder="Explain your decision or what you want to explore with the candidate." /></label>
    <p className="zb-cand-muted">Visible to your business and the ZOBHUNGER operations team.</p>
    {error && <p className="zb-biz-error" role="alert">{error}</p>}<button className="zb-biz-button" type="submit">{busy ? "Saving review…" : action === "INTERVIEW" ? "Save interview request" : action === "FEEDBACK" ? "Save feedback" : "Save decision"}<CheckCheck aria-hidden="true" /></button>
  </fieldset></form></section>;
}
function ListReviewIcon() { return <MessageSquareText aria-hidden="true" />; }
function RevokeForm({ item, onSaved }: { item: BusinessCandidate; onSaved: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const note = String(new FormData(event.currentTarget).get("reason")); setBusy(true); setError("");
    try { await revokeCandidate(item.id, item.revision, note); onSaved(); } catch (reason) { setError(reviewError(reason)); setBusy(false); }
  }
  return <details className="zb-cand-revoke"><summary>Manage business access</summary><form onSubmit={submit}><p>Revoke access if this profile was shared incorrectly. This cannot be undone from the portal.</p><label className="zb-cand-field"><span>Reason *</span><textarea name="reason" required minLength={3} maxLength={2000} rows={2} disabled={busy} /></label><label className="zb-cand-check"><input type="checkbox" required disabled={busy} />Remove this profile from {item.requirement.companyName}’s workspace.</label>{error && <p className="zb-biz-error" role="alert">{error}</p>}<button className="zb-biz-button zb-biz-button--secondary" disabled={busy}>{busy ? "Revoking…" : "Revoke business access"}</button></form></details>;
}
