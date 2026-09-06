import { apiFetch, ApiError } from "@/lib/api";
import type { SiteDataAdapter } from "@/types/data.types";

/** Expected API contracts for the later backend integration. Never selected implicitly. */
export const httpAdapter: SiteDataAdapter = {
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
