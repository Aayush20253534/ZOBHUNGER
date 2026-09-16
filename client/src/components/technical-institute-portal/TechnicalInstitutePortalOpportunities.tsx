"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, CircleAlert, LoaderCircle, MapPin, Search, Send, Sparkles, UsersRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  getTechnicalInstitutePortalOpportunityMatches,
  listTechnicalInstitutePortalOpportunities,
  submitTechnicalInstitutePortalCandidate,
  type TechnicalOpportunityType,
  type TechnicalPortalOpportunity,
  type TechnicalPortalOpportunityMatchResult,
} from "@/services/technical-institute-portal.service";

const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

export function TechnicalInstitutePortalOpportunities() {
  const [items, setItems] = useState<TechnicalPortalOpportunity[]>([]);
  const [matches, setMatches] = useState<Record<string, TechnicalPortalOpportunityMatchResult>>({});
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TechnicalOpportunityType | "">("");
  const [minScore, setMinScore] = useState(55);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await listTechnicalInstitutePortalOpportunities({ page, pageSize: 12, search: search || undefined, opportunityType: type });
      setItems(response.data.items);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to load technical opportunities.");
    }
  }, [search, type, page]);

  useEffect(() => {
    const handle = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(handle);
  }, [load]);

  async function loadMatches(opportunityId: string, force = false) {
    if (!force && matches[opportunityId]) return;
    setMatchingId(opportunityId);
    setError("");
    try {
      const response = await getTechnicalInstitutePortalOpportunityMatches(opportunityId, { minScore, limit: 30 });
      setMatches((current) => ({ ...current, [opportunityId]: response.data }));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to calculate eligible students.");
    } finally {
      setMatchingId(null);
    }
  }

  async function toggleMatches(opportunityId: string) {
    if (expanded === opportunityId) {
      setExpanded(null);
      return;
    }
    setExpanded(opportunityId);
    await loadMatches(opportunityId);
  }

  async function submit(opportunity: TechnicalPortalOpportunity, studentId: string, studentName: string) {
    setBusy(`${opportunity.id}:${studentId}`);
    setError("");
    setNotice("");
    try {
      await submitTechnicalInstitutePortalCandidate(opportunity.id, studentId);
      setNotice(`${studentName} submitted to ${opportunity.title}.`);
      await Promise.all([load(), loadMatches(opportunity.id, true)]);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to submit the student.");
    } finally {
      setBusy(null);
    }
  }

  return <div className="zti-portal-shell">
    <header className="zti-portal-subhero"><div><Link href="/technical-institute-portal"><ArrowLeft />Portal dashboard</Link><small>Qualification-led matching</small><h1>Technical opportunities</h1><p>See live jobs, internships, apprenticeships and training mapped against verified students from your institute.</p></div><Link className="zti-portal-outline-link" href="/technical-institute-portal/applications">Track applications</Link></header>
    {error && <div className="zti-portal-alert"><CircleAlert />{error}</div>}{notice && <div className="zti-portal-notice"><BadgeCheck />{notice}</div>}
    <section className="zti-portal-opportunity-toolbar"><label><Search /><input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Opportunity, employer or location" /></label><select value={type} onChange={(event) => { setPage(1); setType(event.target.value as TechnicalOpportunityType | ""); }}><option value="">All opportunity types</option><option value="JOB">Jobs</option><option value="INTERNSHIP">Internships</option><option value="APPRENTICESHIP">Apprenticeships</option><option value="TRAINING">Training</option></select><select value={minScore} onChange={(event) => {
      setMinScore(Number(event.target.value));
      setMatches({});
      setExpanded(null);
    }}><option value={55}>55%+ eligible</option><option value={65}>65%+ relevant</option><option value={75}>75%+ strong</option><option value={85}>85%+ best fit</option></select><span>{total} open · matches calculated when opened</span></section>
    <div className="zti-portal-opportunity-grid">{items.length ? items.map((opportunity) => {
      const result = matches[opportunity.id];
      const bestScore = result?.matches[0]?.score;
      return <article className="zti-portal-opportunity" key={opportunity.id}>
        <div className="top"><span>{label(opportunity.opportunityType)}</span>{bestScore ? <strong><Sparkles />Best {bestScore}%</strong> : <strong>Matches on demand</strong>}</div>
        <h2>{opportunity.title}</h2><p className="employer">{opportunity.employerName}</p><p className="location"><MapPin />{opportunity.location}{opportunity.workMode ? ` · ${opportunity.workMode}` : ""}</p><p className="description">{opportunity.description}</p>
        <div className="meta">{opportunity.compensation && <span><small>Compensation</small><strong>{opportunity.compensation}</strong></span>}{opportunity.vacancies && <span><small>Vacancies</small><strong>{opportunity.vacancies}</strong></span>}<span><small>Eligible students</small><strong>{result ? result.totalMatches : "—"}</strong></span><span><small>Submitted</small><strong>{opportunity.submittedCount}</strong></span></div>
        <button className="matches-button" onClick={() => void toggleMatches(opportunity.id)}><UsersRound />{expanded === opportunity.id ? "Hide matched students" : result ? `View ${result.totalMatches} matched students` : "Calculate matched students"}</button>
        {expanded === opportunity.id && <div className="zti-portal-match-list">
          {matchingId === opportunity.id && !result ? <div className="zti-portal-empty compact"><LoaderCircle /><strong>Calculating eligible students…</strong><p>Only the bounded candidate pool for this opportunity is evaluated.</p></div>
            : result?.matches.length ? <>{result.candidatePoolTruncated && <div className="zti-portal-alert"><CircleAlert />The institute roster exceeded the safe matching scan limit. Refine student data or use search in the admin matcher for exhaustive review.</div>}{result.matches.map((match) => <div key={match.student.id}><span className="score">{match.score}%</span><div><strong>{match.student.fullName}</strong><p>{match.student.tradeBranch} · {match.student.passingYear}</p><small>{match.reasons.slice(0,3).join(" · ")}</small></div>{match.application ? <span className="zti-portal-status" data-status={match.application.status}>{label(match.application.status)}</span> : <button disabled={busy === `${opportunity.id}:${match.student.id}`} onClick={() => void submit(opportunity, match.student.id, match.student.fullName)}><Send />{busy === `${opportunity.id}:${match.student.id}` ? "Submitting…" : "Submit"}</button>}</div>)}</>
              : <div className="zti-portal-empty compact"><BriefcaseBusiness /><strong>No students meet this threshold</strong><p>Lower the score threshold or update verified student profiles.</p></div>}
        </div>}
      </article>;
    }) : <div className="zti-portal-empty"><BriefcaseBusiness /><strong>No open opportunities match the filters</strong><p>Adjust the filters or check again when the technical hiring team publishes new requirements.</p></div>}</div>
    <div className="zti-portal-pagination"><span>Page {page} of {totalPages}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1,value - 1))}>Previous</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages,value + 1))}>Next</button></div></div>
  </div>;
}
