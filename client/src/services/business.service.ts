import { ApiError, apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { AuthUser } from "@/types/auth.types";
import type { BusinessProfile, BusinessProfileInput, BusinessWorkspace } from "@/types/business.types";

const json = (body: unknown) => ({ method: "POST", headers: { "X-Requested-With": "XMLHttpRequest" }, body: JSON.stringify(body) });

async function businessRequest<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    return await apiFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
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
  return candidate && ["/business", "/business/onboarding", "/business/company", "/business/account"].includes(candidate)
    ? candidate : "/business";
}
