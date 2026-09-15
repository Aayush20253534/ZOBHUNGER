import { PlacementCellApplicationStatus, Prisma, UserRole } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import type {
  CreateTechnicalInstituteApplicationInput,
  TechnicalInstituteAdminListQuery,
} from "./technical-institutes.schema.js";

export function createTechnicalInstituteApplication(data: CreateTechnicalInstituteApplicationInput) {
  return prisma.technicalInstituteApplication.create({
    data,
    select: {
      id: true,
      institutionName: true,
      officialEmail: true,
      status: true,
      createdAt: true,
    },
  });
}

function adminWhere(filters: TechnicalInstituteAdminListQuery): Prisma.TechnicalInstituteApplicationWhereInput {
  const where: Prisma.TechnicalInstituteApplicationWhereInput = {};
  if (filters.status) where.status = PlacementCellApplicationStatus[filters.status];
  if (filters.institutionType) where.institutionType = filters.institutionType;
  if (filters.affiliationBody) where.affiliationBody = filters.affiliationBody;
  if (filters.state) where.state = { equals: filters.state, mode: "insensitive" };
  if (filters.query) {
    where.OR = [
      { institutionName: { contains: filters.query, mode: "insensitive" } },
      { contactPersonName: { contains: filters.query, mode: "insensitive" } },
      { officialEmail: { contains: filters.query, mode: "insensitive" } },
      { city: { contains: filters.query, mode: "insensitive" } },
      { district: { contains: filters.query, mode: "insensitive" } },
      { state: { contains: filters.query, mode: "insensitive" } },
      { affiliationNumber: { contains: filters.query, mode: "insensitive" } },
      { partnershipCode: { contains: filters.query, mode: "insensitive" } },
      { tradesBranches: { contains: filters.query, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listTechnicalInstituteApplicationsForAdmin(filters: TechnicalInstituteAdminListQuery) {
  const where = adminWhere(filters);
  const skip = (filters.page - 1) * filters.pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.technicalInstituteApplication.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: filters.pageSize,
      select: {
        id: true,
        institutionName: true,
        institutionType: true,
        ownershipType: true,
        affiliationBody: true,
        affiliationNumber: true,
        city: true,
        district: true,
        state: true,
        contactPersonName: true,
        officialEmail: true,
        totalStudents: true,
        finalYearStudents: true,
        passingYear: true,
        tradesBranches: true,
        preferredOpportunityTypes: true,
        status: true,
        partnershipCode: true,
        reviewedAt: true,
        approvedAt: true,
        rejectedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.technicalInstituteApplication.count({ where }),
  ]);
  return { items, total };
}

export function findTechnicalInstituteApplicationForAdmin(id: string) {
  return prisma.technicalInstituteApplication.findUnique({
    where: { id },
    select: {
      id: true, institutionName: true, institutionType: true, ownershipType: true, affiliationBody: true,
      affiliationNumber: true, website: true, district: true, city: true, state: true, postalCode: true,
      contactPersonName: true, designation: true, officialEmail: true, mobileNumber: true, alternateNumber: true,
      totalStudents: true, finalYearStudents: true, passingYear: true, tradesBranches: true,
      preferredOpportunityTypes: true, technicalHiringNotes: true, status: true, partnershipCode: true,
      reviewNotes: true, reviewedByUserId: true, reviewedAt: true, approvedAt: true, rejectedAt: true,
      provisionedUserId: true, activationExpiresAt: true, createdAt: true, updatedAt: true,
    },
  });
}

export async function technicalInstituteAdminSummary() {
  const [total, submitted, underReview, approved, rejected, aggregate, states, recentApproved] = await Promise.all([
    prisma.technicalInstituteApplication.count(),
    prisma.technicalInstituteApplication.count({ where: { status: PlacementCellApplicationStatus.SUBMITTED } }),
    prisma.technicalInstituteApplication.count({ where: { status: PlacementCellApplicationStatus.UNDER_REVIEW } }),
    prisma.technicalInstituteApplication.count({ where: { status: PlacementCellApplicationStatus.APPROVED } }),
    prisma.technicalInstituteApplication.count({ where: { status: PlacementCellApplicationStatus.REJECTED } }),
    prisma.technicalInstituteApplication.aggregate({ _sum: { totalStudents: true, finalYearStudents: true } }),
    prisma.technicalInstituteApplication.groupBy({ by: ["state"], _count: { _all: true } }),
    prisma.technicalInstituteApplication.findMany({
      where: { status: PlacementCellApplicationStatus.APPROVED },
      take: 5,
      orderBy: [{ approvedAt: "desc" }, { updatedAt: "desc" }],
      select: { id: true, institutionName: true, city: true, state: true, partnershipCode: true, approvedAt: true },
    }),
  ]);
  return {
    counts: { total, submitted, underReview, approved, rejected },
    students: {
      total: aggregate._sum.totalStudents ?? 0,
      finalYear: aggregate._sum.finalYearStudents ?? 0,
    },
    topStates: states
      .map((item) => ({ state: item.state, count: item._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    recentApproved,
  };
}

export async function reviewTechnicalInstituteApplicationWithAudit(input: {
  id: string;
  status: PlacementCellApplicationStatus;
  reviewNotes?: string;
  partnershipCode?: string;
  provisioning?: { passwordHash: string; activationTokenHash: string; activationExpiresAt: Date };
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "TechnicalInstituteApplication" WHERE "id" = ${input.id} FOR UPDATE`);
    const current = await tx.technicalInstituteApplication.findUnique({ where: { id: input.id } });
    if (!current) return { kind: "not-found" as const };
    if (current.status === PlacementCellApplicationStatus.APPROVED && input.status !== PlacementCellApplicationStatus.APPROVED) {
      return { kind: "already-approved" as const, entity: current };
    }

    const now = new Date();
    const nextReviewNotes = input.reviewNotes ?? current.reviewNotes ?? undefined;
    const statusChanged = current.status !== input.status;
    const notesChanged = (current.reviewNotes ?? undefined) !== nextReviewNotes;
    const needsPortalProvisioning = input.status === PlacementCellApplicationStatus.APPROVED && !current.provisionedUserId;

    let provisionedUserId = current.provisionedUserId;
    let activationTokenHash = current.activationTokenHash;
    let activationExpiresAt = current.activationExpiresAt;
    let portalAccess: "ACTIVATION" | "EXISTING_ACTIVE" | null = null;

    if (needsPortalProvisioning) {
      if (!input.provisioning) throw new Error("Technical institute portal provisioning data is required for approval");
      const existingUser = await tx.user.findUnique({ where: { email: current.officialEmail.toLowerCase() } });
      if (existingUser && existingUser.role !== UserRole.TECHNICAL_INSTITUTE) {
        return { kind: "email-conflict" as const, entity: current };
      }
      if (existingUser) {
        const linkedApplication = await tx.technicalInstituteApplication.findFirst({
          where: { provisionedUserId: existingUser.id, id: { not: current.id } },
          select: { id: true },
        });
        if (linkedApplication) return { kind: "email-conflict" as const, entity: current };
      }
      const user = existingUser ?? await tx.user.create({
        data: {
          email: current.officialEmail.toLowerCase(),
          passwordHash: input.provisioning.passwordHash,
          role: UserRole.TECHNICAL_INSTITUTE,
          isActive: false,
        },
      });
      provisionedUserId = user.id;
      if (user.isActive) {
        activationTokenHash = null;
        activationExpiresAt = null;
        portalAccess = "EXISTING_ACTIVE";
      } else {
        activationTokenHash = input.provisioning.activationTokenHash;
        activationExpiresAt = input.provisioning.activationExpiresAt;
        portalAccess = "ACTIVATION";
      }
    }

    if (!statusChanged && !notesChanged && !needsPortalProvisioning) {
      return { kind: "unchanged" as const, entity: current, portalAccess };
    }

    const updated = await tx.technicalInstituteApplication.update({
      where: { id: input.id },
      data: {
        status: input.status,
        reviewNotes: nextReviewNotes,
        reviewedByUserId: input.actorUserId,
        reviewedAt: now,
        partnershipCode: input.status === PlacementCellApplicationStatus.APPROVED
          ? (current.partnershipCode ?? input.partnershipCode)
          : current.partnershipCode,
        approvedAt: input.status === PlacementCellApplicationStatus.APPROVED ? (current.approvedAt ?? now) : current.approvedAt,
        rejectedAt: input.status === PlacementCellApplicationStatus.REJECTED ? now : input.status === PlacementCellApplicationStatus.UNDER_REVIEW ? null : current.rejectedAt,
        provisionedUserId,
        activationTokenHash,
        activationExpiresAt,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: needsPortalProvisioning
          ? "TECHNICAL_INSTITUTE_PORTAL_PROVISIONED"
          : statusChanged
            ? "TECHNICAL_INSTITUTE_APPLICATION_STATUS_CHANGED"
            : "TECHNICAL_INSTITUTE_APPLICATION_REVIEW_NOTES_UPDATED",
        entityType: "TechnicalInstituteApplication",
        entityId: input.id,
        metadata: {
          from: current.status,
          to: input.status,
          partnershipCode: updated.partnershipCode,
          provisionedUserId: updated.provisionedUserId,
          portalAccess,
        },
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    return { kind: "updated" as const, entity: updated, portalAccess };
  });
}

export async function provisionTechnicalInstitutePortalAccessWithAudit(input: {
  id: string;
  provisioning: { passwordHash: string; activationTokenHash: string; activationExpiresAt: Date };
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "TechnicalInstituteApplication" WHERE "id" = ${input.id} FOR UPDATE`);
    const current = await tx.technicalInstituteApplication.findUnique({ where: { id: input.id } });
    if (!current) return { kind: "not-found" as const };
    if (current.status !== PlacementCellApplicationStatus.APPROVED || !current.partnershipCode) {
      return { kind: "approval-required" as const, entity: current };
    }

    let user = current.provisionedUserId
      ? await tx.user.findUnique({ where: { id: current.provisionedUserId } })
      : await tx.user.findUnique({ where: { email: current.officialEmail.toLowerCase() } });

    if (user && user.role !== UserRole.TECHNICAL_INSTITUTE) {
      return { kind: "email-conflict" as const, entity: current };
    }
    if (user) {
      const linkedApplication = await tx.technicalInstituteApplication.findFirst({
        where: { provisionedUserId: user.id, id: { not: current.id } },
        select: { id: true },
      });
      if (linkedApplication) return { kind: "email-conflict" as const, entity: current };
    }
    if (!user) {
      user = await tx.user.create({
        data: {
          email: current.officialEmail.toLowerCase(),
          passwordHash: input.provisioning.passwordHash,
          role: UserRole.TECHNICAL_INSTITUTE,
          isActive: false,
        },
      });
    }

    const portalAccess = user.isActive ? "EXISTING_ACTIVE" as const : "ACTIVATION" as const;
    const updated = await tx.technicalInstituteApplication.update({
      where: { id: input.id },
      data: {
        provisionedUserId: user.id,
        activationTokenHash: user.isActive ? null : input.provisioning.activationTokenHash,
        activationExpiresAt: user.isActive ? null : input.provisioning.activationExpiresAt,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: user.isActive ? "TECHNICAL_INSTITUTE_PORTAL_ACCESS_CONFIRMED" : "TECHNICAL_INSTITUTE_PORTAL_ACCESS_REISSUED",
        entityType: "TechnicalInstituteApplication",
        entityId: input.id,
        metadata: { partnershipCode: updated.partnershipCode, provisionedUserId: user.id, portalAccess },
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    return { kind: "updated" as const, entity: updated, portalAccess };
  });
}
