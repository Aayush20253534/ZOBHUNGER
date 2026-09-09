import { prisma } from "../../config/db.js";
import { Prisma, type EarningsLineType } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { assignmentDto, assignmentSelect } from "../attendance/attendance.read.js";
import { dateKey, dateValue, istToday } from "../attendance/attendance.utils.js";
import { deploymentState } from "../deployments/deployments.utils.js";
import type { AdminEarningsListQuery, CreateEarningsInput, EarningsAssignmentQuery, EarningsDraftInput, EarningsListQuery, RecordPaymentInput } from "./worker-earnings.schema.js";

const owner = (userId: string): Prisma.WorkforceAssignmentWhereInput => ({ candidate: { is: { application: { is: { workerUserId: userId } } } } });
const missing = () => new HttpError(404, "This earnings statement is not available in your workspace.", { code: "EARNINGS_NOT_FOUND" });
const changed = () => new HttpError(409, "This earnings statement changed. Reload the latest revision before continuing.", { code: "EARNINGS_CHANGED" });
const MAX_MONEY = 2_000_000_000;

const statementSelect = {
  id: true, assignmentId: true, requestKey: true, periodStart: true, periodEnd: true, status: true, revision: true,
  approvedAt: true, approvalNote: true, approvalAttendanceSnapshot: true, createdAt: true, updatedAt: true,
  assignment: { select: assignmentSelect },
  lines: { select: { id: true, type: true, label: true, amountPaise: true, reason: true, sortOrder: true }, orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }] },
  adjustments: { select: { id: true, type: true, amountPaise: true, reason: true, createdAt: true }, orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }] },
  payments: { select: { id: true, amountPaise: true, paidAt: true, method: true, reference: true, note: true, status: true, revision: true, voidedAt: true, voidReason: true, createdAt: true }, orderBy: [{ paidAt: "asc" as const }, { id: "asc" as const }] },
} satisfies Prisma.EarningsStatementSelect;

