import type { EnquiryInput } from "@/types/enquiry.types";
import type { Job, JobFilters, JobList } from "@/types/job.types";
import type { RequirementInput } from "@/types/requirement.types";
import type { JobApplicationInput } from "@/schemas/job-application.schema";

export type MockScenario = "success" | "empty" | "error";

export interface DataRequestOptions {
  signal?: AbortSignal;
  /** Used by previews only; the HTTP adapter ignores this option. */
  scenario?: MockScenario;
}

export interface SubmissionReceipt {
  id: string;
  createdAt: string;
  mode: "mock" | "api";
  delivered: boolean;
  message: string;
}

export interface SiteDataAdapter {
  listJobs(
    filters?: JobFilters,
    options?: DataRequestOptions,
  ): Promise<JobList>;
  getJob(slug: string, options?: DataRequestOptions): Promise<Job | null>;
  submitJobApplication(
    slug: string,
    input: JobApplicationInput,
    options?: DataRequestOptions,
  ): Promise<SubmissionReceipt>;
  submitRequirement(
    input: RequirementInput,
    options?: DataRequestOptions,
  ): Promise<SubmissionReceipt>;
  submitEnquiry(
    input: EnquiryInput,
    options?: DataRequestOptions,
  ): Promise<SubmissionReceipt>;
}
