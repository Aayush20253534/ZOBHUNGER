"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, CircleAlert, MapPin, Search, Send, Sparkles, UsersRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import { listTechnicalInstitutePortalOpportunities, submitTechnicalInstitutePortalCandidate, type TechnicalOpportunityType, type TechnicalPortalOpportunity } from "@/services/technical-institute-portal.service";

const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

export function TechnicalInstitutePortalOpportunities() {
  const [items, setItems] = useState<TechnicalPortalOpportunity[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TechnicalOpportunityType | "">("");
  const [minScore, setMinScore] = useState(55);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await listTechnicalInstitutePortalOpportunities({ page, pageSize: 12, search: search || undefined, opportunityType: type, minScore });
      setItems(response.data.items); setTotalPages(response.data.totalPages); setTotal(response.data.total);
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to load technical opportunities."); }
  }, [search, type, minScore, page]);
  useEffect(() => { const handle = window.setTimeout(() => void load(), 180); return () => window.clearTimeout(handle); }, [load]);

  async function submit(opportunity: TechnicalPortalOpportunity, studentId: string, studentName: string) {
    setBusy(`${opportunity.id}:${studentId}`); setError(""); setNotice("");
    try {
      await submitTechnicalInstitutePortalCandidate(opportunity.id, studentId);
      setNotice(`${studentName} submitted to ${opportunity.title}.`);
      await load();
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to submit the student."); }
    finally { setBusy(null); }
  }

  const totals = useMemo(() => ({ opportunities: items.length, matches: items.reduce((sum, item) => sum + item.eligibleCount, 0) }), [items]);

  return <div className="zti-portal-shell">
    <header className="zti-portal-subhero"><div><Link href="/technical-institute-portal"><ArrowLeft />Portal dashboard</Link><small>Qualification-led matching</small><h1>Technical opportunities</h1><p>See live jobs, internships, apprenticeships and training mapped against verified students from your institute.</p></div><Link className="zti-portal-outline-link" href="/technical-institute-portal/applications">Track applications</Link></header>
    {error && <div className="zti-portal-alert"><CircleAlert />{error}</div>}{notice && <div className="zti-portal-notice"><BadgeCheck />{notice}</div>}
    <section className="zti-portal-opportunity-toolbar"><label><Search /><input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Opportunity, employer or location" /></label><select value={type} onChange={(event) => { setPage(1); setType(event.target.value as TechnicalOpportunityType | ""); }}><option value="">All opportunity types</option><option value="JOB">Jobs</option><option value="INTERNSHIP">Internships</option><option value="APPRENTICESHIP">Apprenticeships</option><option value="TRAINING">Training</option></select><select value={minScore} onChange={(event) => { setPage(1); setMinScore(Number(event.target.value)); }}><option value={55}>55%+ eligible</option><option value={65}>65%+ relevant</option><option value={75}>75%+ strong</option><option value={85}>85%+ best fit</option></select><span>{total} open · {totals.matches} matches on this page</span></section>
    <div className="zti-portal-opportunity-grid">{items.length ? items.map((opportunity) => <article className="zti-portal-opportunity" key={opportunity.id}><div className="top"><span>{label(opportunity.opportunityType)}</span>{opportunity.bestMatchScore ? <strong><Sparkles />Best {opportunity.bestMatchScore}%</strong> : <strong>No roster match</strong>}</div><h2>{opportunity.title}</h2><p className="employer">{opportunity.employerName}</p><p className="location"><MapPin />{opportunity.location}{opportunity.workMode ? ` · ${opportunity.workMode}` : ""}</p><p className="description">{opportunity.description}</p><div className="meta">{opportunity.compensation && <span><small>Compensation</small><strong>{opportunity.compensation}</strong></span>}{opportunity.vacancies && <span><small>Vacancies</small><strong>{opportunity.vacancies}</strong></span>}<span><small>Eligible students</small><strong>{opportunity.eligibleCount}</strong></span><span><small>Submitted</small><strong>{opportunity.submittedCount}</strong></span></div><button className="matches-button" onClick={() => setExpanded(expanded === opportunity.id ? null : opportunity.id)}><UsersRound />{expanded === opportunity.id ? "Hide matched students" : `View ${opportunity.eligibleCount} matched students`}</button>{expanded === opportunity.id && <div className="zti-portal-match-list">{opportunity.matches.length ? opportunity.matches.map((match) => <div key={match.student.id}><span className="score">{match.score}%</span><div><strong>{match.student.fullName}</strong><p>{match.student.tradeBranch} · {match.student.passingYear}</p><small>{match.reasons.slice(0, 3).join(" · ")}</small></div>{match.application ? <span className="zti-portal-status" data-status={match.application.status}>{label(match.application.status)}</span> : <button disabled={busy === `${opportunity.id}:${match.student.id}`} onClick={() => void submit(opportunity, match.student.id, match.student.fullName)}><Send />{busy === `${opportunity.id}:${match.student.id}` ? "Submitting…" : "Submit"}</button>}</div>) : <div className="zti-portal-empty compact"><BriefcaseBusiness /><strong>No students meet this threshold</strong><p>Lower the score threshold or update verified student profiles.</p></div>}</div>}</article>) : <div className="zti-portal-empty"><BriefcaseBusiness /><strong>No open opportunities match the filters</strong><p>Adjust the filters or check again when the technical hiring team publishes new requirements.</p></div>}</div>
    <div className="zti-portal-pagination"><span>Page {page} of {totalPages}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button></div></div>
  </div>;
}
