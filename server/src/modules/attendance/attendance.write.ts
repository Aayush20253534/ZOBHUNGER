import { applicationEvent, assertApplicationActive, lockApplication } from "../workers/worker-workflow.guards.js";
import { prisma } from "../../config/db.js";
import { resetApproval } from "../phase2/approval-events.js";
import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { assignmentDto, assignmentWhere, findAssignment, missingAssignment, type AttendanceAccess } from "./attendance.read.js";
import { attendanceMinutes, dateKey, dateValue, istToday } from "./attendance.utils.js";
import type { AttendanceValues, CreateAssignment, RecordAttendance, RequestCorrection, ResolveCorrection, UpdateAssignment } from "./attendance.schema.js";

const conflict = () => new HttpError(409, "This record changed. Refresh and review the latest values before saving.", { code: "ATTENDANCE_CHANGED" });
async function lockRequirement(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "WorkforceRequirement" WHERE "id" = ${id} FOR UPDATE`);
}
export async function lockedAssignment(tx: Prisma.TransactionClient, access: AttendanceAccess, id: string) {
  const row = await tx.workforceAssignment.findFirst({ where: { id, ...assignmentWhere(access) }, select: { requirementId: true } });
  if (!row) throw missingAssignment();
  // Match candidate/requirement lock order to serialize closure and reviews.
  await lockRequirement(tx, row.requirementId);
  await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "WorkforceAssignment" WHERE "id" = ${id} FOR UPDATE`);
  return findAssignment(tx, access, id);
}
async function audit(tx: Prisma.TransactionClient, userId: string, entityType: string, entityId: string, action: string, metadata: Prisma.InputJsonValue) {
  await tx.auditLog.create({ data: { actorUserId: userId, entityType, entityId, action, metadata } });
}
async function eligibleCandidate(tx: Prisma.TransactionClient, id: string) {
  const row = await tx.businessCandidate.findUnique({ where: { id }, select: {
    id: true, applicationId: true, application: { select: { withdrawnAt: true } }, requirementId: true, name: true, jobTitle: true, status: true, revokedAt: true,
    requirement: { select: { status: true, businessProfileId: true, businessProfile: { select: { user: { select: { role: true, isActive: true } } } }, submittedBy: { select: { role: true, isActive: true } } } },
  } });
  const owner = row?.requirement.businessProfileId ? row.requirement.businessProfile?.user : row?.requirement.submittedBy;
  if (!row || row.application.withdrawnAt || row.revokedAt || row.status !== "SELECTED" || row.requirement.status === "CLOSED" || owner?.role !== "BUSINESS" || !owner.isActive) {
    throw new HttpError(409, "Choose a selected candidate from an open requirement owned by an active business account.", { code: "CANDIDATE_NOT_ASSIGNABLE" });
  }
  return row;
}
function assignmentValues(input: CreateAssignment | UpdateAssignment) {
  return { location: input.location, supervisor: input.supervisor, startDate: dateValue(input.startDate), endDate: dateValue(input.endDate),
    shiftStart: input.shiftStart, shiftEnd: input.shiftEnd, graceMinutes: input.graceMinutes, workingDays: input.workingDays };
}
export async function createAssignment(userId: string, input: CreateAssignment) {
  return prisma.$transaction(async tx => {
    const reference = await tx.businessCandidate.findUnique({ where: { id: input.candidateId }, select: { requirementId: true, applicationId: true } });
    if (!reference) throw new HttpError(404, "Candidate unavailable.", { code: "CANDIDATE_NOT_FOUND" });
    await lockApplication(tx, reference.applicationId);
    await assertApplicationActive(tx, reference.applicationId);
    await lockRequirement(tx, reference.requirementId);
    const candidate = await eligibleCandidate(tx, input.candidateId);
    const existing = await tx.workforceAssignment.findUnique({ where: { candidateId: candidate.id } });
    if (existing) return { id: existing.id, created: false };
    const row = await tx.workforceAssignment.create({ data: { candidateId: candidate.id, requirementId: candidate.requirementId,
      name: candidate.name, role: candidate.jobTitle, ...assignmentValues(input) } });
    await applicationEvent(tx, candidate.applicationId, { kind: "ASSIGNED", stage: "ASSIGNED", title: "Your assignment is confirmed", message: "Open My assignments to see your location, schedule and attendance options." });
    await audit(tx, userId, "WorkforceAssignment", row.id, "ASSIGNMENT_CREATED", { startDate: input.startDate, endDate: input.endDate });
    return { id: row.id, created: true };
  });
}
export async function updateAssignment(userId: string, id: string, input: UpdateAssignment) {
  return prisma.$transaction(async tx => {
    const current = await lockedAssignment(tx, { userId, admin: true }, id);
    if (current.revision !== input.revision) throw conflict();
    await eligibleCandidate(tx, current.candidateId);
    if (await tx.attendanceRecord.count({ where: { assignmentId: id } }) || await tx.attendanceCorrection.count({ where: { assignmentId: id } }) || await tx.workerAttendanceRequest.count({ where: { assignmentId: id } })) {
      throw new HttpError(409, "Schedule settings are locked once attendance or a correction exists. Use End assignment to stop future roster dates.", { code: "ASSIGNMENT_HAS_HISTORY" });
    }
    const row = await tx.workforceAssignment.update({ where: { id }, data: { ...assignmentValues(input), cancelledAt: null, revision: { increment: 1 } } });
    await audit(tx, userId, "WorkforceAssignment", id, "ASSIGNMENT_UPDATED", { reason: input.note, reactivated: Boolean(current.cancelledAt) });
    return assignmentDto(row);
  });
}
export async function endAssignment(userId: string, id: string, input: { revision: number; endDate: string; note: string }) {
  return prisma.$transaction(async tx => {
    const row = await lockedAssignment(tx, { userId, admin: true }, id);
    if (row.revision !== input.revision) throw conflict();
    if (row.cancelledAt || input.endDate < dateKey(row.startDate) || input.endDate > dateKey(row.endDate)) throw new HttpError(400, "Choose an end date within the existing assignment dates.", { code: "INVALID_ASSIGNMENT_END" });
    const later = { assignmentId: id, date: { gt: dateValue(input.endDate) } };
    if (await tx.attendanceRecord.count({ where: later }) || await tx.attendanceCorrection.count({ where: later }) || await tx.workerAttendanceRequest.count({ where: later })) throw new HttpError(409, "The end date cannot exclude recorded attendance or correction requests.", { code: "ASSIGNMENT_HAS_HISTORY" });
    await tx.workforceAssignment.update({ where: { id }, data: { endDate: dateValue(input.endDate), revision: { increment: 1 } } });
    await audit(tx, userId, "WorkforceAssignment", id, "ASSIGNMENT_ENDED", { endDate: input.endDate, reason: input.note });
    return { id };
  });
}
export async function cancelAssignment(userId: string, id: string, input: { revision: number; note: string }) {
  return prisma.$transaction(async tx => {
    const row = await lockedAssignment(tx, { userId, admin: true }, id);
    if (row.revision !== input.revision || row.cancelledAt) throw conflict();
    if (await tx.attendanceRecord.count({ where: { assignmentId: id } }) || await tx.attendanceCorrection.count({ where: { assignmentId: id } }) || await tx.workerAttendanceRequest.count({ where: { assignmentId: id } })) throw new HttpError(409, "This assignment has attendance history. End it instead of cancelling it.", { code: "ASSIGNMENT_HAS_HISTORY" });
    await tx.workforceAssignment.update({ where: { id }, data: { cancelledAt: new Date(), revision: { increment: 1 } } });
    await audit(tx, userId, "WorkforceAssignment", id, "ASSIGNMENT_CANCELLED", { reason: input.note });
    return { id };
  });
}
function verifyDay(assignment: { startDate: Date; endDate: Date; cancelledAt: Date | null }, date: string) {
  if (assignment.cancelledAt || date < dateKey(assignment.startDate) || date > dateKey(assignment.endDate)) throw new HttpError(409, "This date is outside the active assignment.", { code: "DATE_NOT_ASSIGNED" });
  if (date > istToday()) throw new HttpError(400, "Attendance and corrections cannot be recorded for future dates.", { code: "FUTURE_ATTENDANCE" });
}
export async function saveRecord(tx: Prisma.TransactionClient, assignment: Awaited<ReturnType<typeof findAssignment>>, date: string, input: AttendanceValues, userId: string, source: string) {
  verifyDay(assignment, date);
  const values = { status: input.status, checkInAt: input.checkInAt, checkOutAt: input.checkOutAt, breakMinutes: input.breakMinutes, note: input.note,
    ...attendanceMinutes(assignment, date, input) };
  const key = { assignmentId: assignment.id, date: dateValue(date) };
  const existing = await tx.attendanceRecord.findUnique({ where: { assignmentId_date: key } });
  if ((existing?.revision ?? null) !== input.revision) throw conflict();
  if (existing) await resetApproval(tx, existing, userId, "ADMIN", "Attendance was updated. The revised record needs business approval.");
  const record = existing ? await tx.attendanceRecord.update({ where: { id: existing.id }, data: { ...values, revision: { increment: 1 } } })
    : await tx.attendanceRecord.create({ data: { ...key, ...values } });
  await tx.attendanceEvent.create({ data: { recordId: record.id, ...values, source } });
  await audit(tx, userId, "AttendanceRecord", record.id, source, { assignmentId: assignment.id, date, from: existing?.status ?? null, to: input.status });
  return { id: record.id, revision: record.revision };
}
export async function recordAttendance(userId: string, id: string, input: RecordAttendance) {
  return prisma.$transaction(async tx => saveRecord(tx, await lockedAssignment(tx, { userId, admin: true }, id), input.date, input, userId, "ADMIN_ENTRY"));
}
export async function requestCorrection(access: AttendanceAccess, id: string, input: RequestCorrection) {
  return prisma.$transaction(async tx => {
    const assignment = await lockedAssignment(tx, access, id); verifyDay(assignment, input.date);
    const openKey = `${id}:${input.date}`;
    const open = await tx.attendanceCorrection.findUnique({ where: { openKey } });
    if (open) {
      if (open.reason !== input.reason) throw new HttpError(409, "A correction is already open for this date. The operations team will review it.", { code: "CORRECTION_ALREADY_OPEN" });
      return { id: open.id, created: false };
    }
    const record = await tx.attendanceRecord.findUnique({ where: { assignmentId_date: { assignmentId: id, date: dateValue(input.date) } } });
    if ((record?.revision ?? null) !== input.recordRevision) throw conflict();
    const correction = await tx.attendanceCorrection.create({ data: { assignmentId: id, date: dateValue(input.date), openKey, recordRevision: input.recordRevision, reason: input.reason } });
    if (record) await resetApproval(tx, record, access.userId, "BUSINESS", "A correction was requested. Approval is pending review of the correction.");
    await audit(tx, access.userId, "AttendanceCorrection", correction.id, "CORRECTION_REQUESTED", { assignmentId: id, date: input.date });
    return { id: correction.id, created: true };
  });
}
export async function resolveCorrection(userId: string, id: string, input: ResolveCorrection) {
  return prisma.$transaction(async tx => {
    const reference = await tx.attendanceCorrection.findUnique({ where: { id }, select: { assignmentId: true } });
    if (!reference) throw new HttpError(404, "Correction request unavailable.", { code: "CORRECTION_NOT_FOUND" });
    const assignment = await lockedAssignment(tx, { userId, admin: true }, reference.assignmentId);
    const correction = await tx.attendanceCorrection.findUniqueOrThrow({ where: { id } });
    if (correction.status !== "OPEN") throw new HttpError(409, "This correction has already been reviewed. Refresh to see the decision.", { code: "CORRECTION_CLOSED" });
    if (input.action === "RESOLVE") await saveRecord(tx, assignment, dateKey(correction.date), input.attendance, userId, "CORRECTION_RESOLVED");
    else {
      const record = await tx.attendanceRecord.findUnique({ where: { assignmentId_date: { assignmentId: assignment.id, date: correction.date } } });
      if (record) await resetApproval(tx, record, userId, "ADMIN", `Correction declined: ${input.resolution}. Review the recorded attendance again.`);
    }
    await tx.attendanceCorrection.update({ where: { id }, data: { status: input.action === "RESOLVE" ? "RESOLVED" : "REJECTED", resolution: input.resolution, openKey: null } });
    await audit(tx, userId, "AttendanceCorrection", id, `CORRECTION_${input.action}`, { assignmentId: assignment.id, date: dateKey(correction.date) });
    return { id, status: input.action === "RESOLVE" ? "RESOLVED" : "REJECTED" };
  });
}
