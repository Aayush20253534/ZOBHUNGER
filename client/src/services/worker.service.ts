import { ApiError, apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { AuthUser } from "@/types/auth.types";
import type { WorkerJob, WorkerJobFacets, WorkerJobList, WorkerProfileInput, WorkerProfileResult, WorkerWorkspace } from "@/types/worker.types";

const writeHeaders = { "X-Requested-With": "XMLHttpRequest" };
const json = (body: unknown) => ({ method: "POST", headers: writeHeaders, body: JSON.stringify(body) });
export const loginWorker = (email: string, password: string) => apiFetch<ApiSuccessEnvelope<{ user: AuthUser }>>("/auth/worker/login", json({ email, password }));
export const requestWorkerEmail = (kind: "resend-verification" | "forgot-password", email: string, next: string) => apiFetch<ApiSuccessEnvelope<{ accepted: boolean }>>(`/auth/worker/${kind}`, json({ email, next }));
export const verifyWorkerEmail = (token: string) => apiFetch<ApiSuccessEnvelope<{ completed: boolean }>>("/auth/worker/verify-email", json({ token }));
export const resetWorkerPassword = (token: string, password: string) => apiFetch<ApiSuccessEnvelope<{ completed: boolean }>>("/auth/worker/reset-password", json({ token, password }));
export const getWorkerWorkspace = () => apiFetch<ApiSuccessEnvelope<WorkerWorkspace>>("/workers/workspace");
export const getWorkerProfile = () => apiFetch<ApiSuccessEnvelope<WorkerProfileResult>>("/workers/profile");
export const saveWorkerProfile = (body: WorkerProfileInput) => apiFetch<ApiSuccessEnvelope<WorkerProfileResult>>("/workers/profile", { ...json(body), method: "PUT" });
export const uploadWorkerResume = (file: File, revision: number) => apiFetch<ApiSuccessEnvelope<WorkerProfileResult>>("/workers/profile/resume", { method: "PUT", body: file, headers: { ...writeHeaders, "Content-Type": "application/pdf", "X-File-Name": encodeURIComponent(file.name), "X-Resume-Revision": String(revision) } });
export const removeWorkerResume = (revision: number) => apiFetch<ApiSuccessEnvelope<WorkerProfileResult>>("/workers/profile/resume", { ...json({ revision }), method: "DELETE" });
export async function downloadWorkerResume() {
  const response = await fetch("/api/backend/workers/profile/resume", { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new ApiError("The resume could not be downloaded. Check your session and try again.", response.status);
  return response.blob();
}
export const getWorkerJobs = (query: string, signal?: AbortSignal) => apiFetch<ApiSuccessEnvelope<WorkerJobList>>(`/workers/jobs${query ? `?${query}` : ""}`, { signal });
export const getWorkerJobFacets = (signal?: AbortSignal) => apiFetch<ApiSuccessEnvelope<WorkerJobFacets>>("/workers/jobs/facets", { signal });
export const getWorkerJob = (slug: string, signal?: AbortSignal) => apiFetch<ApiSuccessEnvelope<WorkerJob>>(`/workers/jobs/${encodeURIComponent(slug)}`, { signal });
export const getWorkerSavedJobs = (page: number, signal?: AbortSignal) => apiFetch<ApiSuccessEnvelope<WorkerJobList>>(`/workers/saved-jobs?page=${page}`, { signal });
export const setWorkerJobSaved = (jobId: string, saved: boolean) => apiFetch<ApiSuccessEnvelope<{ jobId: string; saved: boolean }>>(`/workers/saved-jobs/${encodeURIComponent(jobId)}`, { method: saved ? "PUT" : "DELETE", headers: writeHeaders });
