import {
  PlacementCellApplicationStatus,
  Prisma,
  TechnicalOpportunityApplicationStatus,
  TechnicalOpportunityStatus,
  TechnicalStudentStatus,
} from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import type { TechnicalOpportunityInput, TechnicalOpportunityListQuery, TechnicalOpportunityMatchQuery } from "./technical-opportunities.schema.js";

function opportunityData(input: TechnicalOpportunityInput) {
  return {
    ...input,
    applicationDeadline: input.applicationDeadline ? new Date(input.applicationDeadline) : null,
    joiningDate: input.joiningDate ? new Date(input.joiningDate) : null,
  };
}

function opportunityWhere(query: TechnicalOpportunityListQuery): Prisma.TechnicalOpportunityWhereInput {
  const where: Prisma.TechnicalOpportunityWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.opportunityType) where.opportunityType = query.opportunityType;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { employerName: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { location: { contains: query.search, mode: "insensitive" } },
      { city: { contains: query.search, mode: "insensitive" } },
      { state: { contains: query.search, mode: "insensitive" } },
      { eligibleTradesBranches: { has: query.search } },
    ];
  }
  return where;
}

export async function listTechnicalOpportunities(query: TechnicalOpportunityListQuery) {
  const where = opportunityWhere(query);
  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.technicalOpportunity.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip,
      take: query.pageSize,
      include: { _count: { select: { applications: true } } },
    }),
    prisma.technicalOpportunity.count({ where }),
  ]);
  return { items, total };
}

export async function technicalOpportunitySummary() {
  const [total, draft, open, closed, archived, applications, shortlisted, selected, joined] = await Promise.all([
    prisma.technicalOpportunity.count(),
    prisma.technicalOpportunity.count({ where: { status: TechnicalOpportunityStatus.DRAFT } }),
    prisma.technicalOpportunity.count({ where: { status: TechnicalOpportunityStatus.OPEN } }),
    prisma.technicalOpportunity.count({ where: { status: TechnicalOpportunityStatus.CLOSED } }),
    prisma.technicalOpportunity.count({ where: { status: TechnicalOpportunityStatus.ARCHIVED } }),
    prisma.technicalOpportunityApplication.count(),
    prisma.technicalOpportunityApplication.count({ where: { status: TechnicalOpportunityApplicationStatus.SHORTLISTED } }),
    prisma.technicalOpportunityApplication.count({ where: { status: TechnicalOpportunityApplicationStatus.SELECTED } }),
    prisma.technicalOpportunityApplication.count({ where: { status: TechnicalOpportunityApplicationStatus.JOINED } }),
  ]);
  return { opportunities: { total, draft, open, closed, archived }, applications: { total: applications, shortlisted, selected, joined } };
}

export function createTechnicalOpportunity(input: TechnicalOpportunityInput, context: { actorUserId: string; ipAddress?: string; userAgent?: string }) {
  return prisma.$transaction(async (tx) => {
    const opportunity = await tx.technicalOpportunity.create({
      data: { ...opportunityData(input), createdByUserId: context.actorUserId },
    });
    await tx.auditLog.create({ data: {
      actorUserId: context.actorUserId,
      action: "TECHNICAL_OPPORTUNITY_CREATED",
      entityType: "TechnicalOpportunity",
      entityId: opportunity.id,
      metadata: { title: opportunity.title, type: opportunity.opportunityType, status: opportunity.status },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    } });
    return opportunity;
  });
}

export function findTechnicalOpportunity(id: string) {
  return prisma.technicalOpportunity.findUnique({
    where: { id },
    include: {
      _count: { select: { applications: true } },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            include: { institute: { select: { id: true, institutionName: true, partnershipCode: true, city: true, state: true } } },
          },
        },
      },
    },
  });
}

export function updateTechnicalOpportunity(
  id: string,
  input: TechnicalOpportunityInput,
  context: { actorUserId: string; ipAddress?: string; userAgent?: string },
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.technicalOpportunity.findUnique({ where: { id } });
    if (!current) return null;
    const opportunity = await tx.technicalOpportunity.update({ where: { id }, data: opportunityData(input) });
    await tx.auditLog.create({ data: {
      actorUserId: context.actorUserId,
      action: "TECHNICAL_OPPORTUNITY_UPDATED",
      entityType: "TechnicalOpportunity",
      entityId: opportunity.id,
      metadata: {
        title: opportunity.title,
        type: opportunity.opportunityType,
        fromStatus: current.status,
        toStatus: opportunity.status,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    } });
    return opportunity;
  });
}

