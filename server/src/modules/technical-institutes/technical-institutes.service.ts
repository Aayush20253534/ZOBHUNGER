import { PlacementCellApplicationStatus } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { notifyTechnicalInstituteReview } from "../../services/notification.service.js";
import {
  createTechnicalInstituteApplication,
  findTechnicalInstituteApplicationForAdmin,
  listTechnicalInstituteApplicationsForAdmin,
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

  const result = await reviewTechnicalInstituteApplicationWithAudit({
    id,
    status,
    reviewNotes: input.reviewNotes,
    partnershipCode: code,
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

  if (result.kind === "updated" && current.status !== result.entity.status) {
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

  return { entity: result.entity, changed: result.kind === "updated" };
}
