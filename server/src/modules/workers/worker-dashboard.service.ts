import { prisma } from "../../config/db.js";
import { Prisma } from "../../generated/prisma/client.js";
import { assignmentDto, assignmentSelect } from "../attendance/attendance.read.js";
import { addDays, dateKey, dateValue, isoWeekday, istToday, shiftWindow } from "../attendance/attendance.utils.js";
import { deploymentState } from "../deployments/deployments.utils.js";
import { workerApplications } from "./worker-applications.service.js";
import { getWorkerProfile } from "./worker-profile.service.js";
import { workerEarnings } from "./worker-earnings.service.js";

const owner = (userId: string): Prisma.WorkforceAssignmentWhereInput => ({ candidate: { is: { application: { is: { workerUserId: userId } } } } });
function assignmentView(row: Prisma.WorkforceAssignmentGetPayload<{ select: typeof assignmentSelect }>) {
  const { requirement, requirementId: _requirementId, candidateId: _candidateId, ...assignment } = row;
  return { ...assignmentDto(assignment), company: requirement.companyName, state: deploymentState(row, istToday()) };
}
function nextShift(rows: Prisma.WorkforceAssignmentGetPayload<{ select: typeof assignmentSelect }>[], now = new Date()) {
  const today = istToday(now); let best: { assignmentId: string; role: string; company: string; location: string; supervisor: string; date: string; startAt: string; endAt: string; overnight: boolean } | null = null;
  for (const row of rows) {
    const first = row.startDate > dateValue(today) ? dateKey(row.startDate) : today;
    const last = dateKey(row.endDate);
    for (let offset = 0; offset <= 45; offset++) {
      const date = addDays(first, offset); if (date > last) break;
      if (!row.workingDays.includes(isoWeekday(date))) continue;
      const window = shiftWindow(date, row.shiftStart, row.shiftEnd);
      if (window.end <= now.getTime()) continue;
      const candidate = { assignmentId: row.id, role: row.role, company: row.requirement.companyName, location: row.location, supervisor: row.supervisor, date, startAt: new Date(window.start).toISOString(), endAt: new Date(window.end).toISOString(), overnight: row.shiftEnd < row.shiftStart };
      if (!best || new Date(candidate.startAt).getTime() < new Date(best.startAt).getTime()) best = candidate;
      break;
    }
  }
  return best;
}

export async function workerDashboard(userId: string) {
  const today = istToday(); const todayDate = dateValue(today);
  const [earnings, profileData, applications] = await Promise.all([
    workerEarnings(userId, { page: 1 }),
    getWorkerProfile(userId),
    workerApplications(userId, { page: 1, query: "", status: "ALL", source: "ALL" }),
  ]);
  return prisma.$transaction(async tx => {
    const [currentTotal, upcomingTotal, assignments, attendancePending, attendanceRecent, applicationEvents, attendanceEvents, approvedStatements, recentPayments] = await Promise.all([
      tx.workforceAssignment.count({ where: { ...owner(userId), cancelledAt: null, startDate: { lte: todayDate }, endDate: { gte: todayDate } } }),
      tx.workforceAssignment.count({ where: { ...owner(userId), cancelledAt: null, startDate: { gt: todayDate } } }),
      tx.workforceAssignment.findMany({ where: { ...owner(userId), cancelledAt: null, endDate: { gte: todayDate } }, select: assignmentSelect, orderBy: [{ startDate: "asc" }, { id: "asc" }], take: 48 }),
      tx.workerAttendanceRequest.count({ where: { workerUserId: userId, status: "PENDING" } }),
      tx.workerAttendanceRequest.findMany({ where: { workerUserId: userId }, select: { id: true, assignmentId: true, date: true, kind: true, status: true, reviewNote: true, reviewedAt: true, createdAt: true, assignment: { select: { role: true, location: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 5 }),
      tx.workerApplicationEvent.findMany({ where: { application: { workerUserId: userId } }, select: { id: true, title: true, message: true, stage: true, createdAt: true, application: { select: { job: { select: { title: true } } } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 5 }),
      tx.workerAttendanceRequest.findMany({ where: { workerUserId: userId }, select: { id: true, status: true, kind: true, date: true, createdAt: true, reviewedAt: true, assignment: { select: { role: true } } }, orderBy: [{ reviewedAt: "desc" }, { createdAt: "desc" }], take: 5 }),
      tx.earningsStatement.findMany({ where: { status: "APPROVED", assignment: { is: owner(userId) } }, select: { id: true, approvedAt: true, periodStart: true, periodEnd: true, assignment: { select: { role: true } } }, orderBy: [{ approvedAt: "desc" }, { id: "desc" }], take: 5 }),
      tx.paymentRecord.findMany({ where: { status: "RECORDED", statement: { status: "APPROVED", assignment: { is: owner(userId) } } }, select: { id: true, paidAt: true, amountPaise: true, method: true, statement: { select: { id: true, assignment: { select: { role: true } } } } }, orderBy: [{ paidAt: "desc" }, { id: "desc" }], take: 5 }),
    ]);
    const current = assignments.filter(row => row.startDate <= todayDate && row.endDate >= todayDate).slice(0, 4).map(assignmentView);
    const upcoming = assignments.filter(row => row.startDate > todayDate).slice(0, 4).map(assignmentView);
    const activity = [
      ...applicationEvents.map(item => ({ id: `application:${item.id}`, kind: "APPLICATION", title: item.title, detail: `${item.application.job.title}${item.message ? ` · ${item.message}` : ""}`, at: item.createdAt })),
      ...attendanceEvents.map(item => ({ id: `attendance:${item.id}`, kind: "ATTENDANCE", title: item.reviewedAt ? `Attendance ${item.status.toLowerCase()}` : "Attendance sent for review", detail: `${item.assignment.role} · ${dateKey(item.date)}`, at: item.reviewedAt || item.createdAt })),
      ...approvedStatements.filter(item => item.approvedAt).map(item => ({ id: `earnings:${item.id}`, kind: "EARNINGS", title: "Earnings statement approved", detail: `${item.assignment.role} · ${dateKey(item.periodStart)} to ${dateKey(item.periodEnd)}`, at: item.approvedAt! })),
      ...recentPayments.map(item => ({ id: `payment:${item.id}`, kind: "PAYMENT", title: "Payment recorded", detail: `${item.statement.assignment.role} · ₹${(item.amountPaise / 100).toFixed(2)} · ${item.method}`, at: item.paidAt })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 8);
    return {
      today,
      profile: { fullName: profileData.profile?.fullName || null, completion: profileData.completion },
      applications: { total: applications.total, counts: applications.counts, recent: applications.items.slice(0, 5).map(row => ({ id: row.id, stage: row.stage, title: row.job.title, updatedAt: row.updatedAt })) },
      assignments: { currentTotal, upcomingTotal, current, upcoming, nextShift: nextShift(assignments) },
      attendance: { pending: attendancePending, recent: attendanceRecent.map(item => ({ ...item, date: dateKey(item.date) })) },
      earnings: earnings.summary,
      activity,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
