"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft, ArrowUpRight, CalendarCheck2, CalendarClock, CalendarDays, ChevronLeft, ChevronRight, History, MapPin, RefreshCw, UserRoundCheck } from "lucide-react";
import { deploymentHref, getDeployment } from "@/services/deployments.service";
import { useBusiness } from "../BusinessProvider";
import { businessDate, requirementServiceLabel, useBusinessResource } from "../BusinessDashboardUI";
import { attendanceHref, AttendanceLoading, AttendancePages, clock, todayIST } from "../attendance/AttendanceUI";
import { AssignmentSettings } from "../attendance/AssignmentManager";
import { DeploymentBadge, DeploymentError, moveDate, WeekSchedule } from "./DeploymentUI";
import "@/styles/business-attendance.css";
import "@/styles/business-deployments.css";

export function BusinessDeployment({ id, initialDate }: { id: string; initialDate?: string }) {
  const { user } = useBusiness();
  return <DeploymentDetail key={`${user.id}:${id}`} accountId={user.id} id={id} initialDate={initialDate} />;
}
export function DeploymentDetail({ accountId, id, admin = false, initialDate }: { accountId: string; id: string; admin?: boolean; initialDate?: string }) {
  const [date, setDate] = useState(initialDate || todayIST()); const [page, setPage] = useState(1); const [version, setVersion] = useState(0);
  const request = useCallback((signal: AbortSignal) => getDeployment(admin, id, date, page, signal), [admin, id, date, page]);
  const { data, previousData, loading, error } = useBusinessResource(JSON.stringify({ accountId, admin, id, date, page, version }), request, JSON.stringify({ accountId, admin, id, date }));
  const current = data ?? (loading ? previousData : undefined);
  function refresh() { setVersion(value => value + 1); }
  function changeDate(value: string) { if (value >= "2000-01-01" && value <= "2099-12-31") { setDate(value); setPage(1); } }
  return <div className="zb-att zb-deploy"><Link className="zb-biz-text-link" href={deploymentHref(admin)}><ArrowLeft aria-hidden="true" />Team roster</Link>
    {error ? <DeploymentError error={error} admin={admin} retry={refresh} /> : !current ? <AttendanceLoading /> : <>
      <header className="zb-deploy-heading"><div><p className="zb-biz-eyebrow">CONFIRMED ASSIGNMENT</p><h1>{current.assignment.name}</h1><p>{current.assignment.role} · {current.assignment.requirement.companyName}</p></div><div className="zb-deploy-heading-actions"><DeploymentBadge state={current.state} /><button type="button" className="zb-att-icon-button" disabled={loading} onClick={refresh} aria-label="Refresh assignment"><RefreshCw aria-hidden="true" /></button></div></header>
      <div className="zb-deploy-detail-grid"><section className="zb-deploy-brief"><h2><UserRoundCheck aria-hidden="true" />The assignment brief</h2><dl><div><dt>Work location</dt><dd><MapPin aria-hidden="true" />{current.assignment.location}</dd></div><div><dt>Supervisor</dt><dd>{current.assignment.supervisor}</dd></div><div><dt>Requirement</dt><dd>{requirementServiceLabel(current.assignment.requirement.serviceRequired)}</dd></div><div><dt>Assignment dates</dt><dd>{businessDate(current.assignment.startDate)} – {businessDate(current.assignment.endDate)}</dd></div><div><dt>Basic shift · IST</dt><dd>{clock(current.assignment.shiftStart)}–{clock(current.assignment.shiftEnd)}{current.assignment.shiftEnd < current.assignment.shiftStart && <small>Ends the next calendar day</small>}</dd></div><div><dt>Arrival grace</dt><dd>{current.assignment.graceMinutes} minutes</dd></div></dl>
        {current.skills.length > 0 && <ul className="zb-deploy-skills" aria-label="Shared skills">{current.skills.map(skill => <li key={skill}>{skill}</li>)}</ul>}
        <div className="zb-deploy-brief-links">{current.candidateVisible && <Link className="zb-biz-text-link" href={admin ? "/admin/candidate-management" : `/business/candidates/${current.assignment.candidateId}`}>{admin ? "Candidate pipeline" : "Candidate profile"}<ArrowUpRight aria-hidden="true" /></Link>}{!admin && <Link className="zb-biz-text-link" href={`/business/requirements/${current.assignment.requirementId}`}>Requirement brief<ArrowUpRight aria-hidden="true" /></Link>}</div>
      </section><section className="zb-deploy-detail-schedule"><div className="zb-att-section-heading"><div><h2><CalendarDays aria-hidden="true" />Your weekly plan</h2><p>Schedule based on the saved working days.</p></div><label><span>Choose a week using any date</span><input type="date" required min="2000-01-01" max="2099-12-31" value={date} onChange={e => changeDate(e.target.value)} /></label></div><div className="zb-deploy-week-heading"><strong>{businessDate(current.dates[0])} – {businessDate(current.dates[6])}</strong><div><button type="button" className="zb-att-icon-button" aria-label="Previous week" disabled={moveDate(date, -7) < "2000-01-01"} onClick={() => changeDate(moveDate(date, -7))}><ChevronLeft aria-hidden="true" /></button><button type="button" className="zb-att-icon-button" aria-label="Next week" disabled={moveDate(date, 7) > "2099-12-31"} onClick={() => changeDate(moveDate(date, 7))}><ChevronRight aria-hidden="true" /></button></div></div><WeekSchedule days={current.schedule} start={current.assignment.shiftStart} end={current.assignment.shiftEnd} /><p className="zb-deploy-count-note">All times use IST. “+1d” means the shift ends the next day. Dashes indicate dates outside the assignment.</p>
        <div className="zb-deploy-schedule-legend"><span><i data-state="WORKING" />Scheduled shift</span><span><i data-state="OFF" />Day off</span><span><i data-state="OUTSIDE" />Outside assignment</span></div>
        <ol className="zb-deploy-milestones"><li><CalendarCheck2 aria-hidden="true" /><span><strong>Assignment created</strong><time dateTime={current.assignment.createdAt}>{businessDate(current.assignment.createdAt)}</time></span></li><li><CalendarClock aria-hidden="true" /><span><strong>Starts on</strong><time dateTime={current.assignment.startDate}>{businessDate(current.assignment.startDate)}</time></span></li><li><CalendarDays aria-hidden="true" /><span><strong>Last included date</strong><time dateTime={current.assignment.endDate}>{businessDate(current.assignment.endDate)}</time></span></li></ol>
        {current.assignment.cancelledAt ? <p className="zb-att-notice">This assignment was cancelled on {businessDate(current.assignment.cancelledAt)} and is excluded from the planned team schedule.</p> : <Link className="zb-biz-button" href={attendanceHref(admin, id, date)}><CalendarCheck2 aria-hidden="true" />{admin ? "Record or review attendance" : "View recorded attendance"}<ArrowUpRight aria-hidden="true" /></Link>}
      </section></div>
      {admin && <AssignmentSettings key={`${id}:${current.assignment.revision}`} assignment={current.assignment} settingsLocked={current.settingsLocked} module="deployments" onChanged={refresh} />}
      <details className="zb-deploy-history"><summary><History aria-hidden="true" />Assignment history <span>{current.history.total} updates</span></summary>{!current.history.total ? <p>Created {businessDate(current.assignment.createdAt)}. Further assignment changes will appear here.</p> : <ol>{current.history.items.map(event => <li key={event.id}><span aria-hidden="true" /><div><strong>{event.label}</strong><time dateTime={event.createdAt}>{businessDate(event.createdAt, true)} IST</time>{event.endDate && <p>Last working date: {businessDate(event.endDate)}</p>}{event.note && <p className="zb-att-preserve">{event.note}</p>}</div></li>)}</ol>}<AttendancePages page={current.history.page} totalPages={current.history.totalPages} onChange={setPage} /></details>
    </>}
  </div>;
}
