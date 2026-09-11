import { createMockAdapter } from "@/mocks/adapter";
import { httpAdapter } from "@/services/adapters/http.adapter";
import type { SiteDataAdapter } from "@/types/data.types";

const mockAdapter = createMockAdapter();

export function getDataMode(): "mock" | "api" {
  const mode = process.env.NEXT_PUBLIC_DATA_MODE ?? (process.env.NODE_ENV === "production" ? "api" : "mock");
  if (mode !== "mock" && mode !== "api")
    throw new Error("NEXT_PUBLIC_DATA_MODE must be 'mock' or 'api'.");
  if (process.env.NODE_ENV === "production" && mode !== "api")
    throw new Error("Mock data mode is disabled in production.");
  return mode;
}

export function getEditorialDataMode(): "mock" | "api" {
  return getDataMode();
}

const apiAdapter: SiteDataAdapter = {
  listArticles: httpAdapter.listArticles,
  getArticle: httpAdapter.getArticle,
  listJobs: httpAdapter.listJobs,
  getJob: httpAdapter.getJob,
  submitJobApplication: httpAdapter.submitJobApplication,
  submitRequirement: httpAdapter.submitRequirement,
  submitEnquiry: httpAdapter.submitEnquiry,
};

export function getDataAdapter(): SiteDataAdapter {
  return getDataMode() === "api" ? apiAdapter : mockAdapter;
}
