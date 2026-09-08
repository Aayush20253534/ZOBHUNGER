"use client";

import { useState, type CSSProperties } from "react";
import { BarChart3, MapPin, PieChart } from "lucide-react";
import type { BusinessDashboardData, RequirementFilter } from "@/types/business-dashboard.types";
import { count, statusInfo } from "./BusinessDashboardUI";

const dayLabel = (date: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00Z`));

export function RequirementActivity({ data }: { data: BusinessDashboardData }) {
  const [selected, setSelected] = useState<number | null>(null);
  // At most seven bars keeps every selection usable on a narrow phone.
  const groupSize = data.period.days === 7 ? 1 : data.period.days === 30 ? 5 : 14;
  const bins: { start: string; end: string; total: number }[] = [];
  for (let i = 0; i < data.activity.length; i += groupSize) {
    const days = data.activity.slice(i, i + groupSize);
    bins.push({ start: days[0].date, end: days.at(-1)!.date, total: days.reduce((sum, day) => sum + day.requirements, 0) });
  }
  const peak = Math.max(1, ...bins.map(bin => bin.total));
  const active = selected === null ? null : bins[selected];
  const label = (bin: typeof bins[number]) => bin.start === bin.end ? dayLabel(bin.start) : `${dayLabel(bin.start)} – ${dayLabel(bin.end)}`;
  return <section className="zb-biz-card zb-dash-panel" aria-labelledby="activity-heading">
    <div className="zb-dash-panel-heading"><span className="zb-biz-icon"><BarChart3 aria-hidden="true" /></span><div><h2 id="activity-heading">Request activity</h2><p>Submissions over {data.period.days} days · IST</p></div><span className="zb-dash-count">{count(data.summary.newRequirements)}</span></div>
    <div className="zb-dash-chart-meta"><span>{groupSize === 1 ? "Daily totals" : `${groupSize}-day groups`} · includes today</span><span>Requests</span></div>
    <div className="zb-dash-bars" style={{ "--bars": bins.length } as CSSProperties} role="group" aria-label="Request submissions. Select a bar for dates and count.">
      {bins.map((bin, i) => <button type="button" className="zb-dash-bar" key={bin.start} onClick={() => setSelected(i)} aria-pressed={selected === i} aria-label={`${label(bin)}: ${count(bin.total)} requests`}>
        <span className="zb-dash-bar-value">{count(bin.total)}</span><span className="zb-dash-bar-track"><span style={{ height: `${bin.total / peak * 100}%` }} data-empty={bin.total === 0} /></span><span className="zb-dash-bar-date">{i === 0 || i === bins.length - 1 || i === Math.floor(bins.length / 2) ? dayLabel(bin.start) : ""}</span>
      </button>)}
    </div>
    <p className="zb-dash-chart-caption" aria-live="polite">{active ? `${label(active)}: ${count(active.total)} ${active.total === 1 ? "request" : "requests"} submitted.` : data.summary.newRequirements ? "Select a bar to explore submissions in that period." : "No submissions in this period. Older requests still appear below."}</p>
  </section>;
}

export function RequirementStatusChart({ data, status, onStatus, loading }: { data: BusinessDashboardData; status: RequirementFilter; onStatus: (value: RequirementFilter) => void; loading: boolean }) {
  const total = data.summary.totalRequirements;
  let start = 0;
  const stops = data.statuses.map(row => {
    const end = start + (total ? row.count / total * 100 : 0);
    const stop = `${statusInfo[row.status].color} ${start}% ${end}%`;
    start = end; return stop;
  });
  return <section className="zb-biz-card zb-dash-panel" aria-labelledby="status-heading">
    <div className="zb-dash-panel-heading"><span className="zb-biz-icon"><PieChart aria-hidden="true" /></span><div><h2 id="status-heading">Request status</h2><p>Current status · all time</p></div></div>
    <div className="zb-dash-status-chart">
      <div className="zb-dash-donut" style={{ background: total ? `conic-gradient(${stops.join(",")})` : "#eee8ec" }} role="img" aria-label={`${count(total)} requests: ${data.statuses.map(row => `${statusInfo[row.status].label} ${count(row.count)}`).join(", ")}`}>
        <span><strong>{count(total)}</strong><small>Total requests</small></span>
      </div>
      <div className="zb-dash-legend" role="group" aria-label="Filter requests by status">{data.statuses.map(row => <button key={row.status} type="button" disabled={loading} aria-pressed={status === row.status} onClick={() => onStatus(status === row.status ? "ALL" : row.status)}>
        <span className="zb-dash-dot" style={{ background: statusInfo[row.status].color }} aria-hidden="true" /><span>{statusInfo[row.status].label}</span><strong>{count(row.count)}</strong>
      </button>)}</div>
    </div>
    <p className="zb-dash-chart-caption">Select a status to filter your list. Closed requests are excluded from open totals.</p>
  </section>;
}

export function RequestedLocations({ data }: { data: BusinessDashboardData }) {
  const peak = Math.max(1, ...data.locations.map(row => row.requirements));
  return <section className="zb-biz-card zb-dash-panel" aria-labelledby="locations-heading">
    <div className="zb-dash-panel-heading"><span className="zb-biz-icon"><MapPin aria-hidden="true" /></span><div><h2 id="locations-heading">Where you need people</h2><p>Top locations · open requests</p></div></div>
    {data.locations.length ? <ol className="zb-dash-location-list">{data.locations.map((row, i) => <li key={row.name}>
      <div><span className="zb-dash-location-rank">{String(i + 1).padStart(2, "0")}</span><strong>{row.name}</strong><span>{count(row.requirements)} {row.requirements === 1 ? "request" : "requests"}</span></div>
      <div className="zb-dash-location-track" aria-hidden="true"><span style={{ width: `${row.requirements / peak * 100}%` }} /></div>
    </li>)}</ol> : <p className="zb-dash-location-empty">Location activity appears when you have an open requirement.</p>}
    <p className="zb-dash-chart-caption">{data.summary.requestedLocations > 5 ? `Showing 5 of ${count(data.summary.requestedLocations)} requested locations. ` : ""}One request can include several locations. These are requested locations, not confirmed deployments.</p>
  </section>;
}
