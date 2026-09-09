import type { AttendanceRecord, Prisma, UserRole } from "../../generated/prisma/client.js";
export function attendanceSnapshot(row: AttendanceRecord) {
  return { status: row.status, date: row.date.toISOString().slice(0, 10), checkInAt: row.checkInAt?.toISOString() ?? null,
    checkOutAt: row.checkOutAt?.toISOString() ?? null, workedMinutes: row.workedMinutes, lateMinutes: row.lateMinutes,
    breakMinutes: row.breakMinutes, note: row.note, revision: row.revision };
}
export async function resetApproval(tx: Prisma.TransactionClient, row: AttendanceRecord, userId: string, actorRole: UserRole, note: string) {
  if (row.approvalStatus === "PENDING") return;
  await tx.attendanceRecord.update({ where: { id: row.id }, data: { approvalStatus: "PENDING", approvalRevision: { increment: 1 } } });
  await tx.attendanceApprovalEvent.create({ data: { recordId: row.id, recordRevision: row.revision, approvalRevision: row.approvalRevision + 1,
    action: "RESET", actorRole, actorUserId: userId, note, snapshot: attendanceSnapshot(row) } });
}
