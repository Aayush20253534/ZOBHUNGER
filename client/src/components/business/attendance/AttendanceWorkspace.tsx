"use client";

import Link from "next/link";
import { useCallback, useState, type CSSProperties, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, CalendarCheck2, CalendarDays, CheckCheck, Clock3, ListFilter, MapPin, MessageSquareMore, RefreshCw, Search, ShieldCheck, UsersRound } from "lucide-react";
import { getAttendance } from "@/services/attendance.service";
import type { DailyAttendance, DisplayStatus } from "@/types/attendance.types";
import { businessDate, useBusinessResource } from "../BusinessDashboardUI";
import { useBusiness } from "../BusinessProvider";
import { AttendanceBadge, AttendanceError, attendanceHref, attendanceLabels, AttendanceLoading, AttendancePages, clock, duration, timeIST, todayIST } from "./AttendanceUI";
import { AttendanceCorrections } from "./AttendanceCorrections";
import { AssignmentManager } from "./AssignmentManager";
import "@/styles/business-attendance.css";

export function BusinessAttendance({ requirementId, initialDate, initialTab }: { requirementId?: string; initialDate?: string; initialTab?: string }) {
  const { user } = useBusiness();
  return <AttendanceWorkspace key={`${user.id}:${requirementId ?? "all"}`} accountId={user.id} requirementId={requirementId} initialDate={initialDate} initialTab={initialTab} />;
}
export function AttendanceWorkspace({ accountId, admin = false, requirementId, initialDate, initialTab }: { accountId: string; admin?: boolean; requirementId?: string; initialDate?: string; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab === "corrections" ? "corrections" : admin && initialTab === "assignments" ? "assignments" : "daily");
  return <div className="zb-att">
    <Link className="zb-biz-text-link" href={admin ? "/admin/attendance-approvals" : "/business/attendance-approvals"}><CalendarCheck2 aria-hidden="true" />Attendance approvals<ArrowUpRight aria-hidden="true" /></Link>
    <Link className="zb-biz-text-link" href={admin ? "/admin/deployments" : requirementId ? `/business/requirements/${requirementId}/deployments` : "/business/deployments"}><UsersRound aria-hidden="true" />Team roster and weekly plan<ArrowUpRight aria-hidden="true" /></Link>
    {requirementId && <Link className="zb-biz-text-link" href={`/business/requirements/${requirementId}`}><ArrowLeft aria-hidden="true" />Back to requirement</Link>}
    <header className="zb-att-heading"><div><p className="zb-biz-eyebrow">{admin ? "OPERATIONS / ATTENDANCE DESK" : "YOUR TEAM, DAY BY DAY"}</p><h1>{admin ? "Keep every day accounted for." : "A clear view of every working day."}</h1><p>{admin ? "Assign selected people, record their shifts and keep corrections moving." : "Follow your assigned team, review recorded hours and flag anything that needs a second look."}</p></div><span className="zb-att-heading-icon" aria-hidden="true"><CalendarCheck2 /><span><CheckCheck /></span></span></header>
    <div className="zb-att-workflow" aria-label="Attendance workflow"><span><UsersRound aria-hidden="true" />Assigned team</span><i aria-hidden="true">→</i><span><CalendarDays aria-hidden="true" />Daily register</span><i aria-hidden="true">→</i><span><ShieldCheck aria-hidden="true" />Reviewed records</span></div>
    <div className="zb-att-tabs" role="group" aria-label="Attendance views">{[{ value: "daily", label: "Daily register", icon: CalendarDays }, ...(admin ? [{ value: "assignments", label: "Assignments", icon: UsersRound }] : []), { value: "corrections", label: "Correction requests", icon: MessageSquareMore }].map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}><Icon aria-hidden="true" />{label}</button>)}</div>
    {tab === "daily" ? <DailyRegister key={requirementId ?? "all"} accountId={accountId} admin={admin} requirementId={requirementId} initialDate={initialDate} onSetup={() => setTab("assignments")} /> : tab === "assignments" && admin ? <AssignmentManager accountId={accountId} /> : <AttendanceCorrections accountId={accountId} admin={admin} requirementId={requirementId} />}
    <p className="zb-att-footnote"><Clock3 aria-hidden="true" />All dates and shift times use India Standard Time (IST). Attendance is recorded by the operations team.</p>
  </div>;
}

