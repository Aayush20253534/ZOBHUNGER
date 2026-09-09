import { prisma } from "../../config/db.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { deletePrivateFile, downloadPrivateFile, uploadPrivateFile } from "../../services/private-file-storage.js";
import { HttpError } from "../../utils/http-error.js";
import { validateCareerResume } from "../careers/careers.service.js";
import type { WorkerProfileInput } from "./workers.schema.js";

const resumeSelect = { id: true, fileName: true, mimeType: true, size: true, revision: true, updatedAt: true } satisfies Prisma.WorkerResumeSelect;
const profileSelect = {
  id: true, fullName: true, phone: true, city: true, state: true, headline: true, about: true, postalCode: true,
  languages: true, skills: true, experienceYears: true, education: true, workExperience: true,
  preferredLocations: true, preferredCategories: true, preferredEngagements: true, availability: true,
  isAvailable: true, consentAt: true, revision: true, resumeRevision: true, updatedAt: true, resume: { select: resumeSelect },
} satisfies Prisma.WorkerProfileSelect;
type Profile = Prisma.WorkerProfileGetPayload<{ select: typeof profileSelect }>;
export function workerCompletion(profile: Profile | null) {
  const checklist = [
    { id: "personal", label: "Personal details", done: Boolean(profile?.fullName && profile.phone && profile.city && profile.state) },
    { id: "education", label: "Education", done: Array.isArray(profile?.education) && profile.education.length > 0 },
    { id: "experience", label: "Experience or fresher status", done: profile?.experienceYears === 0 || Boolean(profile?.experienceYears && Array.isArray(profile.workExperience) && profile.workExperience.length) },
    { id: "skills", label: "Skills", done: Boolean(profile?.skills.length) },
    { id: "preferences", label: "Work preferences", done: Boolean(profile?.preferredLocations.length && profile.preferredCategories.length && profile.preferredEngagements.length && profile.availability) },
    { id: "resume", label: "PDF resume", done: Boolean(profile?.resume) },
  ];
  return { percent: Math.round(checklist.filter(item => item.done).length / checklist.length * 100), checklist };
}
export async function getWorkerProfile(userId: string) {
  const profile = await prisma.workerProfile.findUnique({ where: { userId }, select: profileSelect });
  return { profile, completion: workerCompletion(profile) };
}
async function lockWorker(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
  const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true, isActive: true, emailVerifiedAt: true } });
  if (!user?.isActive || user.role !== "WORKER" || !user.emailVerifiedAt) throw new HttpError(403, "Verify your worker email to continue", { code: "EMAIL_VERIFICATION_REQUIRED" });
}
export async function saveWorkerProfile(userId: string, input: WorkerProfileInput) {
  const { revision, consent: _consent, ...data } = input;
  try {
    await prisma.$transaction(async tx => {
      await lockWorker(tx, userId);
      const current = await tx.workerProfile.findUnique({ where: { userId }, select: { id: true, revision: true, consentAt: true } });
      if ((current?.revision ?? 0) !== revision) throw new HttpError(409, "Your profile changed in another tab. Reload the saved profile before making more changes.", { code: "WORKER_PROFILE_CHANGED" });
      await tx.user.update({ where: { id: userId }, data: { phone: input.phone } });
      await tx.workerProfile.upsert({ where: { userId },
        create: { ...data, userId, revision: 1, consentAt: new Date() },
        update: { ...data, revision: { increment: 1 }, consentAt: current?.consentAt ?? new Date() } });
      await tx.auditLog.create({ data: { actorUserId: userId, action: "worker.profile_saved", entityType: "User", entityId: userId } });
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new HttpError(409, "That phone number is already attached to an account. Check the number or contact support.", { code: "PHONE_ALREADY_REGISTERED" });
    throw error;
  }
  return getWorkerProfile(userId);
}

type StoredResume = { storagePublicId: string | null; storageResourceType: string | null; storageDeliveryType: string | null; storageFormat: string | null; fileName: string; mimeType: string; data: Uint8Array | null };
async function maybeDeleteOldAsset(publicId: string | null, resourceType: string | null, deliveryType: string | null, format: string | null) {
  if (!publicId || resourceType !== "raw" || deliveryType !== "authenticated" || !format) return;
  const references = await prisma.jobApplicationResume.count({ where: { storagePublicId: publicId } });
  if (references) return;
  await deletePrivateFile({ publicId, resourceType: "raw", deliveryType: "authenticated" }).catch(() => undefined);
}

export async function putWorkerResume(userId: string, revision: number, body: unknown, contentType?: string, fileName?: string) {
  const file = validateCareerResume(body, contentType, fileName);
  const preflight = await prisma.workerProfile.findUnique({ where: { userId }, select: { id: true, resumeRevision: true, resume: { select: { storagePublicId: true, storageResourceType: true, storageDeliveryType: true, storageFormat: true } } } });
  if (!preflight) throw new HttpError(409, "Save your personal details before uploading a resume", { code: "PROFILE_REQUIRED" });
  if (preflight.resumeRevision !== revision) throw new HttpError(409, "Your resume changed in another tab. Refresh its details before replacing it.", { code: "WORKER_RESUME_CHANGED" });
  const asset = await uploadPrivateFile({ scope: "worker-resumes", ownerId: preflight.id, fileName: file.fileName, mimeType: file.mimeType, buffer: file.data, sha256: file.hash });
  let previous = preflight.resume;
  try {
    await prisma.$transaction(async tx => {
      await lockWorker(tx, userId);
      const profile = await tx.workerProfile.findUnique({ where: { userId }, select: { id: true, resumeRevision: true, resume: { select: { storagePublicId: true, storageResourceType: true, storageDeliveryType: true, storageFormat: true } } } });
      if (!profile) throw new HttpError(409, "Save your personal details before uploading a resume", { code: "PROFILE_REQUIRED" });
      if (profile.resumeRevision !== revision) throw new HttpError(409, "Your resume changed in another tab. Refresh its details before replacing it.", { code: "WORKER_RESUME_CHANGED" });
      previous = profile.resume;
      const data = {
        fileName: file.fileName, mimeType: file.mimeType, size: file.data.length, sha256: file.hash, data: null, revision: profile.resumeRevision + 1,
        storagePublicId: asset.publicId, storageResourceType: asset.resourceType, storageDeliveryType: asset.deliveryType,
        storageFormat: asset.format, storageVersion: asset.version, storageAssetId: asset.assetId,
      };
      await tx.workerResume.upsert({ where: { profileId: profile.id }, create: { ...data, profileId: profile.id }, update: data });
      await tx.workerProfile.update({ where: { id: profile.id }, data: { resumeRevision: { increment: 1 } } });
      await tx.auditLog.create({ data: { actorUserId: userId, action: "worker.resume_uploaded", entityType: "WorkerProfile", entityId: profile.id } });
    });
  } catch (error) {
    if (asset.publicId !== previous?.storagePublicId) await maybeDeleteOldAsset(asset.publicId, asset.resourceType, asset.deliveryType, asset.format);
    throw error;
  }
  if (previous?.storagePublicId && previous.storagePublicId !== asset.publicId) await maybeDeleteOldAsset(previous.storagePublicId, previous.storageResourceType, previous.storageDeliveryType, previous.storageFormat);
  return getWorkerProfile(userId);
}
export async function deleteWorkerResume(userId: string, revision: number) {
  const previous = await prisma.$transaction(async tx => {
    await lockWorker(tx, userId);
    const profile = await tx.workerProfile.findUnique({ where: { userId }, select: { id: true, resumeRevision: true, resume: { select: { id: true, storagePublicId: true, storageResourceType: true, storageDeliveryType: true, storageFormat: true } } } });
    if (!profile?.resume) return null;
    if (profile.resumeRevision !== revision) throw new HttpError(409, "Your resume changed. Refresh its details before removing it.", { code: "WORKER_RESUME_CHANGED" });
    const deletedAsset = {
      storagePublicId: profile.resume.storagePublicId,
      storageResourceType: profile.resume.storageResourceType,
      storageDeliveryType: profile.resume.storageDeliveryType,
      storageFormat: profile.resume.storageFormat,
    };
    await tx.workerResume.delete({ where: { id: profile.resume.id } });
    await tx.workerProfile.update({ where: { id: profile.id }, data: { resumeRevision: { increment: 1 } } });
    await tx.auditLog.create({ data: { actorUserId: userId, action: "worker.resume_removed", entityType: "WorkerProfile", entityId: profile.id } });
    return deletedAsset;
  });
  if (previous) await maybeDeleteOldAsset(previous.storagePublicId, previous.storageResourceType, previous.storageDeliveryType, previous.storageFormat);
  return getWorkerProfile(userId);
}
export async function getWorkerResume(userId: string) {
  const file = await prisma.workerResume.findFirst({ where: { profile: { userId } }, select: { fileName: true, mimeType: true, data: true, storagePublicId: true, storageResourceType: true, storageDeliveryType: true, storageFormat: true } });
  if (!file) throw new HttpError(404, "No resume is attached to your profile", { code: "RESUME_NOT_FOUND" });
  let bytes: Buffer;
  if (file.storagePublicId && file.storageResourceType === "raw" && file.storageDeliveryType === "authenticated" && file.storageFormat) bytes = await downloadPrivateFile({ publicId: file.storagePublicId, resourceType: "raw", deliveryType: "authenticated", format: file.storageFormat }, file.fileName);
  else if (file.data) bytes = Buffer.from(file.data);
  else throw new HttpError(404, "No resume is attached to your profile", { code: "RESUME_NOT_FOUND" });
  return { fileName: file.fileName, mimeType: file.mimeType, bytes };
}
