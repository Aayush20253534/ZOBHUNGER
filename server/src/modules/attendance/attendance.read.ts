import { prisma } from "../../config/db.js";
import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { ownedRequirements, ownedRequirementSql } from "../business/business-requirement-access.js";
import { addDays, dateKey, dateValue, displayStatuses, isoWeekday, istToday, monthDays } from "./attendance.utils.js";
import type { CorrectionListQuery, DailyQuery, LookupQuery } from "./attendance.schema.js";

export interface AttendanceAccess { userId: string; admin: boolean }
export const requirementSelect = { id: true, companyName: true, serviceRequired: true, jobLocation: true, status: true } satisfies Prisma.WorkforceRequirementSelect;
export const assignmentSelect = {
  id: true, candidateId: true, requirementId: true, name: true, role: true, location: true, supervisor: true,
  startDate: true, endDate: true, shiftStart: true, shiftEnd: true, graceMinutes: true, workingDays: true,
  revision: true, cancelledAt: true, createdAt: true, updatedAt: true, requirement: { select: requirementSelect },
} satisfies Prisma.WorkforceAssignmentSelect;
export const recordSelect = { id: true, date: true, status: true, checkInAt: true, checkOutAt: true, breakMinutes: true,
  workedMinutes: true, lateMinutes: true, note: true, revision: true, updatedAt: true } satisfies Prisma.AttendanceRecordSelect;
export const correctionSelect = { id: true, assignmentId: true, date: true, reason: true, status: true, resolution: true,
  recordRevision: true, createdAt: true, updatedAt: true } satisfies Prisma.AttendanceCorrectionSelect;
export function assignmentWhere(access: AttendanceAccess): Prisma.WorkforceAssignmentWhereInput {
  return access.admin ? {} : { requirement: { is: ownedRequirements(access.userId) } };
}
export const missingAssignment = () => new HttpError(404, "This assignment is not available in your workspace.", { code: "ASSIGNMENT_NOT_FOUND" });
export function assignmentDto<T extends { startDate: Date; endDate: Date }>(row: T) { return { ...row, startDate: dateKey(row.startDate), endDate: dateKey(row.endDate) }; }
export function recordDto<T extends { date: Date }>(row: T) { return { ...row, date: dateKey(row.date) }; }
export async function findAssignment(tx: Prisma.TransactionClient, access: AttendanceAccess, id: string) {
  const assignment = await tx.workforceAssignment.findFirst({ where: { id, ...assignmentWhere(access) }, select: assignmentSelect });
  if (!assignment) throw missingAssignment();
  return assignment;
}
type DisplayStatus = typeof displayStatuses[number];
type Counts = Record<DisplayStatus, number>;
export const emptyCounts = () => Object.fromEntries(displayStatuses.map(status => [status, 0])) as Counts;
type Aggregate = { date: string; status: DisplayStatus; count: number; late: number; minutes: number; openShifts: number; corrections: number };

function rosterSql(access: AttendanceAccess, query: DailyQuery, first: string, last: string) {
  const search = `%${query.query.replace(/[\\%_]/g, "\\$&")}%`;
  const location = `%${query.location.replace(/[\\%_]/g, "\\$&")}%`;
  return Prisma.sql`WITH roster AS (
    SELECT a."id", a."name", to_char(d.day, 'YYYY-MM-DD') AS date,
      CASE WHEN t."status" IS NOT NULL THEN t."status"::text
           WHEN NOT (EXTRACT(ISODOW FROM d.day)::int = ANY(a."workingDays")) THEN 'SCHEDULED_OFF'
           WHEN d.day::date > ${istToday()}::date THEN 'UPCOMING' ELSE 'NOT_RECORDED' END AS status,
      COALESCE(t."lateMinutes", 0) AS late, COALESCE(t."workedMinutes", 0) AS minutes,
      (t."status" = 'PRESENT' AND t."checkOutAt" IS NULL) AS "openShift",
      EXISTS (SELECT 1 FROM "AttendanceCorrection" c WHERE c."assignmentId" = a."id" AND c."date" = d.day::date AND c."status" = 'OPEN') AS correction
    FROM "WorkforceAssignment" a JOIN "WorkforceRequirement" r ON r."id" = a."requirementId"
    LEFT JOIN "BusinessProfile" b ON b."id" = r."businessProfileId"
    CROSS JOIN generate_series(${first}::date::timestamp, ${last}::date::timestamp, INTERVAL '1 day') d(day)
    LEFT JOIN "AttendanceRecord" t ON t."assignmentId" = a."id" AND t."date" = d.day::date
    WHERE a."cancelledAt" IS NULL AND a."startDate" <= d.day::date AND a."endDate" >= d.day::date
      AND ${access.admin ? Prisma.sql`TRUE` : ownedRequirementSql(access.userId)}
      AND ${query.requirementId ? Prisma.sql`r."id" = ${query.requirementId}` : Prisma.sql`TRUE`}
      AND ${query.query ? Prisma.sql`(a."name" ILIKE ${search} OR a."role" ILIKE ${search} OR r."companyName" ILIKE ${search})` : Prisma.sql`TRUE`}
      AND ${query.location ? Prisma.sql`a."location" ILIKE ${location}` : Prisma.sql`TRUE`}
  )`;
}
function aggregateSql(prefix: Prisma.Sql) {
  return Prisma.sql`${prefix} SELECT date, status, COUNT(*)::int AS count,
    COUNT(*) FILTER (WHERE late > 0)::int AS late, COALESCE(SUM(minutes),0)::int AS minutes,
    COUNT(*) FILTER (WHERE "openShift")::int AS "openShifts", COUNT(*) FILTER (WHERE correction)::int AS corrections
    FROM roster GROUP BY date, status ORDER BY date, status`;
}
function summary(rows: Aggregate[]) {
  const counts = emptyCounts(); let late = 0, minutes = 0, openShifts = 0, corrections = 0;
  for (const row of rows) { counts[row.status] += row.count; late += row.late; minutes += row.minutes; openShifts += row.openShifts; corrections += row.corrections; }
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const recorded = counts.PRESENT + counts.ABSENT + counts.LEAVE + counts.OFF;
  const expected = total - counts.SCHEDULED_OFF;
  return { counts, total, recorded, expected, late, minutes, openShifts, corrections, completion: expected ? Math.round(recorded * 100 / expected) : 0 };
}
function dayStatus(assignment: { startDate: Date; endDate: Date; cancelledAt: Date | null; workingDays: number[] }, date: string, status?: DisplayStatus) {
  if (assignment.cancelledAt || date < dateKey(assignment.startDate) || date > dateKey(assignment.endDate)) return "NOT_ASSIGNED" as const;
  return status ?? (!assignment.workingDays.includes(isoWeekday(date)) ? "SCHEDULED_OFF" : date > istToday() ? "UPCOMING" : "NOT_RECORDED");
}