type StatementRow = Prisma.EarningsStatementGetPayload<{ select: typeof statementSelect }>;
function signedLine(type: EarningsLineType, amount: number) { return type === "DEDUCTION" ? -amount : amount; }
function totals(row: Pick<StatementRow, "lines" | "adjustments" | "payments">) {
  const agreedPaise = row.lines.filter(line => line.type === "AGREED_EARNINGS").reduce((sum, line) => sum + line.amountPaise, 0);
  const allowancesPaise = row.lines.filter(line => line.type === "ALLOWANCE").reduce((sum, line) => sum + line.amountPaise, 0);
  const reimbursementsPaise = row.lines.filter(line => line.type === "REIMBURSEMENT").reduce((sum, line) => sum + line.amountPaise, 0);
  const deductionsPaise = row.lines.filter(line => line.type === "DEDUCTION").reduce((sum, line) => sum + line.amountPaise, 0);
  const baseNetPaise = row.lines.reduce((sum, line) => sum + signedLine(line.type, line.amountPaise), 0);
  const adjustmentPaise = row.adjustments.reduce((sum, item) => sum + (item.type === "CREDIT" ? item.amountPaise : -item.amountPaise), 0);
  const netPayablePaise = baseNetPaise + adjustmentPaise;
  const paidPaise = row.payments.filter(payment => payment.status === "RECORDED").reduce((sum, payment) => sum + payment.amountPaise, 0);
  const outstandingPaise = Math.max(0, netPayablePaise - paidPaise);
  return { agreedPaise, allowancesPaise, reimbursementsPaise, deductionsPaise, adjustmentPaise, netPayablePaise, paidPaise, outstandingPaise,
    paymentStatus: paidPaise <= 0 ? "UNPAID" : outstandingPaise > 0 ? "PARTIALLY_PAID" : "PAID" };
}
function assignmentView(row: StatementRow["assignment"]) {
  const { requirement, requirementId: _requirementId, candidateId: _candidateId, ...assignment } = row;
  return { ...assignmentDto(assignment), company: requirement.companyName, state: deploymentState(row, istToday()) };
}
function statementDto(row: StatementRow, detail = false) {
  return {
    id: row.id, assignmentId: row.assignmentId, periodStart: dateKey(row.periodStart), periodEnd: dateKey(row.periodEnd), status: row.status, revision: row.revision,
    approvedAt: row.approvedAt, approvalNote: row.approvalNote, approvalAttendanceSnapshot: detail ? row.approvalAttendanceSnapshot : undefined,
    createdAt: row.createdAt, updatedAt: row.updatedAt, assignment: assignmentView(row.assignment), totals: totals(row),
    ...(detail ? { lines: row.lines, adjustments: row.adjustments, payments: row.payments } : {}),
  };
}
function validateDraft(input: EarningsDraftInput, assignment: { startDate: Date; endDate: Date }) {
  if (input.periodStart > input.periodEnd) throw new HttpError(400, "The earnings period end date must be on or after its start date.", { code: "INVALID_EARNINGS_PERIOD" });
  if (input.periodStart < dateKey(assignment.startDate) || input.periodEnd > dateKey(assignment.endDate)) throw new HttpError(400, "Keep the earnings period inside the confirmed assignment dates.", { code: "EARNINGS_PERIOD_OUTSIDE_ASSIGNMENT" });
  if (!input.lines.some(line => line.type === "AGREED_EARNINGS" && line.amountPaise > 0)) throw new HttpError(400, "Add the agreed earnings for this period before saving the statement.", { code: "AGREED_EARNINGS_REQUIRED" });
  if (input.lines.some(line => line.type === "DEDUCTION" && line.amountPaise > 0 && !line.reason.trim())) throw new HttpError(400, "Every deduction must include a clear reason.", { code: "DEDUCTION_REASON_REQUIRED" });
  const net = input.lines.reduce((sum, line) => sum + signedLine(line.type, line.amountPaise), 0);
  if (net <= 0 || net > MAX_MONEY) throw new HttpError(400, "The statement net payable must be greater than zero and within the supported amount range.", { code: "INVALID_NET_PAYABLE" });
}
async function lockAssignment(tx: Prisma.TransactionClient, id: string) { await tx.$queryRaw`SELECT id FROM "WorkforceAssignment" WHERE id = ${id} FOR UPDATE`; }
async function lockStatement(tx: Prisma.TransactionClient, id: string) { await tx.$queryRaw`SELECT id FROM "EarningsStatement" WHERE id = ${id} FOR UPDATE`; }
async function assignmentForAdmin(tx: Prisma.TransactionClient, id: string) {
  const assignment = await tx.workforceAssignment.findUnique({ where: { id }, select: assignmentSelect });
  if (!assignment) throw new HttpError(404, "Choose a confirmed assignment that still exists.", { code: "ASSIGNMENT_NOT_FOUND" });
  if (assignment.cancelledAt) throw new HttpError(409, "Cancelled assignments cannot receive new earnings statements.", { code: "ASSIGNMENT_CANCELLED" });
  return assignment;
}
async function ensureNoOverlap(tx: Prisma.TransactionClient, assignmentId: string, start: string, end: string, exceptId?: string) {
  const overlap = await tx.earningsStatement.findFirst({ where: { assignmentId, ...(exceptId ? { id: { not: exceptId } } : {}), periodStart: { lte: dateValue(end) }, periodEnd: { gte: dateValue(start) } }, select: { id: true } });
  if (overlap) throw new HttpError(409, "An earnings statement already covers part of this assignment period.", { code: "EARNINGS_PERIOD_OVERLAP" });
}
function lineData(lines: EarningsDraftInput["lines"]) { return lines.map((line, index) => ({ type: line.type, label: line.label, amountPaise: line.amountPaise, reason: line.reason || null, sortOrder: index })); }
function sameDraft(row: StatementRow, input: CreateEarningsInput) {
  return row.assignmentId === input.assignmentId && dateKey(row.periodStart) === input.periodStart && dateKey(row.periodEnd) === input.periodEnd &&
    JSON.stringify(row.lines.map(({ type, label, amountPaise, reason }) => ({ type, label, amountPaise, reason: reason || "" }))) === JSON.stringify(input.lines.map(({ type, label, amountPaise, reason }) => ({ type, label, amountPaise, reason: reason || "" })));
}

