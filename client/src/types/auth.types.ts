export type UserRole = "ADMIN" | "BUSINESS" | "WORKER" | "PLACEMENT_CELL" | "TECHNICAL_INSTITUTE";

export type AdminDepartment = "MAIN_ADMIN" | "HR" | "PF_EPFO" | "ESIC" | "ACCOUNTS" | "TECHNICAL" | "PLACEMENT_CELL" | "LEGAL";

export type AdminPermission =
  | "DASHBOARD_VIEW"
  | "ENQUIRIES_MANAGE"
  | "PARTNERS_MANAGE"
  | "VENDORS_MANAGE"
  | "CAREERS_MANAGE"
  | "EMPLOYEE_JOINING_MANAGE"
  | "PF_VIEW"
  | "PF_VERIFY"
  | "PF_UPDATE"
  | "PF_EXPORT"
  | "ESIC_VIEW"
  | "ESIC_VERIFY"
  | "ESIC_UPDATE"
  | "ESIC_EXPORT"
  | "WORKERS_MANAGE"
  | "CANDIDATES_MANAGE"
  | "REQUIREMENTS_MANAGE"
  | "JOBS_MANAGE"
  | "APPLICATIONS_MANAGE"
  | "DEPLOYMENTS_MANAGE"
  | "ATTENDANCE_MANAGE"
  | "EARNINGS_MANAGE"
  | "REPORTS_VIEW"
  | "PLACEMENT_MANAGE"
  | "TECHNICAL_MANAGE"
  | "LEGAL_MANAGE"
  | "BLOGS_MANAGE"
  | "ADMIN_USERS_MANAGE"
  | "AI_ASSISTANT_MANAGE";

export interface AuthUser {
  id: string;
  partnerCode?: string | null;
  businessAccessApproved?: boolean;
  mustChangePassword?: boolean;
  adminMfaEnabled?: boolean;
  adminMfaRequired?: boolean;
  adminMfaEnrollmentRequired?: boolean;
  adminDepartment?: AdminDepartment | null;
  adminPermissions?: AdminPermission[];
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}