export async function attendanceOverview(access: AttendanceAccess, query: DailyQuery) {
  return prisma.$transaction(async tx => {
    const requirement = query.requirementId ? await tx.workforceRequirement.findFirst({ where: { id: query.requirementId,
      ...(access.admin ? {} : ownedRequirements(access.userId)) }, select: requirementSelect }) : null;
    if (query.requirementId && !requirement) throw new HttpError(404, "This requirement is not available in your workspace.", { code: "REQUIREMENT_NOT_FOUND" });
    const prefix = rosterSql(access, query, query.date, query.date);
    const totals = summary(await tx.$queryRaw<Aggregate[]>(aggregateSql(prefix)));
    const total = query.status === "ALL" ? totals.total : totals.counts[query.status];
    const totalPages = Math.ceil(total / 15); const page = Math.min(query.page, Math.max(totalPages, 1));
    const ids = await tx.$queryRaw<{ id: string; status: DisplayStatus }[]>(Prisma.sql`${prefix} SELECT id, status FROM roster
      WHERE ${query.status === "ALL" ? Prisma.sql`TRUE` : Prisma.sql`status = ${query.status}`}
      ORDER BY name, id LIMIT 15 OFFSET ${(page - 1) * 15}`);
    const date = dateValue(query.date);
    const assignments = await tx.workforceAssignment.findMany({ where: { id: { in: ids.map(row => row.id) } }, select: { ...assignmentSelect,
      attendance: { where: { date }, select: recordSelect }, corrections: { where: { date, status: "OPEN" }, select: correctionSelect } } });
    const items = ids.map(({ id, status }) => {
      const { attendance, corrections, ...assignment } = assignments.find(row => row.id === id)!;
      return { assignment: assignmentDto(assignment), status, record: attendance[0] ? recordDto(attendance[0]) : null,
        correction: corrections[0] ? recordDto(corrections[0]) : null };
    });
    const trendRows = await tx.$queryRaw<Aggregate[]>(aggregateSql(rosterSql(access, query, addDays(query.date, -6), query.date)));
    const trend = Array.from({ length: 7 }, (_, i) => { const date = addDays(query.date, i - 6); return { date, ...summary(trendRows.filter(row => row.date === date)) }; });
    return { date: query.date, today: istToday(), totals, items, total, page, totalPages, trend, requirement };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

export async function assignmentMonth(access: AttendanceAccess, id: string, month: string) {
  return prisma.$transaction(async tx => {
    const assignment = await findAssignment(tx, access, id); const dates = monthDays(month);
    const records = await tx.attendanceRecord.findMany({ where: { assignmentId: id, date: { gte: dateValue(dates[0]), lte: dateValue(dates.at(-1)!) } }, select: recordSelect });
    const corrections = await tx.attendanceCorrection.findMany({ where: { assignmentId: id, status: "OPEN", date: { gte: dateValue(dates[0]), lte: dateValue(dates.at(-1)!) } }, select: { id: true, date: true } });
    const days = dates.map(date => { const record = records.find(row => dateKey(row.date) === date); return { date,
      status: dayStatus(assignment, date, record?.status), record: record ? recordDto(record) : null, correctionId: corrections.find(row => dateKey(row.date) === date)?.id ?? null }; });
    return { assignment: assignmentDto(assignment), month, today: istToday(), days,
      settingsLocked: Boolean(await tx.attendanceRecord.count({ where: { assignmentId: id } }) || await tx.attendanceCorrection.count({ where: { assignmentId: id } })),
      recordedDays: records.length, presentDays: records.filter(row => row.status === "PRESENT").length,
      workedMinutes: records.reduce((sum, row) => sum + (row.workedMinutes ?? 0), 0), lateDays: records.filter(row => row.lateMinutes > 0).length };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
export async function attendanceDay(access: AttendanceAccess, id: string, date: string, historyPage = 1) {
  return prisma.$transaction(async tx => {
    const assignment = await findAssignment(tx, access, id);
    const record = await tx.attendanceRecord.findUnique({ where: { assignmentId_date: { assignmentId: id, date: dateValue(date) } }, select: recordSelect });
    const total = record ? await tx.attendanceEvent.count({ where: { recordId: record.id } }) : 0;
    const totalPages = Math.ceil(total / 20); const page = Math.min(historyPage, Math.max(totalPages, 1));
    const events = record ? await tx.attendanceEvent.findMany({ where: { recordId: record.id }, select: {
      id: true, status: true, checkInAt: true, checkOutAt: true, breakMinutes: true, workedMinutes: true, lateMinutes: true, note: true, source: true, createdAt: true,
    }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, skip: (page - 1) * 20 }) : [];
    const correction = await tx.attendanceCorrection.findFirst({ where: { assignmentId: id, date: dateValue(date), status: "OPEN" }, select: correctionSelect });
    return { assignment: assignmentDto(assignment), date, today: istToday(), status: dayStatus(assignment, date, record?.status),
      record: record ? recordDto(record) : null, correction: correction ? recordDto(correction) : null,
      history: { items: events, total, totalPages, page } };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

export async function listAssignments(query: LookupQuery) {
  const search = { contains: query.query, mode: "insensitive" as const };
  const where: Prisma.WorkforceAssignmentWhereInput = query.query ? { OR: [{ name: search }, { location: search }, { requirement: { is: { companyName: search } } }] } : {};
  return prisma.$transaction(async tx => {
    const total = await tx.workforceAssignment.count({ where }); const totalPages = Math.ceil(total / 12); const page = Math.min(query.page, Math.max(totalPages, 1));
    const items = await tx.workforceAssignment.findMany({ where, select: assignmentSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 12, skip: (page - 1) * 12 });
    return { items: items.map(assignmentDto), total, page, totalPages, today: istToday() };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
export async function selectedCandidateOptions(query: LookupQuery) {
  const search = { contains: query.query, mode: "insensitive" as const };
  const where: Prisma.BusinessCandidateWhereInput = { status: "SELECTED", revokedAt: null, assignment: { is: null },
    requirement: { is: { status: { not: "CLOSED" }, OR: [
      { businessProfile: { is: { user: { is: { role: "BUSINESS", isActive: true } } } } },
      { businessProfileId: null, submittedBy: { is: { role: "BUSINESS", isActive: true } } },
    ] } }, ...(query.query ? { OR: [{ name: search }, { jobTitle: search }, { requirement: { is: { companyName: search } } }] } : {}) };
  return prisma.$transaction(async tx => {
    const total = await tx.businessCandidate.count({ where }); const totalPages = Math.ceil(total / 10); const page = Math.min(query.page, Math.max(1, totalPages));
    const items = await tx.businessCandidate.findMany({ where, select: { id: true, name: true, jobTitle: true, requirement: { select: requirementSelect } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: 10, skip: (page - 1) * 10 });
    return { items, total, page, totalPages };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
export async function listCorrections(access: AttendanceAccess, query: CorrectionListQuery) {
  const search = { contains: query.query, mode: "insensitive" as const };
  const where: Prisma.AttendanceCorrectionWhereInput = { assignment: { is: { ...assignmentWhere(access),
    ...(query.requirementId ? { requirementId: query.requirementId } : {}),
    ...(query.query ? { OR: [{ name: search }, { location: search }, { requirement: { is: { companyName: search } } }] } : {}) } },
    ...(query.status === "ALL" ? {} : { status: query.status }) };
  return prisma.$transaction(async tx => {
    if (query.requirementId && !await tx.workforceRequirement.findFirst({ where: { id: query.requirementId, ...(access.admin ? {} : ownedRequirements(access.userId)) }, select: { id: true } })) {
      throw new HttpError(404, "This requirement is not available in your workspace.", { code: "REQUIREMENT_NOT_FOUND" });
    }
    const total = await tx.attendanceCorrection.count({ where }); const totalPages = Math.ceil(total / 12); const page = Math.min(query.page, Math.max(1, totalPages));
    const rows = await tx.attendanceCorrection.findMany({ where, select: { ...correctionSelect, assignment: { select: assignmentSelect } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 12, skip: (page - 1) * 12 });
    const items = rows.map(({ assignment, ...row }) => ({ ...recordDto(row), assignment: assignmentDto(assignment) }));
    return { items, total, page, totalPages };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
