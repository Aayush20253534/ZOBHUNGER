import { createHash, randomBytes } from "node:crypto";
import { PlacementCellApplicationStatus } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { hashPassword } from "../../utils/password.js";
import { HttpError } from "../../utils/http-error.js";
import { notifyTechnicalInstitutePortalAccess, notifyTechnicalInstituteReview } from "../../services/notification.service.js";
import {
  createTechnicalInstituteApplication,
  findTechnicalInstituteApplicationForAdmin,
  listTechnicalInstituteApplicationsForAdmin,
  provisionTechnicalInstitutePortalAccessWithAudit,
  reviewTechnicalInstituteApplicationWithAudit,
  technicalInstituteAdminSummary,
} from "./technical-institutes.repository.js";
import type {
  CreateTechnicalInstituteApplicationInput,
  ReviewTechnicalInstituteApplicationInput,
  TechnicalInstituteAdminListQuery,
} from "./technical-institutes.schema.js";

export function submitTechnicalInstituteApplication(input: CreateTechnicalInstituteApplicationInput) {
  return createTechnicalInstituteApplication(input);
}

export async function listTechnicalInstitutesForAdmin(filters: TechnicalInstituteAdminListQuery) {
  const { items, total } = await listTechnicalInstituteApplicationsForAdmin(filters);
  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function getTechnicalInstituteForAdmin(id: string) {
  const application = await findTechnicalInstituteApplicationForAdmin(id);
  if (!application) {
    throw new HttpError(404, "Technical institute partnership request not found", {
      code: "TECHNICAL_INSTITUTE_NOT_FOUND",
    });
  }
  return application;
}

export function getTechnicalInstituteAdminSummary() {
  return technicalInstituteAdminSummary();
}

function stateCode(state: string) {
  const words = state.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.slice(0, 3).map((word) => word[0]).join("").toUpperCase();
  return state.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase() || "IN";
}

function institutePrefix(type: string) {
  if (type === "iti") return "ITI";
  if (type === "polytechnic") return "POLY";
  return "TECH";
}

function partnershipCode(application: { id: string; institutionType: string; state: string }) {
  const suffix = application.id.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase();
  return `${institutePrefix(application.institutionType)}-${stateCode(application.state)}-${new Date().getFullYear()}-${suffix}`;
}

function portalProvisioning() {
  const rawActivationToken = randomBytes(32).toString("hex");
  return {
    rawActivationToken,
    provisioning: {
      passwordHashPromise: hashPassword(randomBytes(48).toString("base64url")),
      activationTokenHash: createHash("sha256").update(rawActivationToken).digest("hex"),
      activationExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    },
  };
}

function portalUrl(path: string) {
  const origin = (env.PUBLIC_APP_URL ?? env.CLIENT_ORIGIN.split(",")[0].trim()).replace(/\/$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function reviewTechnicalInstituteApplication(
  id: string,
  input: ReviewTechnicalInstituteApplicationInput,
  context: { actorUserId: string; ipAddress?: string; userAgent?: string },
) {
  const current = await getTechnicalInstituteForAdmin(id);
  const status = PlacementCellApplicationStatus[input.status];
  const code = status === PlacementCellApplicationStatus.APPROVED && !current.partnershipCode
    ? partnershipCode(current)
    : undefined;

  let rawActivationToken: string | undefined;
  let provisioning: { passwordHash: string; activationTokenHash: string; activationExpiresAt: Date } | undefined;
  if (status === PlacementCellApplicationStatus.APPROVED && !current.provisionedUserId) {
    const generated = portalProvisioning();
    rawActivationToken = generated.rawActivationToken;
    provisioning = {
      passwordHash: await generated.provisioning.passwordHashPromise,
      activationTokenHash: generated.provisioning.activationTokenHash,
      activationExpiresAt: generated.provisioning.activationExpiresAt,
    };
  }

  const result = await reviewTechnicalInstituteApplicationWithAudit({
    id,
    status,
    reviewNotes: input.reviewNotes,
    partnershipCode: code,
    provisioning,
    ...context,
  });

  if (result.kind === "not-found") {
    throw new HttpError(404, "Technical institute partnership request not found", {
      code: "TECHNICAL_INSTITUTE_NOT_FOUND",
    });
  }
  if (result.kind === "already-approved") {
    throw new HttpError(409, "Approved technical institute partnerships cannot be moved back into review", {
      code: "TECHNICAL_INSTITUTE_ALREADY_APPROVED",
    });
  }
  if (result.kind === "email-conflict") {
    throw new HttpError(409, "The institute email is already attached to a different ZOBHUNGER account type", {
      code: "TECHNICAL_INSTITUTE_EMAIL_CONFLICT",
    });
  }

  if (result.kind === "updated" && status === PlacementCellApplicationStatus.APPROVED && result.portalAccess) {
    const activationUrl = result.portalAccess === "ACTIVATION" && rawActivationToken
      ? portalUrl(`/technical-institute-login#activation=${encodeURIComponent(rawActivationToken)}`)
      : undefined;
    void notifyTechnicalInstitutePortalAccess({
      id: result.entity.id,
      institutionName: result.entity.institutionName,
      contactPersonName: result.entity.contactPersonName,
      officialEmail: result.entity.officialEmail,
      partnershipCode: result.entity.partnershipCode,
      activationUrl,
      existingAccount: result.portalAccess === "EXISTING_ACTIVE",
      updatedAt: result.entity.updatedAt,
    });
  } else if (result.kind === "updated" && current.status !== result.entity.status) {
    void notifyTechnicalInstituteReview({
      id: result.entity.id,
      institutionName: result.entity.institutionName,
      contactPersonName: result.entity.contactPersonName,
      officialEmail: result.entity.officialEmail,
      status: result.entity.status,
      partnershipCode: result.entity.partnershipCode,
      updatedAt: result.entity.updatedAt,
    });
  }

  const safeEntity = await getTechnicalInstituteForAdmin(id);
  return { entity: safeEntity, changed: result.kind === "updated", portalAccess: result.portalAccess ?? null };
}

export async function issueTechnicalInstitutePortalAccess(
  id: string,
  context: { actorUserId: string; ipAddress?: string; userAgent?: string },
) {
  const generated = portalProvisioning();
  const result = await provisionTechnicalInstitutePortalAccessWithAudit({
    id,
    provisioning: {
      passwordHash: await generated.provisioning.passwordHashPromise,
      activationTokenHash: generated.provisioning.activationTokenHash,
      activationExpiresAt: generated.provisioning.activationExpiresAt,
    },
    ...context,
  });
  if (result.kind === "not-found") throw new HttpError(404, "Technical institute partnership request not found", { code: "TECHNICAL_INSTITUTE_NOT_FOUND" });
  if (result.kind === "approval-required") throw new HttpError(409, "Approve the institute before issuing portal access", { code: "TECHNICAL_INSTITUTE_APPROVAL_REQUIRED" });
  if (result.kind === "email-conflict") throw new HttpError(409, "The institute email is already attached to a different ZOBHUNGER account type", { code: "TECHNICAL_INSTITUTE_EMAIL_CONFLICT" });

  const activationUrl = result.portalAccess === "ACTIVATION"
    ? portalUrl(`/technical-institute-login#activation=${encodeURIComponent(generated.rawActivationToken)}`)
    : undefined;
  await notifyTechnicalInstitutePortalAccess({
    id: result.entity.id,
    institutionName: result.entity.institutionName,
    contactPersonName: result.entity.contactPersonName,
    officialEmail: result.entity.officialEmail,
    partnershipCode: result.entity.partnershipCode,
    activationUrl,
    existingAccount: result.portalAccess === "EXISTING_ACTIVE",
    updatedAt: result.entity.updatedAt,
  });
  const safeEntity = await getTechnicalInstituteForAdmin(id);
  return { entity: safeEntity, portalAccess: result.portalAccess };
}
