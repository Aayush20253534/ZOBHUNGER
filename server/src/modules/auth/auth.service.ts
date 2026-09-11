import { HttpError } from "../../utils/http-error.js";
import { hashPassword, verifyPassword, verifyPasswordOrDummy } from "../../utils/password.js";
import type { BusinessLoginInput, LoginInput, RegisterInput } from "./auth.schema.js";
import { findUserByEmail, findUserById, findUserByPartnerCode, markLogin } from "./auth.repository.js";
import { prisma } from "../../config/db.js";
import { verifyAdminMfaForLogin } from "./admin-mfa.service.js";
import type { AdminDepartment, AdminPermission } from "../../generated/prisma/client.js";

export function safeUser(user: { id: string; email: string; phone: string | null; role: unknown; isActive: boolean; emailVerifiedAt: Date | null; lastLoginAt: Date | null; createdAt: Date; sessionVersion: number; partnerCode?: string | null; businessAccessApproved?: boolean; mustChangePassword?: boolean; temporaryPasswordExpiresAt?: Date | null; adminMfaEnabledAt?: Date | null; adminDepartment?: AdminDepartment | null; adminPermissions?: AdminPermission[] }) {
  return {
    id: user.id, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive,
    emailVerifiedAt: user.emailVerifiedAt, lastLoginAt: user.lastLoginAt, createdAt: user.createdAt,
    sessionVersion: user.sessionVersion, partnerCode: user.partnerCode ?? null,
    businessAccessApproved: user.businessAccessApproved ?? false, mustChangePassword: user.mustChangePassword ?? false,
    temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt ?? null, adminMfaEnabled: Boolean(user.adminMfaEnabledAt),
    adminDepartment: user.adminDepartment ?? null, adminPermissions: user.adminPermissions ?? [],
  };
}

export function assertBusinessAccountAccess(user: { role: unknown; businessAccessApproved?: boolean; mustChangePassword?: boolean; temporaryPasswordExpiresAt?: Date | null }) {
  if (user.role !== "BUSINESS") return;
  if (!user.businessAccessApproved) throw new HttpError(403, "Business access requires approval. Submit your business requirement or onboarding details for our team to review first.", { code: "BUSINESS_APPROVAL_REQUIRED" });
  if (user.mustChangePassword && (!user.temporaryPasswordExpiresAt || user.temporaryPasswordExpiresAt <= new Date())) {
    throw new HttpError(401, "Your temporary password has expired. Request a password recovery email or contact our team for fresh credentials.", { code: "TEMPORARY_PASSWORD_EXPIRED" });
  }
}

export async function registerUser(input: RegisterInput): Promise<never> {
  if (input.role === "BUSINESS") {
    throw new HttpError(403, "Business accounts are issued only after the submitted business requirement or onboarding request is reviewed and approved by our team.", { code: "BUSINESS_APPROVAL_REQUIRED" });
  }
  throw new HttpError(403, "Worker self-registration is closed. Submit your profile for review first; approved workers receive next-step communication from our team.", { code: "WORKER_REVIEW_REQUIRED" });
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  const validPassword = await verifyPasswordOrDummy(user?.passwordHash, input.password);
  if (!user || !validPassword) throw new HttpError(401, "Invalid email or password", { code: "INVALID_CREDENTIALS" });
  if (!user.isActive) throw new HttpError(403, "This account is inactive", { code: "ACCOUNT_INACTIVE" });
  assertBusinessAccountAccess(user);
  if (user.role === "ADMIN") await verifyAdminMfaForLogin(user.id, input.mfaCode);
  const updated = await markLogin(user.id, user.sessionVersion);
  return safeUser(updated);
}

export async function getAuthenticatedUser(id: string, sessionVersion?: number) {
  const user = await findUserById(id);
  if (!user || !user.isActive) throw new HttpError(401, "Authentication required", { code: "UNAUTHENTICATED" });
  if (sessionVersion !== undefined && user.sessionVersion !== sessionVersion) throw new HttpError(401, "Your session has ended. Please sign in again", { code: "SESSION_EXPIRED" });
  assertBusinessAccountAccess(user);
  return safeUser(user);
}

export async function loginPlacementCellUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  const validPassword = await verifyPasswordOrDummy(user?.passwordHash, input.password);
  if (!user || !validPassword) throw new HttpError(401, "Invalid email or password", { code: "INVALID_CREDENTIALS" });
  if (user.role !== "PLACEMENT_CELL") throw new HttpError(403, "This login is reserved for approved institution partners", { code: "PLACEMENT_CELL_LOGIN_REQUIRED" });
  if (!user.isActive) throw new HttpError(403, "Activate your approved institution partner account before signing in", { code: "PLACEMENT_CELL_ACCOUNT_INACTIVE" });
  const updated = await markLogin(user.id, user.sessionVersion);
  return safeUser(updated);
}

export async function loginBusinessUser(input: BusinessLoginInput) {
  const user = input.identifier.includes("@")
    ? await findUserByEmail(input.identifier.toLowerCase())
    : await findUserByPartnerCode(input.identifier.toUpperCase());
  const validPassword = await verifyPasswordOrDummy(user?.passwordHash, input.password);
  if (!user || !validPassword) throw new HttpError(401, "Invalid Partner ID, email or password", { code: "INVALID_CREDENTIALS" });
  if (user.role !== "BUSINESS") throw new HttpError(403, "Use a business account to access this workspace", { code: "BUSINESS_ACCOUNT_REQUIRED" });
  if (!user.isActive) throw new HttpError(403, "This account is inactive", { code: "ACCOUNT_INACTIVE" });
  assertBusinessAccountAccess(user);
  return safeUser(await markLogin(user.id, user.sessionVersion));
}

export async function changeBusinessPassword(id: string, currentPassword: string, password: string) {
  const user = await findUserById(id);
  if (!user || !user.isActive || user.role !== "BUSINESS") throw new HttpError(401, "Please sign in to your business account", { code: "UNAUTHENTICATED" });
  assertBusinessAccountAccess(user);
  if (!(await verifyPassword(user.passwordHash, currentPassword))) throw new HttpError(400, "The current password is incorrect", { code: "CURRENT_PASSWORD_INVALID" });
  if (await verifyPassword(user.passwordHash, password)) throw new HttpError(400, "Choose a different password from your current or temporary password", { code: "PASSWORD_REUSED" });
  const passwordHash = await hashPassword(password);
  return prisma.$transaction(async tx => {
    const updated = await tx.user.updateMany({
      where: { id, sessionVersion: user.sessionVersion, isActive: true, businessAccessApproved: true },
      data: { passwordHash, mustChangePassword: false, temporaryPasswordExpiresAt: null, sessionVersion: { increment: 1 } },
    });
    if (updated.count !== 1) throw new HttpError(409, "Your account changed. Please sign in again.", { code: "ACCOUNT_CHANGED" });
    await tx.passwordResetToken.deleteMany({ where: { userId: id } });
    await tx.auditLog.create({ data: { actorUserId: id, action: "business.password_changed", entityType: "User", entityId: id } });
    return safeUser((await tx.user.findUniqueOrThrow({ where: { id } })));
  });
}
