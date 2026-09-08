import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { Assignment, AssignmentCalendar, AssignmentInput, AttendanceDay, AttendanceInput, Correction, DailyAttendance, DailyQuery, Paged, SelectedCandidate } from "@/types/attendance.types";

const base = (admin: boolean) => admin ? "/admin/attendance" : "/business/attendance";
const write = (body: unknown, method = "POST") => ({ method, headers: { "X-Requested-With": "XMLHttpRequest" }, body: JSON.stringify(body) });
const idPath = (admin: boolean, id: string) => `${base(admin)}/assignments/${encodeURIComponent(id)}`;
export function getAttendance(admin: boolean, query: DailyQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({ date: query.date, query: query.query, location: query.location, page: String(query.page), status: query.status });
  if (query.requirementId) params.set("requirementId", query.requirementId);
  return apiFetch<ApiSuccessEnvelope<DailyAttendance>>(`${base(admin)}?${params}`, { signal });
}
export function getAssignment(admin: boolean, id: string, month: string, signal?: AbortSignal) {
  return apiFetch<ApiSuccessEnvelope<AssignmentCalendar>>(`${idPath(admin, id)}?${new URLSearchParams({ month })}`, { signal });
}
export function getAttendanceDay(admin: boolean, id: string, date: string, historyPage: number, signal?: AbortSignal) {
  return apiFetch<ApiSuccessEnvelope<AttendanceDay>>(`${idPath(admin, id)}/day?${new URLSearchParams({ date, historyPage: String(historyPage) })}`, { signal });
}
export function getAssignments(query: string, page: number, signal?: AbortSignal) {
  return apiFetch<ApiSuccessEnvelope<Paged<Assignment> & { today: string }>>(`${base(true)}/assignments?${new URLSearchParams({ query, page: String(page) })}`, { signal });
}
export function getSelectedCandidates(query: string, page: number, signal?: AbortSignal) {
  return apiFetch<ApiSuccessEnvelope<Paged<SelectedCandidate>>>(`${base(true)}/selected-candidates?${new URLSearchParams({ query, page: String(page) })}`, { signal });
}
export function createAssignment(input: AssignmentInput & { candidateId: string }) {
  return apiFetch<ApiSuccessEnvelope<{ id: string; created: boolean }>>(`${base(true)}/assignments`, write(input));
}
export function updateAssignment(id: string, input: AssignmentInput & { revision: number; note: string }) {
  return apiFetch<ApiSuccessEnvelope<{ id: string }>>(idPath(true, id), write(input, "PUT"));
}
export function endAssignment(id: string, revision: number, endDate: string, note: string) {
  return apiFetch<ApiSuccessEnvelope<{ id: string }>>(`${idPath(true, id)}/end`, write({ revision, endDate, note }));
}
export function cancelAssignment(id: string, revision: number, note: string) {
  return apiFetch<ApiSuccessEnvelope<{ id: string }>>(`${idPath(true, id)}/cancel`, write({ revision, note }));
}
export function saveAttendance(id: string, date: string, input: AttendanceInput) {
  return apiFetch<ApiSuccessEnvelope<{ id: string }>>(`${idPath(true, id)}/records`, write({ ...input, date }, "PUT"));
}
export function requestAttendanceCorrection(id: string, date: string, recordRevision: number | null, reason: string) {
  return apiFetch<ApiSuccessEnvelope<{ id: string; created: boolean }>>(`${idPath(false, id)}/corrections`, write({ date, recordRevision, reason }));
}
export function getCorrections(admin: boolean, query: string, page: number, status: Correction["status"] | "ALL", signal?: AbortSignal, requirementId?: string) {
  const params = new URLSearchParams({ query, page: String(page), status });
  if (requirementId) params.set("requirementId", requirementId);
  return apiFetch<ApiSuccessEnvelope<Paged<Correction & { assignment: Assignment }>>>(`${base(admin)}/corrections?${params}`, { signal });
}
export function resolveCorrection(id: string, resolution: string, attendance?: AttendanceInput) {
  return apiFetch<ApiSuccessEnvelope<{ id: string; status: string }>>(`${base(true)}/corrections/${encodeURIComponent(id)}/resolve`, write(attendance ? { action: "RESOLVE", resolution, attendance } : { action: "REJECT", resolution }));
}
