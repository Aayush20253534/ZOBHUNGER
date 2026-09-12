import { createHash, randomBytes } from "node:crypto";
import {
  ApplicationStatus,
  JobStatus,
  RequirementStatus,
  PartnerApplicationStatus,
  PlacementCellApplicationStatus,
  AdminPermission,
  AdminDepartment,
} from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { prisma } from "../../config/db.js";
import { sendCorporateEmail } from "../../services/email.service.js";
import { notifyJobApplicationStatus, notifyPartnerApplicationStatus, notifyPlacementCellStatus, notifyRequirementStatus } from "../../services/notification.service.js";
import { hashPassword } from "../../utils/password.js";
import { HttpError } from "../../utils/http-error.js";
import { downloadPrivateFile } from "../../services/private-file-storage.js";
import { jobCache } from "../../services/job-cache.service.js";
import type {
  ListAdminJobsQuery,
  ListApplicationsQuery,
  ListPartnerApplicationsQuery,
  ListPlacementCellApplicationsQuery,
  ListEnquiriesQuery,
  ListRequirementsQuery,
  UpdateApplicationStatusInput,
  UpdatePartnerApplicationStatusInput,
  UpdatePlacementCellApplicationStatusInput,
  UpdateJobStatusInput,
  UpdateRequirementStatusInput,
} from "./admin.schema.js";
import {
  findAdminApplications,
  findAdminPartnerApplications,
  findAdminPlacementCellApplications,
  reviewPlacementCellApplicationWithAudit,
  findPartnerResumeForAdmin,
  findAdminEnquiries,
  findAdminJobs,
  findAdminRequirements,
  updateApplicationStatusWithAudit,
  updatePartnerApplicationStatusWithAudit,
  updateJobStatusWithAudit,
  updateRequirementStatusWithAudit,
} from "./admin.repository.js";

