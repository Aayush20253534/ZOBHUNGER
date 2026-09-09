import { createHash, createHmac, randomUUID } from "node:crypto";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { uploadPrivateFile } from "../../services/private-file-storage.js";
import { HttpError } from "../../utils/http-error.js";
import type { CreatePartnerApplicationInput } from "./partners.schema.js";

const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const resumeLimit = 2 * 1024 * 1024;
const tokenFor = (id: string, key: string) => createHmac("sha256", env.JWT_SECRET).update(`partner-resume:${id}:${key}`).digest("hex");
const receiptSelect = { id: true, fullName: true, email: true, createdAt: true, submissionHash: true, resumeFileName: true, resumeUploadExpiresAt: true } as const;

function uniqueConflict(error: unknown) { return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002"); }

export async function submitPartnerApplication(input: CreatePartnerApplicationInput) {
  const { requestKey, ...profile } = input;
  const id = randomUUID();
  const submissionHash = sha256(JSON.stringify(profile));
  const uploadToken = tokenFor(id, requestKey);
  const create = { ...profile, id, submissionKey: requestKey, submissionHash, resumeUploadTokenHash: sha256(uploadToken), resumeUploadExpiresAt: new Date(Date.now() + 30 * 60_000) };
  let application;
  let created = true;
  try {
    application = await prisma.partnerApplication.create({ data: create, select: receiptSelect });
  } catch (error) {
    if (!uniqueConflict(error)) throw error;
    application = await prisma.partnerApplication.findUnique({ where: { submissionKey: requestKey }, select: receiptSelect });
    if (!application) throw error;
    created = false;
  }
  if (application.submissionHash !== submissionHash) throw new HttpError(409, "This submission key was already used with different partner details. Refresh the form and try again.", { code: "PARTNER_SUBMISSION_CHANGED" });
  return {
    id: application.id,
    fullName: application.fullName,
    email: application.email,
    createdAt: application.createdAt,
    created,
    resumeUploadToken: application.resumeFileName ? null : tokenFor(application.id, requestKey),
    resumeUploadExpiresAt: application.resumeFileName ? null : application.resumeUploadExpiresAt,
  };
}

function validatePartnerResume(body: unknown, contentType?: string, fileName?: string) {
  if (!Buffer.isBuffer(body) || body.length === 0) throw new HttpError(400, "Choose a non-empty PDF resume", { code: "PARTNER_RESUME_EMPTY" });
  if (body.length > resumeLimit) throw new HttpError(413, "Resume must be 2 MB or smaller", { code: "PARTNER_RESUME_TOO_LARGE" });
  const type = contentType?.split(";")[0].trim();
  if (type !== "application/pdf" || !/^%PDF-(?:1\.[0-9]|2\.0)/.test(body.subarray(0, 8).toString("ascii")) || !body.subarray(-1024).includes(Buffer.from("%%EOF"))) {
    throw new HttpError(415, "Upload a valid PDF resume. Renaming another file to .pdf does not convert it.", { code: "PARTNER_RESUME_TYPE_UNSUPPORTED" });
  }
  let decoded = "resume.pdf";
  try { decoded = decodeURIComponent(fileName || decoded); } catch { /* safe fallback */ }
  const stem = decoded.replace(/\.pdf$/i, "").replace(/[\\/\r\n\u0000-\u001f\u007f"<>]/g, "_").slice(0, 150).trim() || "resume";
  return { fileName: `${stem}.pdf`, mimeType: "application/pdf", size: body.length, sha256: sha256(body), buffer: body };
}

export async function uploadPartnerResume(input: { id: string; uploadToken?: string; fileName?: string; mimeType?: string; body: Buffer }) {
  if (!input.uploadToken || !/^[a-f0-9]{64}$/.test(input.uploadToken)) throw new HttpError(403, "A valid resume upload receipt is required", { code: "PARTNER_RESUME_TOKEN_REQUIRED" });
  const tokenHash = sha256(input.uploadToken);
  const target = await prisma.partnerApplication.findFirst({ where: { id: input.id, resumeUploadTokenHash: tokenHash, resumeUploadExpiresAt: { gt: new Date() } }, select: { id: true, resumeSha256: true, resumeFileName: true } });
  if (!target) throw new HttpError(403, "The resume upload receipt is invalid, expired or already used", { code: "PARTNER_RESUME_TOKEN_INVALID" });
  const file = validatePartnerResume(input.body, input.mimeType, input.fileName);
  if (target.resumeSha256) {
    if (target.resumeSha256 !== file.sha256) throw new HttpError(409, "A different resume is already attached to this application", { code: "PARTNER_RESUME_ALREADY_ATTACHED" });
    return { id: input.id, resumeFileName: target.resumeFileName! };
  }
  const asset = await uploadPrivateFile({ scope: "partner-resumes", ownerId: input.id, fileName: file.fileName, mimeType: file.mimeType, buffer: file.buffer, sha256: file.sha256 });
  const changed = await prisma.partnerApplication.updateMany({
    where: { id: input.id, resumeUploadTokenHash: tokenHash, resumeUploadExpiresAt: { gt: new Date() }, resumeSha256: null },
    data: {
      resumeFileName: file.fileName, resumeMimeType: file.mimeType, resumeSize: file.size, resumeSha256: file.sha256, resumeData: null,
      resumeStoragePublicId: asset.publicId, resumeStorageResourceType: asset.resourceType, resumeStorageDeliveryType: asset.deliveryType,
      resumeStorageFormat: asset.format, resumeStorageVersion: asset.version, resumeStorageAssetId: asset.assetId,
      resumeUploadTokenHash: null, resumeUploadExpiresAt: null, resumeUploadToken: null,
    },
  });
  if (changed.count !== 1) {
    const saved = await prisma.partnerApplication.findUnique({ where: { id: input.id }, select: { resumeSha256: true, resumeFileName: true } });
    if (saved?.resumeSha256 !== file.sha256) throw new HttpError(409, "The resume changed during upload. Check the application before retrying.", { code: "PARTNER_RESUME_UPLOAD_CONFLICT" });
    return { id: input.id, resumeFileName: saved.resumeFileName! };
  }
  return { id: input.id, resumeFileName: file.fileName };
}