function DailyRegister({ accountId, admin, requirementId, initialDate, onSetup }: { accountId: string; admin: boolean; requirementId?: string; initialDate?: string; onSetup: () => void }) {
  const [date, setDate] = useState(initialDate || todayIST()); const [search, setSearch] = useState(""); const [place, setPlace] = useState("");
  const [query, setQuery] = useState(""); const [location, setLocation] = useState(""); const [status, setStatus] = useState<DisplayStatus | "ALL">("ALL");
  const [page, setPage] = useState(1); const [version, setVersion] = useState(0);
  const request = useCallback((signal: AbortSignal) => getAttendance(admin, { date, query, location, status, page, requirementId }, signal), [admin, date, query, location, status, page, requirementId]);
  const { data, loading, error } = useBusinessResource(`${accountId}:${admin}:${date}:${query}:${location}:${status}:${page}:${requirementId}:${version}`, request);
  function filter(event: FormEvent) { event.preventDefault(); setQuery(search.trim()); setLocation(place.trim()); setPage(1); }
  function changeDate(value: string) { if (value) { setDate(value); setPage(1); } }
  function clear() { setQuery(""); setSearch(""); setLocation(""); setPlace(""); setStatus("ALL"); setPage(1); }
  return <section className="zb-att-register" aria-label="Daily attendance">
    <div className="zb-att-section-heading"><div><h2>Daily register</h2><p>One person, one assignment, one clear record.</p></div><div className="zb-att-date-actions"><label><span>Attendance date</span><input type="date" min="2000-01-01" max="2099-12-31" value={date} onChange={e => changeDate(e.target.value)} /></label><button className="zb-att-icon-button" type="button" disabled={loading} onClick={() => setVersion(v => v + 1)} aria-label="Refresh attendance"><RefreshCw aria-hidden="true" /></button></div></div>
    <form className="zb-att-filters" onSubmit={filter}><label><span><Search aria-hidden="true" />Person or role</span><input value={search} onChange={e => setSearch(e.target.value)} maxLength={100} placeholder={admin ? "Name, role or company" : "Search your team"} /></label><label><span><MapPin aria-hidden="true" />Location</span><input value={place} onChange={e => setPlace(e.target.value)} maxLength={100} placeholder="Site or city" /></label><label><span><ListFilter aria-hidden="true" />Status</span><select value={status} onChange={e => { setStatus(e.target.value as DisplayStatus | "ALL"); setPage(1); }}><option value="ALL">All statuses</option>{Object.entries(attendanceLabels).filter(([key]) => key !== "NOT_ASSIGNED").map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}</select></label><button className="zb-biz-button zb-biz-button--secondary" type="submit">Apply filters</button></form>
    {loading ? <AttendanceLoading /> : error ? <AttendanceError error={error} retry={() => setVersion(v => v + 1)} admin={admin} /> : data && <>
      {data.requirement && <div className="zb-att-context"><UsersRound aria-hidden="true" /><span><strong>{data.requirement.companyName}</strong>{data.requirement.serviceRequired} · {data.requirement.jobLocation}</span></div>}
      <AttendanceSnapshot data={data} onDate={changeDate} />
      {date > data.today && <p className="zb-att-notice">This is an upcoming roster. Attendance can be recorded on or after the shift date.</p>}
      <div className="zb-att-result-line"><p role="status">{data.total} {data.total === 1 ? "person" : "people"} · {businessDate(date)}</p>{(query || location || status !== "ALL") && <button type="button" onClick={clear}>Clear filters</button>}</div>
      {!data.total ? <div className="zb-att-empty"><CalendarDays aria-hidden="true" /><h3>{query || location || status !== "ALL" ? "No matching records" : "No assignments for this date"}</h3><p>{query || location || status !== "ALL" ? "Try a different name, location or status." : admin ? "Create an assignment for a selected candidate, or choose a date within an existing assignment." : "Your team will appear here when our operations team confirms their assignment dates and shifts."}</p>{admin && !query && !location && status === "ALL" && <button type="button" className="zb-biz-button" onClick={onSetup}><UsersRound aria-hidden="true" />Set up assignments</button>}</div> : <>
        <div className="zb-att-table"><div className="zb-att-row zb-att-table-head" aria-hidden="true"><span>Team member / site</span><span>Status</span><span>Check-in / out</span><span>Worked</span><span>Details</span></div>{data.items.map(({ assignment: a, status: entryStatus, record, correction }) => <article className="zb-att-row" key={a.id}>
          <div className="zb-att-person"><span className="zb-att-avatar" aria-hidden="true">{a.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("")}</span><div><h3>{a.name}</h3><p>{a.role}</p><small><MapPin aria-hidden="true" />{a.location}{admin ? ` · ${a.requirement.companyName}` : ""}</small></div></div>
          <div className="zb-att-cell"><AttendanceBadge status={entryStatus} />{correction && <small className="zb-att-warning">Correction open</small>}{Boolean(record?.lateMinutes) && <small className="zb-att-warning">{record!.lateMinutes} min beyond grace</small>}</div>
          <div className="zb-att-cell"><span className="zb-att-mobile-label">Check-in / out</span><strong>{timeIST(record?.checkInAt ?? null)} / {timeIST(record?.checkOutAt ?? null)}</strong><small>Shift {clock(a.shiftStart)}–{clock(a.shiftEnd)}{a.shiftEnd < a.shiftStart ? " (+1 day)" : ""}</small></div>
          <div className="zb-att-cell"><span className="zb-att-mobile-label">Worked</span><strong>{record?.status === "PRESENT" ? duration(record.workedMinutes) : "—"}</strong>{record?.status === "PRESENT" && <small>{record.breakMinutes} min break</small>}</div>
          <Link className="zb-att-record-link" href={attendanceHref(admin, a.id, date)} aria-label={`${admin ? "Record or review" : "View"} ${a.name}'s attendance for ${businessDate(date)}`}>{admin ? "Record / review" : "View details"}<ArrowUpRight aria-hidden="true" /></Link>
        </article>)}</div><AttendancePages page={data.page} totalPages={data.totalPages} onChange={setPage} />
      </>}
    </>}
  </section>;
}
function AttendanceSnapshot({ data, onDate }: { data: DailyAttendance; onDate: (date: string) => void }) {
  const t = data.totals; const peak = Math.max(1, ...data.trend.map(day => day.total));
  return <>
    <div className="zb-att-metrics">{[{ label: "People on roster", value: t.total, detail: "Assigned for this date", icon: UsersRound }, { label: "Present", value: t.counts.PRESENT, detail: `${t.openShifts} shifts awaiting check-out`, icon: CheckCheck }, { label: "Not recorded", value: t.counts.NOT_RECORDED, detail: "Needs an attendance entry", icon: CalendarCheck2 }, { label: "Corrections open", value: t.corrections, detail: "For this date and search", icon: MessageSquareMore }].map(({ label, value, detail, icon: Icon }) => <article key={label}><span><Icon aria-hidden="true" />{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</div>
    <div className="zb-att-visuals"><section className="zb-att-coverage"><div className="zb-att-ring" style={{ "--coverage": `${t.completion}%` } as CSSProperties} role="img" aria-label={`${t.recorded} of ${t.expected} attendance entries recorded; ${t.completion} percent complete`}><span><strong>{t.completion}%</strong><small>Recorded</small></span></div><div><h3>Daily coverage</h3><p>{t.recorded} of {t.expected} entries recorded</p><ul><li><span data-status="ABSENT" />{t.counts.ABSENT} absent</li><li><span data-status="LEAVE" />{t.counts.LEAVE} on leave</li><li><span data-status="OFF" />{t.counts.OFF + t.counts.SCHEDULED_OFF} off</li></ul><small>Unrecorded days are not counted as absences.</small></div></section>
      <section className="zb-att-trend"><div><h3>Seven-day view</h3><span><i aria-hidden="true" />Present <i aria-hidden="true" />Other / pending</span></div><div className="zb-att-bars">{data.trend.map(day => <button type="button" key={day.date} aria-label={`${businessDate(day.date)}: ${day.counts.PRESENT} present of ${day.total} people. View this day.`} aria-pressed={day.date === data.date} onClick={() => onDate(day.date)}><strong>{day.total}</strong><span className="zb-att-bar-track"><span style={{ height: `${day.total / peak * 100}%` }}><i style={{ height: `${day.total ? day.counts.PRESENT / day.total * 100 : 0}%` }} /></span></span><small>{day.date.slice(8)}/{day.date.slice(5, 7)}</small></button>)}</div><p>Totals follow the name and location filters; status filters affect the list.</p></section></div>
  </>;
}
