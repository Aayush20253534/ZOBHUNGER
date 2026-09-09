import { createHash, randomBytes } from "node:crypto";
import type { z } from "zod";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { HttpError } from "../../utils/http-error.js";
import { hashPassword, verifyPasswordOrDummy } from "../../utils/password.js";
import { safeUser } from "../auth/auth.service.js";
import { markLogin } from "../auth/auth.repository.js";
import { sendWorkerAccessEmail } from "../../services/worker-email.service.js";
import { workerDestination, type workerRegisterSchema } from "./workers.schema.js";

type Purpose = "EMAIL_VERIFICATION" | "PASSWORD_RESET";
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const invalidToken = () => new HttpError(400, "This link has expired or has already been used. Request a new email.", { code: "WORKER_TOKEN_INVALID" });

export async function requestWorkerEmail(email: string, purpose: Purpose, next?: string, requestId?: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || user.role !== "WORKER" || (purpose === "EMAIL_VERIFICATION" && user.emailVerifiedAt)) return false;
  const token = randomBytes(32).toString("hex"); const tokenHash = hashToken(token);
  const createdAt = new Date(); const expiresAt = new Date(Date.now() + (purpose === "EMAIL_VERIFICATION" ? 60 : 30) * 60_000);
  const issued = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
    const current = await tx.user.findUnique({ where: { id: user.id } });
    if (!current?.isActive || current.role !== "WORKER" || (purpose === "EMAIL_VERIFICATION" && current.emailVerifiedAt)) return false;
    const previous = await tx.workerAccessToken.findUnique({ where: { userId_purpose: { userId: user.id, purpose } } });
    if (previous && createdAt.getTime() - previous.createdAt.getTime() < 60_000) return false;
    await tx.workerAccessToken.upsert({ where: { userId_purpose: { userId: user.id, purpose } },
      create: { userId: user.id, purpose, tokenHash, sessionVersion: current.sessionVersion, expiresAt, createdAt },
      update: { tokenHash, sessionVersion: current.sessionVersion, expiresAt, createdAt } });
    return true;
  });
  if (!issued) return false;
  const url = new URL(purpose === "EMAIL_VERIFICATION" ? "/worker/verify" : "/worker/reset-password", env.PUBLIC_APP_URL ?? env.CLIENT_ORIGIN.split(",")[0].trim());
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Configure PUBLIC_APP_URL as the frontend origin.");
  url.searchParams.set("next", workerDestination(next)); url.hash = new URLSearchParams({ token }).toString();
  const delivered = await sendWorkerAccessEmail(user.email, url.toString(), purpose, requestId);
  if (!delivered) await prisma.workerAccessToken.deleteMany({ where: { userId: user.id, tokenHash } });
  return delivered;
}

export async function registerWorker(input: z.infer<typeof workerRegisterSchema>, requestId?: string) {
  const passwordHash = await hashPassword(input.password);
  let user;
  try {
    user = await prisma.user.create({ data: { email: input.email, phone: input.phone, passwordHash, role: "WORKER",
      workerProfile: { create: { fullName: input.fullName, phone: input.phone, consentAt: new Date() } } } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new HttpError(409, "An account with this email or phone already exists. Sign in or recover your password.", { code: "ACCOUNT_ALREADY_REGISTERED" });
    throw error;
  }
  // Account creation has committed. A delivery/configuration failure must not
  // make the user repeat registration and lose the route to email recovery.
  let emailSent = false;
  try { emailSent = await requestWorkerEmail(user.email, "EMAIL_VERIFICATION", input.next, requestId); }
  catch { logger.warn("worker.registration_email_failed", { requestId }); }
  return { user: safeUser(user), emailSent };
}

export async function loginWorker(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  const validPassword = await verifyPasswordOrDummy(user?.passwordHash, password);
  if (!user || user.role !== "WORKER" || !validPassword) throw new HttpError(401, "Invalid worker email or password", { code: "INVALID_CREDENTIALS" });
  if (!user.isActive) throw new HttpError(403, "This worker account is inactive. Contact our team for help.", { code: "ACCOUNT_INACTIVE" });
  return safeUser(await markLogin(user.id, user.sessionVersion));
}

export async function consumeWorkerToken(token: string, purpose: Purpose, password?: string) {
  const tokenHash = hashToken(token);
  const candidate = await prisma.workerAccessToken.findUnique({ where: { tokenHash } });
  if (!candidate || candidate.purpose !== purpose || candidate.expiresAt <= new Date()) throw invalidToken();
  const passwordHash = purpose === "PASSWORD_RESET" && password ? await hashPassword(password) : null;
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${candidate.userId} FOR UPDATE`;
    const record = await tx.workerAccessToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!record || record.purpose !== purpose || record.expiresAt <= new Date() || record.user.role !== "WORKER" || !record.user.isActive || record.sessionVersion !== record.user.sessionVersion) throw invalidToken();
    const consumed = await tx.workerAccessToken.deleteMany({ where: { id: record.id, tokenHash, expiresAt: { gt: new Date() } } });
    if (consumed.count !== 1) throw invalidToken();
    if (purpose === "EMAIL_VERIFICATION") {
      await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
    } else {
      if (!passwordHash) throw invalidToken();
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } });
      await tx.workerAccessToken.deleteMany({ where: { userId: record.userId } });
    }
    await tx.auditLog.create({ data: { actorUserId: record.userId, action: purpose === "EMAIL_VERIFICATION" ? "worker.email_verified" : "worker.password_reset", entityType: "User", entityId: record.userId } });
    return { completed: true };
  });
}
