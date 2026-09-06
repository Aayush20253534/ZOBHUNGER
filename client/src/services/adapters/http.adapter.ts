import { apiFetch, ApiError } from "@/lib/api";
import type { SiteDataAdapter } from "@/types/data.types";

/** Expected API contracts for the later backend integration. Never selected implicitly. */
export const httpAdapter: SiteDataAdapter = {
  listArticles(filters = {}, options) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    return apiFetch(`/articles${params.size ? `?${params}` : ""}`, {
      signal: options?.signal,
    });
  },
  async getArticle(slug, options) {
    try {
      return await apiFetch(`/articles/${encodeURIComponent(slug)}`, {
        signal: options?.signal,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  listJobs(filters = {}, options) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    return apiFetch(`/jobs${params.size ? `?${params}` : ""}`, {
      signal: options?.signal,
    });
  },
  async getJob(slug, options) {
    try {
      return await apiFetch(`/jobs/${encodeURIComponent(slug)}`, {
        signal: options?.signal,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  submitJobApplication(slug, input, options) {
    return apiFetch(`/jobs/${encodeURIComponent(slug)}/applications`, {
      method: "POST",
      body: JSON.stringify(input),
      signal: options?.signal,
    });
  },
  submitRequirement(input, options) {
    return apiFetch("/requirements", {
      method: "POST",
      body: JSON.stringify(input),
      signal: options?.signal,
    });
  },
  submitEnquiry(input, options) {
    return apiFetch("/enquiries", {
      method: "POST",
      body: JSON.stringify(input),
      signal: options?.signal,
    });
  },
};
