import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { CandidateDetail, CandidateList, CandidateListQuery, CandidateOptions, CandidateReview } from "@/types/business-candidates.types";

const base = (admin: boolean) => admin ? "/admin/candidate-management" : "/business/candidates";
const write = (body: unknown) => ({ method: "POST", headers: { "X-Requested-With": "XMLHttpRequest" }, body: JSON.stringify(body) });
export function getCandidates(admin: boolean, query: CandidateListQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(query.page), query: query.query, status: query.status });
  if (query.requirementId) params.set("requirementId", query.requirementId);
  return apiFetch<ApiSuccessEnvelope<CandidateList>>(`${base(admin)}?${params}`, { signal });
}
export function getCandidate(admin: boolean, id: string, historyPage: number, signal?: AbortSignal) {
  return apiFetch<ApiSuccessEnvelope<CandidateDetail>>(`${base(admin)}/${encodeURIComponent(id)}?historyPage=${historyPage}`, { signal });
}
export function reviewCandidate(id: string, review: CandidateReview) {
  return apiFetch<ApiSuccessEnvelope<CandidateDetail>>(`${base(false)}/${encodeURIComponent(id)}/reviews`, write(review));
}
export function revokeCandidate(id: string, revision: number, note: string) {
  return apiFetch<ApiSuccessEnvelope<CandidateDetail>>(`${base(true)}/${encodeURIComponent(id)}/revoke`, write({ revision, note }));
}
export function getCandidateOptions<T>(kind: "requirements" | "applications", query: string, page: number, signal?: AbortSignal, requirementId?: string) {
  return apiFetch<ApiSuccessEnvelope<CandidateOptions<T>>>(`${base(true)}/${kind}?${new URLSearchParams({ query, page: String(page), ...(requirementId ? { requirementId } : {}) })}`, { signal });
}
export function shareCandidate(input: { requirementId: string; applicationId: string; summary: string; skills: string[] }) {
  return apiFetch<ApiSuccessEnvelope<{ id: string; created: boolean }>>(base(true), write(input));
}
