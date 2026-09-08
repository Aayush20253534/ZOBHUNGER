import { HttpError } from "../../utils/http-error.js";
import { jobCache } from "../../services/job-cache.service.js";
import type { CreateJobApplicationInput, ListJobsQuery } from "./jobs.schema.js";
import {
  createJobApplication,
  findApplicationByJobAndEmail,
  findOpenJobByReference,
  findPublicJobBySlug,
  findPublicJobs,
} from "./jobs.repository.js";

export async function listPublicJobs(filters: ListJobsQuery) {
  return jobCache.remember("public-list", filters, async () => {
    const { items, total } = await findPublicJobs(filters);
    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  });
}

export async function getPublicJob(slug: string) {
  return jobCache.remember("public-detail", slug, async () => {
    const job = await findPublicJobBySlug(slug);

    if (!job) {
      throw new HttpError(404, "Job not found or no longer available", {
        code: "JOB_NOT_FOUND",
      });
    }

    return job;
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function submitJobApplication(
  jobReference: string,
  input: CreateJobApplicationInput,
) {
  const job = await findOpenJobByReference(jobReference);

  if (!job) {
    throw new HttpError(404, "This role is no longer available", {
      code: "JOB_NOT_FOUND",
    });
  }

  const existingApplication = await findApplicationByJobAndEmail(job.id, input.email);
  if (existingApplication) {
    throw new HttpError(409, "You have already applied for this role with this email address", {
      code: "DUPLICATE_APPLICATION",
    });
  }

  try {
    const application = await createJobApplication(job.id, input);
    return {
      ...application,
      job: {
        id: job.id,
        slug: job.slug,
        title: job.title,
      },
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new HttpError(409, "You have already applied for this role with this email address", {
        code: "DUPLICATE_APPLICATION",
      });
    }
    throw error;
  }
}
