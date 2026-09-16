import {
  PlacementCellApplicationStatus,
  Prisma,
  TechnicalOpportunityApplicationStatus,
  TechnicalOpportunityStatus,
  TechnicalStudentStatus,
} from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import type {
  TechnicalInstitutePortalApplicationQuery,
  TechnicalInstitutePortalOpportunityQuery,
} from "./technical-institute-portal.schema.js";

export async function technicalInstitutePortalDashboard(instituteId: string) {
  const applicationWhere: Prisma.TechnicalOpportunityApplicationWhereInput = {
    student: { technicalInstituteApplicationId: instituteId },
  };
  const [
    totalStudents,
    verifiedStudents,
    pendingStudents,
    inactiveStudents,
    totalApplications,
    shortlisted,
    selected,
    joined,
    openOpportunities,
    recentApplications,
    topTrades,
  ] = await Promise.all([
    prisma.technicalStudent.count({ where: { technicalInstituteApplicationId: instituteId } }),
    prisma.technicalStudent.count({ where: { technicalInstituteApplicationId: instituteId, status: TechnicalStudentStatus.VERIFIED } }),
    prisma.technicalStudent.count({ where: { technicalInstituteApplicationId: instituteId, status: TechnicalStudentStatus.PENDING } }),
    prisma.technicalStudent.count({ where: { technicalInstituteApplicationId: instituteId, status: TechnicalStudentStatus.INACTIVE } }),
    prisma.technicalOpportunityApplication.count({ where: applicationWhere }),
    prisma.technicalOpportunityApplication.count({ where: { ...applicationWhere, status: TechnicalOpportunityApplicationStatus.SHORTLISTED } }),
    prisma.technicalOpportunityApplication.count({ where: { ...applicationWhere, status: TechnicalOpportunityApplicationStatus.SELECTED } }),
    prisma.technicalOpportunityApplication.count({ where: { ...applicationWhere, status: TechnicalOpportunityApplicationStatus.JOINED } }),
    prisma.technicalOpportunity.count({
      where: {
        status: TechnicalOpportunityStatus.OPEN,
        OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: new Date() } }],
      },
    }),
    prisma.technicalOpportunityApplication.findMany({
      where: applicationWhere,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 6,
      select: {
        id: true,
        status: true,
        matchScore: true,
        updatedAt: true,
        student: { select: { id: true, fullName: true, tradeBranch: true, passingYear: true } },
        opportunity: { select: { id: true, title: true, employerName: true, opportunityType: true, location: true } },
      },
    }),
    prisma.technicalStudent.groupBy({
      by: ["tradeBranch"],
      where: { technicalInstituteApplicationId: instituteId, status: { not: TechnicalStudentStatus.INACTIVE } },
      _count: { _all: true },
    }),
  ]);
  return {
    students: { total: totalStudents, verified: verifiedStudents, pending: pendingStudents, inactive: inactiveStudents },
    applications: { total: totalApplications, shortlisted, selected, joined },
    opportunities: { open: openOpportunities },
    recentApplications,
    topTrades: topTrades.map((item) => ({ tradeBranch: item.tradeBranch, count: item._count._all })).sort((a, b) => b.count - a.count).slice(0, 6),
  };
}

function opportunityWhere(query: TechnicalInstitutePortalOpportunityQuery): Prisma.TechnicalOpportunityWhereInput {
  const where: Prisma.TechnicalOpportunityWhereInput = {
    status: TechnicalOpportunityStatus.OPEN,
    AND: [{ OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: new Date() } }] }],
  };
  if (query.opportunityType) where.opportunityType = query.opportunityType;
  if (query.search) {
    const search = query.search;
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { employerName: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { state: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }
  return where;
}

export async function technicalInstitutePortalOpportunityData(
  instituteId: string,
  query: TechnicalInstitutePortalOpportunityQuery,
) {
  const where = opportunityWhere(query);
  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.technicalOpportunity.findMany({
      where,
      orderBy: [{ applicationDeadline: "asc" }, { createdAt: "desc" }],
      skip,
      take: query.pageSize,
      select: {
        id: true,
        title: true,
        employerName: true,
        opportunityType: true,
        description: true,
        location: true,
        city: true,
        state: true,
        workMode: true,
        eligibleQualifications: true,
        eligibleTradesBranches: true,
        eligiblePassingYears: true,
        requiredSkills: true,
        preferredSkills: true,
        eligibleStates: true,
        vacancies: true,
        compensation: true,
        duration: true,
        applicationDeadline: true,
        joiningDate: true,
        createdAt: true,
      },
    }),
    prisma.technicalOpportunity.count({ where }),
  ]);
  const opportunityIds = items.map((item) => item.id);
  const applicationCounts = opportunityIds.length
    ? await prisma.technicalOpportunityApplication.groupBy({
        by: ["opportunityId"],
        where: { opportunityId: { in: opportunityIds }, student: { technicalInstituteApplicationId: instituteId } },
        _count: { _all: true },
      })
    : [];
  return { items, total, applicationCounts };
}

