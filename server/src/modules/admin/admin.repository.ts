import { applicationEvent, lockApplication } from "../workers/worker-workflow.guards.js";
import {
  ApplicationStatus,
  JobStatus,
  Prisma,
  RequirementStatus,
  PartnerApplicationStatus,
  PlacementCellApplicationStatus,
  UserRole,
} from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import { guardRequirementAssignments } from "../attendance/attendance.guards.js";
import { eligibleRequirement, pauseRequirementJobs } from "../phase2/linked-jobs.service.js";
import { HttpError } from "../../utils/http-error.js";
import type {
  ListAdminJobsQuery,
  ListApplicationsQuery,
  ListPartnerApplicationsQuery,
  ListPlacementCellApplicationsQuery,
  ListEnquiriesQuery,
  ListRequirementsQuery,
} from "./admin.schema.js";

function pagination(page: number, pageSize: number) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export async function findAdminEnquiries(filters: ListEnquiriesQuery) {
  const where: Prisma.ContactEnquiryWhereInput = filters.query
    ? {
        OR: [
          { name: { contains: filters.query, mode: "insensitive" } },
          { companyName: { contains: filters.query, mode: "insensitive" } },
          { email: { contains: filters.query, mode: "insensitive" } },
          { phone: { contains: filters.query, mode: "insensitive" } },
          { serviceRequired: { contains: filters.query, mode: "insensitive" } },
        ],
      }
    : {};

  const page = pagination(filters.page, filters.pageSize);
  const [items, total] = await prisma.$transaction([
    prisma.contactEnquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...page,
    }),
    prisma.contactEnquiry.count({ where }),
  ]);

  return { items, total };
}

export async function findAdminRequirements(filters: ListRequirementsQuery) {
  const where: Prisma.WorkforceRequirementWhereInput = {};

  if (filters.status) {
    where.status = RequirementStatus[filters.status];
  }

  if (filters.query) {
    where.OR = [
      { companyName: { contains: filters.query, mode: "insensitive" } },
      { contactPerson: { contains: filters.query, mode: "insensitive" } },
      { businessEmail: { contains: filters.query, mode: "insensitive" } },
      { mobileNumber: { contains: filters.query, mode: "insensitive" } },
      { serviceRequired: { contains: filters.query, mode: "insensitive" } },
      { jobLocation: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  const page = pagination(filters.page, filters.pageSize);
  const [items, total] = await prisma.$transaction([
    prisma.workforceRequirement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        submittedBy: {
          select: { id: true, email: true, role: true },
        },
      },
      ...page,
    }),
    prisma.workforceRequirement.count({ where }),
  ]);

  return { items, total };
}

export async function findAdminJobs(filters: ListAdminJobsQuery) {
  const where: Prisma.JobWhereInput = {};

  if (filters.status) {
    where.status = JobStatus[filters.status];
  }

  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { slug: { contains: filters.query, mode: "insensitive" } },
      { category: { contains: filters.query, mode: "insensitive" } },
      { city: { contains: filters.query, mode: "insensitive" } },
      { location: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  const page = pagination(filters.page, filters.pageSize);
  const [items, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        createdBy: {
          select: { id: true, email: true, role: true },
        },
        _count: {
          select: { applications: true },
        },
      },
      ...page,
    }),
    prisma.job.count({ where }),
  ]);

  return { items, total };
}


export async function findAdminPartnerApplications(filters: ListPartnerApplicationsQuery) {
  const where: Prisma.PartnerApplicationWhereInput = {};

  if (filters.status) {
    where.status = PartnerApplicationStatus[filters.status];
  }

  if (filters.query) {
    where.OR = [
      { fullName: { contains: filters.query, mode: "insensitive" } },
      { email: { contains: filters.query, mode: "insensitive" } },
      { mobileNumber: { contains: filters.query, mode: "insensitive" } },
      { currentCity: { contains: filters.query, mode: "insensitive" } },
      { currentProfession: { contains: filters.query, mode: "insensitive" } },
      { companyName: { contains: filters.query, mode: "insensitive" } },
      { specialization: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  const page = pagination(filters.page, filters.pageSize);
  const [items, total] = await prisma.$transaction([
    prisma.partnerApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        mobileNumber: true,
        email: true,
        currentCity: true,
        currentProfession: true,
        companyName: true,
        totalExperienceYears: true,
        specialization: true,
        industryExperience: true,
        linkedInUrl: true,
        contributionPreference: true,
        expertiseDescription: true,
        professionalNetwork: true,
        preferredPartnershipArea: true,
        resumeFileName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      ...page,
    }),
    prisma.partnerApplication.count({ where }),
  ]);

  return { items, total };
}

export function findPartnerResumeForAdmin(id: string) {
  return prisma.partnerApplication.findUnique({
    where: { id },
    select: {
      id: true,
      resumeFileName: true,
      resumeMimeType: true,
      resumeData: true,
    },
  });
}

export async function findAdminApplications(filters: ListApplicationsQuery) {
  const where: Prisma.JobApplicationWhereInput = {};

  if (filters.status) {
    where.status = ApplicationStatus[filters.status];
  }

  if (filters.jobId) {
    where.job = {
      OR: [{ id: filters.jobId }, { slug: filters.jobId }],
    };
  }

  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: "insensitive" } },
      { email: { contains: filters.query, mode: "insensitive" } },
      { phone: { contains: filters.query, mode: "insensitive" } },
      { city: { contains: filters.query, mode: "insensitive" } },
      { job: { title: { contains: filters.query, mode: "insensitive" } } },
    ];
  }

  const page = pagination(filters.page, filters.pageSize);
  const [items, total] = await prisma.$transaction([
    prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: { id: true, slug: true, title: true, status: true },
        },
        workerUser: {
          select: { id: true, email: true, role: true },
        },
      },
      ...page,
    }),
    prisma.jobApplication.count({ where }),
  ]);

  return { items, total };
}

