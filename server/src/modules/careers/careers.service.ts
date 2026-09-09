import { createHash, createHmac, randomUUID } from "node:crypto";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { downloadPrivateFile, uploadPrivateFile } from "../../services/private-file-storage.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import type { CareerQuery, CareerReview, CareerSubmission } from "./careers.schema.js";

const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const resumeToken = (id: string, key: string) => createHmac("sha256", env.JWT_SECRET).update(`career-resume:${id}:${key}`).digest("hex");
const resumeLimit = 2 * 1024 * 1024;
const safeSelect = {
  id: true, fullName: true, email: true, phone: true, city: true, state: true,
  preferredRole: true, experienceYears: true, education: true, workExperience: true,
  skills: true, preferredLocations: true, availability: true, portfolioUrl: true,
  coverNote: true, consentAt: true, resumeFileName: true, status: true,
  reviewNotes: true, reviewedAt: true, createdAt: true, updatedAt: true,
} satisfies Prisma.CareerApplicationSelect;
const receiptSelect = { id: true, submissionHash: true, resumeFileName: true, resumeUploadExpiresAt: true, createdAt: true } satisfies Prisma.CareerApplicationSelect;
type Receipt = Prisma.CareerApplicationGetPayload<{ select: typeof receiptSelect }>;
const uniqueConflict = (error: unknown) => Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");

export async function submitCareerProfile(input: CareerSubmission) {
  const { requestKey, consent: _consent, ...profile } = input;
  const submissionHash = sha256(JSON.stringify(profile));
  const id = randomUUID();
  const token = resumeToken(id, requestKey);
  const create = { ...profile, id, portfolioUrl: profile.portfolioUrl || null, coverNote: profile.coverNote || null,
    education: profile.education, workExperience: profile.workExperience,
    submissionKey: requestKey, submissionHash, resumeUploadTokenHash: sha256(token),
    resumeUploadExpiresAt: new Date(Date.now() + 30 * 60_000) };
  let application: Receipt | null;
  try {
    application = await prisma.careerApplication.create({ data: create, select: receiptSelect });
  } catch (error) {
    if (!uniqueConflict(error)) throw error;
    application = await prisma.careerApplication.findUnique({ where: { submissionKey: requestKey }, select: receiptSelect });
    if (!application) throw error;
  }
  if (application.submissionHash !== submissionHash) throw new HttpError(409, "This submission was already received with different details. Contact our team with your reference to amend it.", { code: "CAREER_SUBMISSION_CHANGED" });
  return {
    id: application.id, createdAt: application.createdAt,
    resumeUploaded: Boolean(application.resumeFileName),
    resumeUploadToken: application.resumeFileName ? null : resumeToken(application.id, requestKey),
    resumeUploadExpiresAt: application.resumeFileName ? null : application.resumeUploadExpiresAt,
  };
}

