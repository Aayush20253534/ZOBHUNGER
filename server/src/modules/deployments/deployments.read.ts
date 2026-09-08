import { prisma } from "../../config/db.js";
import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { ownedRequirements, ownedRequirementSql } from "../business/business-requirement-access.js";
import { assignmentDto, assignmentSelect, findAssignment, requirementSelect, type AttendanceAccess } from "../attendance/attendance.read.js";
import { addDays, isoWeekday, istToday } from "../attendance/attendance.utils.js";
import { assignmentSchedule, deploymentProgress, deploymentState, deploymentStates, weekDates, type DeploymentState } from "./deployments.utils.js";
import type { ProgressQuery, RosterQuery } from "./deployments.schema.js";

const missingRequirement = () => new HttpError(404, "This requirement is not available in your workspace.", { code: "REQUIREMENT_NOT_FOUND" });
async function scopedRequirement(tx: Prisma.TransactionClient, access: AttendanceAccess, id?: string) {
  if (!id) return null;
  const requirement = await tx.workforceRequirement.findFirst({ where: { id, ...(access.admin ? {} : ownedRequirements(access.userId)) }, select: requirementSelect });
  if (!requirement) throw missingRequirement();
  return requirement;
}
function rosterSql(access: AttendanceAccess, query: RosterQuery, dates: string[]) {
  const search = `%${query.query.replace(/[\\%_]/g, "\\$&")}%`;
  const location = `%${query.location.replace(/[\\%_]/g, "\\$&")}%`;
  return Prisma.sql`WITH roster AS (
    SELECT a."id", a."name", a."location", a."endDate", a."workingDays",
      CASE WHEN a."cancelledAt" IS NOT NULL THEN 'CANCELLED'
           WHEN a."startDate" > ${query.date}::date THEN 'UPCOMING'
           WHEN a."endDate" < ${query.date}::date THEN 'ENDED' ELSE 'ACTIVE' END AS state
    FROM "WorkforceAssignment" a JOIN "WorkforceRequirement" r ON r."id" = a."requirementId"
    LEFT JOIN "BusinessProfile" b ON b."id" = r."businessProfileId"
    WHERE ${access.admin ? Prisma.sql`TRUE` : ownedRequirementSql(access.userId)}
      AND ${query.requirementId ? Prisma.sql`r."id" = ${query.requirementId}` : Prisma.sql`TRUE`}
      AND ${query.query ? Prisma.sql`(a."name" ILIKE ${search} OR a."role" ILIKE ${search} OR a."supervisor" ILIKE ${search} OR r."companyName" ILIKE ${search})` : Prisma.sql`TRUE`}
      AND ${query.location ? Prisma.sql`a."location" ILIKE ${location}` : Prisma.sql`TRUE`}
      AND ${query.view === "schedule" ? Prisma.sql`a."cancelledAt" IS NULL AND a."startDate" <= ${dates[6]}::date AND a."endDate" >= ${dates[0]}::date` : Prisma.sql`TRUE`}
  )`;
}
export async function deploymentRoster(access: AttendanceAccess, query: RosterQuery) {
  const dates = weekDates(query.date);
  return prisma.$transaction(async tx => {
    const requirement = await scopedRequirement(tx, access, query.requirementId);
    const from = rosterSql(access, query, dates);
    const groups = await tx.$queryRaw<{ state: DeploymentState; count: number; sites: number; ending: number; working: number }[]>(Prisma.sql`${from}
      SELECT state, COUNT(*)::int AS count, COUNT(DISTINCT LOWER(BTRIM(location)))::int AS sites,
        COUNT(*) FILTER (WHERE "endDate" >= ${query.date}::date AND "endDate" <= ${addDays(query.date, 6)}::date AND state <> 'CANCELLED')::int AS ending,
        COUNT(*) FILTER (WHERE state = 'ACTIVE' AND ${isoWeekday(query.date)} = ANY("workingDays"))::int AS working
      FROM roster GROUP BY state`);
    const counts = Object.fromEntries(deploymentStates.map(state => [state, groups.find(row => row.state === state)?.count ?? 0])) as Record<DeploymentState, number>;
    const total = query.status === "ALL" ? Object.values(counts).reduce((sum, value) => sum + value, 0) : counts[query.status];
    const totalPages = Math.max(1, Math.ceil(total / 12)), page = Math.min(query.page, totalPages);
    const order = query.view === "locations" ? Prisma.sql`LOWER(BTRIM(location)), name, id` : Prisma.sql`name, id`;
    const ids = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`${from} SELECT id FROM roster
      WHERE ${query.status === "ALL" ? Prisma.sql`TRUE` : Prisma.sql`state = ${query.status}`}
      ORDER BY ${order} LIMIT 12 OFFSET ${(page - 1) * 12}`);
    const assignments = await tx.workforceAssignment.findMany({ where: { id: { in: ids.map(row => row.id) } }, select: assignmentSelect });
    const items = ids.map(({ id }) => {
      const row = assignments.find(item => item.id === id)!;
      return { ...assignmentDto(row), state: deploymentState(row, query.date), schedule: assignmentSchedule(row, dates) };
    });
    return { items, counts, total, totalPages, page, pageSize: 12, dates, date: query.date, today: istToday(), requirement,
      activeSites: groups.find(row => row.state === "ACTIVE")?.sites ?? 0, workingOnDate: groups.reduce((sum, row) => sum + row.working, 0), endingSoon: groups.reduce((sum, row) => sum + row.ending, 0) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 15000 });
}

