"use client";

import { useCallback, useState, type FormEvent } from "react";
import { CheckCheck, Clock3, History, MessageSquareMore, Save } from "lucide-react";
import { getAttendanceDay, requestAttendanceCorrection, resolveCorrection, saveAttendance } from "@/services/attendance.service";
import { attendanceStatuses, type AttendanceDay, type AttendanceInput, type AttendanceStatus } from "@/types/attendance.types";
import { businessDate, useBusinessResource } from "../BusinessDashboardUI";
import { AttendanceBadge, attendanceError, AttendanceError, attendanceLabels, AttendanceLoading, AttendancePages, duration, localIST, timeIST } from "./AttendanceUI";

export function AttendanceDayPanel({ id, date, accountId, admin, onChanged }: { id: string; date: string; accountId: string; admin: boolean; onChanged: () => void }) {
  const [page, setPage] = useState(1); const [version, setVersion] = useState(0); const [notice, setNotice] = useState("");
  const request = useCallback((signal: AbortSignal) => getAttendanceDay(admin, id, date, page, signal), [admin, id, date, page]);
  const { data, error, loading } = useBusinessResource(`${accountId}:${admin}:${id}:${date}:${page}:${version}`, request);
  function refresh() { setPage(1); setVersion(v => v + 1); }
  function saved(message: string) { setNotice(message); refresh(); onChanged(); }
  return <section className="zb-att-day" id="attendance-day" aria-label={`Attendance for ${businessDate(date)}`}>
    <div className="zb-att-section-heading"><div><p className="zb-biz-eyebrow">DAILY RECORD</p><h2>{businessDate(date)}</h2></div><Clock3 aria-hidden="true" /></div>
    {notice && <p role="status" className="zb-att-success"><CheckCheck aria-hidden="true" />{notice}</p>}
    {loading ? <AttendanceLoading /> : error ? <AttendanceError error={error} retry={refresh} admin={admin} /> : data && <>
      <div className="zb-att-day-summary"><AttendanceBadge status={data.status} /><dl><div><dt>Check-in (IST)</dt><dd>{timeIST(data.record?.checkInAt ?? null)}</dd></div><div><dt>Check-out (IST)</dt><dd>{timeIST(data.record?.checkOutAt ?? null)}{data.record?.checkOutAt && localIST(data.record.checkOutAt).slice(0, 10) !== date && <small>{businessDate(localIST(data.record.checkOutAt).slice(0, 10))}</small>}</dd></div><div><dt>Worked</dt><dd>{data.record?.status === "PRESENT" ? duration(data.record.workedMinutes) : "—"}</dd></div><div><dt>Beyond grace</dt><dd>{data.record?.lateMinutes ?? 0} min</dd></div></dl>{data.record && <p className="zb-att-preserve">{data.record.note}</p>}</div>
      {data.status === "NOT_ASSIGNED" || date > data.today ? <p className="zb-att-notice">{date > data.today ? "This date is in the future. Attendance and correction requests open on the shift date." : "No active assignment covers this date."}</p> : admin ? <AttendanceEntry key={`${id}:${date}:${data.record?.revision ?? "new"}:${data.correction?.id ?? "none"}`} data={data} onSaved={saved} onReload={refresh} /> : <BusinessCorrection key={`${id}:${date}:${data.record?.revision ?? "new"}:${data.correction?.id ?? "none"}`} data={data} onSaved={saved} onReload={refresh} />}
      <div className="zb-att-history"><h3><History aria-hidden="true" />Record history</h3>{!data.history.total ? <p>There are no saved attendance entries for this date yet.</p> : <ol>{data.history.items.map(event => <li key={event.id}><span className="zb-att-history-dot" aria-hidden="true" /><div><div><AttendanceBadge status={event.status} /><time dateTime={event.createdAt}>{businessDate(event.createdAt, true)}</time></div><p>{event.source === "CORRECTION_RESOLVED" ? "Correction resolved" : "Recorded by operations"}{event.status === "PRESENT" ? ` · ${timeIST(event.checkInAt)}–${timeIST(event.checkOutAt)} · ${duration(event.workedMinutes)} · ${event.breakMinutes} min break` : ""}</p><p className="zb-att-preserve">{event.note}</p></div></li>)}</ol>}<AttendancePages page={data.history.page} totalPages={data.history.totalPages} onChange={setPage} /></div>
    </>}
  </section>;
}

