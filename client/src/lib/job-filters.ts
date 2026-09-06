import type { JobFilters } from "@/types/job.types";

export const JOBS_PAGE_SIZE = 4;
export type JobSearchParams = Record<string, string | string[] | undefined>;

function filterValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

export function parseJobFilters(query: JobSearchParams = {}): JobFilters {
  const rawPage =
    typeof query.page === "string" && /^\d+$/.test(query.page)
      ? Number(query.page)
      : 1;
  const selection = (value: string | string[] | undefined) =>
    filterValue(value) === "all" ? "" : filterValue(value);
  return {
    query: filterValue(query.query),
    location: selection(query.location),
    category: selection(query.category),
    jobType: selection(query.jobType),
    page:
      Number.isSafeInteger(rawPage) && rawPage > 0
        ? Math.min(rawPage, 100000)
        : 1,
    pageSize: JOBS_PAGE_SIZE,
  };
}

export function jobsHref(filters: JobFilters = {}) {
  const params = new URLSearchParams();
  for (const key of ["query", "location", "category", "jobType"] as const) {
    const value = filters[key]?.trim().slice(0, 120);
    if (value) params.set(key, value);
  }
  if (filters.page && Number.isSafeInteger(filters.page) && filters.page > 1)
    params.set("page", String(Math.min(filters.page, 100000)));
  return params.size ? "/jobs?" + params.toString() : "/jobs";
}
