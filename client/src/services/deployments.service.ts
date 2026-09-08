import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { DeploymentDetail, DeploymentQuery, DeploymentRoster, ProgressList, ProgressQuery } from "@/types/deployments.types";

const base = (admin: boolean) => admin ? "/admin/deployments" : "/business/deployments";
export function getDeploymentRoster(admin: boolean, query: DeploymentQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({ date: query.date, page: String(query.page), query: query.query, location: query.location, status: query.status, view: query.view });
  if (query.requirementId) params.set("requirementId", query.requirementId);
  return apiFetch<ApiSuccessEnvelope<DeploymentRoster>>(`${base(admin)}?${params}`, { signal });
}
export function getDeploymentProgress(admin: boolean, query: ProgressQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({ date: query.date, page: String(query.page), query: query.query, scope: query.scope });
  if (query.requirementId) params.set("requirementId", query.requirementId);
  return apiFetch<ApiSuccessEnvelope<ProgressList>>(`${base(admin)}/progress?${params}`, { signal });
}
export function getDeployment(admin: boolean, id: string, date: string, historyPage: number, signal?: AbortSignal) {
  return apiFetch<ApiSuccessEnvelope<DeploymentDetail>>(`${base(admin)}/assignments/${encodeURIComponent(id)}?${new URLSearchParams({ date, historyPage: String(historyPage) })}`, { signal });
}
export function deploymentHref(admin: boolean, id?: string, date?: string) {
  return `${base(admin)}${id ? `${admin ? "/assignments" : ""}/${encodeURIComponent(id)}` : ""}${date ? `?date=${encodeURIComponent(date)}` : ""}`;
}