function BusinessCorrection({ data, onSaved, onReload }: { data: AttendanceDay; onSaved: (message: string) => void; onReload: () => void }) {
  const [reason, setReason] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try { await requestAttendanceCorrection(data.assignment.id, data.date, data.record?.revision ?? null, reason); onSaved("Correction requested. The operations team can now review this date."); }
    catch (error) { setError(attendanceError(error)); } finally { setBusy(false); }
  }
  return data.correction ? <div className="zb-att-notice"><h3><MessageSquareMore aria-hidden="true" />Correction awaiting review</h3><p className="zb-att-preserve">{data.correction.reason}</p><small>Requested {businessDate(data.correction.createdAt, true)}. Follow the decision in Correction requests.</small></div> : <form className="zb-att-form" onSubmit={submit}><fieldset disabled={busy}><h3><MessageSquareMore aria-hidden="true" />Something needs changing?</h3><p>Describe the correct status or times and why this record should change.</p><label><span>Correction reason *</span><textarea required minLength={3} maxLength={1500} rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="For example: Check-out was 6:15 pm after the final outlet visit." /></label>{error && <p role="alert" className="zb-biz-error">{error}</p>}<div className="zb-att-form-actions"><button className="zb-biz-button" type="submit">{busy ? "Requesting…" : "Request correction"}</button>{error && <button type="button" className="zb-biz-button zb-biz-button--secondary" onClick={onReload}>Reload saved record</button>}</div></fieldset></form>;
}

function AttendanceEntry({ data, onSaved, onReload }: { data: AttendanceDay; onSaved: (message: string) => void; onReload: () => void }) {
  const [status, setStatus] = useState<AttendanceStatus>(data.record?.status ?? "PRESENT");
  const [checkIn, setCheckIn] = useState(localIST(data.record?.checkInAt ?? null)); const [checkOut, setCheckOut] = useState(localIST(data.record?.checkOutAt ?? null));
  const [breakMinutes, setBreakMinutes] = useState(data.record?.breakMinutes ?? 0); const [note, setNote] = useState("");
  const [decision, setDecision] = useState<"RESOLVE" | "REJECT">("RESOLVE"); const [resolution, setResolution] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const rejecting = Boolean(data.correction) && decision === "REJECT";
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      const input: AttendanceInput = { revision: data.record?.revision ?? null, status, checkInAt: status === "PRESENT" && checkIn ? `${checkIn}:00+05:30` : null,
        checkOutAt: status === "PRESENT" && checkOut ? `${checkOut}:00+05:30` : null, breakMinutes: status === "PRESENT" ? breakMinutes : 0, note };
      if (data.correction) await resolveCorrection(data.correction.id, resolution, rejecting ? undefined : input);
      else await saveAttendance(data.assignment.id, data.date, input);
      onSaved(data.correction ? rejecting ? "Correction declined with your reason. Attendance is unchanged." : "Correction resolved and attendance updated." : "Attendance saved. The business can now review this entry.");
    } catch (error) { setError(attendanceError(error)); } finally { setBusy(false); }
  }
  return <form className="zb-att-form" onSubmit={submit}><fieldset disabled={busy}><h3><Save aria-hidden="true" />{data.correction ? "Review correction" : data.record ? "Update attendance" : "Record attendance"}</h3>
    {data.correction && <><div className="zb-att-notice"><strong>Business request</strong><p className="zb-att-preserve">{data.correction.reason}</p>{data.correction.recordRevision !== (data.record?.revision ?? null) && <p>The entry changed after this request was raised. Review the latest times before deciding.</p>}</div><label><span>Decision *</span><select value={decision} onChange={e => setDecision(e.target.value as "RESOLVE" | "REJECT")}><option value="RESOLVE">Accept and save corrected attendance</option><option value="REJECT">Decline with a reason</option></select></label></>}
    {!rejecting && <><div className="zb-att-status-buttons" role="group" aria-label="Attendance status">{attendanceStatuses.map(value => { const Icon = attendanceLabels[value].icon; return <button type="button" data-status={value} aria-pressed={status === value} key={value} onClick={() => setStatus(value)}><Icon aria-hidden="true" />{attendanceLabels[value].label}</button>; })}</div>
      {status === "PRESENT" && <><div className="zb-att-form-grid"><label><span>Check-in date & time (IST) *</span><input type="datetime-local" required value={checkIn} onChange={e => setCheckIn(e.target.value)} /></label><label><span>Check-out date & time (IST)</span><input type="datetime-local" value={checkOut} onChange={e => setCheckOut(e.target.value)} /></label><label><span>Break minutes</span><input type="number" required min={0} max={480} value={breakMinutes} onChange={e => setBreakMinutes(Number(e.target.value))} /></label></div><p className="zb-att-muted">Leave check-out empty while the shift is in progress. For overnight shifts, choose the next date for check-out. Add breaks when closing the shift.</p></>}
      <label><span>{data.record ? "Reason for this update" : "Attendance note"} *</span><textarea required minLength={3} maxLength={1500} rows={2} value={note} onChange={e => setNote(e.target.value)} /></label></>}
    {data.correction && <label><span>Decision explanation for the business *</span><textarea required minLength={3} maxLength={1500} rows={2} value={resolution} onChange={e => setResolution(e.target.value)} /></label>}
    {error && <p role="alert" className="zb-biz-error">{error}</p>}<div className="zb-att-form-actions"><button className="zb-biz-button" type="submit"><Save aria-hidden="true" />{busy ? "Saving…" : rejecting ? "Decline correction" : data.correction ? "Resolve and save" : "Save attendance"}</button>{error && <button type="button" className="zb-biz-button zb-biz-button--secondary" onClick={onReload}>Reload saved record</button>}</div>
  </fieldset></form>;
}