const businessOwned: Prisma.WorkforceRequirementWhereInput = { OR: [
  { businessProfile: { is: { user: { is: { role: "BUSINESS" } } } } },
  { businessProfileId: null, submittedBy: { is: { role: "BUSINESS" } } },
] };
export async function requirementDeploymentProgress(access: AttendanceAccess, query: ProgressQuery) {
  const search = { contains: query.query.replace(/[\\%_]/g, "\\$&"), mode: "insensitive" as const };
  const where: Prisma.WorkforceRequirementWhereInput = { AND: [access.admin ? businessOwned : ownedRequirements(access.userId),
    ...(query.requirementId ? [{ id: query.requirementId }] : []),
    ...(query.scope === "OPEN" ? [{ status: { not: "CLOSED" as const } }] : query.scope === "CLOSED" ? [{ status: "CLOSED" as const }] : []),
    ...(query.query ? [{ OR: [{ companyName: search }, { serviceRequired: search }, { jobLocation: search }, { id: search }] }] : []),
  ] };
  return prisma.$transaction(async tx => {
    await scopedRequirement(tx, access, query.requirementId);
    const total = await tx.workforceRequirement.count({ where }), totalPages = Math.max(1, Math.ceil(total / 9)), page = Math.min(query.page, totalPages);
    const requirements = await tx.workforceRequirement.findMany({ where, select: { ...requirementSelect, workforceCount: true, locations: true,
      expectedStartAt: true, projectDuration: true, createdAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 9, skip: (page - 1) * 9 });
    const ids = requirements.map(row => row.id);
    const assignments = ids.length ? await tx.$queryRaw<{ requirementId: string; active: number; upcoming: number; ended: number; cancelled: number; activeSites: number }[]>(Prisma.sql`
      SELECT "requirementId",
        COUNT(*) FILTER (WHERE "cancelledAt" IS NULL AND "startDate" <= ${query.date}::date AND "endDate" >= ${query.date}::date)::int AS active,
        COUNT(*) FILTER (WHERE "cancelledAt" IS NULL AND "startDate" > ${query.date}::date)::int AS upcoming,
        COUNT(*) FILTER (WHERE "cancelledAt" IS NULL AND "endDate" < ${query.date}::date)::int AS ended,
        COUNT(*) FILTER (WHERE "cancelledAt" IS NOT NULL)::int AS cancelled,
        COUNT(DISTINCT LOWER(BTRIM(location))) FILTER (WHERE "cancelledAt" IS NULL AND "startDate" <= ${query.date}::date AND "endDate" >= ${query.date}::date)::int AS "activeSites"
      FROM "WorkforceAssignment" WHERE "requirementId" IN (${Prisma.join(ids)}) GROUP BY "requirementId"`) : [];
    const selected = await tx.businessCandidate.groupBy({ by: ["requirementId"], where: { requirementId: { in: ids }, status: "SELECTED", revokedAt: null }, _count: { _all: true } });
    const waiting = await tx.businessCandidate.groupBy({ by: ["requirementId"], where: { requirementId: { in: ids }, status: "SELECTED", revokedAt: null, assignment: { is: null } }, _count: { _all: true } });
    const items = requirements.map(requirement => {
      const group = assignments.find(row => row.requirementId === requirement.id);
      const active = group?.active ?? 0;
      return { requirement, active, upcoming: group?.upcoming ?? 0, ended: group?.ended ?? 0, cancelled: group?.cancelled ?? 0, activeSites: group?.activeSites ?? 0,
        selected: selected.find(row => row.requirementId === requirement.id)?._count._all ?? 0,
        awaitingAssignment: waiting.find(row => row.requirementId === requirement.id)?._count._all ?? 0,
        ...deploymentProgress(requirement.workforceCount, active) };
    });
    return { items, total, totalPages, page, date: query.date, pageSize: 9 };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 15000 });
}
const eventLabels: Record<string, string> = { ASSIGNMENT_CREATED: "Assignment confirmed", ASSIGNMENT_UPDATED: "Assignment settings updated", ASSIGNMENT_ENDED: "Last working date updated", ASSIGNMENT_CANCELLED: "Assignment cancelled" };
export async function deploymentDetail(access: AttendanceAccess, id: string, date: string, historyPage: number) {
  return prisma.$transaction(async tx => {
    const row = await findAssignment(tx, access, id), dates = weekDates(date);
    const candidate = await tx.businessCandidate.findUniqueOrThrow({ where: { id: row.candidateId }, select: { revokedAt: true, skills: true } });
    const where = { entityType: "WorkforceAssignment", entityId: id, action: { in: Object.keys(eventLabels) } };
    const total = await tx.auditLog.count({ where }), totalPages = Math.max(1, Math.ceil(total / 20)), page = Math.min(historyPage, totalPages);
    const events = await tx.auditLog.findMany({ where, select: { id: true, action: true, metadata: true, createdAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, skip: (page - 1) * 20 });
    return { assignment: assignmentDto(row), date, today: istToday(), dates, state: deploymentState(row, date), schedule: assignmentSchedule(row, dates),
      skills: access.admin || !candidate.revokedAt ? candidate.skills : [], candidateVisible: access.admin || !candidate.revokedAt,
      settingsLocked: Boolean(await tx.attendanceRecord.count({ where: { assignmentId: id } }) || await tx.attendanceCorrection.count({ where: { assignmentId: id } })),
      history: { total, totalPages, page, items: events.map(event => {
        const metadata = event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata) ? event.metadata : {};
        return { id: event.id, label: eventLabels[event.action], createdAt: event.createdAt,
          note: access.admin && typeof metadata.reason === "string" ? metadata.reason.slice(0, 1500) : null,
          endDate: typeof metadata.endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(metadata.endDate) ? metadata.endDate : null };
      }) } };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
