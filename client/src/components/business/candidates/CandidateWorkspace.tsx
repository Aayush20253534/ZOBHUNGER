"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarClock, CheckCheck, Columns3, LayoutGrid, MapPin, RefreshCw, Search, UsersRound } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getCandidates } from "@/services/business-candidates.service";
import { candidateStatuses, type BusinessCandidate, type CandidateStatus } from "@/types/business-candidates.types";
import { businessDate, requirementServiceLabel, useBusinessResource } from "../BusinessDashboardUI";
import { useBusiness } from "../BusinessProvider";
import { CandidateBadge, CandidateError, CandidateLoading, CandidatePagination, candidateStages } from "./CandidateUI";
import { CandidateProfile, initials } from "./CandidateProfile";
import "@/styles/business-candidates.css";

export function BusinessCandidates({ requirementId }: { requirementId?: string }) {
  const { user } = useBusiness();
  return <CandidateWorkspace key={`${user.id}:${requirementId ?? "all"}`} accountId={user.id} requirementId={requirementId} />;
}
export function BusinessCandidatePage({ id }: { id: string }) {
  const { user } = useBusiness();
  return <div className="zb-cand zb-cand-full-profile"><Link className="zb-biz-text-link" href="/business/candidates"><ArrowLeft aria-hidden="true" />Candidate pipeline</Link><CandidateProfile key={`${user.id}:${id}`} accountId={user.id} id={id} /></div>;
}
export function CandidateWorkspace({ accountId, requirementId, admin = false, refreshToken = 0 }: { accountId: string; requirementId?: string; admin?: boolean; refreshToken?: number }) {
  const [search, setSearch] = useState(""); const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CandidateStatus | "ALL">("ALL");
  const [page, setPage] = useState(1); const [version, setVersion] = useState(0);
  const [view, setView] = useState<"board" | "cards">("board");
  const [selected, setSelected] = useState<string | null>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const request = useCallback((signal: AbortSignal) => getCandidates(admin, { query, status, page, requirementId }, signal), [admin, query, status, page, requirementId]);
  const { data, loading, error } = useBusinessResource(`${accountId}:${admin}:${requirementId}:${query}:${status}:${page}:${version}:${refreshToken}`, request);
  const refresh = () => setVersion(value => value + 1);
  function filter(value: CandidateStatus | "ALL") { setStatus(value); setPage(1); }
  function submit(event: FormEvent) { event.preventDefault(); setQuery(search.trim()); setPage(1); }
  const Title = admin ? "h2" : "h1";
  const allCount = data ? Object.values(data.counts).reduce((sum, value) => sum + value, 0) : 0;
  function card(item: BusinessCandidate) {
    return <article className="zb-cand-card" key={item.id}>
      <div className="zb-cand-card-person"><span className="zb-cand-avatar" aria-hidden="true">{initials(item.name)}</span><div><h3>{item.name}</h3><span>{item.city || "Location to confirm"}</span></div></div>
      <CandidateBadge status={item.status} />{item.revokedAt && <p className="zb-cand-muted">Business access revoked</p>}
      <p className="zb-cand-job"><BriefcaseBusiness aria-hidden="true" />{item.jobTitle}</p><p className="zb-cand-experience">{item.experience || "Experience to discuss"}</p>
      <ul className="zb-cand-skills">{item.skills.slice(0, 3).map(skill => <li key={skill}>{skill}</li>)}{item.skills.length > 3 && <li>+{item.skills.length - 3} skills</li>}</ul>
      <p className="zb-cand-card-brief">{admin && <strong>{item.requirement.companyName} · </strong>}{requirementServiceLabel(item.requirement.serviceRequired)}<span><MapPin aria-hidden="true" />{item.requirement.jobLocation}</span></p>
      <div className="zb-cand-card-bottom"><time dateTime={item.updatedAt}>Updated {businessDate(item.updatedAt)}</time><button type="button" onClick={event => { lastTrigger.current = event.currentTarget; setSelected(item.id); }} aria-label={`Review ${item.name} for ${requirementServiceLabel(item.requirement.serviceRequired)}`}>View profile<ArrowRight aria-hidden="true" /></button></div>
    </article>;
  }
  return <div className="zb-cand">
    {requirementId && !admin && <Link className="zb-biz-text-link" href={`/business/requirements/${requirementId}`}><ArrowLeft aria-hidden="true" />Back to requirement</Link>}
    <header className="zb-cand-heading"><div><p className="zb-biz-eyebrow">{admin ? "BUSINESS REVIEW DESK" : "PEOPLE, READY FOR YOUR REVIEW"}</p><Title>{admin ? "Shared candidate pipeline" : "Your next team starts here."}</Title><p>{admin ? "Track company decisions and coordinate requested interviews." : "Explore shared profiles, shape your shortlist and keep every decision in one place."}</p></div><button type="button" className="zb-biz-button zb-biz-button--secondary" disabled={loading} onClick={refresh}><RefreshCw aria-hidden="true" />Refresh</button></header>
    {!admin && <ol className="zb-cand-story"><li><span><UsersRound aria-hidden="true" /></span><div><strong>01 / Discover the people</strong><p>Profiles shared for your requirement</p></div></li><li><span><CalendarClock aria-hidden="true" /></span><div><strong>02 / Start a conversation</strong><p>Request a time to meet</p></div></li><li><span><CheckCheck aria-hidden="true" /></span><div><strong>03 / Make your decision</strong><p>Feedback with a clear next step</p></div></li></ol>}
    {data?.requirement && <div className="zb-cand-context"><BriefcaseBusiness aria-hidden="true" /><div><strong>{requirementServiceLabel(data.requirement.serviceRequired)}</strong><span>{data.requirement.companyName} · {data.requirement.jobLocation}{data.requirement.status === "CLOSED" ? " · Closed requirement" : ""}</span></div><Link className="zb-biz-text-link" href={admin ? "/admin/candidate-management" : "/business/candidates"}>All candidates<ArrowRight aria-hidden="true" /></Link></div>}
    <form className="zb-cand-toolbar" onSubmit={submit}><label className="zb-cand-search"><Search aria-hidden="true" /><span className="zb-cand-sr-only">Search candidate name, location or role</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, city or role" maxLength={100} /></label><button type="submit" className="zb-biz-button zb-biz-button--secondary">Search</button><label className="zb-cand-status-select"><span className="zb-cand-sr-only">Candidate stage</span><select value={status} onChange={event => filter(event.target.value as CandidateStatus | "ALL")}><option value="ALL">All stages</option>{candidateStatuses.map(stage => <option key={stage} value={stage}>{candidateStages[stage].label}</option>)}</select></label><div className="zb-cand-view" role="group" aria-label="Display style"><button type="button" aria-label="Pipeline board" aria-pressed={view === "board"} onClick={() => setView("board")}><Columns3 aria-hidden="true" /></button><button type="button" aria-label="Candidate cards" aria-pressed={view === "cards"} onClick={() => setView("cards")}><LayoutGrid aria-hidden="true" /></button></div></form>
    {loading ? <CandidateLoading /> : error ? <CandidateError error={error} retry={refresh} admin={admin} /> : data && <>
      <div className="zb-cand-metrics" aria-label="Filter by candidate stage">{candidateStatuses.map(stage => { const Icon = candidateStages[stage].icon; return <button key={stage} type="button" data-stage={stage} aria-pressed={status === stage} onClick={() => filter(status === stage ? "ALL" : stage)}><Icon aria-hidden="true" /><strong>{data.counts[stage]}</strong><span>{candidateStages[stage].label}</span></button>; })}</div>
      <div className="zb-cand-result-heading" role="status"><p>{data.total ? `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)} of ${data.total} candidates` : "No candidates to show"}{status !== "ALL" && ` · ${candidateStages[status].label}`}</p>{(query || status !== "ALL") && <button type="button" onClick={() => { setSearch(""); setQuery(""); filter("ALL"); }}>Clear filters</button>}</div>
      {!data.total ? <section className="zb-cand-empty"><UsersRound aria-hidden="true" /><h2>{query || status !== "ALL" ? "No profiles match this view" : "Your candidate story starts here"}</h2><p>{query || status !== "ALL" ? "Try another search or stage to find the people you need." : admin ? "Share a real job application with an eligible business requirement using the form above." : "Once our team shares candidates for your requirement, their profiles and review steps will appear here."}</p>{!admin && !query && status === "ALL" && <Link href="/business/requirements" className="zb-biz-button">View your requirements<ArrowRight aria-hidden="true" /></Link>}</section> : <>
        {view === "board" && status === "ALL" ? <div className="zb-cand-board">{candidateStatuses.map(stage => <section className="zb-cand-lane" key={stage} data-empty={!data.items.some(item => item.status === stage)}><div className="zb-cand-lane-title"><h2>{candidateStages[stage].label}</h2><span>{data.counts[stage]}</span></div>{data.items.filter(item => item.status === stage).map(card)}{!data.items.some(item => item.status === stage) && <p className="zb-cand-lane-empty">{data.counts[stage] ? "Profiles in this stage appear on other pages. Select this stage to browse them." : "No profiles at this stage yet."}</p>}</section>)}</div> : <div className="zb-cand-cards">{data.items.map(card)}</div>}
        <CandidatePagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        <p className="zb-cand-muted">Stage totals cover all {allCount} profiles matching this search. The board shows this page’s profiles{admin ? ", including revoked submissions" : ""}.</p>
      </>}
    </>}
    <Sheet open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}><SheetContent className="zb-biz zb-cand zb-cand-drawer" finalFocus={lastTrigger}><SheetHeader><SheetTitle>Candidate review</SheetTitle><SheetDescription>Profile, decisions and review history</SheetDescription></SheetHeader><div className="zb-cand-drawer-body">{selected && <CandidateProfile key={`${accountId}:${selected}`} id={selected} accountId={accountId} admin={admin} onChanged={refresh} compact />}</div></SheetContent></Sheet>
  </div>;
}
