import { z } from "zod";
import { calendarDate } from "../attendance/attendance.schema.js";
import { addDays, istToday } from "../attendance/attendance.utils.js";
export const idParams = z.object({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/) });
export const page = z.coerce.number().int().min(1).max(100000).default(1);
export const revision = z.number().int().min(0).max(2147483646);
export const queryText = z.string().trim().max(100).default("");
export const listQuery = z.object({ page, query: queryText }).strict();
const text = (max: number) => z.string().max(max).default("");
// Incomplete values are valid drafts; submission uses the full requirement schema.
export const draftDataSchema = z.object({ companyName: text(160), contactPerson: text(120), businessEmail: text(254), mobileNumber: text(24),
  industry: text(120), serviceRequired: text(160), workforceCount: z.number().int().min(0).max(1000000).nullable().default(null),
  locations: z.array(z.object({ name: text(180) }).strict()).max(50).default([{ name: "" }]),
  projectDuration: text(160), expectedStartAt: z.union([calendarDate, z.literal("")]).default(""), details: text(6000),
}).strict();
export const saveDraftSchema = z.object({ revision: revision.nullable(), data: draftDataSchema }).strict();
export const revisionSchema = z.object({ revision }).strict();
const jobFields = { title: z.string().trim().min(3).max(160), city: z.string().trim().min(2).max(120), location: z.string().trim().min(2).max(180),
  state: z.string().trim().max(120).default(""), category: z.string().trim().min(2).max(120), engagementType: z.string().trim().min(2).max(120),
  description: z.string().trim().min(30).max(10000), compensation: z.string().trim().max(300).default(""),
  responsibilities: z.array(z.string().trim().min(2).max(500)).max(30).default([]), requirements: z.array(z.string().trim().min(2).max(500)).max(30).default([]),
};
export const createLinkedJobSchema = z.object({ ...jobFields, requestKey: z.string().uuid(), requirementRevision: revision }).strict();
export const editLinkedJobSchema = z.object({ ...jobFields, revision }).strict();
export const linkedJobStatusSchema = z.object({ revision, status: z.enum(["DRAFT", "OPEN", "CLOSED"]) }).strict();
export const linkedJobArchiveSchema = z.object({ revision, archived: z.boolean() }).strict();
export const rangeFields = { from: calendarDate.default(() => addDays(istToday(), -29)), to: calendarDate.default(() => istToday()), location: queryText, requirementId: idParams.shape.id.optional() };
export function validRange(value: { from: string; to: string }) { return value.from <= value.to && value.to <= istToday() && (Date.parse(value.to) - Date.parse(value.from)) / 86400000 <= 365; }
export const approvalQuerySchema = z.object({ ...rangeFields, page, query: queryText, status: z.enum(["ALL", "PENDING", "APPROVED", "CHANGES_REQUESTED"]).default("PENDING") }).strict().refine(validRange, "Choose up to 366 dates ending today or earlier.");
export const approvalDecisionSchema = z.object({ revision, approvalRevision: revision, action: z.enum(["APPROVED", "CHANGES_REQUESTED"]), note: z.string().trim().min(5).max(1500) }).strict();
export const historyQuerySchema = z.object({ page }).strict();
export const reportQuerySchema = z.object({ ...rangeFields, page, type: z.enum(["requirements", "candidates", "deployments", "attendance"]).default("requirements") }).strict().refine(validRange, "Choose up to 366 dates ending today or earlier.");
