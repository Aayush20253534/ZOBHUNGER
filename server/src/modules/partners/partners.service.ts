import { randomBytes } from "node:crypto";
import { HttpError } from "../../utils/http-error.js";
import {
  createPartnerApplication,
  findPartnerApplicationUploadTarget,
  savePartnerResume,
} from "./partners.repository.js";
import type { CreatePartnerApplicationInput } from "./partners.schema.js";

const allowedResumeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function submitPartnerApplication(input: CreatePartnerApplicationInput) {
  return createPartnerApplication({
    ...input,
    resumeUploadToken: randomBytes(24).toString("hex"),
  });
}

export async function uploadPartnerResume(input: {
  id: string;
  uploadToken?: string;
  fileName?: string;
  mimeType?: string;
  body: Buffer;
}) {
  if (!input.uploadToken) {
    throw new HttpError(401, "Resume upload token is required", {
      code: "PARTNER_RESUME_TOKEN_REQUIRED",
    });
  }

  const target = await findPartnerApplicationUploadTarget(input.id, input.uploadToken);
  if (!target) {
    throw new HttpError(403, "Resume upload token is invalid or has already been used", {
      code: "PARTNER_RESUME_TOKEN_INVALID",
    });
  }

  const mimeType = input.mimeType?.split(";")[0]?.trim();
  if (!mimeType || !allowedResumeTypes.has(mimeType)) {
    throw new HttpError(415, "Resume must be a PDF, DOC or DOCX file", {
      code: "PARTNER_RESUME_TYPE_UNSUPPORTED",
    });
  }

  if (input.body.length === 0) {
    throw new HttpError(400, "Resume file is empty", {
      code: "PARTNER_RESUME_EMPTY",
    });
  }

  const fileName = (input.fileName || "resume").replace(/[\\/\r\n]/g, "_").slice(0, 180);
  return savePartnerResume(input.id, {
    fileName,
    mimeType,
    data: input.body,
  });
}
