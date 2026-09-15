"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, BriefcaseBusiness, Download, FileCheck2, GraduationCap, LoaderCircle, Trophy, UsersRound } from "lucide-react";
import { downloadTechnicalInstitutePortalReport, getTechnicalInstitutePortalReports } from "@/services/technical-institute-portal.service";

const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

type Report = Awaited<ReturnType<typeof getTechnicalInstitutePortalReports>>["data"];

export function TechnicalInstitutePortalReports() {
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  useEffect(() => { getTechnicalInstitutePortalReports().then((response) => setData(response.data)).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load reports.")); }, []);
  const funnelMax = useMemo(() => data ? Math.max(1, ...Object.values(data.statusCounts)) : 1, [data]);

  async function download() { setDownloading(true); setError(""); try { await downloadTechnicalInstitutePortalReport(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to export report."); } finally { setDownloading(false); } }

  if (!data && !error) return <div className="zti-portal-loading"><LoaderCircle />Loading placement report…</div>;
  if (error && !data) return <div className="zb-login-error">{error}</div>;
  if (!data) return null;

  const dashboard = data.dashboard;
  return <div className="zti-portal-shell"><header className="zti-portal-subhero"><div><Link href="/technical-institute-portal"><ArrowLeft />Portal dashboard</Link><small>Placement & hiring reports</small><h1>Technical hiring performance</h1><p>{data.profile.institutionName} · {data.profile.partnershipCode}</p></div><button className="zti-portal-primary-action" onClick={() => void download()} disabled={downloading}><Download />{downloading ? "Preparing…" : "Export CSV report"}</button></header>{error && <div className="zti-portal-alert">{error}</div>}<section className="zti-portal-report-metrics"><article><span><UsersRound /></span><div><small>Verified students</small><strong>{dashboard.students.verified}</strong></div></article><article><span><FileCheck2 /></span><div><small>Applications</small><strong>{dashboard.applications.total}</strong></div></article><article><span><Trophy /></span><div><small>Selected</small><strong>{dashboard.applications.selected}</strong></div></article><article><span><GraduationCap /></span><div><small>Joined</small><strong>{dashboard.applications.joined}</strong></div></article><article><span><BarChart3 /></span><div><small>Join conversion</small><strong>{data.conversionRate}%</strong></div></article></section><div className="zti-portal-report-grid"><section className="zti-portal-card"><div className="zti-portal-section-head"><div><small>Application funnel</small><h2>Hiring pipeline</h2></div><FileCheck2 /></div><div className="zti-portal-funnel">{["SUBMITTED", "REVIEWED", "SHORTLISTED", "SELECTED", "JOINED", "REJECTED"].map((status) => { const count = data.statusCounts[status] ?? 0; return <div key={status}><span>{label(status)}</span><div><i style={{ width: `${Math.max(3, (count / funnelMax) * 100)}%` }} /></div><strong>{count}</strong></div>; })}</div></section><section className="zti-portal-card"><div className="zti-portal-section-head"><div><small>Opportunity mix</small><h2>Engagement channels</h2></div><BriefcaseBusiness /></div><div className="zti-portal-type-breakdown">{Object.entries(data.typeCounts).length ? Object.entries(data.typeCounts).map(([type, count]) => <div key={type}><span>{label(type)}</span><strong>{count}</strong></div>) : <p>No application data yet.</p>}</div><div className="zti-portal-top-employers"><small>Top employers by submissions</small>{data.topEmployers.length ? data.topEmployers.map((item) => <div key={item.employer}><span>{item.employer}</span><strong>{item.count}</strong></div>) : <p>No employer activity yet.</p>}</div></section></div><section className="zti-portal-card"><div className="zti-portal-section-head"><div><small>Roster snapshot</small><h2>Technical talent distribution</h2></div><GraduationCap /></div><div className="zti-portal-trade-report">{dashboard.topTrades.length ? dashboard.topTrades.map((item) => <span key={item.tradeBranch}><strong>{item.count}</strong>{item.tradeBranch}</span>) : <p>Trade distribution will appear after student onboarding.</p>}</div></section></div>;
}
