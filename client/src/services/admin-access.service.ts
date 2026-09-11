import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { AdminDepartment, AdminPermission } from "@/types/auth.types";

export interface AdminAccessPermissionOption {
  value: AdminPermission;
  label: string;
  description: string;
}

export interface AdminAccessDepartmentOption {
  value: Exclude<AdminDepartment, "MAIN_ADMIN">;
  label: string;
  defaultPermissions: AdminPermission[];
  permissions: AdminAccessPermissionOption[];
}

export interface AdminAccessConfig {
  departments: AdminAccessDepartmentOption[];
  permissions: AdminAccessPermissionOption[];
  invitationHours: number;
}

export type AdminAccountStatus = "ACTIVE" | "PENDING" | "DISABLED";

export interface DepartmentAdminAccount {
  id: string;
  email: string;
  department: AdminDepartment | null;
  departmentLabel: string;
  permissions: AdminPermission[];
  isActive: boolean;
  status: AdminAccountStatus;
  mfaEnabled: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  invitationExpiresAt: string | null;
  protectedAccount: boolean;
}

export interface AdminAccountPage {
  items: DepartmentAdminAccount[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminInvitationInfo {
  email: string;
  department: AdminDepartment;
  departmentLabel: string;
  expiresAt: string;
}

export function getAdminAccessConfig() {
  return apiFetch<ApiSuccessEnvelope<AdminAccessConfig>>("/admin/access/config");
}

export function listAdminAccounts(params: { query?: string; department?: AdminDepartment; status?: AdminAccountStatus } = {}) {
  const query = new URLSearchParams({ page: "1", pageSize: "50" });
  if (params.query?.trim()) query.set("query", params.query.trim());
  if (params.department) query.set("department", params.department);
  if (params.status) query.set("status", params.status);
  return apiFetch<ApiSuccessEnvelope<AdminAccountPage>>(`/admin/access/users?${query.toString()}`);
}

export function createAdminAccount(input: { email: string; department: Exclude<AdminDepartment, "MAIN_ADMIN">; permissions: AdminPermission[] }) {
  return apiFetch<ApiSuccessEnvelope<{ admin: DepartmentAdminAccount; invitationDelivered: boolean }>>("/admin/access/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminAccountAccess(id: string, input: { department: Exclude<AdminDepartment, "MAIN_ADMIN">; permissions: AdminPermission[] }) {
  return apiFetch<ApiSuccessEnvelope<DepartmentAdminAccount>>(`/admin/access/users/${encodeURIComponent(id)}/access`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updateAdminAccountStatus(id: string, isActive: boolean) {
  return apiFetch<ApiSuccessEnvelope<DepartmentAdminAccount>>(`/admin/access/users/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export function resendAdminAccountInvitation(id: string) {
  return apiFetch<ApiSuccessEnvelope<{ delivered: boolean; expiresAt: string }>>(`/admin/access/users/${encodeURIComponent(id)}/invitation`, {
    method: "POST",
  });
}

export function inspectAdminInvitation(token: string) {
  return apiFetch<ApiSuccessEnvelope<AdminInvitationInfo>>("/auth/admin-access/inspect", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function activateAdminInvitation(token: string, password: string) {
  return apiFetch<ApiSuccessEnvelope<{ email: string; department: AdminDepartment; departmentLabel: string; next: string }>>("/auth/admin-access/activate", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}
