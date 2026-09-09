export type UserRole = "ADMIN" | "BUSINESS" | "WORKER" | "PLACEMENT_CELL";

export interface AuthUser {
  id: string;
  partnerCode?: string | null;
  businessAccessApproved?: boolean;
  mustChangePassword?: boolean;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}
