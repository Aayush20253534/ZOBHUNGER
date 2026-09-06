import { createMockAdapter } from "@/mocks/adapter";
import { httpAdapter } from "@/services/adapters/http.adapter";
import type { SiteDataAdapter } from "@/types/data.types";

const mockAdapter = createMockAdapter();

export function getDataMode(): "mock" | "api" {
  const mode = process.env.NEXT_PUBLIC_DATA_MODE ?? "mock";
  if (mode !== "mock" && mode !== "api")
    throw new Error("NEXT_PUBLIC_DATA_MODE must be 'mock' or 'api'.");
  return mode;
}

/**
 * Phase 1 does not expose editorial APIs yet, so Blog & Insights deliberately
 * remains on the reviewed sample-content adapter even when operational data is live.
 */
export function getEditorialDataMode(): "mock" {
  return "mock";
}

const apiAdapter: SiteDataAdapter = {
  listArticles: mockAdapter.listArticles,
  getArticle: mockAdapter.getArticle,
  listJobs: httpAdapter.listJobs,
  getJob: httpAdapter.getJob,
  submitJobApplication: httpAdapter.submitJobApplication,
  submitRequirement: httpAdapter.submitRequirement,
  submitEnquiry: httpAdapter.submitEnquiry,
};

export function getDataAdapter(): SiteDataAdapter {
  return getDataMode() === "api" ? apiAdapter : mockAdapter;
}
