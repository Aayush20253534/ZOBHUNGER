export type UserRole = "ADMIN" | "BUSINESS" | "WORKER" | "PLACEMENT_CELL";

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}
