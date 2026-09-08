"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowUpRight, BarChart3, CalendarDays, MapPin, RefreshCw, UsersRound } from "lucide-react";
import { getDeploymentProgress } from "@/services/deployments.service";
import type { ProgressQuery } from "@/types/deployments.types";
import { businessDate, requirementServiceLabel, useBusinessResource } from "../BusinessDashboardUI";
import { AttendanceLoading, AttendancePages, todayIST } from "../attendance/AttendanceUI";
import { DeploymentError } from "./DeploymentUI";

export function DeploymentProgress({ accountId, admin, requirementId, initialDate }: { accountId: string; admin: boolean; requirementId?: string; initialDate?: string }) {
  const [date, setDate] = useState(initialDate || todayIST()); const [search, setSearch] = useState(""); const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ProgressQuery["scope"]>(requirementId ? "ALL" : "OPEN"); const [page, setPage] = useState(1); const [version, setVersion] = useState(0);
  const request = useCallback((signal: AbortSignal) => getDeploymentProgress(admin, { date, query, scope, page, requirementId }, signal), [admin, date, query, scope, page, requirementId]);
  const { data, loading, error } = useBusinessResource(JSON.stringify({ accountId, admin, date, query, scope, page, requirementId, version }), request);
  return <section><div className="zb-att-section-heading"><div><h2>From requirement to assigned team</h2><p>Compare active assignments with each requirement’s requested headcount.</p></div><button className="zb-att-icon-button" type="button" disabled={loading} onClick={() => setVersion(v => v + 1)} aria-label="Refresh deployment progress"><RefreshCw aria-hidden="true" /></button></div>
    <form className="zb-deploy-progress-filters" onSubmit={e => { e.preventDefault(); setQuery(search.trim()); setPage(1); }}><label><span>Coverage date (IST)</span><input type="date" required value={date} min="2000-01-01" max="2099-12-31" onChange={e => { if (e.target.value) { setDate(e.target.value); setPage(1); } }} /></label><label><span>Find a requirement</span><input value={search} onChange={e => setSearch(e.target.value)} maxLength={100} placeholder="Service, company, city or reference" /></label><label><span>Requirements</span><select value={scope} onChange={e => { setScope(e.target.value as typeof scope); setPage(1); }}><option value="OPEN">Open</option><option value="CLOSED">Closed</option><option value="ALL">All</option></select></label><button className="zb-biz-button zb-biz-button--secondary" type="submit">Search</button></form>
    {loading ? <AttendanceLoading /> : error ? <DeploymentError admin={admin} error={error} retry={() => setVersion(v => v + 1)} /> : data && <>
      <p className="zb-deploy-explainer"><BarChart3 aria-hidden="true" />Coverage uses active assignments on {businessDate(data.date)}. Upcoming assignments and selected profiles are shown separately.</p>
      <p className="zb-att-result-line" role="status">{data.total} {data.total === 1 ? "requirement" : "requirements"} in this view</p>
      {!data.total ? <div className="zb-att-empty"><UsersRound aria-hidden="true" /><h3>No requirements match this view</h3><p>Try another search or include closed requirements. Deployment progress appears once the business submits a requirement.</p>{!admin && <Link className="zb-biz-button" href="/business/requirements/new">Create a requirement</Link>}</div> : <div className="zb-deploy-progress-grid">{data.items.map(item => <article className="zb-deploy-progress-card" key={item.requirement.id}>
        <div className="zb-deploy-progress-top"><span>{item.requirement.status === "CLOSED" ? "Closed requirement" : "Open requirement"}</span><small>#{item.requirement.id.slice(-8)}</small></div><h3>{requirementServiceLabel(item.requirement.serviceRequired)}</h3><p>{item.requirement.companyName}</p><p className="zb-deploy-meta"><MapPin aria-hidden="true" />{[...new Set([item.requirement.jobLocation, ...item.requirement.locations].filter(Boolean))].join(" · ")}</p>
        <div className="zb-deploy-progress-value"><strong>{item.active}<span> / {item.requirement.workforceCount}</span></strong><span>{item.coverage === null ? "No target" : `${item.coverage}%`}<small>active coverage</small></span></div>
        <div className="zb-deploy-progress-track" role="img" aria-label={`${item.active} active assignments against ${item.requirement.workforceCount} requested roles`}><span style={{ width: `${Math.min(100, item.coverage ?? 0)}%` }} /></div>
        <div className="zb-deploy-progress-counts"><span><strong>{item.selected}</strong>Selected</span><span><strong>{item.awaitingAssignment}</strong>Unassigned selections</span><span><strong>{item.upcoming}</strong>Upcoming assignments</span></div>
        <p className="zb-deploy-progress-gap">{item.coverage === null ? "Add a requested headcount to calculate coverage." : item.overTarget ? `${item.overTarget} active assignments above the requested headcount.` : item.remaining ? `${item.remaining} roles remain to reach active coverage.` : "The requested active coverage is met."}</p><p className="zb-deploy-meta"><CalendarDays aria-hidden="true" />{item.requirement.projectDuration}{item.requirement.expectedStartAt ? ` · Requested start ${businessDate(item.requirement.expectedStartAt)}` : ""}</p><small>{item.activeSites} active sites · {item.ended} ended · {item.cancelled} cancelled</small>
        <footer><Link className="zb-att-record-link" href={admin ? `/admin/deployments?requirementId=${item.requirement.id}&date=${date}` : `/business/requirements/${item.requirement.id}/deployments?date=${date}`}>View team roster<ArrowUpRight aria-hidden="true" /></Link>{!admin && <Link className="zb-biz-text-link" href={`/business/requirements/${item.requirement.id}`}>Requirement brief</Link>}</footer>
      </article>)}</div>}<AttendancePages page={data.page} totalPages={data.totalPages} onChange={setPage} />
    </>}
  </section>;
}
