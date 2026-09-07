import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { AuthUser } from "@/types/auth.types";

interface AuthResponse {
  user: AuthUser;
}

export async function login(email: string, password: string) {
  return apiFetch<ApiSuccessEnvelope<AuthResponse>>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
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
