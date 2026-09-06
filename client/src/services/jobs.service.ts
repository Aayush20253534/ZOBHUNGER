import { getDataAdapter } from "@/services/adapters";
import type { DataRequestOptions } from "@/types/data.types";
import type { JobFilters } from "@/types/job.types";

export function getJobs(filters?: JobFilters, options?: DataRequestOptions) {
  return getDataAdapter().listJobs(filters, options);
}

export function getJobBySlug(slug: string, options?: DataRequestOptions) {
  return getDataAdapter().getJob(slug, options);
}
