import { mockJobs } from "@/mocks/jobs";
import { enquirySchema } from "@/schemas/enquiry.schema";
import { requirementSchema } from "@/schemas/requirement.schema";
import { jobApplicationSchema } from "@/schemas/job-application.schema";
import type {
  DataRequestOptions,
  SiteDataAdapter,
  SubmissionReceipt,
} from "@/types/data.types";

export class MockRequestError extends Error {
  constructor() {
    super("This is a simulated error. Please try again.");
    this.name = "MockRequestError";
  }
}

function wait(milliseconds: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abortError = () =>
      new DOMException("The request was cancelled.", "AbortError");
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

function positiveInteger(
  value: number | undefined,
  fallback: number,
  maximum: number,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(1, Math.trunc(value)))
    : fallback;
}

function demoReceipt(
  kind: "requirement" | "enquiry" | "application",
): SubmissionReceipt {
  return {
    id: `demo-${kind}-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    mode: "mock",
    delivered: false,
    message: "Preview complete. No information has been sent or saved.",
  };
}

export function createMockAdapter({
  latencyMs = 450,
}: { latencyMs?: number } = {}): SiteDataAdapter {
  const prepare = async (options?: DataRequestOptions) => {
    await wait(Math.max(0, latencyMs), options?.signal);
    if (options?.scenario === "error") throw new MockRequestError();
  };

  return {
    async listArticles(filters = {}, options) {
      await prepare(options);
      const { mockArticles } = await import("@/mocks/articles");
      const normalise = (value?: string) =>
        value?.trim().toLocaleLowerCase("en-IN") ?? "";
      const query = normalise(filters.query);
      const category = normalise(filters.category);
      const articles =
        options?.scenario === "empty"
          ? []
          : mockArticles.filter(
              (article) =>
                article.isPublished &&
                (!query ||
                  normalise(
                    `${article.title} ${article.excerpt} ${article.category}`,
                  ).includes(query)) &&
                (!category || normalise(article.category) === category),
            );
      const pageSize = positiveInteger(filters.pageSize, 6, 100);
      const totalPages = Math.ceil(articles.length / pageSize);
      const page = Math.min(
        positiveInteger(filters.page, 1, 100000),
        Math.max(1, totalPages),
      );
      return {
        items: articles
          .slice((page - 1) * pageSize, page * pageSize)
          .map((article) => ({
            slug: article.slug,
            title: article.title,
            excerpt: article.excerpt,
            category: article.category,
            readingMinutes: article.readingMinutes,
            isPublished: article.isPublished,
            isSample: article.isSample,
          })),
        total: articles.length,
        page,
        pageSize,
        totalPages,
      };
    },
    async getArticle(slug, options) {
      await prepare(options);
      if (options?.scenario === "empty") return null;
      const { mockArticles } = await import("@/mocks/articles");
      const article = mockArticles.find(
        (item) => item.slug === slug && item.isPublished,
      );
      return article ? structuredClone(article) : null;
    },
    async listJobs(filters = {}, options) {
      await prepare(options);
      const normalise = (value?: string) =>
        value?.trim().toLocaleLowerCase("en-IN") ?? "";
      const query = normalise(filters.query);
      const location = normalise(filters.location);
      const category = normalise(filters.category);
      const jobType = normalise(filters.jobType);
      const jobs =
        options?.scenario === "empty"
          ? []
          : mockJobs
              .filter(
                (job) =>
                  job.isPublished &&
                  (!query ||
                    normalise(
                      `${job.title} ${job.description} ${job.category} ${job.location}`,
                    ).includes(query)) &&
                  (!location || normalise(job.location) === location) &&
                  (!category || normalise(job.category) === category) &&
                  (!jobType || normalise(job.jobType) === jobType),
              )
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const pageSize = positiveInteger(filters.pageSize, 6, 100);
      const totalPages = Math.ceil(jobs.length / pageSize);
      const page = Math.min(
        positiveInteger(filters.page, 1, 100000),
        Math.max(totalPages, 1),
      );
      return {
        items: jobs
          .slice((page - 1) * pageSize, page * pageSize)
          .map((job) => ({ ...job })),
        total: jobs.length,
        page,
        pageSize,
        totalPages,
      };
    },
    async getJob(slug, options) {
      await prepare(options);
      if (options?.scenario === "empty") return null;
      const job = mockJobs.find(
        (item) => item.slug === slug && item.isPublished,
      );
      return job ? { ...job } : null;
    },
    async submitJobApplication(slug, input, options) {
      jobApplicationSchema.parse(input);
      await prepare(options);
      if (!mockJobs.some((job) => job.slug === slug && job.isPublished)) {
        throw new Error(
          "This role is no longer available. Please explore another job.",
        );
      }
      return demoReceipt("application");
    },
    async submitRequirement(input, options) {
      requirementSchema.parse(input);
      await prepare(options);
      return demoReceipt("requirement");
    },
    async submitEnquiry(input, options) {
      enquirySchema.parse(input);
      await prepare(options);
      return demoReceipt("enquiry");
    },
  };
}
