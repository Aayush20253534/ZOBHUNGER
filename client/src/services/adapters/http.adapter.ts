import {
  apiFetch,
  ApiError,
  type ApiSuccessEnvelope,
} from "@/lib/api";
import type { SiteDataAdapter, SubmissionReceipt } from "@/types/data.types";
import type { Article, ArticleList } from "@/types/article.types";
import type { Job, JobList } from "@/types/job.types";

type ApiJobList = Omit<JobList, "items"> & { items: ApiJob[] };
type ApiArticleList = ArticleList;

interface ApiJob {
  id: string;
  slug: string;
  title: string;
  location: string;
  city: string;
  state?: string | null;
  category: string;
  engagementType: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  compensation?: string | null;
  isDemo?: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiSubmissionRecord {
  id: string;
  createdAt: string | Date;
}

function toJob(job: ApiJob): Job {
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    location: job.location,
    city: job.city,
    state: job.state ?? null,
    category: job.category,
    jobType: job.engagementType,
    description: job.description,
    isPublished: true,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    publishedAt: job.publishedAt ?? null,
    responsibilities: job.responsibilities ?? [],
    requirements: job.requirements ?? [],
    isDemo: job.isDemo ?? false,
  };
}

function toReceipt(
  response: ApiSuccessEnvelope<ApiSubmissionRecord>,
): SubmissionReceipt {
  return {
    id: response.data.id,
    createdAt:
      typeof response.data.createdAt === "string"
        ? response.data.createdAt
        : response.data.createdAt.toISOString(),
    mode: "api",
    delivered: true,
    message: response.message,
  };
}

/** Real Phase 1 adapter backed by the Express/PostgreSQL API. */
export const httpAdapter = {
  async listArticles(filters = {}, options) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });

    const response = await apiFetch<ApiSuccessEnvelope<ApiArticleList>>(
      `/articles${params.size ? `?${params}` : ""}`,
      { signal: options?.signal },
    );
    return response.data;
  },

  async getArticle(slug, options) {
    try {
      const response = await apiFetch<ApiSuccessEnvelope<Article>>(
        `/articles/${encodeURIComponent(slug)}`,
        { signal: options?.signal },
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  async listJobs(filters = {}, options) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });

    const response = await apiFetch<ApiSuccessEnvelope<ApiJobList>>(
      `/jobs${params.size ? `?${params}` : ""}`,
      { signal: options?.signal },
    );

    return {
      ...response.data,
      items: response.data.items.map(toJob),
    };
  },

  async getJob(slug, options) {
    try {
      const response = await apiFetch<ApiSuccessEnvelope<ApiJob>>(
        `/jobs/${encodeURIComponent(slug)}`,
        { signal: options?.signal },
      );
      return toJob(response.data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async submitJobApplication(slug, input, options) {
    const response = await apiFetch<ApiSuccessEnvelope<ApiSubmissionRecord>>(
      `/jobs/${encodeURIComponent(slug)}/applications`,
      {
        method: "POST",
        body: JSON.stringify(input),
        signal: options?.signal,
      },
    );
    return toReceipt(response);
  },

  async submitRequirement(input, options) {
    const response = await apiFetch<ApiSuccessEnvelope<ApiSubmissionRecord>>(
      "/requirements",
      {
        method: "POST",
        body: JSON.stringify(input),
        signal: options?.signal,
      },
    );
    return toReceipt(response);
  },

  async submitEnquiry(input, options) {
    const response = await apiFetch<ApiSuccessEnvelope<ApiSubmissionRecord>>(
      "/contact",
      {
        method: "POST",
        body: JSON.stringify(input),
        signal: options?.signal,
      },
    );
    return toReceipt(response);
  },
} satisfies Pick<
  SiteDataAdapter,
  | "listArticles"
  | "getArticle"
  | "listJobs"
  | "getJob"
  | "submitJobApplication"
  | "submitRequirement"
  | "submitEnquiry"
>;
