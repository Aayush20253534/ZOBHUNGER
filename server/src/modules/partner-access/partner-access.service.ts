import { randomBytes } from "node:crypto";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { hashPassword } from "../../utils/password.js";
import { HttpError } from "../../utils/http-error.js";
import { sendCorporateEmail } from "../../services/email.service.js";
import { notifyPartnerApplicationStatus } from "../../services/notification.service.js";
import type { PartnerReviewInput, PartnerReviewQuery } from "./partner-access.schema.js";

const partnerSelect = {
  id: true, fullName: true, mobileNumber: true, email: true, companyName: true,
  currentCity: true, currentProfession: true, totalExperienceYears: true,
  specialization: true, industryExperience: true, linkedInUrl: true,
  contributionPreference: true, expertiseDescription: true, professionalNetwork: true,
  preferredPartnershipArea: true, resumeFileName: true, status: true,
  reviewNotes: true, reviewedAt: true, credentialsIssuedAt: true, credentialsEmailStatus: true,
  createdAt: true, updatedAt: true,
  provisionedUser: { select: { partnerCode: true, mustChangePassword: true, temporaryPasswordExpiresAt: true, isActive: true } },
} satisfies Prisma.PartnerApplicationSelect;

const conflict = () => new HttpError(409, "This application changed. Refresh it before saving your review.", { code: "APPLICATION_CHANGED" });
const missing = () => new HttpError(404, "Partner application not found", { code: "PARTNER_APPLICATION_NOT_FOUND" });

export async function listPartnerReviews(input: PartnerReviewQuery) {
  const where: Prisma.PartnerApplicationWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.query ? { OR: ["fullName", "email", "companyName", "currentCity"].map(field => ({ [field]: { contains: input.query, mode: "insensitive" } })) } : {}),
  };
  const [items, total, counts] = await prisma.$transaction([
    prisma.partnerApplication.findMany({ where, select: partnerSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 12, skip: (input.page - 1) * 12 }),
    prisma.partnerApplication.count({ where }),
    prisma.partnerApplication.groupBy({ by: ["status"], orderBy: { status: "asc" }, _count: { _all: true } }),
  ]);
  return { items, total, page: input.page, totalPages: Math.max(1, Math.ceil(total / 12)), counts: Object.fromEntries(counts.map(item => [item.status, typeof item._count === "object" ? item._count._all ?? 0 : 0])) };
}

export async function getPartnerReview(id: string) {
  const application = await prisma.partnerApplication.findUnique({ where: { id }, select: partnerSelect });
  if (!application) throw missing();
  const history = await prisma.auditLog.findMany({ where: { entityType: "PartnerApplication", entityId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 30, select: { id: true, action: true, metadata: true, createdAt: true } });
  return { ...application, history };
}

function newCredentials() {
  return { partnerCode: `ZB-${randomBytes(8).toString("hex").toUpperCase()}`, temporaryPassword: `Zh!${randomBytes(18).toString("base64url")}7aA` };
}

async function issueEmail(id: string, email: string, partnerCode: string, temporaryPassword: string, issuedAt: Date) {
  const loginUrl = new URL("/business/login", env.PUBLIC_APP_URL ?? env.CLIENT_ORIGIN.split(",")[0].trim()).toString();
  const expiresAt = new Date(issuedAt.getTime() + 72 * 60 * 60_000);
  const emailAccepted = await sendCorporateEmail({
    to: email,
    subject: "Your approved ZOBHUNGER business account",
    replyTo: env.SALES_TEAM_EMAIL,
    idempotencyKey: `partner-${id}-credentials-${issuedAt.getTime()}`,
    content: {
      eyebrow: "Business access approved",
      title: "Your ZOBHUNGER business workspace is ready",
      intro: "Your partnership application has been approved and temporary business credentials have been issued.",
      details: [
        { label: "Partner ID", value: partnerCode },
        { label: "Temporary password", value: temporaryPassword },
        { label: "Password expires", value: expiresAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) },
      ],
      action: { label: "Open business login", url: loginUrl },
      paragraphs: ["Sign in with the temporary password and change it immediately before opening the business workspace."],
      note: "Keep these credentials private. ZOBHUNGER staff will never ask you to send this temporary password back by email.",
      signoff: "ZOBHUNGER Business Operations",
    },
  });
  await prisma.partnerApplication.updateMany({ where: { id, credentialsIssuedAt: issuedAt }, data: { credentialsEmailStatus: emailAccepted ? "ACCEPTED" : "FAILED" } });
  // The secret exists only in this response and the requested email, never in logs or plaintext database fields.
  return { partnerCode, temporaryPassword, expiresAt, loginUrl, emailAccepted };
}