interface AuditContext {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}


export async function findAdminPlacementCellApplications(filters: ListPlacementCellApplicationsQuery) {
  const where: Prisma.PlacementCellApplicationWhereInput = {};
  if (filters.status) where.status = PlacementCellApplicationStatus[filters.status];
  if (filters.query) {
    where.OR = [
      { institutionName: { contains: filters.query, mode: "insensitive" } },
      { placementCellName: { contains: filters.query, mode: "insensitive" } },
      { contactPersonName: { contains: filters.query, mode: "insensitive" } },
      { officialEmail: { contains: filters.query, mode: "insensitive" } },
      { city: { contains: filters.query, mode: "insensitive" } },
      { state: { contains: filters.query, mode: "insensitive" } },
    ];
  }
  const page = pagination(filters.page, filters.pageSize);
  const [items, total] = await prisma.$transaction([
    prisma.placementCellApplication.findMany({ where, orderBy: { createdAt: "desc" }, ...page }),
    prisma.placementCellApplication.count({ where }),
  ]);
  return { items, total };
}

export async function reviewPlacementCellApplicationWithAudit(
  id: string,
  status: PlacementCellApplicationStatus,
  context: AuditContext,
  provisioning?: { passwordHash: string; activationTokenHash: string; activationExpiresAt: Date },
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.placementCellApplication.findUnique({ where: { id } });
    if (!current) return { kind: "not-found" as const };
    if (current.status === PlacementCellApplicationStatus.APPROVED && status !== PlacementCellApplicationStatus.APPROVED) {
      return { kind: "already-approved" as const };
    }
    if (status === PlacementCellApplicationStatus.APPROVED) {
      if (current.provisionedUserId) return { kind: "unchanged" as const, entity: current };
      const existingUser = await tx.user.findUnique({ where: { email: current.officialEmail.toLowerCase() } });
      if (existingUser) return { kind: "email-conflict" as const };
      if (!provisioning) throw new Error("Provisioning data is required for approval");
      const user = await tx.user.create({
        data: {
          email: current.officialEmail.toLowerCase(),
          passwordHash: provisioning.passwordHash,
          role: UserRole.PLACEMENT_CELL,
          isActive: false,
        },
      });
      const updated = await tx.placementCellApplication.update({
        where: { id },
        data: {
          status,
          reviewedByUserId: context.actorUserId,
          reviewedAt: new Date(),
          provisionedUserId: user.id,
          activationTokenHash: provisioning.activationTokenHash,
          activationExpiresAt: provisioning.activationExpiresAt,
        },
      });
      await tx.auditLog.create({ data: {
        actorUserId: context.actorUserId, action: "PLACEMENT_CELL_APPLICATION_APPROVED",
        entityType: "PlacementCellApplication", entityId: id,
        metadata: { from: current.status, to: status, provisionedUserId: user.id },
        ipAddress: context.ipAddress, userAgent: context.userAgent,
      }});
      return { kind: "updated" as const, entity: updated };
    }
    if (current.status === status) return { kind: "unchanged" as const, entity: current };
    const updated = await tx.placementCellApplication.update({
      where: { id }, data: { status, reviewedByUserId: context.actorUserId, reviewedAt: new Date() },
    });
    await tx.auditLog.create({ data: {
      actorUserId: context.actorUserId, action: "PLACEMENT_CELL_APPLICATION_STATUS_CHANGED",
      entityType: "PlacementCellApplication", entityId: id,
      metadata: { from: current.status, to: status }, ipAddress: context.ipAddress, userAgent: context.userAgent,
    }});
    return { kind: "updated" as const, entity: updated };
  });
}

