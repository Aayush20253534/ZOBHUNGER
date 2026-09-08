import { ApiError, apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { AuthUser } from "@/types/auth.types";
import type { BusinessProfile, BusinessProfileInput, BusinessWorkspace } from "@/types/business.types";
import type { BusinessDashboardData, BusinessRequirementData, DashboardRange, RequirementFilter } from "@/types/business-dashboard.types";
import type { BusinessRequirementInput, BusinessRequirementReceipt, BusinessRequirementsData, BusinessRequirementsQuery } from "@/types/business-requirements.types";

const json = (body: unknown) => ({ method: "POST", headers: { "X-Requested-With": "XMLHttpRequest" }, body: JSON.stringify(body) });

async function businessRequest<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    return await apiFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && (!error.code || error.code === "ROUTE_NOT_FOUND")) {
      throw new ApiError(
        "The business workspace is temporarily unavailable. Please try again shortly or contact our team. If you already created an account, you can use it once access is restored.",
        404,
        "BUSINESS_API_UNAVAILABLE",
      );
    }
    throw error;
  }
}

export function businessLogin(email: string, password: string) {
  return businessRequest<ApiSuccessEnvelope<{ user: AuthUser }>>("/auth/business-login", json({ email, password }));
}
export function registerBusiness(email: string, password: string) {
  return businessRequest<ApiSuccessEnvelope<{ user: AuthUser }>>("/auth/register", json({ email, password, role: "BUSINESS" }));
}
export function getBusinessWorkspace() {
  return businessRequest<ApiSuccessEnvelope<BusinessWorkspace>>("/business/workspace");
}
export function getBusinessDashboard(query: { range: DashboardRange; status: RequirementFilter; page: number }, signal?: AbortSignal) {
  const params = new URLSearchParams({ range: String(query.range), status: query.status, page: String(query.page) });
  return businessRequest<ApiSuccessEnvelope<BusinessDashboardData>>(`/business/dashboard?${params}`, { signal });
}
export function getBusinessRequirement(id: string, signal?: AbortSignal) {
  return businessRequest<ApiSuccessEnvelope<BusinessRequirementData>>(`/business/requirements/${encodeURIComponent(id)}`, { signal });
}
export function getBusinessRequirements(query: BusinessRequirementsQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({ query: query.query, status: query.status, sort: query.sort, page: String(query.page) });
  return businessRequest<ApiSuccessEnvelope<BusinessRequirementsData>>(`/business/requirements?${params}`, { signal });
}
export function createBusinessRequirement(input: BusinessRequirementInput, requestKey: string) {
  return businessRequest<ApiSuccessEnvelope<BusinessRequirementReceipt>>("/business/requirements", json({ ...input, requestKey }));
}
export function updateBusinessRequirement(id: string, input: BusinessRequirementInput, revision: number) {
  return businessRequest<ApiSuccessEnvelope<BusinessRequirementReceipt>>(`/business/requirements/${encodeURIComponent(id)}`, { ...json({ ...input, revision }), method: "PUT" });
}
export function withdrawBusinessRequirement(id: string, revision: number, reason: string) {
  return businessRequest<ApiSuccessEnvelope<BusinessRequirementReceipt>>(`/business/requirements/${encodeURIComponent(id)}/withdraw`, json({ revision, reason }));
}
export function saveBusinessProfile(input: BusinessProfileInput) {
  return businessRequest<ApiSuccessEnvelope<{ profile: BusinessProfile }>>("/business/profile", { ...json(input), method: "PUT" });
}
export function requestBusinessRecovery(email: string) {
  return businessRequest<ApiSuccessEnvelope<{ accepted: boolean }>>("/auth/business/forgot-password", json({ email }));
}
export function resetBusinessPassword(token: string, password: string) {
  return businessRequest<ApiSuccessEnvelope<{ reset: boolean }>>("/auth/business/reset-password", json({ token, password }));
}

// Only internal, implemented destinations are accepted after authentication.
export function businessDestination(candidate: string | null) {
  return candidate && (["/business", "/business/dashboard", "/business/candidates", "/business/requirements", "/business/onboarding", "/business/company", "/business/account"].includes(candidate)
    || /^\/business\/requirements\/[a-zA-Z0-9_-]{1,64}(?:\/(?:edit|candidates))?$/.test(candidate) || /^\/business\/candidates\/[a-zA-Z0-9_-]{1,64}$/.test(candidate))
    ? candidate : "/business";
}
