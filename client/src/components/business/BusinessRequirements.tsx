"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, FileCheck2, MapPin, Plus, RefreshCw, Search, UsersRound, X } from "lucide-react";
import { getBusinessRequirements } from "@/services/business.service";
import type { BusinessRequirementsQuery } from "@/types/business-requirements.types";
import type { RequirementFilter } from "@/types/business-dashboard.types";
import { useBusiness } from "./BusinessProvider";
import { businessDate, count, DashboardError, DashboardLoading, requirementLocations, requirementServiceLabel, StatusBadge, statusInfo, useBusinessResource } from "./BusinessDashboardUI";
import "@/styles/business-dashboard.css";
import "@/styles/business-requirements.css";

export function BusinessRequirements() {
  const { user } = useBusiness();
  const [filters, setFilters] = useState<BusinessRequirementsQuery>({ query: "", status: "ALL", sort: "newest", page: 1 });
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const request = useCallback((signal: AbortSignal) => getBusinessRequirements(filters, signal), [filters]);
  const result = useBusinessResource(`${user.id}:${JSON.stringify(filters)}:${revision}`, request, user.id);
  const data = result.data ?? (result.loading ? result.previousData : undefined);
  const refresh = () => setRevision(value => value + 1);
  function updateFilter(next: Partial<BusinessRequirementsQuery>) { setFilters(current => ({ ...current, ...next, page: 1 })); }
  function searchSubmit(event: FormEvent) { event.preventDefault(); updateFilter({ query: search.trim() }); }
  function clear() { setSearch(""); setFilters({ query: "", status: "ALL", sort: "newest", page: 1 }); }

  return <div className="zb-dash zb-req">
    <header className="zb-dash-heading"><div><p className="zb-biz-eyebrow">PLAN THE WORK. BUILD THE TEAM.</p><h1>Your requirements, organised.</h1><p>Create a brief, follow its progress and keep your team’s needs up to date.</p></div><Link className="zb-biz-text-link" href="/business/requirements/drafts">Saved drafts</Link><Link className="zb-biz-button" href="/business/requirements/new"><Plus aria-hidden="true" />New requirement</Link></header>
    <section className="zb-req-flow-banner" aria-label="Requirement journey"><div><ClipboardList aria-hidden="true" /><span>01</span><strong>Share your brief</strong></div><span aria-hidden="true">→</span><div><FileCheck2 aria-hidden="true" /><span>02</span><strong>Our team reviews</strong></div><span aria-hidden="true">→</span><div><UsersRound aria-hidden="true" /><span>03</span><strong>Keep it up to date</strong></div></section>
    <section className="zb-req-controls" aria-label="Find requirements">
      <form className="zb-req-search" onSubmit={searchSubmit}><label className="zb-dash-sr-only" htmlFor="requirement-search">Search requirements by service, location, company or reference</label><Search aria-hidden="true" /><input id="requirement-search" value={search} onChange={event => setSearch(event.target.value)} maxLength={120} placeholder="Search service, location or reference…" type="search" /><button type="submit" disabled={result.loading}>Search</button></form>
      <label className="zb-dash-select"><span className="zb-dash-sr-only">Requirement order</span><select value={filters.sort} disabled={result.loading} onChange={event => updateFilter({ sort: event.target.value as BusinessRequirementsQuery["sort"] })}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      <button className="zb-dash-refresh" type="button" disabled={result.loading} onClick={refresh}><RefreshCw aria-hidden="true" className={result.loading ? "zb-biz-spin" : undefined} /><span>{result.loading ? "Updating…" : "Refresh"}</span></button>
    </section>
    <div className="zb-req-status-filters" role="group" aria-label="Filter requirements by status">{(["ALL", "NEW", "CONTACTED", "QUALIFIED", "CLOSED"] as RequirementFilter[]).map(status => <button key={status} type="button" aria-pressed={filters.status === status} disabled={result.loading} onClick={() => updateFilter({ status })}><span>{status === "ALL" ? "All requests" : statusInfo[status].label}</span>{data && <strong>{count(status === "ALL" ? data.totalRequirements : data.counts.find(row => row.status === status)?.count ?? 0)}</strong>}</button>)}</div>
    <p className="zb-req-filter-note">Status counts cover all your requirements. Search narrows the list below.</p>
    {result.error && <DashboardError error={result.error} retry={refresh} next="/business/requirements" />}
    {result.loading && !data && <DashboardLoading />}
    {data && <div aria-busy={result.loading}>
      <div className="zb-req-results-heading"><p role="status">{result.loading ? "Updating requirements…" : `${count(data.total)} ${data.total === 1 ? "requirement" : "requirements"}${data.query ? ` matching “${data.query}”` : ""}`}</p>{(filters.query || filters.status !== "ALL") && <button type="button" disabled={result.loading} onClick={clear}><X aria-hidden="true" />Clear filters</button>}</div>
      {data.items.length ? <ul className="zb-req-card-grid">{data.items.map(item => {
        const places = requirementLocations(item);
        return <li key={item.id}><Link href={`/business/requirements/${item.id}`} className="zb-req-card"><div className="zb-req-card-top"><span className="zb-biz-icon"><ClipboardList aria-hidden="true" /></span><StatusBadge status={item.status} /></div><h2>{requirementServiceLabel(item.serviceRequired)}</h2><span className="zb-req-card-reference">Ref · {item.id.slice(-8).toUpperCase()}</span>
          <div className="zb-req-card-people"><strong>{count(item.workforceCount)}</strong><span>people requested</span><UsersRound aria-hidden="true" /></div>
          <p><MapPin aria-hidden="true" /><span>{places.slice(0, 2).join(", ")}{places.length > 2 ? ` +${places.length - 2} more` : ""}</span></p><p><CalendarDays aria-hidden="true" /><span>{item.projectDuration}</span></p>
          <div className="zb-req-card-bottom"><span>Submitted {businessDate(item.createdAt)}</span><span>View brief<ArrowUpRight aria-hidden="true" /></span></div>
        </Link></li>;
      })}</ul> : <section className="zb-biz-card zb-req-empty"><span className="zb-biz-icon zb-biz-icon--large"><ClipboardList aria-hidden="true" /></span><h2>{data.totalRequirements === 0 ? "Give your next team a starting point." : "No requirements match these filters."}</h2><p>{data.totalRequirements === 0 ? "Tell us the service, people and locations you need. Your business requests and their updates will stay together here." : "Try a different service, location or status to find the request you need."}</p>{data.totalRequirements === 0 ? <Link className="zb-biz-button" href="/business/requirements/new"><Plus aria-hidden="true" />Create your first requirement</Link> : <button className="zb-biz-button zb-biz-button--secondary" type="button" onClick={clear}>Show all requirements</button>}</section>}
      <nav className="zb-dash-pagination zb-req-pagination" aria-label="Requirements pages"><p>{data.total ? `${count((data.page - 1) * data.pageSize + 1)}–${count(Math.min(data.page * data.pageSize, data.total))} of ${count(data.total)}` : "0 requests"}</p><div><button type="button" disabled={result.loading || data.page === 1} aria-label="Previous page" onClick={() => setFilters(current => ({ ...current, page: data.page - 1 }))}><ChevronLeft aria-hidden="true" /></button><span>Page {data.page} of {data.totalPages}</span><button type="button" disabled={result.loading || data.page >= data.totalPages} aria-label="Next page" onClick={() => setFilters(current => ({ ...current, page: data.page + 1 }))}><ChevronRight aria-hidden="true" /></button></div></nav>
    </div>}
  </div>;
}
