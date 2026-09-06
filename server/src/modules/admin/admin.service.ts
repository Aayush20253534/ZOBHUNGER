import {
  ApplicationStatus,
  JobStatus,
  RequirementStatus,
} from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import type {
  ListAdminJobsQuery,
  ListApplicationsQuery,
  ListEnquiriesQuery,
  ListRequirementsQuery,
  UpdateApplicationStatusInput,
  UpdateJobStatusInput,
  UpdateRequirementStatusInput,
} from "./admin.schema.js";
import {
  findAdminApplications,
  findAdminEnquiries,
  findAdminJobs,
  findAdminRequirements,
  updateApplicationStatusWithAudit,
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

  return result;
}