export function validateCareerResume(body: unknown, contentType?: string, fileName?: string) {
  if (!Buffer.isBuffer(body) || body.length === 0) throw new HttpError(400, "Choose a non-empty PDF resume", { code: "RESUME_EMPTY" });
  if (body.length > resumeLimit) throw new HttpError(413, "The resume must be 2 MB or smaller", { code: "RESUME_TOO_LARGE" });
  if (contentType?.split(";")[0].trim() !== "application/pdf" || !/^%PDF-(?:1\.[0-9]|2\.0)/.test(body.subarray(0, 8).toString("ascii")) || !body.subarray(-1024).includes(Buffer.from("%%EOF"))) {
    throw new HttpError(415, "Upload a valid PDF file. Renaming another file to .pdf does not convert it.", { code: "RESUME_TYPE_UNSUPPORTED" });
  }
  let decoded = "resume.pdf";
  try { decoded = decodeURIComponent(fileName || decoded); } catch { /* Use a safe fallback name. */ }
  const stem = decoded.replace(/\.pdf$/i, "").replace(/[\\/\r\n\u0000-\u001f\u007f"<>]/g, "_").slice(0, 150).trim() || "resume";
  return { fileName: `${stem}.pdf`, mimeType: "application/pdf", data: body, hash: sha256(body) };
}

export async function uploadCareerResume(id: string, uploadToken: string | undefined, body: unknown, contentType?: string, fileName?: string) {
  if (!uploadToken || !/^[a-f0-9]{64}$/.test(uploadToken)) throw new HttpError(403, "A valid resume upload receipt is required", { code: "RESUME_UPLOAD_UNAUTHORIZED" });
  const tokenHash = sha256(uploadToken);
  const application = await prisma.careerApplication.findFirst({ where: { id, resumeUploadTokenHash: tokenHash, resumeUploadExpiresAt: { gt: new Date() } }, select: { id: true, resumeSha256: true, resumeFileName: true } });
  if (!application) throw new HttpError(403, "The upload receipt is invalid or has expired. Your profile is saved; contact our team with your reference to add a resume.", { code: "RESUME_UPLOAD_EXPIRED" });
  const file = validateCareerResume(body, contentType, fileName);
  if (application.resumeSha256) {
    if (application.resumeSha256 !== file.hash) throw new HttpError(409, "A resume is already attached. Contact our team to replace it.", { code: "RESUME_ALREADY_ATTACHED" });
    return { id, resumeUploaded: true };
  }
  const asset = await uploadPrivateFile({ scope: "career-resumes", ownerId: id, fileName: file.fileName, mimeType: file.mimeType, buffer: file.data, sha256: file.hash });
  const changed = await prisma.careerApplication.updateMany({ where: { id, resumeUploadTokenHash: tokenHash, resumeUploadExpiresAt: { gt: new Date() }, resumeSha256: null }, data: {
    resumeFileName: file.fileName, resumeMimeType: file.mimeType, resumeSize: file.data.length, resumeData: null, resumeSha256: file.hash,
    resumeStoragePublicId: asset.publicId, resumeStorageResourceType: asset.resourceType, resumeStorageDeliveryType: asset.deliveryType,
    resumeStorageFormat: asset.format, resumeStorageVersion: asset.version, resumeStorageAssetId: asset.assetId,
    resumeUploadTokenHash: null, resumeUploadExpiresAt: null,
  } });
  if (changed.count !== 1) {
    const saved = await prisma.careerApplication.findUnique({ where: { id }, select: { resumeSha256: true } });
    if (saved?.resumeSha256 !== file.hash) throw new HttpError(409, "The resume changed during upload. Please check your submission.", { code: "RESUME_UPLOAD_CONFLICT" });
  }
  return { id, resumeUploaded: true };
}

export async function listCareerApplications(input: CareerQuery) {
  const where: Prisma.CareerApplicationWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.query ? { OR: ["fullName", "email", "city", "preferredRole"].map(field => ({ [field]: { contains: input.query, mode: "insensitive" } })) } : {}),
  };
  const [items, total, counts] = await prisma.$transaction([
    prisma.careerApplication.findMany({ where, select: safeSelect, take: 12, skip: (input.page - 1) * 12, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    prisma.careerApplication.count({ where }),
    prisma.careerApplication.groupBy({ by: ["status"], orderBy: { status: "asc" }, _count: { _all: true } }),
  ]);
  return { items, total, page: input.page, totalPages: Math.max(1, Math.ceil(total / 12)), counts: Object.fromEntries(counts.map(item => [item.status, typeof item._count === "object" ? item._count._all ?? 0 : 0])) };
}

export async function getCareerApplication(id: string) {
  const application = await prisma.careerApplication.findUnique({ where: { id }, select: safeSelect });
  if (!application) throw new HttpError(404, "Career profile not found", { code: "CAREER_APPLICATION_NOT_FOUND" });
  const history = await prisma.auditLog.findMany({ where: { entityType: "CareerApplication", entityId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 30, select: { id: true, action: true, metadata: true, createdAt: true } });
  return { ...application, history };
}

export async function reviewCareerApplication(id: string, actorUserId: string, input: CareerReview) {
  await prisma.$transaction(async tx => {
    const current = await tx.careerApplication.findUnique({ where: { id }, select: { status: true } });
    if (!current) throw new HttpError(404, "Career profile not found", { code: "CAREER_APPLICATION_NOT_FOUND" });
    const changed = await tx.careerApplication.updateMany({ where: { id, updatedAt: new Date(input.expectedUpdatedAt) }, data: { status: input.status, reviewNotes: input.notes || null, reviewedAt: new Date(), reviewedByUserId: actorUserId } });
    if (changed.count !== 1) throw new HttpError(409, "This profile changed. Refresh it before saving your review.", { code: "APPLICATION_CHANGED" });
    await tx.auditLog.create({ data: { actorUserId, action: "career.reviewed", entityType: "CareerApplication", entityId: id, metadata: { from: current.status, to: input.status, notes: input.notes } } });
  });
  return { application: await getCareerApplication(id) };
}

export async function getCareerResume(id: string, actorUserId: string) {
  const file = await prisma.careerApplication.findUnique({ where: { id }, select: { resumeData: true, resumeFileName: true, resumeMimeType: true, resumeStoragePublicId: true, resumeStorageResourceType: true, resumeStorageDeliveryType: true, resumeStorageFormat: true } });
  if (!file?.resumeFileName) throw new HttpError(404, "No resume is attached to this profile", { code: "RESUME_NOT_FOUND" });
  let bytes: Buffer;
  if (file.resumeStoragePublicId && file.resumeStorageResourceType === "raw" && file.resumeStorageDeliveryType === "authenticated" && file.resumeStorageFormat) {
    bytes = await downloadPrivateFile({ publicId: file.resumeStoragePublicId, resourceType: "raw", deliveryType: "authenticated", format: file.resumeStorageFormat }, file.resumeFileName);
  } else if (file.resumeData) {
    bytes = Buffer.from(file.resumeData);
  } else throw new HttpError(404, "No resume is attached to this profile", { code: "RESUME_NOT_FOUND" });
  await prisma.auditLog.create({ data: { actorUserId, action: "career.resume_downloaded", entityType: "CareerApplication", entityId: id } });
  return { resumeFileName: file.resumeFileName, resumeMimeType: file.resumeMimeType || "application/pdf", bytes };
}
