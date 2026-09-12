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


export function disableAdminMfa(password: string, code: string) {
  return apiFetch<ApiSuccessEnvelope<{ user: AuthUser }>>("/auth/admin-mfa/disable", { method: "POST", body: JSON.stringify({ password, code }) });
}
export function rotateAdminMfa(password: string, code: string) {
  return apiFetch<ApiSuccessEnvelope<{ user: AuthUser; secret: string; otpauthUri: string }>>("/auth/admin-mfa/rotate", { method: "POST", body: JSON.stringify({ password, code }) });
}
export function changeAdminPassword(currentPassword: string, password: string) {
  return apiFetch<ApiSuccessEnvelope<{ user: AuthUser }>>("/auth/admin/change-password", { method: "POST", body: JSON.stringify({ currentPassword, password }) });
}
export function requestAdminPasswordReset(email: string) {
  return apiFetch<ApiSuccessEnvelope<{ accepted: boolean }>>("/auth/admin/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}
export function resetAdminPassword(token: string, password: string) {
  return apiFetch<ApiSuccessEnvelope<{ reset: boolean }>>("/auth/admin/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
}
