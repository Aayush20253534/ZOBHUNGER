"use client";

import Link from "next/link";
import { CalendarClock, CheckCheck, CircleAlert, Flag, LockKeyhole, RefreshCw, XCircle } from "lucide-react";
import { ApiError } from "@/lib/api";
import type { DeploymentState, ScheduleDay } from "@/types/deployments.types";
import { businessDate } from "../BusinessDashboardUI";
import { clock } from "../attendance/AttendanceUI";

export const deploymentLabels = {
  ACTIVE: { label: "Active assignment", icon: CheckCheck }, UPCOMING: { label: "Upcoming", icon: CalendarClock },
  ENDED: { label: "Ended", icon: Flag }, CANCELLED: { label: "Cancelled", icon: XCircle },
} satisfies Record<DeploymentState, { label: string; icon: typeof CheckCheck }>;
export function DeploymentBadge({ state }: { state: DeploymentState }) {
  const { label, icon: Icon } = deploymentLabels[state];
  return <span className="zb-deploy-badge" data-state={state}><Icon aria-hidden="true" />{label}</span>;
}
export function DeploymentError({ error, retry, admin }: { error: Error; retry: () => void; admin: boolean }) {
  const locked = error instanceof ApiError && [401, 403].includes(error.status);
  return <div className="zb-att-empty" role="alert">{locked ? <LockKeyhole aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}<h2>{locked ? "Sign in to continue" : "This view is unavailable"}</h2><p>{error.message}</p>{locked ? <Link className="zb-biz-button" href={admin ? "/login" : "/business/login?next=/business/deployments"}>Sign in</Link> : <button type="button" className="zb-biz-button" onClick={retry}><RefreshCw aria-hidden="true" />Try again</button>}</div>;
}
export function moveDate(date: string, days: number) { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }
export const scheduleLabels = { WORKING: "Scheduled shift", OFF: "Day off", OUTSIDE: "Outside assignment", CANCELLED: "Cancelled" };
export function WeekSchedule({ days, start, end, compact = false }: { days: ScheduleDay[]; start: number; end: number; compact?: boolean }) {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return <div className={compact ? "zb-deploy-week zb-deploy-week--compact" : "zb-deploy-week"} role="group" aria-label="Weekly assignment schedule">{days.map((day, i) => <div key={day.date} data-state={day.state} role="group" aria-label={`${businessDate(day.date)}: ${scheduleLabels[day.state]}${day.state === "WORKING" ? `, ${clock(start)} to ${clock(end)} IST${end < start ? ", ending the next day" : ""}` : ""}`}><span>{names[i]}</span>{!compact && <small>{Number(day.date.slice(8))}/{day.date.slice(5, 7)}</small>}<strong aria-hidden="true">{compact ? day.state === "WORKING" ? "●" : day.state === "OFF" ? "○" : "–" : day.state === "WORKING" ? clock(start) : day.state === "OFF" ? "Off" : "—"}</strong>{!compact && <small aria-hidden="true">{day.state === "WORKING" ? `${clock(end)}${end < start ? " +1d" : ""}` : day.state === "OUTSIDE" ? "No shift" : day.state === "CANCELLED" ? "Cancelled" : "Rest day"}</small>}</div>)}</div>;
}