export async function listTechnicalInstitutePortalApplications(
  instituteId: string,
  query: TechnicalInstitutePortalApplicationQuery,
) {
  const where: Prisma.TechnicalOpportunityApplicationWhereInput = {
    student: { technicalInstituteApplicationId: instituteId },
  };
  if (query.status) where.status = query.status;
  if (query.opportunityType) where.opportunity = { opportunityType: query.opportunityType };
  if (query.search) {
    where.OR = [
      { student: { fullName: { contains: query.search, mode: "insensitive" } } },
      { student: { tradeBranch: { contains: query.search, mode: "insensitive" } } },
      { opportunity: { title: { contains: query.search, mode: "insensitive" } } },
      { opportunity: { employerName: { contains: query.search, mode: "insensitive" } } },
      { opportunity: { location: { contains: query.search, mode: "insensitive" } } },
    ];
  }
  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.technicalOpportunityApplication.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip,
      take: query.pageSize,
      select: {
        id: true,
        status: true,
        matchScore: true,
        matchReasons: true,
        note: true,
        reviewedAt: true,
        selectedAt: true,
        joinedAt: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobileNumber: true,
            qualification: true,
            tradeBranch: true,
            passingYear: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            employerName: true,
            opportunityType: true,
            status: true,
            location: true,
            compensation: true,
            applicationDeadline: true,
          },
        },
      },
    }),
    prisma.technicalOpportunityApplication.count({ where }),
  ]);
  return { items, total };
}

export function findPortalTechnicalStudent(instituteId: string, studentId: string) {
  return prisma.technicalStudent.findFirst({
    where: { id: studentId, technicalInstituteApplicationId: instituteId },
  });
}

export async function technicalInstitutePortalReportSummary(instituteId: string) {
  const applicationWhere: Prisma.TechnicalOpportunityApplicationWhereInput = {
    student: { technicalInstituteApplicationId: instituteId },
  };
  const [statusGroups, typeRows, employerRows] = await Promise.all([
    prisma.technicalOpportunityApplication.groupBy({
      by: ["status"],
      where: applicationWhere,
      _count: { _all: true },
    }),
    prisma.$queryRaw<Array<{ opportunityType: string; count: bigint }>>(Prisma.sql`
      SELECT o."opportunityType"::text AS "opportunityType", COUNT(*)::bigint AS "count"
      FROM "TechnicalOpportunityApplication" a
      INNER JOIN "TechnicalStudent" s ON s."id" = a."studentId"
      INNER JOIN "TechnicalOpportunity" o ON o."id" = a."opportunityId"
      WHERE s."technicalInstituteApplicationId" = ${instituteId}
      GROUP BY o."opportunityType"
    `),
    prisma.$queryRaw<Array<{ employer: string; count: bigint }>>(Prisma.sql`
      SELECT o."employerName" AS "employer", COUNT(*)::bigint AS "count"
      FROM "TechnicalOpportunityApplication" a
      INNER JOIN "TechnicalStudent" s ON s."id" = a."studentId"
      INNER JOIN "TechnicalOpportunity" o ON o."id" = a."opportunityId"
      WHERE s."technicalInstituteApplicationId" = ${instituteId}
      GROUP BY o."employerName"
      ORDER BY COUNT(*) DESC, o."employerName" ASC
      LIMIT 6
    `),
  ]);
  return {
    statusCounts: Object.fromEntries(statusGroups.map((row) => [row.status, row._count._all])),
    typeCounts: Object.fromEntries(typeRows.map((row) => [row.opportunityType, Number(row.count)])),
    topEmployers: employerRows.map((row) => ({ employer: row.employer, count: Number(row.count) })),
  };
}

export function technicalInstitutePortalReportRows(instituteId: string, take: number) {
  return prisma.technicalOpportunityApplication.findMany({
    where: { student: { technicalInstituteApplicationId: instituteId } },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take,
    select: {
      id: true,
      status: true,
      matchScore: true,
      createdAt: true,
      updatedAt: true,
      selectedAt: true,
      joinedAt: true,
      student: { select: { fullName: true, email: true, mobileNumber: true, qualification: true, tradeBranch: true, passingYear: true } },
      opportunity: { select: { title: true, employerName: true, opportunityType: true, location: true, compensation: true } },
    },
  });
}
