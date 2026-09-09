import { prisma } from "../../config/db.js";
import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { assignmentDto, recordDto, assignmentSelect, missingAssignment } from "../attendance/attendance.read.js";
import { lockedAssignment, saveRecord } from "../attendance/attendance.write.js";
import { attendanceMinutes, dateKey, dateValue, istToday, isoWeekday, monthDays } from "../attendance/attendance.utils.js";
import { assignmentSchedule, deploymentState, weekDates } from "../deployments/deployments.utils.js";
import type { AssignmentQuery, WorkerAttendanceInput, WorkerAttendanceQuery } from "./worker-workflow.schema.js";

// A trusted application foreign key is the only worker ownership boundary.
const owner = (userId: string): Prisma.WorkforceAssignmentWhereInput => ({ candidate: { is: { application: { is: { workerUserId: userId } } } } });
const publicRecord = { id: true, date: true, status: true, checkInAt: true, checkOutAt: true, breakMinutes: true, workedMinutes: true, lateMinutes: true, revision: true, approvalStatus: true, approvalRevision: true, updatedAt: true } satisfies Prisma.AttendanceRecordSelect;
const publicRequest = { id: true, assignmentId: true, date: true, kind: true, status: true, attendanceStatus: true, checkInAt: true, checkOutAt: true, breakMinutes: true, workedMinutes: true, lateMinutes: true, reason: true, recordRevision: true, recordApprovalRevision: true, assignmentRevision: true, revision: true, approvedRecordRevision: true, reviewedAt: true, reviewNote: true, createdAt: true } satisfies Prisma.WorkerAttendanceRequestSelect;
const changed = () => new HttpError(409, "The schedule or attendance changed. Reload this date and review the latest record before continuing.", { code: "WORKER_ATTENDANCE_CHANGED" });
const missingRequest = () => new HttpError(404, "This attendance request is not available in your workspace.", { code: "WORKER_ATTENDANCE_NOT_FOUND" });
async function ownAssignment(tx: Prisma.TransactionClient, userId: string, id: string) {
  const assignment = await tx.workforceAssignment.findFirst({ where: { id, ...owner(userId) }, select: assignmentSelect });
  if (!assignment) throw missingAssignment();
  return assignment;
}
function assignmentView(row: Prisma.WorkforceAssignmentGetPayload<{ select: typeof assignmentSelect }>, date = istToday()) {
  // Business brief fields and candidate review notes stay out of worker responses.
  const { requirement, requirementId: _requirementId, candidateId: _candidateId, ...assignment } = row;
  return { ...assignmentDto(assignment), company: requirement.companyName, state: deploymentState(row, date), schedule: assignmentSchedule(row, weekDates(date)) };
}
function dayState(row: { startDate: Date; endDate: Date; cancelledAt: Date | null; workingDays: number[] }, date: string, status?: string) {
  if (row.cancelledAt || date < dateKey(row.startDate) || date > dateKey(row.endDate)) return "NOT_ASSIGNED";
  return status || (!row.workingDays.includes(isoWeekday(date)) ? "SCHEDULED_OFF" : date > istToday() ? "UPCOMING" : "NOT_RECORDED");
}
export async function workerAssignments(userId: string, query: AssignmentQuery) {
  const today = dateValue(query.date), search = { contains: query.query, mode: "insensitive" as const };
  const state: Prisma.WorkforceAssignmentWhereInput = query.status === "ALL" ? {} : query.status === "CANCELLED" ? { cancelledAt: { not: null } } : { cancelledAt: null, ...(query.status === "ACTIVE" ? { startDate: { lte: today }, endDate: { gte: today } } : query.status === "UPCOMING" ? { startDate: { gt: today } } : { endDate: { lt: today } }) };
  const where: Prisma.WorkforceAssignmentWhereInput = { ...owner(userId), ...state, ...(query.query ? { OR: [{ role: search }, { location: search }, { requirement: { is: { companyName: search } } }] } : {}) };
  return prisma.$transaction(async tx => {
    const total = await tx.workforceAssignment.count({ where }); const totalPages = Math.max(1, Math.ceil(total / 9)), page = Math.min(query.page, totalPages);
    const items = await tx.workforceAssignment.findMany({ where, select: assignmentSelect, orderBy: [{ startDate: "desc" }, { id: "desc" }], skip: (page - 1) * 9, take: 9 });
    return { items: items.map(row => assignmentView(row, query.date)), total, page, totalPages, today: istToday() };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
export async function workerAssignmentMonth(userId: string, id: string, month: string) {
  return prisma.$transaction(async tx => {
    const assignment = await ownAssignment(tx, userId, id), dates = monthDays(month);
    const where = { assignmentId: id, date: { gte: dateValue(dates[0]), lte: dateValue(dates.at(-1)!) } };
    const records = await tx.attendanceRecord.findMany({ where, select: publicRecord });
    const pending = await tx.workerAttendanceRequest.findMany({ where: { ...where, workerUserId: userId, status: "PENDING" }, select: { id: true, date: true } });
    return { assignment: assignmentView(assignment), month, today: istToday(), days: dates.map(date => {
      const record = records.find(row => dateKey(row.date) === date);
      return { date, status: dayState(assignment, date, record?.status), record: record ? recordDto(record) : null, pendingId: pending.find(row => dateKey(row.date) === date)?.id ?? null };
    }), recordedDays: records.length, approvedDays: records.filter(row => row.approvalStatus === "APPROVED").length, workedMinutes: records.reduce((sum, row) => sum + (row.workedMinutes || 0), 0) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
export async function workerAssignmentDay(userId: string, id: string, date: string, historyPage = 1) {
  return prisma.$transaction(async tx => {
    const assignment = await ownAssignment(tx, userId, id), where = { assignmentId: id, date: dateValue(date) };
    const record = await tx.attendanceRecord.findUnique({ where: { assignmentId_date: where }, select: publicRecord });
    const businessCorrection = Boolean(await tx.attendanceCorrection.findFirst({ where: { ...where, status: "OPEN" }, select: { id: true } }));
    const pending = await tx.workerAttendanceRequest.findFirst({ where: { ...where, workerUserId: userId, status: "PENDING" }, select: publicRequest });
    const total = await tx.workerAttendanceRequest.count({ where: { ...where, workerUserId: userId } }); const totalPages = Math.max(1, Math.ceil(total / 10)), page = Math.min(historyPage, totalPages);
    const history = await tx.workerAttendanceRequest.findMany({ where: { ...where, workerUserId: userId }, select: publicRequest, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 10, skip: (page - 1) * 10 });
    return { assignment: assignmentView(assignment, date), date, today: istToday(), status: dayState(assignment, date, record?.status), record: record ? recordDto(record) : null, businessCorrection, pending: pending ? recordDto(pending) : null, history: { items: history.map(recordDto), total, totalPages, page } };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
function verifyProposal(assignment: Awaited<ReturnType<typeof ownAssignment>>, input: WorkerAttendanceInput) {
  if (assignment.cancelledAt || input.date < dateKey(assignment.startDate) || input.date > dateKey(assignment.endDate)) throw new HttpError(409, "Choose a date inside your confirmed assignment.", { code: "DATE_NOT_ASSIGNED" });
  if (input.date > istToday()) throw new HttpError(400, "Future attendance cannot be submitted.", { code: "FUTURE_ATTENDANCE" });
  if (!assignment.workingDays.includes(isoWeekday(input.date)) && input.attendanceStatus !== "OFF") throw new HttpError(400, "This is a scheduled day off. Contact operations if you were asked to work an extra shift.", { code: "SCHEDULED_OFF" });
  if (input.attendanceStatus === "PRESENT" && (!input.checkInAt || !input.checkOutAt)) throw new HttpError(400, "Submit a completed shift with both arrival and departure times.", { code: "COMPLETED_SHIFT_REQUIRED" });
  return attendanceMinutes(assignment, input.date, { status: input.attendanceStatus, checkInAt: input.checkInAt, checkOutAt: input.checkOutAt, breakMinutes: input.breakMinutes });
}
export async function submitWorkerAttendance(userId: string, id: string, input: WorkerAttendanceInput) {
  return prisma.$transaction(async tx => {
    await ownAssignment(tx, userId, id);
    const assignment = await lockedAssignment(tx, { userId, admin: true }, id);
    await ownAssignment(tx, userId, id);
    const duplicate = await tx.workerAttendanceRequest.findUnique({ where: { workerUserId_requestKey: { workerUserId: userId, requestKey: input.requestKey } } });
    if (duplicate) {
      const same = duplicate.assignmentId === id && dateKey(duplicate.date) === input.date && duplicate.kind === input.kind && duplicate.attendanceStatus === input.attendanceStatus && duplicate.checkInAt?.getTime() === input.checkInAt?.getTime() && duplicate.checkOutAt?.getTime() === input.checkOutAt?.getTime() && duplicate.breakMinutes === input.breakMinutes && duplicate.reason === input.reason && duplicate.assignmentRevision === input.assignmentRevision && duplicate.recordRevision === input.recordRevision && duplicate.recordApprovalRevision === input.recordApprovalRevision;
      if (!same) throw new HttpError(409, "This submission reference has already been used. Reload the date before sending a different entry.", { code: "REQUEST_KEY_REUSED" });
      return { id: duplicate.id, created: false };
    }
    const minutes = verifyProposal(assignment, input), openKey = `${id}:${input.date}`;
    if (await tx.workerAttendanceRequest.findUnique({ where: { openKey } })) throw new HttpError(409, "A request for this date is already awaiting operations review.", { code: "WORKER_ATTENDANCE_PENDING" });
    if (await tx.attendanceCorrection.findUnique({ where: { openKey } })) throw new HttpError(409, "Operations is already reviewing a business correction for this date. Try again after that review.", { code: "BUSINESS_CORRECTION_OPEN" });
    const record = await tx.attendanceRecord.findUnique({ where: { assignmentId_date: { assignmentId: id, date: dateValue(input.date) } } });
    if (assignment.revision !== input.assignmentRevision || (record?.revision ?? null) !== input.recordRevision || (record?.approvalRevision ?? null) !== input.recordApprovalRevision) throw changed();
    if (input.kind === "SUBMISSION" && record) throw new HttpError(409, "Attendance is already recorded. Submit a correction instead.", { code: "ATTENDANCE_ALREADY_RECORDED" });
    const request = await tx.workerAttendanceRequest.create({ data: { workerUserId: userId, assignmentId: id, requestKey: input.requestKey, openKey, date: dateValue(input.date), kind: input.kind, attendanceStatus: input.attendanceStatus, checkInAt: input.checkInAt, checkOutAt: input.checkOutAt, breakMinutes: input.breakMinutes, reason: input.reason, assignmentRevision: input.assignmentRevision, recordRevision: input.recordRevision, recordApprovalRevision: input.recordApprovalRevision, ...minutes } });
    await tx.auditLog.create({ data: { actorUserId: userId, action: "WORKER_ATTENDANCE_REQUESTED", entityType: "WorkerAttendanceRequest", entityId: request.id } });
    return { id: request.id, created: true };
  });
}
export async function workerAttendanceRequests(userId: string, query: WorkerAttendanceQuery, admin = false) {
  const search = { contains: query.query, mode: "insensitive" as const };
  const where: Prisma.WorkerAttendanceRequestWhereInput = { ...(admin ? {} : { workerUserId: userId }), ...(query.status === "ALL" ? {} : { status: query.status }), ...(query.assignmentId ? { assignmentId: query.assignmentId } : {}), ...(query.query ? { assignment: { is: { OR: [{ name: search }, { role: search }, { location: search }] } } } : {}) };
  return prisma.$transaction(async tx => {
    const total = await tx.workerAttendanceRequest.count({ where }); const totalPages = Math.max(1, Math.ceil(total / 12)), page = Math.min(query.page, totalPages);
    const rows = await tx.workerAttendanceRequest.findMany({ where, select: { ...publicRequest, assignment: { select: assignmentSelect } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 12, take: 12 });
    return { items: rows.map(({ assignment, ...row }) => ({ ...recordDto(row), assignment: assignmentView(assignment) })), total, page, totalPages };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
export async function adminAttendanceRequest(id: string) {
  return prisma.$transaction(async tx => {
    const row = await tx.workerAttendanceRequest.findUnique({ where: { id }, select: { ...publicRequest, assignment: { select: assignmentSelect }, worker: { select: { email: true } } } });
    if (!row) throw missingRequest();
    const record = await tx.attendanceRecord.findUnique({ where: { assignmentId_date: { assignmentId: row.assignmentId, date: row.date } }, select: publicRecord });
    const businessCorrection = Boolean(await tx.attendanceCorrection.findFirst({ where: { assignmentId: row.assignmentId, date: row.date, status: "OPEN" }, select: { id: true } }));
    const { assignment, ...request } = row;
    return { request: recordDto(request), assignment: assignmentView(assignment, dateKey(row.date)), record: record ? recordDto(record) : null, businessCorrection, stale: assignment.revision !== row.assignmentRevision || (record?.revision ?? null) !== row.recordRevision || (record?.approvalRevision ?? null) !== row.recordApprovalRevision };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
export async function reviewWorkerAttendance(userId: string, id: string, input: { revision: number; decision: "APPROVE" | "REJECT"; reviewNote: string }) {
  await prisma.$transaction(async tx => {
    const reference = await tx.workerAttendanceRequest.findUnique({ where: { id }, select: { assignmentId: true } }); if (!reference) throw missingRequest();
    const assignment = await lockedAssignment(tx, { userId, admin: true }, reference.assignmentId);
    const row = await tx.workerAttendanceRequest.findUniqueOrThrow({ where: { id } });
    if (row.status !== "PENDING" || row.revision !== input.revision) throw changed();
    let accepted: { id: string; revision: number } | null = null;
    if (input.decision === "APPROVE") {
      await ownAssignment(tx, row.workerUserId, row.assignmentId);
      const record = await tx.attendanceRecord.findUnique({ where: { assignmentId_date: { assignmentId: row.assignmentId, date: row.date } } });
      if (assignment.revision !== row.assignmentRevision || (record?.revision ?? null) !== row.recordRevision || (record?.approvalRevision ?? null) !== row.recordApprovalRevision) throw changed();
      if (await tx.attendanceCorrection.findFirst({ where: { assignmentId: row.assignmentId, date: row.date, status: "OPEN" } })) throw new HttpError(409, "Resolve the open business correction first, then ask the worker to review the updated date.", { code: "BUSINESS_CORRECTION_OPEN" });
      accepted = await saveRecord(tx, assignment, dateKey(row.date), { revision: row.recordRevision, status: row.attendanceStatus, checkInAt: row.checkInAt, checkOutAt: row.checkOutAt, breakMinutes: row.breakMinutes, note: `Worker report reviewed: ${input.reviewNote}` }, userId, row.kind === "CORRECTION" ? "WORKER_CORRECTION_APPROVED" : "WORKER_SUBMISSION_APPROVED");
    }
    await tx.workerAttendanceRequest.update({ where: { id }, data: { status: input.decision === "APPROVE" ? "APPROVED" : "REJECTED", openKey: null, revision: { increment: 1 }, reviewedByUserId: userId, reviewedAt: new Date(), reviewNote: input.reviewNote, ...(accepted ? { recordId: accepted.id, approvedRecordRevision: accepted.revision } : {}) } });
    await tx.auditLog.create({ data: { actorUserId: userId, action: `WORKER_ATTENDANCE_${input.decision}`, entityType: "WorkerAttendanceRequest", entityId: id } });
  });
  return adminAttendanceRequest(id);
}
