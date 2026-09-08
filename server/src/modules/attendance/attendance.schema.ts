import { z } from "zod";
import { attendanceStatuses, displayStatuses, istToday, minuteOfDay } from "./attendance.utils.js";

const id = z.string().trim().regex(/^[a-zA-Z0-9_-]{1,64}$/);
export const attendanceParams = z.object({ id });
export const calendarDate = z.iso.date().refine(value => value >= "2000-01-01" && value <= "2100-12-31", "Use a date between 2000 and 2100.");
const month = z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/);
const page = z.coerce.number().int().min(1).max(100000).default(1);
const query = z.string().trim().max(100).default("");
const revision = z.number().int().min(0).max(2147483646);
const note = z.string().trim().min(3).max(1500);
export const dailyQuerySchema = z.object({ date: calendarDate.default(() => istToday()), page, query, location: query,
  requirementId: id.optional(), status: z.enum(["ALL", ...displayStatuses]).default("ALL") }).strict();
export const assignmentQuerySchema = z.object({ query, page }).strict();
export const assignmentMonthSchema = z.object({ month: month.default(() => istToday().slice(0, 7)) }).strict();
export const attendanceDaySchema = z.object({ date: calendarDate, historyPage: page }).strict();
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).transform(minuteOfDay);
const assignmentFields = { location: z.string().trim().min(2).max(160), supervisor: z.string().trim().min(2).max(120),
  startDate: calendarDate, endDate: calendarDate, shiftStart: clock, shiftEnd: clock,
  graceMinutes: z.number().int().min(0).max(60), workingDays: z.array(z.number().int().min(1).max(7)).min(1).max(7).transform(values => [...new Set(values)].sort()),
};
function validAssignment(value: { startDate: string; endDate: string; shiftStart: number; shiftEnd: number }) {
  const days = (Date.parse(value.endDate) - Date.parse(value.startDate)) / 86400_000;
  const minutes = (value.shiftEnd - value.shiftStart + 1440) % 1440;
  return days >= 0 && days <= 366 && minutes >= 60 && minutes <= 16 * 60;
}
export const createAssignmentSchema = z.object({ candidateId: id, ...assignmentFields }).strict().refine(validAssignment, "Use an end date within 366 days of the start and a shift between 1 and 16 hours.");
export const updateAssignmentSchema = z.object({ revision, note, ...assignmentFields }).strict().refine(validAssignment, "Use an end date within 366 days of the start and a shift between 1 and 16 hours.");
export const endAssignmentSchema = z.object({ revision, endDate: calendarDate, note }).strict();
export const cancelAssignmentSchema = z.object({ revision, note }).strict();
const timestamp = z.iso.datetime({ offset: true }).transform(value => new Date(value)).nullable();
export const attendanceValuesSchema = z.object({ revision: revision.nullable(), status: z.enum(attendanceStatuses),
  checkInAt: timestamp, checkOutAt: timestamp, breakMinutes: z.number().int().min(0).max(480), note }).strict();
export const recordAttendanceSchema = attendanceValuesSchema.extend({ date: calendarDate }).strict();
export const requestCorrectionSchema = z.object({ date: calendarDate, recordRevision: revision.nullable(), reason: note }).strict();
export const correctionListSchema = z.object({ query, page, requirementId: id.optional(), status: z.enum(["OPEN", "RESOLVED", "REJECTED", "ALL"]).default("OPEN") }).strict();
export const resolveCorrectionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("RESOLVE"), resolution: note, attendance: attendanceValuesSchema }).strict(),
  z.object({ action: z.literal("REJECT"), resolution: note }).strict(),
]);
export type DailyQuery = z.infer<typeof dailyQuerySchema>;
export type LookupQuery = z.infer<typeof assignmentQuerySchema>;
export type CreateAssignment = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignment = z.infer<typeof updateAssignmentSchema>;
export type AttendanceValues = z.infer<typeof attendanceValuesSchema>;
export type RecordAttendance = z.infer<typeof recordAttendanceSchema>;
export type RequestCorrection = z.infer<typeof requestCorrectionSchema>;
export type CorrectionListQuery = z.infer<typeof correctionListSchema>;
export type ResolveCorrection = z.infer<typeof resolveCorrectionSchema>;
