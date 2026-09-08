import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { AuthUser } from "@/types/auth.types";
import type { BusinessProfile, BusinessProfileInput, BusinessWorkspace } from "@/types/business.types";

const json = (body: unknown) => ({ method: "POST", headers: { "X-Requested-With": "XMLHttpRequest" }, body: JSON.stringify(body) });

export function businessLogin(email: string, password: string) {
  return apiFetch<ApiSuccessEnvelope<{ user: AuthUser }>>("/auth/business-login", json({ email, password }));
}
export function registerBusiness(email: string, password: string) {
  return apiFetch<ApiSuccessEnvelope<{ user: AuthUser }>>("/auth/register", json({ email, password, role: "BUSINESS" }));
}
export function getBusinessWorkspace() {
  return apiFetch<ApiSuccessEnvelope<BusinessWorkspace>>("/business/workspace");
}
export function saveBusinessProfile(input: BusinessProfileInput) {
  return apiFetch<ApiSuccessEnvelope<{ profile: BusinessProfile }>>("/business/profile", { ...json(input), method: "PUT" });
}
export function requestBusinessRecovery(email: string) {
  return apiFetch<ApiSuccessEnvelope<{ accepted: boolean }>>("/auth/business/forgot-password", json({ email }));
}
export function resetBusinessPassword(token: string, password: string) {
  return apiFetch<ApiSuccessEnvelope<{ reset: boolean }>>("/auth/business/reset-password", json({ token, password }));
}

// Only internal, implemented destinations are accepted after authentication.
export function businessDestination(candidate: string | null) {
  return candidate && ["/business", "/business/onboarding", "/business/company", "/business/account"].includes(candidate)
    ? candidate : "/business";
}
