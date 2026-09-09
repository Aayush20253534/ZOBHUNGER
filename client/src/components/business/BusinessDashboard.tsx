"use client";

import Link from "next/link";
import { VendorInvitation } from "@/components/vendors/VendorInvitation";
import { OperationsOverview } from "./phase2/OperationsOverview";
import { useCallback, useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, Building2, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, FileCheck2, MapPin, Plus, RefreshCw, Send, UsersRound } from "lucide-react";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { executionVisuals } from "@/data/execution-visuals";
import { getBusinessDashboard } from "@/services/business.service";
import type { BusinessDashboardData, DashboardRange, RequirementFilter } from "@/types/business-dashboard.types";
import { useBusiness } from "./BusinessProvider";
import { profileCompletion } from "./BusinessUI";
import { businessDate, count, DashboardError, DashboardLoading, requirementLocations, requirementServiceLabel, StatusBadge, statusInfo, useBusinessResource } from "./BusinessDashboardUI";
import { RequestedLocations, RequirementActivity, RequirementStatusChart } from "./BusinessDashboardCharts";
import "@/styles/business-dashboard.css";

export function BusinessDashboard() {
  const { user, profile } = useBusiness();
  const [range, setRange] = useState<DashboardRange>(30);
  const [status, setStatus] = useState<RequirementFilter>("ALL");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const request = useCallback((signal: AbortSignal) => getBusinessDashboard({ range, status, page }, signal), [range, status, page]);
  const result = useBusinessResource(`${user.id}:${range}:${status}:${page}:${revision}`, request, user.id);
  const { loading, error } = result;
  const data = result.data ?? (loading ? result.previousData : undefined);
  const completion = profileCompletion(profile);
  const ready = completion === 100 && Boolean(profile?.onboardedAt);
  function filter(value: RequirementFilter) { setStatus(value); setPage(1); }
  const refresh = () => setRevision(value => value + 1);

  return <div className="zb-dash">
    <header className="zb-dash-heading"><div><p className="zb-biz-eyebrow">YOUR BUSINESS AT A GLANCE</p><h1>Your next team starts here.</h1><p>{profile?.companyName || "Your business"} <span aria-hidden="true">·</span> Requirements, people and priorities in one view.</p></div>
      <Link className="zb-biz-button" href="/business/requirements/new"><Plus aria-hidden="true" />Share a requirement</Link>
    </header>
    <div className="zb-dash-toolbar"><p><span className="zb-dash-live-dot" aria-hidden="true" />{profile?.contactPerson ? `Welcome, ${profile.contactPerson}.` : "Welcome to your dashboard."}</p><div>
      <label className="zb-dash-select"><CalendarDays aria-hidden="true" /><span className="zb-dash-sr-only">Activity period</span><select value={range} disabled={loading} onChange={event => { setRange(Number(event.target.value) as DashboardRange); setPage(1); }}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></label>
      <button type="button" className="zb-dash-refresh" disabled={loading} onClick={refresh}><RefreshCw aria-hidden="true" className={loading ? "zb-biz-spin" : undefined} /><span>{loading ? "Updating…" : "Refresh"}</span></button>
    </div></div>
    <OperationsOverview accountId={user.id} refreshToken={revision} />
    {error && <DashboardError error={error} retry={refresh} next="/business/dashboard" />}
    {loading && !data && <DashboardLoading />}
    {data && <div className="zb-dash-data" aria-busy={loading}>
      <DashboardMetrics data={data} />
      {data.summary.totalRequirements === 0 ? <section className="zb-biz-card zb-dash-empty" aria-labelledby="empty-heading">
        <div className="zb-dash-empty-title"><span className="zb-biz-icon zb-biz-icon--large"><ClipboardList aria-hidden="true" /></span><div><h2 id="empty-heading">Your first requirement belongs here.</h2><p>Tell us the roles, locations and timeline. Requests submitted while signed in to this business account appear on this dashboard.</p></div></div>
        <ol className="zb-dash-start-steps"><li><Send aria-hidden="true" /><span>01</span><strong>Share the brief</strong><p>People, work and locations.</p></li><li><FileCheck2 aria-hidden="true" /><span>02</span><strong>Our team reviews</strong><p>Clarify your requirement.</p></li><li><ClipboardList aria-hidden="true" /><span>03</span><strong>Follow the updates</strong><p>See the recorded request status.</p></li></ol>
        <Link href="/business/requirements/new" className="zb-biz-text-link">Share your first requirement<ArrowRight aria-hidden="true" /></Link>
      </section> : <>
        <div className="zb-dash-chart-grid"><RequirementActivity key={data.period.days} data={data} /><RequirementStatusChart data={data} status={data.requirements.status} onStatus={filter} loading={loading} /></div>
        <div className="zb-dash-lower-grid"><RequirementList data={data} status={status} onStatus={filter} onPage={setPage} loading={loading} /><RequestedLocations data={data} /></div>
      </>}
      <section className="zb-dash-next" aria-label="Company setup and support">
        <figure><ExecutionImage visual={executionVisuals["operations-coordination"]} sizes="(max-width: 480px) 110px, 180px" /><figcaption>AI-generated illustration</figcaption></figure>
        <div className="zb-dash-next-copy"><p className="zb-biz-eyebrow">FROM YOUR BRIEF TO THE FIELD</p><h2>{ready ? "A clear brief makes a stronger start." : "Give your next team a clear starting point."}</h2><p>{ready ? "Need help with roles, locations or timelines? Talk through your requirement with our team." : "Complete your company profile so our team has the right contact and business details."}</p><Link href={ready ? "/contact" : "/business/onboarding"} className="zb-biz-text-link">{ready ? "Talk to our team" : "Complete company setup"}<ArrowUpRight aria-hidden="true" /></Link></div>
        <Link href="/business/company" className="zb-dash-profile" aria-label={`Company profile ${completion}% complete. View company profile.`}><div className="zb-biz-ring" style={{ "--completion": `${completion}%` } as CSSProperties}><span>{completion}%</span></div><span><Building2 aria-hidden="true" /><strong>Company profile</strong><small>{ready ? "Setup complete" : "Finish your setup"}</small></span><ArrowRight aria-hidden="true" /></Link>
      </section>
      <p className="zb-dash-footnote" role="status">{loading ? "Updating your company’s dashboard…" : `Updated ${businessDate(data.generatedAt, true)} IST. `}{!loading && "Open totals and the list cover all time; the period selector changes submission activity."}</p>
    </div>}
    <VendorInvitation href="/business/vendors" />
  </div>;
}

