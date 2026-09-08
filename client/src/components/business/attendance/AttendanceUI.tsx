"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarCheck2, CircleAlert, CircleCheck, Clock3, Coffee, FileQuestion, LockKeyhole, RefreshCw, Sun, UserRoundX } from "lucide-react";
import { ApiError, apiFieldErrors } from "@/lib/api";
import type { CalendarStatus } from "@/types/attendance.types";

export const attendanceLabels = {
  PRESENT: { label: "Present", short: "P", icon: CircleCheck, color: "#26725c" },
  ABSENT: { label: "Absent", short: "A", icon: UserRoundX, color: "#c8202f" },
  LEAVE: { label: "Leave", short: "L", icon: Sun, color: "#8758a2" },
  OFF: { label: "Off", short: "O", icon: Coffee, color: "#596c84" },
  NOT_RECORDED: { label: "Not recorded", short: "?", icon: FileQuestion, color: "#a76e13" },
  SCHEDULED_OFF: { label: "Scheduled off", short: "–", icon: Coffee, color: "#8d91a0" },
  UPCOMING: { label: "Upcoming", short: "·", icon: Clock3, color: "#507592" },
  NOT_ASSIGNED: { label: "Not assigned", short: "", icon: CalendarCheck2, color: "#b3b2b9" },
} satisfies Record<CalendarStatus, { label: string; short: string; icon: typeof CircleCheck; color: string }>;
export function AttendanceBadge({ status }: { status: CalendarStatus }) {
  const { icon: Icon, label } = attendanceLabels[status];
  return <span className="zb-att-badge" data-status={status}><Icon aria-hidden="true" />{label}</span>;
}
export function todayIST() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
export function clock(minutes: number) { return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; }
export function duration(minutes: number | null) { return minutes === null ? "In progress" : `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }
export function timeIST(value: string | null) { return value ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—"; }
export function localIST(value: string | null) { return value ? new Date(Date.parse(value) + 330 * 60_000).toISOString().slice(0, 16) : ""; }
export function attendanceHref(admin: boolean, id?: string, date?: string) {
  const root = admin ? "/admin/attendance" : "/business/attendance";
  return `${root}${id ? `${admin ? "/assignments" : ""}/${encodeURIComponent(id)}` : ""}${date ? `?date=${encodeURIComponent(date)}` : ""}`;
}
export function attendanceError(reason: unknown) {
  if (reason instanceof ApiError && reason.code === "VALIDATION_ERROR") {
    const fields = Object.values(apiFieldErrors(reason)).flat();
    const form = reason.details && typeof reason.details === "object" && "formErrors" in reason.details && Array.isArray(reason.details.formErrors) ? reason.details.formErrors.filter((value): value is string => typeof value === "string").map(value => value.slice(0, 300)) : [];
    return [...form, ...fields].slice(0, 3).join(" ") || "Check the required fields, dates and shift times before saving again.";
  }
  if (reason instanceof ApiError && reason.status === 400) return `${reason.message} Check the dates, shift times and required fields before saving again.`;
  return reason instanceof Error ? reason.message : "We couldn’t save this change. Please try again.";
}
export function AttendanceError({ error, retry, admin = false }: { error: Error; retry: () => void; admin?: boolean }) {
  const locked = error instanceof ApiError && [401, 403].includes(error.status);
  return <section className="zb-att-empty" role="alert">{locked ? <LockKeyhole aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}<h2>{locked ? "Sign in to your workspace" : "This view is unavailable"}</h2><p>{error.message}</p>{locked ? <Link className="zb-biz-button" href={admin ? "/login?next=/admin/attendance" : "/business/login?next=/business/attendance"}>Sign in<ArrowRight aria-hidden="true" /></Link> : <button type="button" className="zb-biz-button" onClick={retry}><RefreshCw aria-hidden="true" />Try again</button>}</section>;
}
export function AttendanceLoading() { return <div className="zb-att-loading" role="status"><CalendarCheck2 aria-hidden="true" /><span>Loading attendance…</span><div aria-hidden="true" /><div aria-hidden="true" /></div>; }
export function AttendancePages({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (value: number) => void }) {
  return totalPages > 1 ? <nav className="zb-att-pages" aria-label="Result pages"><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}><ArrowLeft aria-hidden="true" />Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next<ArrowRight aria-hidden="true" /></button></nav> : null;
}
