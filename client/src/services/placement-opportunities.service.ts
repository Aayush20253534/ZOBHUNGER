import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { PlacementCandidate } from "@/services/placement-candidates.service";

export interface PlacementOpportunity {
  id: string;
  slug: string;
  title: string;
  location: string;
  city: string;
  state: string | null;
  category: string;
  engagementType: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  compensation: string | null;
  status: "OPEN";
  publishedAt: string | null;
}

export interface PlacementOpportunityApplication {
  id: string;
  status: "SUBMITTED" | "REVIEWED" | "SHORTLISTED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  job: { id: string; slug: string; title: string; engagementType: string; location: string; status: "DRAFT" | "OPEN" | "CLOSED" };
  placementCandidate: Pick<PlacementCandidate, "id" | "fullName" | "email" | "course" | "qualification"> | null;
}

export interface PlacementOpportunityListParams {
  search?: string;
  city?: string;
  opportunityType?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export interface PlacementApplicationListParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

interface Paged<T> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: T[];
}

const root = "/placement-cell-applications/portal";

export function listPlacementOpportunities(params: PlacementOpportunityListParams = {}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 12));
  for (const [key, value] of [["search", params.search], ["city", params.city], ["opportunityType", params.opportunityType]] as const) {
    if (value?.trim()) query.set(key, value.trim());
  }
  return apiFetch<ApiSuccessEnvelope<{
    opportunities: Paged<PlacementOpportunity>["items"];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    opportunityTypes: string[];
  }>>(`${root}/opportunities?${query.toString()}`, { signal: params.signal });
}

export function submitCandidateForOpportunity(jobId: string, candidateId: string, message?: string) {
  return apiFetch<ApiSuccessEnvelope<{ application: PlacementOpportunityApplication }>>(`${root}/opportunities/${jobId}/applications`, {
    method: "POST",
    body: JSON.stringify({ candidateId, message }),
  });
}

export function listPlacementApplications(params: PlacementApplicationListParams = {}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 30));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status?.trim()) query.set("status", params.status.trim());
  return apiFetch<ApiSuccessEnvelope<{
    applications: Paged<PlacementOpportunityApplication>["items"];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>>(`${root}/applications?${query.toString()}`, { signal: params.signal });
}
