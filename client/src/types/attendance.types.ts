import type { CandidateRequirement } from "./business-candidates.types";

export const attendanceStatuses = ["PRESENT", "ABSENT", "LEAVE", "OFF"] as const;
export type AttendanceStatus = typeof attendanceStatuses[number];
export type DisplayStatus = AttendanceStatus | "NOT_RECORDED" | "SCHEDULED_OFF" | "UPCOMING";
export type CalendarStatus = DisplayStatus | "NOT_ASSIGNED";
export interface Assignment {
  id: string; candidateId: string; requirementId: string; name: string; role: string; location: string; supervisor: string;
  startDate: string; endDate: string; shiftStart: number; shiftEnd: number; graceMinutes: number; workingDays: number[];
  revision: number; cancelledAt: string | null; createdAt: string; updatedAt: string; requirement: CandidateRequirement;
}
export interface AttendanceRecord {
  id: string; date: string; status: AttendanceStatus; checkInAt: string | null; checkOutAt: string | null;
  breakMinutes: number; workedMinutes: number | null; lateMinutes: number; note: string; revision: number; updatedAt: string;
}
export interface Correction {
  id: string; assignmentId: string; date: string; reason: string; status: "OPEN" | "RESOLVED" | "REJECTED";
  resolution: string | null; recordRevision: number | null; createdAt: string; updatedAt: string;
}
export interface AttendanceTotals {
  counts: Record<DisplayStatus, number>; total: number; recorded: number; expected: number; late: number;
  minutes: number; openShifts: number; corrections: number; completion: number;
}
export interface Paged<T> { items: T[]; total: number; page: number; totalPages: number }
export interface DailyQuery { date: string; query: string; location: string; page: number; status: DisplayStatus | "ALL"; requirementId?: string }
export interface DailyAttendance extends Paged<{ assignment: Assignment; status: DisplayStatus; record: AttendanceRecord | null; correction: Correction | null }> {
  date: string; today: string; totals: AttendanceTotals; trend: (AttendanceTotals & { date: string })[]; requirement: CandidateRequirement | null;
}
export interface AssignmentCalendar {
  settingsLocked: boolean;
  assignment: Assignment; month: string; today: string; recordedDays: number; presentDays: number; workedMinutes: number; lateDays: number;
  days: { date: string; status: CalendarStatus; record: AttendanceRecord | null; correctionId: string | null }[];
}
export interface AttendanceEvent extends Omit<AttendanceRecord, "date" | "revision" | "updatedAt"> { source: string; createdAt: string }
export interface AttendanceDay {
  assignment: Assignment; date: string; today: string; status: CalendarStatus; record: AttendanceRecord | null; correction: Correction | null;
  history: Paged<AttendanceEvent>;
}
export interface AssignmentInput {
  location: string; supervisor: string; startDate: string; endDate: string; shiftStart: string; shiftEnd: string; graceMinutes: number; workingDays: number[];
}
export interface AttendanceInput {
  revision: number | null; status: AttendanceStatus; checkInAt: string | null; checkOutAt: string | null; breakMinutes: number; note: string;
}
export interface SelectedCandidate { id: string; name: string; jobTitle: string; requirement: CandidateRequirement }
