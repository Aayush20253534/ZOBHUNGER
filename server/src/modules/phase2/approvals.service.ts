import { prisma } from "../../config/db.js";
import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { ownedRequirements } from "../business/business-requirement-access.js";
import { assignmentWhere, type AttendanceAccess } from "../attendance/attendance.read.js";
import { lockedAssignment } from "../attendance/attendance.write.js";
import { dateKey, dateValue, istToday } from "../attendance/attendance.utils.js";
import { attendanceSnapshot } from "./approval-events.js";
import type { z } from "zod";
import type { approvalDecisionSchema, approvalQuerySchema } from "./phase2.schema.js";
const missing = () => new HttpError(404, "Attendance record not available in this workspace.", { code: "ATTENDANCE_NOT_FOUND" });
const conflict = () => new HttpError(409, "This attendance record or decision changed. Refresh and review it again.", { code: "ATTENDANCE_CHANGED" });
export const approvalSelect = { id: true, assignmentId: true, date: true, status: true, checkInAt: true, checkOutAt: true, breakMinutes: true, workedMinutes: true, lateMinutes: true, note: true, revision: true,
  approvalStatus: true, approvalRevision: true, updatedAt: true, assignment: { select: { id: true, name: true, role: true, location: true, supervisor: true, requirementId: true, requirement: { select: { companyName: true } } } } } satisfies Prisma.AttendanceRecordSelect;
function recordWhere(access: AttendanceAccess): Prisma.AttendanceRecordWhereInput { return { assignment: assignmentWhere(access) }; }
export async function checkRequirementScope(tx: Prisma.TransactionClient, access: AttendanceAccess, id?: string) {
  if (id && !await tx.workforceRequirement.findFirst({ where: { id, ...(access.admin ? {} : ownedRequirements(access.userId)) }, select: { id: true } })) throw missing();
}
export async function approvalQueue(access: AttendanceAccess, input: z.infer<typeof approvalQuerySchema>) {
  const search = input.query.replace(/[\\%_]/g, "\\$&"), location = input.location.replace(/[\\%_]/g, "\\$&");
  const where: Prisma.AttendanceRecordWhereInput = { date: { gte: dateValue(input.from), lte: dateValue(input.to) }, assignment: { AND: [assignmentWhere(access),
    ...(input.requirementId ? [{ requirementId: input.requirementId }] : []), ...(location ? [{ location: { contains: location, mode: "insensitive" as const } }] : []),
    ...(search ? [{ OR: [{ name: { contains: search, mode: "insensitive" as const } }, { role: { contains: search, mode: "insensitive" as const } }] }] : [])] } };
  return prisma.$transaction(async tx => {
    await checkRequirementScope(tx, access, input.requirementId);
    const groups = await tx.attendanceRecord.groupBy({ by: ["approvalStatus"], where, _count: { _all: true }, _sum: { workedMinutes: true } });
    const filtered = { ...where, ...(input.status === "ALL" ? {} : { approvalStatus: input.status }) };
    const total = await tx.attendanceRecord.count({ where: filtered }), totalPages = Math.max(1, Math.ceil(total / 12)), page = Math.min(input.page, totalPages);
    const rows = await tx.attendanceRecord.findMany({ where: filtered, select: approvalSelect, orderBy: [{ date: "desc" }, { id: "desc" }], take: 12, skip: (page - 1) * 12 });
    const open = rows.length ? await tx.attendanceCorrection.findMany({ where: { status: "OPEN", OR: rows.map(row => ({ assignmentId: row.assignmentId, date: row.date })) }, select: { assignmentId: true, date: true } }) : [];
    return { items: rows.map(row => ({ ...row, date: dateKey(row.date), correctionOpen: open.some(item => item.assignmentId === row.assignmentId && dateKey(item.date) === dateKey(row.date)) })), total, page, totalPages, pageSize: 12,
      counts: Object.fromEntries(["PENDING", "APPROVED", "CHANGES_REQUESTED"].map(status => [status, groups.find(group => group.approvalStatus === status)?._count._all ?? 0])),
      approvedMinutes: groups.find(group => group.approvalStatus === "APPROVED")?._sum.workedMinutes ?? 0 };
  }, { isolationLevel: "RepeatableRead" });
}
export async function approvalDetail(access: AttendanceAccess, id: string, page: number) {
  return prisma.$transaction(async tx => {
    const record = await tx.attendanceRecord.findFirst({ where: { id, ...recordWhere(access) }, select: approvalSelect });
    if (!record) throw missing();
    const correction = await tx.attendanceCorrection.findUnique({ where: { openKey: `${record.assignmentId}:${dateKey(record.date)}` }, select: { id: true, reason: true } });
    const total = await tx.attendanceApprovalEvent.count({ where: { recordId: id } }), totalPages = Math.max(1, Math.ceil(total / 20)); page = Math.min(page, totalPages);
    const history = await tx.attendanceApprovalEvent.findMany({ where: { recordId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, skip: (page - 1) * 20,
      select: { id: true, action: true, actorRole: true, note: true, snapshot: true, recordRevision: true, createdAt: true } });
    return { record: { ...record, date: dateKey(record.date) }, correction, history: { items: history, total, totalPages, page } };
  }, { isolationLevel: "RepeatableRead" });
}
export async function decideApproval(userId: string, id: string, input: z.infer<typeof approvalDecisionSchema>) {
  return prisma.$transaction(async tx => {
    const reference = await tx.attendanceRecord.findFirst({ where: { id, ...recordWhere({ userId, admin: false }) }, select: { assignmentId: true } });
    if (!reference) throw missing();
    await lockedAssignment(tx, { userId, admin: false }, reference.assignmentId);
    const record = await tx.attendanceRecord.findUniqueOrThrow({ where: { id } });
    if (record.revision !== input.revision || record.approvalRevision !== input.approvalRevision || record.approvalStatus !== "PENDING") throw conflict();
    if (dateKey(record.date) > istToday() || (input.action === "APPROVED" && record.status === "PRESENT" && !record.checkOutAt)) throw new HttpError(409, "Wait for the shift to finish and check-out to be recorded before approving.", { code: "SHIFT_NOT_COMPLETE" });
    const openKey = `${record.assignmentId}:${dateKey(record.date)}`;
    if (await tx.attendanceCorrection.findUnique({ where: { openKey } })) throw new HttpError(409, "Resolve the open correction before reviewing this attendance record.", { code: "CORRECTION_ALREADY_OPEN" });
    if (input.action === "CHANGES_REQUESTED") await tx.attendanceCorrection.create({ data: { assignmentId: record.assignmentId, date: record.date, openKey, recordRevision: record.revision, reason: input.note } });
    await tx.attendanceRecord.update({ where: { id }, data: { approvalStatus: input.action, approvalRevision: { increment: 1 } } });
    await tx.attendanceApprovalEvent.create({ data: { recordId: id, recordRevision: record.revision, approvalRevision: record.approvalRevision + 1, action: input.action,
      actorRole: "BUSINESS", actorUserId: userId, note: input.note, snapshot: attendanceSnapshot(record) } });
    await tx.auditLog.create({ data: { actorUserId: userId, entityType: "AttendanceRecord", entityId: id, action: `ATTENDANCE_${input.action}`, metadata: { revision: record.revision } } });
    return { id, approvalStatus: input.action, approvalRevision: record.approvalRevision + 1 };
  });
}
