import { apiFetch, ApiError, type ApiSuccessEnvelope } from "@/lib/api";
import type { BusinessRequirementInput, BusinessRequirementReceipt } from "@/types/business-requirements.types";
import type { ApprovalDetail, ApprovalQueue, ApprovalRecord, DraftData, HiringBriefsPage, JobInput, LinkedJob, LinkedJobs, OperationsSummary, Page, ReportData, ReportFilters, ReportType, RequirementDraft } from "@/types/phase2.types";
const json = (body: unknown, method = "POST") => ({ method, body: JSON.stringify(body), headers: { "X-Requested-With": "XMLHttpRequest" } });
const params = (values: object) => new URLSearchParams(Object.entries(values).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]));
export const phaseBase = (admin: boolean) => admin ? "/admin" : "/business";
export const phaseGet = <T,>(path: string, signal?: AbortSignal) => apiFetch<ApiSuccessEnvelope<T>>(path, { signal });
export const listDrafts = (page: number, signal?: AbortSignal) => phaseGet<Page<RequirementDraft>>(`/business/requirement-drafts?page=${page}`, signal);
export const getDraft = (id: string, signal?: AbortSignal) => phaseGet<RequirementDraft>(`/business/requirement-drafts/${encodeURIComponent(id)}`, signal);
export const saveDraft = (id: string, revision: number | null, data: DraftData) => apiFetch<ApiSuccessEnvelope<RequirementDraft>>(`/business/requirement-drafts/${encodeURIComponent(id)}`, json({ revision, data }, "PUT"));
export const deleteDraft = (id: string, revision: number) => apiFetch(`/business/requirement-drafts/${encodeURIComponent(id)}`, json({ revision }, "DELETE"));
export const submitDraft = (draft: RequirementDraft, brief: BusinessRequirementInput) => apiFetch<ApiSuccessEnvelope<BusinessRequirementReceipt>>(`/business/requirement-drafts/${encodeURIComponent(draft.id)}/submit`, json({ revision: draft.revision, brief: { ...brief, requestKey: draft.id } }));
export const getHiringBriefs = (page: number, query: string, signal?: AbortSignal) => phaseGet<HiringBriefsPage>(`/admin/requirement-jobs?${params({ page, query })}`, signal);
export const getLinkedJobs = (admin: boolean, id: string, page: number, signal?: AbortSignal) => phaseGet<LinkedJobs>(`${admin ? "/admin/requirement-jobs" : "/business/requirements"}/${encodeURIComponent(id)}${admin ? "" : "/jobs"}?page=${page}`, signal);
export const createLinkedJob = (id: string, requirementRevision: number, requestKey: string, input: JobInput) => apiFetch<ApiSuccessEnvelope<{ id: string; created: boolean }>>(`/admin/requirement-jobs/${id}/jobs`, json({ ...input, requirementRevision, requestKey }));
export const editLinkedJob = (job: LinkedJob, input: JobInput) => apiFetch(`/admin/requirement-jobs/jobs/${job.id}`, json({ ...input, revision: job.revision }, "PUT"));
export const setLinkedJobStatus = (job: LinkedJob, status: LinkedJob["status"]) => apiFetch(`/admin/requirement-jobs/jobs/${job.id}/status`, json({ revision: job.revision, status }));
export const setLinkedJobArchived = (job: LinkedJob, archived: boolean) => apiFetch(`/admin/requirement-jobs/jobs/${job.id}/archive`, json({ revision: job.revision, archived }));
export const getApprovals = (admin: boolean, values: ReportFilters & { page: number; status: string; query: string }, signal?: AbortSignal) => phaseGet<ApprovalQueue>(`${phaseBase(admin)}/attendance-approvals?${params(values)}`, signal);
export const getApproval = (admin: boolean, id: string, page: number, signal?: AbortSignal) => phaseGet<ApprovalDetail>(`${phaseBase(admin)}/attendance-approvals/${encodeURIComponent(id)}?page=${page}`, signal);
export const decideApproval = (record: ApprovalRecord, action: "APPROVED" | "CHANGES_REQUESTED", note: string) => apiFetch(`/business/attendance-approvals/${record.id}/decision`, json({ revision: record.revision, approvalRevision: record.approvalRevision, action, note }));
export const getReport = (admin: boolean, values: ReportFilters & { type: ReportType; page: number }, signal?: AbortSignal, print = false) => phaseGet<ReportData>(`${phaseBase(admin)}/reports${print ? "/print" : ""}?${params(values)}`, signal);
export async function downloadReport(admin: boolean, values: ReportFilters & { type: ReportType; page: number }, signal?: AbortSignal) {
  const response = await fetch(`/api/backend${phaseBase(admin)}/reports/export?${params(values)}`, { credentials: "include", cache: "no-store", signal });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new ApiError(body?.message || "The export could not be downloaded.", response.status); }
  const url = URL.createObjectURL(await response.blob()); const link = document.createElement("a"); link.href = url; link.download = `zobhunger-${values.type}-${values.from}-${values.to}.csv`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const getOperationsSummary = (signal?: AbortSignal) => phaseGet<OperationsSummary>("/business/operations-summary", signal);
