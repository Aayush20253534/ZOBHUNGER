export type UserRole = "ADMIN" | "BUSINESS" | "WORKER";

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
