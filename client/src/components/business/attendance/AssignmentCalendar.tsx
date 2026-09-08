"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, MapPin, UserRoundCheck } from "lucide-react";
import { getAssignment } from "@/services/attendance.service";
import { useBusiness } from "../BusinessProvider";
import { businessDate, useBusinessResource } from "../BusinessDashboardUI";
import { attendanceHref, attendanceLabels, AttendanceError, AttendanceLoading, clock, duration, todayIST } from "./AttendanceUI";
import { AttendanceDayPanel } from "./AttendanceDayPanel";
import { AssignmentSettings } from "./AssignmentManager";
import "@/styles/business-attendance.css";

export function BusinessAssignment({ id, initialDate }: { id: string; initialDate?: string }) {
  const { user } = useBusiness();
  return <AssignmentCalendar key={`${user.id}:${id}`} accountId={user.id} id={id} initialDate={initialDate} />;
}
export function AssignmentCalendar({ accountId, id, admin = false, initialDate }: { accountId: string; id: string; admin?: boolean; initialDate?: string }) {
  const [month, setMonth] = useState((initialDate || todayIST()).slice(0, 7)); const [selected, setSelected] = useState(initialDate || todayIST()); const [version, setVersion] = useState(0);
  const request = useCallback((signal: AbortSignal) => getAssignment(admin, id, month, signal), [admin, id, month]);
  const { data, previousData, loading, error } = useBusinessResource(`${accountId}:${admin}:${id}:${month}:${version}`, request, `${accountId}:${admin}:${id}:${month}`);
  const current = data ?? (loading ? previousData : undefined);
  function refresh() { setVersion(v => v + 1); }
  return <div className="zb-att"><Link className="zb-biz-text-link" href={attendanceHref(admin)}><ArrowLeft aria-hidden="true" />Attendance workspace</Link>
    {error ? <AttendanceError error={error} retry={refresh} admin={admin} /> : !current ? <AttendanceLoading /> : <>
      <header className="zb-att-person-heading"><span className="zb-att-heading-icon" aria-hidden="true"><UserRoundCheck /></span><div><p className="zb-biz-eyebrow">ASSIGNMENT CALENDAR</p><h1>{current.assignment.name}</h1><p>{current.assignment.role} · {current.assignment.requirement.companyName}</p><span className="zb-att-assignment-state">{current.assignment.cancelledAt ? "Cancelled assignment" : `${businessDate(current.assignment.startDate)} – ${businessDate(current.assignment.endDate)}`}</span></div></header>
      <div className="zb-att-assignment-facts"><span><MapPin aria-hidden="true" /><span><small>Work location</small><strong>{current.assignment.location}</strong></span></span><span><Clock3 aria-hidden="true" /><span><small>Shift · IST · {current.assignment.graceMinutes} min grace</small><strong>{clock(current.assignment.shiftStart)}–{clock(current.assignment.shiftEnd)}{current.assignment.shiftEnd < current.assignment.shiftStart && " (+1 day)"}</strong></span></span><span><UserRoundCheck aria-hidden="true" /><span><small>Supervisor</small><strong>{current.assignment.supervisor}</strong></span></span></div>
      <section className="zb-att-calendar"><div className="zb-att-section-heading"><div><h2><CalendarDays aria-hidden="true" />Month at a glance</h2><p>Choose a date to review times, notes and corrections.</p></div><label><span>Calendar month</span><input type="month" required min="2000-01" max="2099-12" value={month} onChange={e => { if (e.target.value) { setMonth(e.target.value); setSelected(`${e.target.value}-01`); } }} /></label></div>
        <div className="zb-att-calendar-stats"><span><strong>{current.presentDays}</strong>present days</span><span><strong>{current.recordedDays}</strong>recorded days</span><span><strong>{duration(current.workedMinutes)}</strong>recorded hours</span><span><strong>{current.lateDays}</strong>beyond grace</span></div>
        <div className="zb-att-calendar-grid" aria-label={`Attendance calendar ${month}`} aria-busy={loading}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span className="zb-att-weekday" key={day}>{day}</span>)}{Array.from({ length: (new Date(`${month}-01T00:00:00Z`).getUTCDay() + 6) % 7 }, (_, i) => <span className="zb-att-calendar-spacer" key={`space-${i}`} />)}{current.days.map(day => <button key={day.date} type="button" data-status={day.status} data-today={day.date === current.today} aria-pressed={selected === day.date} aria-label={`${businessDate(day.date)}: ${attendanceLabels[day.status].label}${day.correctionId ? ", correction open" : ""}`} onClick={() => setSelected(day.date)}><span>{Number(day.date.slice(8))}</span><strong>{attendanceLabels[day.status].short || "—"}</strong><small>{attendanceLabels[day.status].label}</small>{day.correctionId && <i aria-hidden="true" />}</button>)}</div>
        <div className="zb-att-calendar-legend">{Object.entries(attendanceLabels).filter(([status]) => status !== "NOT_ASSIGNED").map(([status, info]) => <span key={status}><i data-status={status}>{info.short}</i>{info.label}</span>)}<span><b aria-hidden="true">●</b>Correction open</span></div>
        <p className="zb-att-muted">Worked hours include completed shifts after breaks. A missing entry is not an absence.</p>
      </section>
      <AttendanceDayPanel key={`${accountId}:${id}:${selected}:${current.assignment.revision}`} accountId={accountId} id={id} date={selected} admin={admin} onChanged={refresh} />
      {admin && <AssignmentSettings key={`${id}:${current.assignment.revision}`} assignment={current.assignment} settingsLocked={current.settingsLocked} onChanged={refresh} />}
    </>}
  </div>;
}