function DashboardMetrics({ data }: { data: BusinessDashboardData }) {
  const metrics = [
    { label: "Open requirements", value: data.summary.openRequirements, note: "New, contacted or qualified", icon: ClipboardList },
    { label: "People requested", value: data.summary.peopleRequested, note: "Across open requirements", icon: UsersRound },
    { label: "New requirements", value: data.summary.newRequirements, note: `Submitted in the last ${data.period.days} days`, icon: Send },
    { label: "Requested locations", value: data.summary.requestedLocations, note: "Distinct locations in open requests", icon: MapPin },
  ];
  return <section className="zb-dash-metrics" aria-label="Requirement summaries">{metrics.map(({ label, value, note, icon: Icon }, index) => <article key={label} className="zb-dash-metric" data-featured={index === 0}>
    <div><span>{label}</span><Icon aria-hidden="true" /></div><strong>{count(value)}</strong><p>{note}</p>
  </article>)}</section>;
}

function RequirementList({ data, status, onStatus, onPage, loading }: { data: BusinessDashboardData; status: RequirementFilter; onStatus: (value: RequirementFilter) => void; onPage: (value: number) => void; loading: boolean }) {
  const list = data.requirements;
  return <section className="zb-biz-card zb-dash-panel zb-dash-requests" aria-labelledby="requirements-heading">
    <div className="zb-dash-panel-heading"><span className="zb-biz-icon"><ClipboardList aria-hidden="true" /></span><div><h2 id="requirements-heading">Your requirements</h2><Link href="/business/requirements" className="zb-biz-text-link">Manage all requirements<ArrowUpRight aria-hidden="true" /></Link></div>
      <label className="zb-dash-select"><span className="zb-dash-sr-only">Filter requirements by status</span><select value={status} disabled={loading} onChange={event => onStatus(event.target.value as RequirementFilter)}><option value="ALL">All statuses</option>{Object.entries(statusInfo).map(([value, info]) => <option key={value} value={value}>{info.label}</option>)}</select></label>
    </div>
    {list.items.length ? <ul className="zb-dash-request-list">{list.items.map(item => {
      const locations = requirementLocations(item);
      return <li key={item.id}><Link href={`/business/requirements/${encodeURIComponent(item.id)}`} className="zb-dash-request">
        <span className="zb-dash-request-icon" aria-hidden="true"><FileCheck2 /></span><div className="zb-dash-request-copy"><div><h3>{requirementServiceLabel(item.serviceRequired)}</h3><StatusBadge status={item.status} /></div><p><span><UsersRound aria-hidden="true" />{count(item.workforceCount)} requested</span><span><MapPin aria-hidden="true" />{locations[0] || "Location not supplied"}{locations.length > 1 ? ` +${locations.length - 1}` : ""}</span></p><small>Submitted {businessDate(item.createdAt)} <span aria-hidden="true">·</span> {item.projectDuration}</small></div><ArrowUpRight aria-label="Open requirement brief" />
      </Link></li>;
    })}</ul> : <div className="zb-dash-list-empty"><FileCheck2 aria-hidden="true" /><h3>No {status === "ALL" ? "matching" : statusInfo[status].label.toLowerCase()} requirements</h3><p>Try another status to see your requests.</p><button className="zb-biz-text-link" type="button" disabled={loading} onClick={() => onStatus("ALL")}>Show all requirements<ArrowRight aria-hidden="true" /></button></div>}
    <nav className="zb-dash-pagination" aria-label="Requirements pagination"><p>{list.total ? `${count((list.page - 1) * list.pageSize + 1)}–${count(Math.min(list.page * list.pageSize, list.total))} of ${count(list.total)}` : "0 requests"}</p><div><button type="button" disabled={loading || list.page <= 1} onClick={() => onPage(list.page - 1)} aria-label="Previous requirements page"><ChevronLeft aria-hidden="true" /></button><span>Page {list.page} of {list.totalPages}</span><button type="button" disabled={loading || list.page >= list.totalPages} onClick={() => onPage(list.page + 1)} aria-label="Next requirements page"><ChevronRight aria-hidden="true" /></button></div></nav>
  </section>;
}