export async function listVerifiedTechnicalStudentsForMatching(query: TechnicalOpportunityMatchQuery, opportunityId: string) {
  const where: Prisma.TechnicalStudentWhereInput = {
    status: TechnicalStudentStatus.VERIFIED,
    institute: { status: PlacementCellApplicationStatus.APPROVED },
  };
  if (query.instituteId) where.technicalInstituteApplicationId = query.instituteId;
  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { tradeBranch: { contains: query.search, mode: "insensitive" } },
      { currentCity: { contains: query.search, mode: "insensitive" } },
      { currentState: { contains: query.search, mode: "insensitive" } },
      { institute: { institutionName: { contains: query.search, mode: "insensitive" } } },
    ];
  }
  return prisma.technicalStudent.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 1000,
    include: {
      institute: { select: { id: true, institutionName: true, partnershipCode: true, city: true, state: true } },
      applications: { where: { opportunityId }, select: { id: true, status: true, createdAt: true } },
    },
  });
}

export function findVerifiedTechnicalStudent(studentId: string) {
  return prisma.technicalStudent.findFirst({
    where: { id: studentId, status: TechnicalStudentStatus.VERIFIED, institute: { status: PlacementCellApplicationStatus.APPROVED } },
    include: { institute: { select: { id: true, institutionName: true, partnershipCode: true, city: true, state: true } } },
  });
}

export async function createTechnicalOpportunityApplication(input: {
  opportunityId: string;
  studentId: string;
  matchScore: number;
  matchReasons: string[];
  note?: string;
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const application = await tx.technicalOpportunityApplication.create({
      data: {
        opportunityId: input.opportunityId,
        studentId: input.studentId,
        matchScore: input.matchScore,
        matchReasons: input.matchReasons,
        note: input.note,
        createdByUserId: input.actorUserId,
      },
      include: {
        opportunity: true,
        student: { include: { institute: { select: { institutionName: true, partnershipCode: true } } } },
      },
    });
    await tx.auditLog.create({ data: {
      actorUserId: input.actorUserId,
      action: "TECHNICAL_OPPORTUNITY_CANDIDATE_SUBMITTED",
      entityType: "TechnicalOpportunityApplication",
      entityId: application.id,
      metadata: { opportunityId: input.opportunityId, studentId: input.studentId, matchScore: input.matchScore },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    } });
    return application;
  });
}

export async function updateTechnicalOpportunityApplicationStatus(input: {
  opportunityId: string;
  applicationId: string;
  status: TechnicalOpportunityApplicationStatus;
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.technicalOpportunityApplication.findFirst({
      where: { id: input.applicationId, opportunityId: input.opportunityId },
      include: { opportunity: true, student: { include: { institute: { select: { institutionName: true, partnershipCode: true } } } } },
    });
    if (!current) return null;
    if (current.status === input.status) return current;
    const now = new Date();
    const application = await tx.technicalOpportunityApplication.update({
      where: { id: current.id },
      data: {
        status: input.status,
        reviewedAt: input.status === TechnicalOpportunityApplicationStatus.REVIEWED ? now : current.reviewedAt,
        selectedAt: input.status === TechnicalOpportunityApplicationStatus.SELECTED ? now : current.selectedAt,
        joinedAt: input.status === TechnicalOpportunityApplicationStatus.JOINED ? now : current.joinedAt,
      },
      include: { opportunity: true, student: { include: { institute: { select: { institutionName: true, partnershipCode: true } } } } },
    });
    await tx.auditLog.create({ data: {
      actorUserId: input.actorUserId,
      action: "TECHNICAL_OPPORTUNITY_APPLICATION_STATUS_CHANGED",
      entityType: "TechnicalOpportunityApplication",
      entityId: application.id,
      metadata: { opportunityId: input.opportunityId, from: current.status, to: input.status },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    } });
    return application;
  });
}