export interface AdminAuditContext {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

function paginated<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function listEnquiriesForAdmin(filters: ListEnquiriesQuery) {
  const { items, total } = await findAdminEnquiries(filters);
  return paginated(items, total, filters.page, filters.pageSize);
}

export async function listRequirementsForAdmin(filters: ListRequirementsQuery) {
  const { items, total } = await findAdminRequirements(filters);
  return paginated(items, total, filters.page, filters.pageSize);
}

export async function listJobsForAdmin(filters: ListAdminJobsQuery) {
  const { items, total } = await findAdminJobs(filters);
  return paginated(items, total, filters.page, filters.pageSize);
}

export async function listApplicationsForAdmin(filters: ListApplicationsQuery) {
  const { items, total } = await findAdminApplications(filters);
  return paginated(items, total, filters.page, filters.pageSize);
}

export async function listPartnerApplicationsForAdmin(filters: ListPartnerApplicationsQuery) {
  const { items, total } = await findAdminPartnerApplications(filters);
  return paginated(items, total, filters.page, filters.pageSize);
}

export async function listPlacementCellApplicationsForAdmin(filters: ListPlacementCellApplicationsQuery) {
  const { items, total } = await findAdminPlacementCellApplications(filters);
  return paginated(items, total, filters.page, filters.pageSize);
}

export async function adminOverviewForPermissions(permissions: AdminPermission[], department?: AdminDepartment | null, actorUserId?: string) {
  const granted = new Set(permissions);
  const page = { page: 1, pageSize: 5 };
  const intakeWhere = department && department !== AdminDepartment.MAIN_ADMIN ? { department } : {};
  const [enquiries, requirements, jobs, applications, partnerApplications, placementCellApplications, intakeTotal, intakeNew, intakeUnassigned, intakeRecent] = await Promise.all([
    granted.has(AdminPermission.ENQUIRIES_MANAGE) ? listEnquiriesForAdmin(page) : null,
    granted.has(AdminPermission.REQUIREMENTS_MANAGE) ? listRequirementsForAdmin(page) : null,
    granted.has(AdminPermission.JOBS_MANAGE) ? listJobsForAdmin(page) : null,
    granted.has(AdminPermission.APPLICATIONS_MANAGE) ? listApplicationsForAdmin(page) : null,
    granted.has(AdminPermission.PARTNERS_MANAGE) ? listPartnerApplicationsForAdmin(page) : null,
    granted.has(AdminPermission.PLACEMENT_MANAGE) ? listPlacementCellApplicationsForAdmin(page) : null,
    prisma.intakeCase.count({ where: intakeWhere }),
    prisma.intakeCase.count({ where: { ...intakeWhere, status: "SUBMITTED" } }),
    prisma.intakeCase.count({ where: { ...intakeWhere, assignedAdminId: null } }),
    prisma.intakeCase.findMany({ where: intakeWhere, take: 5, orderBy: [{ submittedAt: "desc" }, { id: "desc" }], select: { id: true, subject: true, sourceType: true, status: true, department: true, submittedAt: true, assignedAdminId: true } }),
  ]);
  return { enquiries, requirements, jobs, applications, partnerApplications, placementCellApplications, intake: { total: intakeTotal, submitted: intakeNew, unassigned: intakeUnassigned, mine: actorUserId ? await prisma.intakeCase.count({ where: { ...intakeWhere, assignedAdminId: actorUserId } }) : 0, recent: intakeRecent } };
}

export async function changePlacementCellApplicationStatus(
  id: string,
  input: UpdatePlacementCellApplicationStatusInput,
  context: AdminAuditContext,
) {
  const status = PlacementCellApplicationStatus[input.status];
  let rawActivationToken: string | undefined;
  let provisioning: { passwordHash: string; activationTokenHash: string; activationExpiresAt: Date } | undefined;

  if (status === PlacementCellApplicationStatus.APPROVED) {
    rawActivationToken = randomBytes(32).toString("hex");
    provisioning = {
      passwordHash: await hashPassword(randomBytes(48).toString("base64url")),
      activationTokenHash: createHash("sha256").update(rawActivationToken).digest("hex"),
      activationExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    };
  }

  const result = await reviewPlacementCellApplicationWithAudit(id, status, context, provisioning);
  if (result.kind === "not-found") throw new HttpError(404, "Institution partnership application not found", { code: "PLACEMENT_CELL_APPLICATION_NOT_FOUND" });
  if (result.kind === "already-approved") throw new HttpError(409, "An approved institution partnership application cannot be moved back to review", { code: "PLACEMENT_CELL_ALREADY_APPROVED" });
  if (result.kind === "email-conflict") throw new HttpError(409, "A user account already exists for this institution email", { code: "PLACEMENT_CELL_EMAIL_ALREADY_REGISTERED" });

  if (result.kind === "updated" && status === PlacementCellApplicationStatus.APPROVED && rawActivationToken) {
    const frontendOrigin = (env.PUBLIC_APP_URL ?? env.CLIENT_ORIGIN.split(",")[0].trim()).replace(/\/$/, "");
    const activationUrl = `${frontendOrigin}/placement-cell-login#activation=${encodeURIComponent(rawActivationToken)}`;
    await sendCorporateEmail({
      to: result.entity.officialEmail,
      subject: "ZOBHUNGER Placement Cell & Institution Partnership approved",
      replyTo: env.PLACEMENT_TEAM_EMAIL,
      idempotencyKey: `placement-${result.entity.id}-activation-${result.entity.updatedAt.getTime()}`,
      content: {
        eyebrow: "Institution partnership approved",
        title: "Activate your Placement Cell workspace",
        intro: `The partnership request for ${result.entity.institutionName} has been approved.`,
        paragraphs: ["Create your password using the secure one-time activation link below. After activation, your institution can access approved opportunities and candidate workflows."],
        details: [{ label: "Institution", value: result.entity.institutionName }, { label: "Activation validity", value: "72 hours" }],
        action: { label: "Activate institution access", url: activationUrl },
        note: "Do not forward this activation link. If it expires, contact the Placement Cell team for a new invitation.",
        signoff: "ZOBHUNGER Placement Cell",
      },
    });
  } else if (result.kind === "updated") {
    void notifyPlacementCellStatus({
      id: result.entity.id, institutionName: result.entity.institutionName, contactPersonName: result.entity.contactPersonName,
      officialEmail: result.entity.officialEmail, status: result.entity.status, updatedAt: result.entity.updatedAt,
    });
  }

  return { entity: result.entity, changed: result.kind === "updated" };
}

export async function getPartnerResumeForAdmin(id: string) {
  const result = await findPartnerResumeForAdmin(id);
  if (!result) {
    throw new HttpError(404, "Partner application not found", {
      code: "PARTNER_APPLICATION_NOT_FOUND",
    });
  }
  if (!result.resumeFileName || !result.resumeMimeType) {
    throw new HttpError(404, "No resume is attached to this application", { code: "PARTNER_RESUME_NOT_FOUND" });
  }
  let bytes: Buffer;
  if (result.resumeStoragePublicId && result.resumeStorageResourceType === "raw" && result.resumeStorageDeliveryType === "authenticated" && result.resumeStorageFormat) {
    bytes = await downloadPrivateFile({ publicId: result.resumeStoragePublicId, resourceType: "raw", deliveryType: "authenticated", format: result.resumeStorageFormat }, result.resumeFileName);
  } else if (result.resumeData) bytes = Buffer.from(result.resumeData);
  else throw new HttpError(404, "No resume is attached to this application", { code: "PARTNER_RESUME_NOT_FOUND" });

  return { id: result.id, resumeFileName: result.resumeFileName, resumeMimeType: result.resumeMimeType, bytes };
}

export async function changeRequirementStatus(
  id: string,
  input: UpdateRequirementStatusInput,
  context: AdminAuditContext,
) {
  const result = await updateRequirementStatusWithAudit(
    id,
    RequirementStatus[input.status],
    context,
  );

  if (!result) {
    throw new HttpError(404, "Workforce requirement not found", {
      code: "REQUIREMENT_NOT_FOUND",
    });
  }
  await jobCache.invalidate();
  if (result.changed) void notifyRequirementStatus(result.entity);
  return result;
}

export async function changeJobStatus(
  id: string,
  input: UpdateJobStatusInput,
  context: AdminAuditContext,
) {
  const result = await updateJobStatusWithAudit(
    id,
    JobStatus[input.status],
    context,
  );

  if (!result) {
    throw new HttpError(404, "Job not found", { code: "JOB_NOT_FOUND" });
  }

  // The transaction has committed before invalidating all open-role read models.
  // A Redis outage must not turn a successful database write into an HTTP error.
  await jobCache.invalidate();
  return result;
}

export async function changeApplicationStatus(
  id: string,
  input: UpdateApplicationStatusInput,
  context: AdminAuditContext,
) {
  const result = await updateApplicationStatusWithAudit(
    id,
    ApplicationStatus[input.status],
    context,
  );

  if (!result) {
    throw new HttpError(404, "Job application not found", {
      code: "APPLICATION_NOT_FOUND",
    });
  }
  if (result.changed) {
    const application = await prisma.jobApplication.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, status: true, revision: true, job: { select: { title: true } } },
    });
    if (application) void notifyJobApplicationStatus({ id: application.id, name: application.name, email: application.email, status: application.status, jobTitle: application.job.title, revision: application.revision });
  }

  return result;
}


export async function changePartnerApplicationStatus(
  id: string,
  input: UpdatePartnerApplicationStatusInput,
  context: AdminAuditContext,
) {
  const result = await updatePartnerApplicationStatusWithAudit(
    id,
    PartnerApplicationStatus[input.status],
    context,
  );

  if (!result) {
    throw new HttpError(404, "Partner application not found", {
      code: "PARTNER_APPLICATION_NOT_FOUND",
    });
  }
  if (result.changed) void notifyPartnerApplicationStatus(result.entity);

  return result;
}
