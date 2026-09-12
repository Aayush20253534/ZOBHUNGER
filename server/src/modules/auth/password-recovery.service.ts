import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http-error.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { sendBusinessRecoveryEmail } from "../../services/email.service.js";

export function hashRecoveryToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function recoveryLink(token: string) {
  const url = new URL("/business/reset-password", env.PUBLIC_APP_URL ?? env.CLIENT_ORIGIN.split(",")[0].trim());
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid recovery frontend URL");
  // A URL fragment stays out of HTTP request paths, analytics query strings and referrers.
  url.hash = new URLSearchParams({ token }).toString();
  return url.toString();
}

export async function requestBusinessRecovery(email: string, requestId?: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || user.role !== "BUSINESS" || !user.businessAccessApproved) return;
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashRecoveryToken(token);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 30 * 60_000);
  const issued = await prisma.$transaction(async (tx) => {
    // Serialize issuance per account so concurrent requests cannot bypass the cooldown.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
    const previous = await tx.passwordResetToken.findUnique({ where: { userId: user.id } });
    if (previous && createdAt.getTime() - previous.createdAt.getTime() < 60_000) return false;
    await tx.passwordResetToken.upsert({
      where: { userId: user.id },
      create: { userId: user.id, tokenHash, expiresAt, createdAt },
      update: { tokenHash, expiresAt, createdAt },
    });
    return true;
  });
  if (!issued) return;
  if (!(await sendBusinessRecoveryEmail(user.email, recoveryLink(token), requestId))) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, tokenHash } });
  }
}

export async function resetBusinessPassword(token: string, password: string) {
  const tokenHash = hashRecoveryToken(token);
  const passwordHash = await hashPassword(password);
  return prisma.$transaction(async (tx) => {
    const invalid = () => new HttpError(400, "This recovery link has expired or has already been used. Request a new link.", { code: "INVALID_RESET_TOKEN" });
    const candidate = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!candidate) throw invalid();
    // Match issuance lock order (user, then token) and recheck after acquiring it.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${candidate.userId} FOR UPDATE`;
    const record = await tx.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
    const now = new Date();
    if (!record || record.expiresAt <= now || !record.user.isActive || record.user.role !== "BUSINESS" || !record.user.businessAccessApproved) throw invalid();
    if (record.user.mustChangePassword && await verifyPassword(record.user.passwordHash, password)) throw new HttpError(400, "Choose a different password from your temporary password", { code: "PASSWORD_REUSED" });
    const consumed = await tx.passwordResetToken.deleteMany({ where: { id: record.id, tokenHash, expiresAt: { gt: now } } });
    if (consumed.count !== 1) throw invalid();
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash, mustChangePassword: false, temporaryPasswordExpiresAt: null, sessionVersion: { increment: 1 } } });
    await tx.auditLog.create({ data: { actorUserId: record.userId, action: "business.password_reset", entityType: "User", entityId: record.userId } });
    return { reset: true };
  });
}

export function adminRecoveryLink(token: string) {
  const url = new URL("/reset-password", env.PUBLIC_APP_URL ?? env.CLIENT_ORIGIN.split(",")[0].trim());
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid recovery frontend URL");
  url.hash = new URLSearchParams({ token }).toString();
  return url.toString();
}

export async function requestAdminRecovery(email: string, requestId?: string) {
  const { sendAdminRecoveryEmail } = await import("../../services/email.service.js");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || user.role !== "ADMIN") return;
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashRecoveryToken(token);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 30 * 60_000);
  const issued = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
    const previous = await tx.passwordResetToken.findUnique({ where: { userId: user.id } });
    if (previous && createdAt.getTime() - previous.createdAt.getTime() < 60_000) return false;
    await tx.passwordResetToken.upsert({
      where: { userId: user.id },
      create: { userId: user.id, tokenHash, expiresAt, createdAt },
      update: { tokenHash, expiresAt, createdAt },
    });
    return true;
  });
  if (!issued) return;
  if (!(await sendAdminRecoveryEmail(user.email, adminRecoveryLink(token), requestId))) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, tokenHash } });
  }
}

export async function resetAdminPassword(token: string, password: string) {
  const tokenHash = hashRecoveryToken(token);
  const passwordHash = await hashPassword(password);
  return prisma.$transaction(async tx => {
    const invalid = () => new HttpError(400, "This recovery link has expired or has already been used. Request a new link.", { code: "INVALID_RESET_TOKEN" });
    const candidate = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!candidate) throw invalid();
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${candidate.userId} FOR UPDATE`;
    const record = await tx.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
    const now = new Date();
    if (!record || record.expiresAt <= now || !record.user.isActive || record.user.role !== "ADMIN") throw invalid();
    if (await verifyPassword(record.user.passwordHash, password)) throw new HttpError(400, "Choose a different password from your current password", { code: "PASSWORD_REUSED" });
    const consumed = await tx.passwordResetToken.deleteMany({ where: { id: record.id, tokenHash, expiresAt: { gt: now } } });
    if (consumed.count !== 1) throw invalid();
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } });
    await tx.auditLog.create({ data: { actorUserId: record.userId, action: "admin.password_reset", entityType: "User", entityId: record.userId } });
    return { reset: true };
  });
}
