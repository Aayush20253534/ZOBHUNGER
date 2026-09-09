import { z } from "zod";
import { calendarDate } from "../attendance/attendance.schema.js";
import { istToday } from "../attendance/attendance.utils.js";

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const revision = z.number().int().min(0).max(2147483646);
const page = z.coerce.number().int().min(1).max(10000).default(1);
const query = z.string().trim().max(120).default("");
const note = z.string().trim().min(3).max(1500);
export const workflowParams = z.object({ id }).strict();
export const workflowJobParams = z.object({ jobId: id }).strict();
export const applyForJobSchema = z.object({ profileRevision: revision, resumeRevision: revision, includeResume: z.boolean(), consent: z.literal(true), message: z.string().trim().max(2000), availableFrom: calendarDate.nullable() }).strict();
export const applicationStages = ["SUBMITTED", "REVIEWED", "SHORTLISTED", "INTERVIEW_REQUESTED", "SELECTED", "ASSIGNED", "REJECTED", "WITHDRAWN"] as const;
export const workerApplicationsQuery = z.object({ page, query, status: z.enum(["ALL", ...applicationStages]).default("ALL") }).strict();
export const applicationHistoryQuery = z.object({ historyPage: page }).strict();
export const withdrawApplicationSchema = z.object({ revision, reason: note, confirm: z.literal(true) }).strict();
export const adminApplicationReviewSchema = z.object({ revision, status: z.enum(["REVIEWED", "SHORTLISTED", "REJECTED", "SUBMITTED"]), workerMessage: z.string().trim().max(1500) }).strict();
export const assignmentQuery = z.object({ page, status: z.enum(["ALL", "ACTIVE", "UPCOMING", "ENDED", "CANCELLED"]).default("ALL"), query, date: calendarDate.default(() => istToday()) }).strict();
export const workerAssignmentQuery = z.object({ date: calendarDate.default(() => istToday()), historyPage: page }).strict();
export const attendanceMonthQuery = z.object({ month: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/).default(() => istToday().slice(0, 7)) }).strict();
const timestamp = z.iso.datetime({ offset: true }).transform(value => new Date(value)).nullable();
export const workerAttendanceSchema = z.object({
  requestKey: z.uuid(), date: calendarDate, kind: z.enum(["SUBMISSION", "CORRECTION"]),
  assignmentRevision: revision, recordRevision: revision.nullable(), recordApprovalRevision: revision.nullable(),
  attendanceStatus: z.enum(["PRESENT", "ABSENT", "LEAVE", "OFF"]), checkInAt: timestamp, checkOutAt: timestamp,
  breakMinutes: z.number().int().min(0).max(480), reason: note, confirm: z.literal(true),
}).strict();
export const workerAttendanceQuery = z.object({ page, status: z.enum(["ALL", "PENDING", "APPROVED", "REJECTED"]).default("ALL"), assignmentId: id.optional(), query }).strict();
export const reviewWorkerAttendanceSchema = z.object({ revision, decision: z.enum(["APPROVE", "REJECT"]), reviewNote: note }).strict();
export type ApplyForJobInput = z.infer<typeof applyForJobSchema>;
export type WorkerApplicationQuery = z.infer<typeof workerApplicationsQuery>;
export type WorkerAttendanceInput = z.infer<typeof workerAttendanceSchema>;
export type WorkerAttendanceQuery = z.infer<typeof workerAttendanceQuery>;
export type AssignmentQuery = z.infer<typeof assignmentQuery>;
