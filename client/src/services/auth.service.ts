import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { AuthUser } from "@/types/auth.types";

interface AuthResponse {
  user: AuthUser;
}

export async function login(email: string, password: string, mfaCode?: string) {
  return apiFetch<ApiSuccessEnvelope<AuthResponse>>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, ...(mfaCode ? { mfaCode } : {}) }),
  });
}

export async function getCurrentUser() {
  return apiFetch<ApiSuccessEnvelope<AuthResponse>>("/auth/me");
}

export async function logout() {
  return apiFetch<ApiSuccessEnvelope<{ loggedOut: boolean }>>("/auth/logout", {
    method: "POST",
  });
}

export async function placementCellLogin(email: string, password: string) {
  return apiFetch<ApiSuccessEnvelope<AuthResponse>>("/auth/placement-cell-login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}


export function beginAdminMfa() {
  return apiFetch<ApiSuccessEnvelope<{ secret: string; otpauthUri: string }>>("/auth/admin-mfa/setup", { method: "POST" });
}

export function confirmAdminMfa(code: string) {
  return apiFetch<ApiSuccessEnvelope<{ user: AuthUser; recoveryCodes: string[] }>>("/auth/admin-mfa/confirm", { method: "POST", body: JSON.stringify({ code }) });
}