export async function updateRequirementStatusWithAudit(
  id: string,
  status: RequirementStatus,
  context: AuditContext,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "WorkforceRequirement" WHERE "id" = ${id} FOR UPDATE`);
    const current = await tx.workforceRequirement.findUnique({ where: { id } });
    if (!current) return null;
    if (current.status === status) return { entity: current, changed: false };

    if (status === "CLOSED") await guardRequirementAssignments(tx, id);
    if (status !== "QUALIFIED") await pauseRequirementJobs(tx, id);

    const changed = await tx.workforceRequirement.updateMany({
      where: { id, revision: current.revision },
      data: { status, revision: { increment: 1 } },
    });
    if (changed.count !== 1) throw new HttpError(409, "This requirement changed. Refresh and review it before updating the status.", { code: "REQUIREMENT_CHANGED" });
    const updated = await tx.workforceRequirement.findUniqueOrThrow({ where: { id } });

    await tx.auditLog.create({
      data: {
        actorUserId: context.actorUserId,
        action: "WORKFORCE_REQUIREMENT_STATUS_CHANGED",
        entityType: "WorkforceRequirement",
        entityId: id,
        metadata: { from: current.status, to: status },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    return { entity: updated, changed: true };
  });
}

export async function updateJobStatusWithAudit(
  id: string,
  status: JobStatus,
  context: AuditContext,
) {
  return prisma.$transaction(async (tx) => {
    const reference = await tx.job.findUnique({ where: { id }, select: { requirementId: true } });
    if (reference?.requirementId) await tx.$queryRaw(Prisma.sql`SELECT id FROM "WorkforceRequirement" WHERE id = ${reference.requirementId} FOR UPDATE`);
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "Job" WHERE id = ${id} FOR UPDATE`);
    const current = await tx.job.findUnique({ where: { id } });
    if (!current) return null;
    if (current.requirementId && status === "OPEN") await eligibleRequirement(tx, current.requirementId);
    if (current.status === status) return { entity: current, changed: false };

    const updated = await tx.job.update({
      where: { id },
      data: {
        status,
        revision: { increment: 1 },
        publishedAt:
          status === JobStatus.OPEN && !current.publishedAt
            ? new Date()
            : current.publishedAt,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: context.actorUserId,
        action: "JOB_STATUS_CHANGED",
        entityType: "Job",
        entityId: id,
        metadata: { from: current.status, to: status },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    return { entity: updated, changed: true };
  });
}

export async function updateApplicationStatusWithAudit(
  id: string,
  status: ApplicationStatus,
  context: AuditContext,
) {
  return prisma.$transaction(async (tx) => {
    await lockApplication(tx, id);
    const current = await tx.jobApplication.findUnique({ where: { id } });
    if (!current) return null;
    if (current.withdrawnAt) throw new HttpError(409, "This application was withdrawn.", { code: "APPLICATION_WITHDRAWN" });
    if (current.workerUserId && status === "REJECTED" && await tx.businessCandidate.count({ where: { applicationId: id, OR: [{ revokedAt: null }, { assignment: { is: { cancelledAt: null } } }] } })) throw new HttpError(409, "Complete or revoke business reviews first.", { code: "APPLICATION_IN_PIPELINE" });
    if (current.status === status) return { entity: current, changed: false };

    const updated = await tx.jobApplication.update({
      where: { id },
      data: { status, revision: { increment: 1 } },
      include: {
        job: {
          select: { id: true, slug: true, title: true },
        },
      },
    });

    await applicationEvent(tx, id, { kind: "ADMIN_REVIEW", stage: status, title: `Hiring team update: ${status.toLowerCase()}` });
    await tx.auditLog.create({
      data: {
        actorUserId: context.actorUserId,
        action: "JOB_APPLICATION_STATUS_CHANGED",
        entityType: "JobApplication",
        entityId: id,
        metadata: { from: current.status, to: status, jobId: current.jobId },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    return { entity: updated, changed: true };
  });
}


export async function updatePartnerApplicationStatusWithAudit(
  id: string,
  status: PartnerApplicationStatus,
  context: AuditContext,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "PartnerApplication" WHERE "id" = ${id} FOR UPDATE`;
    const current = await tx.partnerApplication.findUnique({ where: { id } });
    if (current?.status === "APPROVED" || current?.provisionedUserId) throw new HttpError(409, "Approved business accounts cannot be moved back through lead review", { code: "PARTNER_ALREADY_APPROVED" });
    if (!current) return null;
    if (current.status === status) return { entity: current, changed: false };

    const updated = await tx.partnerApplication.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        fullName: true,
        email: true,
        currentCity: true,
        specialization: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: context.actorUserId,
        action: "PARTNER_APPLICATION_STATUS_CHANGED",
        entityType: "PartnerApplication",
        entityId: id,
        metadata: { from: current.status, to: status },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    return { entity: updated, changed: true };
  });
}
