import { z } from "zod";
import { calendarDate } from "../attendance/attendance.schema.js";

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const revision = z.number().int().min(0).max(2147483646);
const page = z.coerce.number().int().min(1).max(10000).default(1);
const money = z.number().int().min(0).max(2_000_000_000);
const positiveMoney = z.number().int().min(1).max(2_000_000_000);
const shortText = z.string().trim().min(2).max(160);
const note = z.string().trim().min(3).max(1500);
const optionalDate = z.preprocess(value => value === "" ? undefined : value, calendarDate.optional());

export const earningsParams = z.object({ id }).strict();
export const earningsPaymentParams = z.object({ id, paymentId: id }).strict();
export const earningsListQuery = z.object({
  page,
  assignmentId: id.optional(),
  from: optionalDate,
  to: optionalDate,
}).strict();
export const adminEarningsListQuery = z.object({
  page,
  query: z.string().trim().max(120).default(""),
  status: z.enum(["ALL", "DRAFT", "APPROVED"]).default("ALL"),
  assignmentId: id.optional(),
}).strict();
export const earningsAssignmentQuery = z.object({
  page,
  query: z.string().trim().max(120).default(""),
}).strict();
export const earningsContextQuery = z.object({ periodStart: calendarDate, periodEnd: calendarDate }).strict();

export const earningsLineSchema = z.object({
  type: z.enum(["AGREED_EARNINGS", "ALLOWANCE", "REIMBURSEMENT", "DEDUCTION"]),
  label: shortText,
  amountPaise: money,
  reason: z.string().trim().max(500).default(""),
}).strict();
const statementDraft = z.object({
  periodStart: calendarDate,
  periodEnd: calendarDate,
  lines: z.array(earningsLineSchema).min(1).max(50),
}).strict();
export const createEarningsSchema = statementDraft.extend({ assignmentId: id, requestKey: z.uuid() }).strict();
export const updateEarningsDraftSchema = statementDraft.extend({ revision }).strict();
export const approveEarningsSchema = z.object({ revision, approvalNote: note }).strict();
export const addEarningsAdjustmentSchema = z.object({ revision, requestKey: z.uuid(), type: z.enum(["CREDIT", "DEBIT"]), amountPaise: positiveMoney, reason: note }).strict();
export const recordPaymentSchema = z.object({
  revision,
  requestKey: z.uuid(),
  amountPaise: positiveMoney,
  paidAt: z.iso.datetime({ offset: true }).transform(value => new Date(value)),
  method: z.string().trim().min(2).max(80),
  reference: z.string().trim().min(2).max(160),
  note: z.string().trim().max(500).default(""),
}).strict();
export const voidPaymentSchema = z.object({ statementRevision: revision, paymentRevision: revision, reason: note }).strict();

export type EarningsListQuery = z.infer<typeof earningsListQuery>;
export type AdminEarningsListQuery = z.infer<typeof adminEarningsListQuery>;
export type EarningsAssignmentQuery = z.infer<typeof earningsAssignmentQuery>;
export type EarningsDraftInput = z.infer<typeof statementDraft>;
export type CreateEarningsInput = z.infer<typeof createEarningsSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
