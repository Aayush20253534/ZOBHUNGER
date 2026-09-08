"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, FileText, History, MapPin, MessageCircle, Plus, RefreshCw, UsersRound } from "lucide-react";
import { getBusinessRequirement } from "@/services/business.service";
import { useBusiness } from "./BusinessProvider";
import { businessDate, count, DashboardError, DashboardLoading, requirementLocations, StatusBadge, statusInfo, useBusinessResource } from "./BusinessDashboardUI";
import "@/styles/business-dashboard.css";

export function BusinessRequirementDetail({ id }: { id: string }) {
  const { user } = useBusiness();
  const [revision, setRevision] = useState(0);
  const request = useCallback((signal: AbortSignal) => getBusinessRequirement(id, signal), [id]);
  const { data, error, loading } = useBusinessResource(`${user.id}:${id}:${revision}`, request);
  const refresh = () => setRevision(value => value + 1);
  const item = data?.requirement;
  return <div className="zb-dash zb-dash-detail">
    <div className="zb-dash-detail-nav"><Link href="/business/dashboard" className="zb-biz-text-link"><ArrowLeft aria-hidden="true" />Back to dashboard</Link><button className="zb-dash-refresh" disabled={loading} onClick={refresh}><RefreshCw className={loading ? "zb-biz-spin" : undefined} aria-hidden="true" />{loading ? "Updating…" : "Refresh"}</button></div>
    {loading && <DashboardLoading detail />}
    {error && <DashboardError error={error} retry={refresh} next={`/business/requirements/${id}`} />}
    {item && data && <>
      <header className="zb-dash-heading"><div><p className="zb-biz-eyebrow">YOUR REQUIREMENT BRIEF</p><h1>{item.serviceRequired}</h1><p>{item.companyName} <span aria-hidden="true">·</span> Submitted {businessDate(item.createdAt)}</p></div><StatusBadge status={item.status} /></header>
      <div className="zb-dash-detail-summary">
        <div><UsersRound aria-hidden="true" /><span>People requested<strong>{count(item.workforceCount)}</strong></span></div>
        <div><MapPin aria-hidden="true" /><span>Requested locations<strong>{count(requirementLocations(item).length)}</strong></span></div>
        <div><Clock3 aria-hidden="true" /><span>Project duration<strong>{item.projectDuration}</strong></span></div>
        <div><CalendarDays aria-hidden="true" /><span>Expected start<strong>{item.expectedStartAt ? businessDate(item.expectedStartAt) : "To be discussed"}</strong></span></div>
      </div>
      <div className="zb-dash-detail-grid"><div className="zb-dash-detail-main">
        <section className="zb-biz-card zb-dash-panel"><div className="zb-dash-panel-heading"><span className="zb-biz-icon"><FileText aria-hidden="true" /></span><div><h2>The work you need done</h2><p>Your submitted brief</p></div></div><p className="zb-dash-brief">{item.details}</p>
          <h3 className="zb-dash-subtitle">Requested locations</h3><ul className="zb-dash-place-chips">{requirementLocations(item).map(place => <li key={place}><MapPin aria-hidden="true" />{place}</li>)}</ul>
          <dl className="zb-biz-details"><div><dt>Industry</dt><dd>{item.industry}</dd></div><div><dt>Reference ID</dt><dd className="zb-dash-reference">{item.id}</dd></div></dl>
        </section>
        <section className="zb-biz-card zb-dash-panel"><div className="zb-dash-panel-heading"><span className="zb-biz-icon"><MessageCircle aria-hidden="true" /></span><div><h2>Contact for this requirement</h2><p>Details provided with the brief</p></div></div>
          <dl className="zb-biz-details"><div><dt>Contact person</dt><dd>{item.contactPerson}</dd></div><div><dt>Company</dt><dd>{item.companyName}</dd></div><div><dt>Business email</dt><dd>{item.businessEmail}</dd></div><div><dt>Mobile number</dt><dd>{item.mobileNumber}</dd></div></dl>
          <p className="zb-dash-chart-caption">These are the details submitted with this request. Updating your company profile does not rewrite an existing brief.</p>
        </section>
      </div><aside className="zb-dash-detail-side" aria-label="Request status and history">
        <section className="zb-biz-card zb-dash-panel"><div className="zb-dash-panel-heading"><span className="zb-biz-icon"><History aria-hidden="true" /></span><div><h2>Where things stand</h2><p>Recorded request updates</p></div></div>
          <div className="zb-dash-current-status"><StatusBadge status={item.status} /><p>{statusInfo[item.status].description}</p></div>
          <ol className="zb-dash-timeline"><li><span className="zb-dash-timeline-icon"><Check aria-hidden="true" /></span><div><h3>Requirement submitted</h3><time dateTime={item.createdAt}>{businessDate(item.createdAt, true)} IST</time></div></li>
            {data.hasEarlierHistory && <li><span className="zb-dash-timeline-icon"><History aria-hidden="true" /></span><div><p>Showing the latest 20 recorded updates below.</p></div></li>}
            {data.history.map(event => <li key={event.id}><span className="zb-dash-timeline-icon"><ArrowRight aria-hidden="true" /></span><div><h3>{statusInfo[event.from].label} → {statusInfo[event.to].label}</h3><time dateTime={event.createdAt}>{businessDate(event.createdAt, true)} IST</time></div></li>)}
          </ol>
          {!data.history.length && <p className="zb-dash-chart-caption">No status changes have been recorded in the history for this request.</p>}
        </section>
        <section className="zb-dash-detail-help"><MessageCircle aria-hidden="true" /><h2>Something to clarify?</h2><p>Share the reference ID with our team to discuss your brief or ask for a change.</p><Link href="/contact" className="zb-biz-button">Talk to our team<ArrowRight aria-hidden="true" /></Link><Link href="/hire-workforce" className="zb-biz-text-link"><Plus aria-hidden="true" />Share a new requirement</Link></section>
      </aside></div>
    </>}
  </div>;
}