export async function reviewPartner(id: string, actorUserId: string, input: PartnerReviewInput) {
  const credentials = input.status === "APPROVED" ? newCredentials() : null;
  const passwordHash = credentials ? await hashPassword(credentials.temporaryPassword) : null;
  const issuedAt = new Date();
  let result;
  try {
    result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "PartnerApplication" WHERE "id" = ${id} FOR UPDATE`;
      const current = await tx.partnerApplication.findUnique({ where: { id } });
      if (!current) throw missing();
      if (current.status === "APPROVED") {
        if (input.status === "APPROVED") return { created: false, email: current.email, partnerCode: null };
        throw new HttpError(409, "An approved account cannot be moved back through application review", { code: "PARTNER_ALREADY_APPROVED" });
      }
      if (current.updatedAt.toISOString() !== input.expectedUpdatedAt) throw conflict();
      let provisionedUserId: string | undefined;
      let partnerCode: string | null = null;
      if (credentials && passwordHash) {
        if (["REJECTED", "CLOSED"].includes(current.status)) throw new HttpError(409, "Move this application to reviewed before approving it", { code: "PARTNER_REVIEW_REQUIRED" });
        // Serialize approvals for the same email, including applications with different IDs.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${current.email}))::text`;
        const existing = await tx.user.findUnique({ where: { email: current.email } });
        if (existing && (existing.role !== "BUSINESS" || existing.businessAccessApproved || !existing.isActive)) {
          throw new HttpError(409, "This email already belongs to an approved, inactive or different type of account. Resolve the account with the applicant before approving.", { code: "PARTNER_EMAIL_CONFLICT" });
        }
        partnerCode = existing?.partnerCode ?? credentials.partnerCode;
        const access = { partnerCode, passwordHash, businessAccessApproved: true, mustChangePassword: true, temporaryPasswordExpiresAt: new Date(issuedAt.getTime() + 72 * 60 * 60_000) };
        const user = existing
          ? await tx.user.update({ where: { id: existing.id }, data: { ...access, sessionVersion: { increment: 1 } } })
          : await tx.user.create({ data: { email: current.email, role: "BUSINESS", ...access } });
        provisionedUserId = user.id;
        await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
        await tx.businessProfile.upsert({ where: { userId: user.id }, update: {}, create: {
          userId: user.id, companyName: current.companyName, contactPerson: current.fullName,
          phone: current.mobileNumber, city: current.currentCity,
        } });
      }
      await tx.partnerApplication.update({ where: { id }, data: {
        status: input.status, reviewNotes: input.notes || null, reviewedByUserId: actorUserId, reviewedAt: issuedAt,
        ...(provisionedUserId ? { provisionedUserId, credentialsIssuedAt: issuedAt, credentialsEmailStatus: "PENDING" } : {}),
      } });
      await tx.auditLog.create({ data: { actorUserId, action: credentials ? "partner.approved" : "partner.reviewed", entityType: "PartnerApplication", entityId: id, metadata: { from: current.status, to: input.status, notes: input.notes } } });
      return { created: Boolean(provisionedUserId), email: current.email, partnerCode };
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new HttpError(409, "An account was created concurrently. Refresh and try again.", { code: "PARTNER_ACCOUNT_CONFLICT" });
    throw error;
  }
  const access = result.created && credentials && result.partnerCode
    ? await issueEmail(id, result.email, result.partnerCode, credentials.temporaryPassword, issuedAt) : null;
  const application = await getPartnerReview(id);
  if (!access && input.status !== "APPROVED") void notifyPartnerApplicationStatus({ id: application.id, fullName: application.fullName, email: application.email, status: application.status, updatedAt: application.updatedAt });
  return { application, credentials: access };
}

export async function reissuePartnerCredentials(id: string, actorUserId: string, expectedUpdatedAt: string) {
  const credentials = newCredentials();
  const passwordHash = await hashPassword(credentials.temporaryPassword);
  const issuedAt = new Date();
  const account = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "PartnerApplication" WHERE "id" = ${id} FOR UPDATE`;
    const application = await tx.partnerApplication.findUnique({ where: { id }, include: { provisionedUser: true } });
    if (!application) throw missing();
    if (application.updatedAt.toISOString() !== expectedUpdatedAt) throw conflict();
    const user = application.provisionedUser;
    if (application.status !== "APPROVED" || !user?.partnerCode || !user.isActive || !user.businessAccessApproved || !user.mustChangePassword) {
      throw new HttpError(409, "Temporary credentials can only be reissued before the approved partner finishes password setup. Active partners can use password recovery.", { code: "PARTNER_REISSUE_UNAVAILABLE" });
    }
    const changed = await tx.user.updateMany({ where: { id: user.id, sessionVersion: user.sessionVersion, mustChangePassword: true }, data: { passwordHash, temporaryPasswordExpiresAt: new Date(issuedAt.getTime() + 72 * 60 * 60_000), sessionVersion: { increment: 1 } } });
    if (changed.count !== 1) throw conflict();
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await tx.partnerApplication.update({ where: { id }, data: { credentialsIssuedAt: issuedAt, credentialsEmailStatus: "PENDING" } });
    await tx.auditLog.create({ data: { actorUserId, action: "partner.credentials_reissued", entityType: "PartnerApplication", entityId: id } });
    return { email: user.email, partnerCode: user.partnerCode };
  });
  const access = await issueEmail(id, account.email, account.partnerCode, credentials.temporaryPassword, issuedAt);
  return { application: await getPartnerReview(id), credentials: access };
}