export async function createEarningsStatement(userId: string, input: CreateEarningsInput) {
  return prisma.$transaction(async tx => {
    const duplicate = await tx.earningsStatement.findUnique({ where: { requestKey: input.requestKey }, select: statementSelect });
    if (duplicate) {
      if (!sameDraft(duplicate, input)) throw new HttpError(409, "This submission reference has already been used for a different earnings draft.", { code: "REQUEST_KEY_REUSED" });
      return { statement: statementDto(duplicate, true), created: false };
    }
    await lockAssignment(tx, input.assignmentId);
    const racedDuplicate = await tx.earningsStatement.findUnique({ where: { requestKey: input.requestKey }, select: statementSelect });
    if (racedDuplicate) {
      if (!sameDraft(racedDuplicate, input)) throw new HttpError(409, "This submission reference has already been used for a different earnings draft.", { code: "REQUEST_KEY_REUSED" });
      return { statement: statementDto(racedDuplicate, true), created: false };
    }
    const assignment = await assignmentForAdmin(tx, input.assignmentId); validateDraft(input, assignment);
    await ensureNoOverlap(tx, input.assignmentId, input.periodStart, input.periodEnd);
    const statement = await tx.earningsStatement.create({ data: { assignmentId: input.assignmentId, requestKey: input.requestKey, periodStart: dateValue(input.periodStart), periodEnd: dateValue(input.periodEnd), createdByUserId: userId, lines: { create: lineData(input.lines) } }, select: statementSelect });
    await tx.auditLog.create({ data: { actorUserId: userId, action: "EARNINGS_DRAFT_CREATED", entityType: "EarningsStatement", entityId: statement.id, metadata: { assignmentId: input.assignmentId, periodStart: input.periodStart, periodEnd: input.periodEnd } } });
    return { statement: statementDto(statement, true), created: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function updateEarningsDraft(userId: string, id: string, input: EarningsDraftInput & { revision: number }) {
  return prisma.$transaction(async tx => {
    await lockStatement(tx, id);
    const current = await tx.earningsStatement.findUnique({ where: { id }, select: statementSelect }); if (!current) throw missing();
    if (current.status !== "DRAFT" || current.revision !== input.revision) throw changed();
    await lockAssignment(tx, current.assignmentId); const assignment = await assignmentForAdmin(tx, current.assignmentId); validateDraft(input, assignment);
    await ensureNoOverlap(tx, current.assignmentId, input.periodStart, input.periodEnd, id);
    await tx.earningsLine.deleteMany({ where: { statementId: id } });
    const updated = await tx.earningsStatement.update({ where: { id }, data: { periodStart: dateValue(input.periodStart), periodEnd: dateValue(input.periodEnd), revision: { increment: 1 }, lines: { create: lineData(input.lines) } }, select: statementSelect });
    await tx.auditLog.create({ data: { actorUserId: userId, action: "EARNINGS_DRAFT_REVISED", entityType: "EarningsStatement", entityId: id, metadata: { fromRevision: input.revision, toRevision: updated.revision } } });
    return statementDto(updated, true);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function attendanceSnapshot(tx: Prisma.TransactionClient, statement: { assignmentId: string; periodStart: Date; periodEnd: Date }) {
  const records = await tx.attendanceRecord.findMany({ where: { assignmentId: statement.assignmentId, date: { gte: statement.periodStart, lte: statement.periodEnd } }, select: { id: true, date: true, status: true, workedMinutes: true, approvalStatus: true, approvalRevision: true, revision: true }, orderBy: { date: "asc" }, take: 366 });
  const approved = records.filter(record => record.approvalStatus === "APPROVED");
  return { records: records.map(record => ({ ...record, date: dateKey(record.date) })), recordedDays: records.length, approvedDays: approved.length, workedMinutes: approved.reduce((sum, record) => sum + (record.workedMinutes || 0), 0), pendingDays: records.filter(record => record.approvalStatus === "PENDING").length, changesRequestedDays: records.filter(record => record.approvalStatus === "CHANGES_REQUESTED").length };
}
export async function approveEarningsStatement(userId: string, id: string, input: { revision: number; approvalNote: string }) {
  return prisma.$transaction(async tx => {
    await lockStatement(tx, id); const current = await tx.earningsStatement.findUnique({ where: { id }, select: statementSelect }); if (!current) throw missing();
    if (current.status !== "DRAFT" || current.revision !== input.revision) throw changed();
    const money = totals(current); if (money.netPayablePaise <= 0) throw new HttpError(409, "The draft has no payable amount to approve.", { code: "INVALID_NET_PAYABLE" });
    const attendance = await attendanceSnapshot(tx, current);
    if (!attendance.approvedDays) throw new HttpError(409, "At least one attendance record in this period must have business approval before earnings can be approved.", { code: "APPROVED_ATTENDANCE_REQUIRED" });
    const updated = await tx.earningsStatement.update({ where: { id }, data: { status: "APPROVED", revision: { increment: 1 }, approvedByUserId: userId, approvedAt: new Date(), approvalNote: input.approvalNote, approvalAttendanceSnapshot: attendance }, select: statementSelect });
    await tx.auditLog.create({ data: { actorUserId: userId, action: "EARNINGS_APPROVED", entityType: "EarningsStatement", entityId: id, metadata: { revision: updated.revision, netPayablePaise: totals(updated).netPayablePaise, attendance } } });
    return statementDto(updated, true);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function addEarningsAdjustment(userId: string, id: string, input: { revision: number; requestKey: string; type: "CREDIT" | "DEBIT"; amountPaise: number; reason: string }) {
  return prisma.$transaction(async tx => {
    const duplicate = await tx.earningsAdjustment.findUnique({ where: { requestKey: input.requestKey }, select: { id: true, statementId: true, type: true, amountPaise: true, reason: true } });
    if (duplicate) {
      if (duplicate.statementId !== id || duplicate.type !== input.type || duplicate.amountPaise !== input.amountPaise || duplicate.reason !== input.reason) throw new HttpError(409, "This adjustment reference has already been used.", { code: "REQUEST_KEY_REUSED" });
      const row = await tx.earningsStatement.findUnique({ where: { id }, select: statementSelect }); if (!row) throw missing(); return statementDto(row, true);
    }
    await lockStatement(tx, id);
    const racedDuplicate = await tx.earningsAdjustment.findUnique({ where: { requestKey: input.requestKey }, select: { id: true, statementId: true, type: true, amountPaise: true, reason: true } });
    if (racedDuplicate) {
      if (racedDuplicate.statementId !== id || racedDuplicate.type !== input.type || racedDuplicate.amountPaise !== input.amountPaise || racedDuplicate.reason !== input.reason) throw new HttpError(409, "This adjustment reference has already been used.", { code: "REQUEST_KEY_REUSED" });
      const row = await tx.earningsStatement.findUnique({ where: { id }, select: statementSelect }); if (!row) throw missing(); return statementDto(row, true);
    }
    const current = await tx.earningsStatement.findUnique({ where: { id }, select: statementSelect }); if (!current) throw missing();
    if (current.status !== "APPROVED" || current.revision !== input.revision) throw changed();
    const before = totals(current); const nextNet = before.netPayablePaise + (input.type === "CREDIT" ? input.amountPaise : -input.amountPaise);
    if (nextNet <= 0 || nextNet > MAX_MONEY || nextNet < before.paidPaise) throw new HttpError(409, "This adjustment would make the approved payable invalid or lower than payments already recorded.", { code: "INVALID_EARNINGS_ADJUSTMENT" });
    await tx.earningsAdjustment.create({ data: { statementId: id, type: input.type, amountPaise: input.amountPaise, reason: input.reason, requestKey: input.requestKey, createdByUserId: userId } });
    const updated = await tx.earningsStatement.update({ where: { id }, data: { revision: { increment: 1 } }, select: statementSelect });
    await tx.auditLog.create({ data: { actorUserId: userId, action: "EARNINGS_ADJUSTED", entityType: "EarningsStatement", entityId: id, metadata: { type: input.type, amountPaise: input.amountPaise, reason: input.reason, revision: updated.revision } } });
    return statementDto(updated, true);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function recordEarningsPayment(userId: string, id: string, input: RecordPaymentInput) {
  return prisma.$transaction(async tx => {
    const duplicate = await tx.paymentRecord.findUnique({ where: { requestKey: input.requestKey }, select: { id: true, statementId: true, amountPaise: true, paidAt: true, method: true, reference: true, note: true } });
    if (duplicate) {
      const same = duplicate.statementId === id && duplicate.amountPaise === input.amountPaise && duplicate.paidAt.getTime() === input.paidAt.getTime() && duplicate.method === input.method && duplicate.reference === input.reference && (duplicate.note || "") === (input.note || "");
      if (!same) throw new HttpError(409, "This payment reference has already been used for another entry.", { code: "REQUEST_KEY_REUSED" });
      const row = await tx.earningsStatement.findUnique({ where: { id }, select: statementSelect }); if (!row) throw missing(); return statementDto(row, true);
    }
    await lockStatement(tx, id);
    const racedDuplicate = await tx.paymentRecord.findUnique({ where: { requestKey: input.requestKey }, select: { id: true, statementId: true, amountPaise: true, paidAt: true, method: true, reference: true, note: true } });
    if (racedDuplicate) {
      const same = racedDuplicate.statementId === id && racedDuplicate.amountPaise === input.amountPaise && racedDuplicate.paidAt.getTime() === input.paidAt.getTime() && racedDuplicate.method === input.method && racedDuplicate.reference === input.reference && (racedDuplicate.note || "") === (input.note || "");
      if (!same) throw new HttpError(409, "This payment reference has already been used for another entry.", { code: "REQUEST_KEY_REUSED" });
      const row = await tx.earningsStatement.findUnique({ where: { id }, select: statementSelect }); if (!row) throw missing(); return statementDto(row, true);
    }
    const current = await tx.earningsStatement.findUnique({ where: { id }, select: statementSelect }); if (!current) throw missing();
    if (current.status !== "APPROVED" || current.revision !== input.revision) throw changed();
    const money = totals(current); if (input.amountPaise > money.outstandingPaise) throw new HttpError(409, "This payment would exceed the current outstanding balance.", { code: "PAYMENT_OVERPAYMENT" });
    await tx.paymentRecord.create({ data: { statementId: id, amountPaise: input.amountPaise, paidAt: input.paidAt, method: input.method, reference: input.reference, note: input.note || null, requestKey: input.requestKey, recordedByUserId: userId } });
    const updated = await tx.earningsStatement.update({ where: { id }, data: { revision: { increment: 1 } }, select: statementSelect });
    await tx.auditLog.create({ data: { actorUserId: userId, action: "EARNINGS_PAYMENT_RECORDED", entityType: "EarningsStatement", entityId: id, metadata: { amountPaise: input.amountPaise, paidAt: input.paidAt.toISOString(), method: input.method, reference: input.reference, revision: updated.revision } } });
    return statementDto(updated, true);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function voidEarningsPayment(userId: string, id: string, paymentId: string, input: { statementRevision: number; paymentRevision: number; reason: string }) {
  return prisma.$transaction(async tx => {
    await lockStatement(tx, id); const current = await tx.earningsStatement.findUnique({ where: { id }, select: statementSelect }); if (!current) throw missing();
    if (current.status !== "APPROVED" || current.revision !== input.statementRevision) throw changed();
    const payment = await tx.paymentRecord.findFirst({ where: { id: paymentId, statementId: id }, select: { id: true, status: true, revision: true, amountPaise: true } });
    if (!payment) throw new HttpError(404, "This payment entry is not available on the statement.", { code: "PAYMENT_NOT_FOUND" });
    if (payment.status !== "RECORDED" || payment.revision !== input.paymentRevision) throw changed();
    await tx.paymentRecord.update({ where: { id: paymentId }, data: { status: "VOIDED", revision: { increment: 1 }, voidedAt: new Date(), voidedByUserId: userId, voidReason: input.reason } });
    const updated = await tx.earningsStatement.update({ where: { id }, data: { revision: { increment: 1 } }, select: statementSelect });
    await tx.auditLog.create({ data: { actorUserId: userId, action: "EARNINGS_PAYMENT_VOIDED", entityType: "EarningsStatement", entityId: id, metadata: { paymentId, amountPaise: payment.amountPaise, reason: input.reason, revision: updated.revision } } });
    return statementDto(updated, true);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

function safeMoneyTotal(value: bigint | number | null | undefined) {
  const result = Number(value || 0);
  if (!Number.isSafeInteger(result)) throw new HttpError(500, "The financial total exceeded the supported safe range.", { code: "MONEY_TOTAL_RANGE" });
  return result;
}
async function exactWorkerSummary(tx: Prisma.TransactionClient, userId: string, query: EarningsListQuery) {
  const filters: Prisma.Sql[] = [
    Prisma.sql`ja."workerUserId" = ${userId}`,
    Prisma.sql`es."status" = 'APPROVED'::"EarningsStatementStatus"`,
  ];
  if (query.assignmentId) filters.push(Prisma.sql`es."assignmentId" = ${query.assignmentId}`);
  if (query.from) filters.push(Prisma.sql`es."periodEnd" >= ${dateValue(query.from)}`);
  if (query.to) filters.push(Prisma.sql`es."periodStart" <= ${dateValue(query.to)}`);
  const rows = await tx.$queryRaw<{ approvedPaise: bigint; paidPaise: bigint; outstandingPaise: bigint }[]>(Prisma.sql`
    SELECT
      COALESCE(SUM(base."netPaise" + adj."netPaise"), 0)::bigint AS "approvedPaise",
      COALESCE(SUM(pay."paidPaise"), 0)::bigint AS "paidPaise",
      COALESCE(SUM(GREATEST(0, base."netPaise" + adj."netPaise" - pay."paidPaise")), 0)::bigint AS "outstandingPaise"
    FROM "EarningsStatement" es
    JOIN "WorkforceAssignment" wa ON wa.id = es."assignmentId"
    JOIN "BusinessCandidate" bc ON bc.id = wa."candidateId"
    JOIN "JobApplication" ja ON ja.id = bc."applicationId"
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(CASE WHEN el.type = 'DEDUCTION'::"EarningsLineType" THEN -el."amountPaise" ELSE el."amountPaise" END), 0)::bigint AS "netPaise"
      FROM "EarningsLine" el WHERE el."statementId" = es.id
    ) base ON TRUE
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(CASE WHEN ea.type = 'CREDIT'::"EarningsAdjustmentType" THEN ea."amountPaise" ELSE -ea."amountPaise" END), 0)::bigint AS "netPaise"
      FROM "EarningsAdjustment" ea WHERE ea."statementId" = es.id
    ) adj ON TRUE
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(pr."amountPaise"), 0)::bigint AS "paidPaise"
      FROM "PaymentRecord" pr WHERE pr."statementId" = es.id AND pr.status = 'RECORDED'::"PaymentRecordStatus"
    ) pay ON TRUE
    WHERE ${Prisma.join(filters, " AND ")}
  `);
  const row = rows[0];
  return { approvedPaise: safeMoneyTotal(row?.approvedPaise), paidPaise: safeMoneyTotal(row?.paidPaise), outstandingPaise: safeMoneyTotal(row?.outstandingPaise) };
}

export async function workerEarnings(userId: string, query: EarningsListQuery) {
  const where: Prisma.EarningsStatementWhereInput = { status: "APPROVED", assignment: { is: owner(userId) }, ...(query.assignmentId ? { assignmentId: query.assignmentId } : {}), ...(query.from || query.to ? { AND: [query.from ? { periodEnd: { gte: dateValue(query.from) } } : {}, query.to ? { periodStart: { lte: dateValue(query.to) } } : {}] } : {}) };
  return prisma.$transaction(async tx => {
    const total = await tx.earningsStatement.count({ where }); const totalPages = Math.max(1, Math.ceil(total / 10)); const page = Math.min(query.page, totalPages);
    const rows = await tx.earningsStatement.findMany({ where, select: statementSelect, orderBy: [{ periodEnd: "desc" }, { id: "desc" }], take: 10, skip: (page - 1) * 10 });
    const summary = await exactWorkerSummary(tx, userId, query);
    const assignmentRows = await tx.earningsStatement.findMany({ where: { status: "APPROVED", assignment: { is: owner(userId) } }, select: { assignmentId: true, assignment: { select: { role: true, location: true, requirement: { select: { companyName: true } } } } }, distinct: ["assignmentId"], orderBy: { assignmentId: "asc" }, take: 100 });
    return { items: rows.map(row => statementDto(row)), total, page, totalPages, summary, assignments: assignmentRows.map(row => ({ id: row.assignmentId, role: row.assignment.role, company: row.assignment.requirement.companyName, location: row.assignment.location })) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

export async function workerEarningsDetail(userId: string, id: string) {
  const row = await prisma.earningsStatement.findFirst({ where: { id, status: "APPROVED", assignment: { is: owner(userId) } }, select: statementSelect });
  if (!row) throw missing(); return statementDto(row, true);
}
export async function adminEarningsDetail(id: string) {
  return prisma.$transaction(async tx => {
    const row = await tx.earningsStatement.findUnique({ where: { id }, select: statementSelect }); if (!row) throw missing();
    const currentAttendance = await attendanceSnapshot(tx, row);
    return { ...statementDto(row, true), currentAttendance };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

export async function adminEarnings(query: AdminEarningsListQuery) {
  const search = { contains: query.query, mode: "insensitive" as const };
  const where: Prisma.EarningsStatementWhereInput = { ...(query.status === "ALL" ? {} : { status: query.status }), ...(query.assignmentId ? { assignmentId: query.assignmentId } : {}), ...(query.query ? { assignment: { is: { OR: [{ name: search }, { role: search }, { location: search }, { requirement: { is: { companyName: search } } }] } } } : {}) };
  return prisma.$transaction(async tx => {
    const total = await tx.earningsStatement.count({ where }); const totalPages = Math.max(1, Math.ceil(total / 12)); const page = Math.min(query.page, totalPages);
    const rows = await tx.earningsStatement.findMany({ where, select: statementSelect, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: 12, skip: (page - 1) * 12 });
    return { items: rows.map(row => statementDto(row)), total, page, totalPages };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

export async function earningsAssignmentOptions(query: EarningsAssignmentQuery) {
  const search = { contains: query.query, mode: "insensitive" as const };
  const where: Prisma.WorkforceAssignmentWhereInput = { cancelledAt: null, candidate: { is: { application: { is: { workerUserId: { not: null } } } } }, ...(query.query ? { OR: [{ name: search }, { role: search }, { location: search }, { requirement: { is: { companyName: search } } }] } : {}) };
  return prisma.$transaction(async tx => {
    const total = await tx.workforceAssignment.count({ where }); const totalPages = Math.max(1, Math.ceil(total / 10)); const page = Math.min(query.page, totalPages);
    const rows = await tx.workforceAssignment.findMany({ where, select: { ...assignmentSelect, candidate: { select: { application: { select: { workerUserId: true } } } }, _count: { select: { attendance: true, earningsStatements: true } } }, orderBy: [{ startDate: "desc" }, { id: "desc" }], take: 10, skip: (page - 1) * 10 });
    return { items: rows.map(row => ({ ...assignmentDto(row), company: row.requirement.companyName, workerUserId: row.candidate.application.workerUserId, recordCount: row._count.attendance, statementCount: row._count.earningsStatements })), total, page, totalPages };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

export async function earningsAssignmentContext(id: string, periodStart: string, periodEnd: string) {
  if (periodStart > periodEnd) throw new HttpError(400, "Choose a valid earnings period.", { code: "INVALID_EARNINGS_PERIOD" });
  return prisma.$transaction(async tx => {
    const assignment = await assignmentForAdmin(tx, id); validateDraft({ periodStart, periodEnd, lines: [{ type: "AGREED_EARNINGS", label: "Context check", amountPaise: 1, reason: "" }] }, assignment);
    const attendance = await attendanceSnapshot(tx, { assignmentId: id, periodStart: dateValue(periodStart), periodEnd: dateValue(periodEnd) });
    return { assignment: { ...assignmentDto(assignment), company: assignment.requirement.companyName }, attendance };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

export async function workerStatementCsv(userId: string, id: string) {
  const row = await workerEarningsDetail(userId, id) as ReturnType<typeof statementDto>;
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const money = (value: number) => (value / 100).toFixed(2);
  const lines: string[][] = [["Statement", row.id], ["Assignment", row.assignment.role], ["Company", row.assignment.company], ["Location", row.assignment.location], ["Period", `${row.periodStart} to ${row.periodEnd}`], ["Status", row.status], [], ["Breakdown type", "Label", "Amount INR", "Reason"]];
  for (const line of row.lines || []) lines.push([line.type, line.label, money(line.amountPaise), line.reason || ""]);
  lines.push([], ["Adjustments", "Type", "Amount INR", "Reason"]); for (const item of row.adjustments || []) lines.push(["Adjustment", item.type, money(item.amountPaise), item.reason]);
  lines.push([], ["Payments", "Date", "Amount INR", "Method", "Reference", "Status"]); for (const payment of row.payments || []) lines.push(["Payment", payment.paidAt.toISOString(), money(payment.amountPaise), payment.method, payment.reference, payment.status]);
  lines.push([], ["Net payable INR", money(row.totals.netPayablePaise)], ["Recorded paid INR", money(row.totals.paidPaise)], ["Outstanding INR", money(row.totals.outstandingPaise)]);
  return lines.map(columns => columns.map(escape).join(",")).join("\r\n") + "\r\n";
}
