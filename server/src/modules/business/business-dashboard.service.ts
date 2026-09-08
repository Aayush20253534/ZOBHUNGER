import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import { HttpError } from "../../utils/http-error.js";
import type { DashboardQuery } from "./business-dashboard.schema.js";
import { dashboardPeriod, requirementStatuses, statusChange } from "./business-dashboard.utils.js";

const PAGE_SIZE = 6;
const summarySelect = {
  id: true, serviceRequired: true, workforceCount: true, locations: true,
  jobLocation: true, projectDuration: true, status: true, createdAt: true, updatedAt: true,
} satisfies Prisma.WorkforceRequirementSelect;

function ownedRequirements(userId: string): Prisma.WorkforceRequirementWhereInput {
  // An explicit company association takes precedence over the submitting user.
  // Never claim guest submissions by a matching business email.
  return { OR: [
    { businessProfile: { is: { userId } } },
    { businessProfileId: null, submittedByUserId: userId },
  ] };
}

function ownedSql(userId: string) {
  return Prisma.sql`(b."userId" = ${userId} OR (r."businessProfileId" IS NULL AND r."submittedByUserId" = ${userId}))`;
}

export async function getBusinessDashboard(userId: string, query: DashboardQuery, now = new Date()) {
  const period = dashboardPeriod(query.range, now);
  const owned = { ...ownedRequirements(userId), createdAt: { lte: now } };
  return prisma.$transaction(async tx => {
    const [groups, daily, locations] = await Promise.all([
      tx.workforceRequirement.groupBy({
        by: ["status"], where: owned, _count: { _all: true }, _sum: { workforceCount: true },
      }),
      tx.$queryRaw<{ date: string; requirements: number }[]>(Prisma.sql`
        SELECT to_char(r."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS requirements
        FROM "WorkforceRequirement" r LEFT JOIN "BusinessProfile" b ON b.id = r."businessProfileId"
        WHERE ${ownedSql(userId)} AND r."createdAt" >= ${period.start} AND r."createdAt" <= ${now}
        GROUP BY 1 ORDER BY 1`),
      tx.$queryRaw<{ name: string; requirements: number; totalLocations: number }[]>(Prisma.sql`
        WITH normalized AS (
          SELECT r.id, lower(regexp_replace(trim(place.name), '[[:space:]]+', ' ', 'g')) AS name
          FROM "WorkforceRequirement" r LEFT JOIN "BusinessProfile" b ON b.id = r."businessProfileId"
          CROSS JOIN LATERAL unnest(array_append(r.locations, r."jobLocation")) AS place(name)
          WHERE ${ownedSql(userId)} AND r.status != 'CLOSED' AND r."createdAt" <= ${now}
        ), counts AS (
          SELECT name, COUNT(DISTINCT id)::int AS requirements FROM normalized
          WHERE name != '' GROUP BY name
        )
        SELECT name, requirements, COUNT(*) OVER()::int AS "totalLocations"
        FROM counts ORDER BY requirements DESC, name ASC LIMIT 5`),
    ]);
    const statuses = requirementStatuses.map(status => {
      const group = groups.find(row => row.status === status);
      return { status, count: group?._count._all ?? 0, peopleRequested: group?._sum.workforceCount ?? 0 };
    });
    const activity = period.dates.map(date => ({ date, requirements: daily.find(row => row.date === date)?.requirements ?? 0 }));
    const where = { ...owned, ...(query.status === "ALL" ? {} : { status: query.status }) };
    const total = await tx.workforceRequirement.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(query.page, totalPages);
    const items = await tx.workforceRequirement.findMany({
      where, select: summarySelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE,
    });
    const open = statuses.filter(row => row.status !== "CLOSED");
    return {
      generatedAt: now.toISOString(),
      period: { days: query.range, timeZone: "Asia/Kolkata", startsAt: period.start.toISOString(), endsAt: now.toISOString() },
      summary: {
        totalRequirements: statuses.reduce((sum, row) => sum + row.count, 0),
        openRequirements: open.reduce((sum, row) => sum + row.count, 0),
        peopleRequested: open.reduce((sum, row) => sum + row.peopleRequested, 0),
        newRequirements: activity.reduce((sum, row) => sum + row.requirements, 0),
        requestedLocations: locations[0]?.totalLocations ?? 0,
      },
      statuses, activity,
      locations: locations.map(({ name, requirements }) => ({ name, requirements })),
      requirements: { items, page, pageSize: PAGE_SIZE, total, totalPages, status: query.status },
    };
  }, { isolationLevel: "RepeatableRead", timeout: 15000 });
}

export async function getBusinessRequirement(userId: string, id: string) {
  return prisma.$transaction(async tx => {
    const requirement = await tx.workforceRequirement.findFirst({
      where: { ...ownedRequirements(userId), id },
      select: { ...summarySelect, companyName: true, contactPerson: true, businessEmail: true,
        mobileNumber: true, industry: true, expectedStartAt: true, details: true },
    });
    if (!requirement) throw new HttpError(404, "This requirement is not available in your business account.", { code: "REQUIREMENT_NOT_FOUND" });
    const logs = await tx.auditLog.findMany({
      where: { entityType: "WorkforceRequirement", entityId: requirement.id, action: "WORKFORCE_REQUIREMENT_STATUS_CHANGED" },
      select: { id: true, createdAt: true, metadata: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 21,
    });
    // Only the status pair is exposed. Internal actors, IPs and extra metadata stay private.
    const history = logs.slice(0, 20).flatMap(log => {
      const change = statusChange(log.metadata);
      return change ? [{ id: log.id, createdAt: log.createdAt, ...change }] : [];
    }).reverse();
    return { requirement, history, hasEarlierHistory: logs.length > 20 };
  }, { isolationLevel: "RepeatableRead" });
}
