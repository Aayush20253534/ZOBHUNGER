import { prisma } from "../../config/db.js";
import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { lockAvailableJob } from "../jobs/job-availability.js";
import { liveWorkerJobWhere } from "./worker-jobs.service.js";
import { applicationEvent, lockApplication } from "./worker-workflow.guards.js";
import { applicationStages, type ApplyForJobInput, type WorkerApplicationQuery } from "./worker-workflow.schema.js";

const missing = () => new HttpError(404, "This application is not available in your workspace.", { code: "APPLICATION_NOT_FOUND" });
const changed = () => new HttpError(409, "This application changed. Refresh it before continuing.", { code: "APPLICATION_CHANGED" });
const pageSize = 9;
const candidateSelect = { id: true, status: true, revokedAt: true, requirement: { select: { companyName: true } }, assignment: { select: { id: true, cancelledAt: true, startDate: true, endDate: true } } } satisfies Prisma.BusinessCandidateSelect;
const applicationSelect = {
  id: true, jobId: true, name: true, email: true, phone: true, city: true, experience: true, availableFrom: true,
  message: true, status: true, revision: true, withdrawnAt: true, withdrawalReason: true, consentAt: true,
  jobSnapshot: true, createdAt: true, updatedAt: true, businessCandidates: { select: candidateSelect },
  submittedResume: { select: { fileName: true, size: true } },
} satisfies Prisma.JobApplicationSelect;
type Application = Prisma.JobApplicationGetPayload<{ select: typeof applicationSelect }>;
type Stage = typeof applicationStages[number];
const activeCandidate = { revokedAt: null };
const assigned: Prisma.JobApplicationWhereInput = { businessCandidates: { some: { assignment: { is: { cancelledAt: null } } } } };
const candidateStatus = (status: "SELECTED" | "INTERVIEW_REQUESTED" | "SHORTLISTED"): Prisma.JobApplicationWhereInput => ({ businessCandidates: { some: { ...activeCandidate, status } } });
const selected = candidateStatus("SELECTED"), interview = candidateStatus("INTERVIEW_REQUESTED");
const shortlist: Prisma.JobApplicationWhereInput = { OR: [{ status: "SHORTLISTED" }, candidateStatus("SHORTLISTED")] };
const reviewed: Prisma.JobApplicationWhereInput = { OR: [{ status: "REVIEWED" }, { businessCandidates: { some: { ...activeCandidate, status: { not: "REJECTED" } } } }] };
const rejected: Prisma.JobApplicationWhereInput = { OR: [{ status: "REJECTED" }, { businessCandidates: { some: activeCandidate, every: { OR: [{ revokedAt: { not: null } }, { status: "REJECTED" }] } } }] };
const precedence = [assigned, selected, interview, shortlist, reviewed, rejected];
const stages: Stage[] = ["ASSIGNED", "SELECTED", "INTERVIEW_REQUESTED", "SHORTLISTED", "REVIEWED", "REJECTED"];
function stageWhere(stage: Stage): Prisma.JobApplicationWhereInput {
  if (stage === "WITHDRAWN") return { withdrawnAt: { not: null } };
  const index = stages.indexOf(stage);
  return { withdrawnAt: null, AND: index < 0 ? [{ NOT: { OR: precedence } }] : [precedence[index], ...(index ? [{ NOT: { OR: precedence.slice(0, index) } }] : [])] };
}
export function applicationStage(row: Application): Stage {
  if (row.withdrawnAt) return "WITHDRAWN";
  if (row.businessCandidates.some(candidate => candidate.assignment && !candidate.assignment.cancelledAt)) return "ASSIGNED";
  const live = row.businessCandidates.filter(candidate => !candidate.revokedAt);
  if (live.some(candidate => candidate.status === "SELECTED")) return "SELECTED";
  if (live.some(candidate => candidate.status === "INTERVIEW_REQUESTED")) return "INTERVIEW_REQUESTED";
  if (row.status === "SHORTLISTED" || live.some(candidate => candidate.status === "SHORTLISTED")) return "SHORTLISTED";
  if (row.status === "REVIEWED" || live.some(candidate => candidate.status !== "REJECTED")) return "REVIEWED";
  if (row.status === "REJECTED" || (live.length > 0 && live.every(candidate => candidate.status === "REJECTED"))) return "REJECTED";
  return "SUBMITTED";
}
function snapshotObject(value: Prisma.JsonValue | null) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function dto(row: Application) {
  const { businessCandidates, jobSnapshot, ...data } = row;
  const snapshot = snapshotObject(jobSnapshot);
  const job = { title: typeof snapshot.title === "string" ? snapshot.title : "Previously submitted role", location: typeof snapshot.location === "string" ? snapshot.location : row.city || "Location to confirm", category: typeof snapshot.category === "string" ? snapshot.category : "Work opportunity", engagementType: typeof snapshot.engagementType === "string" ? snapshot.engagementType : "To be confirmed", slug: typeof snapshot.slug === "string" ? snapshot.slug : null };
  return { ...data, job, stage: applicationStage(row), canWithdraw: !row.withdrawnAt && row.status !== "REJECTED" && !businessCandidates.some(candidate => candidate.assignment && !candidate.assignment.cancelledAt),
    hiringReviews: businessCandidates.filter(candidate => !candidate.revokedAt).map(candidate => ({ company: candidate.requirement.companyName, status: candidate.status, assignmentId: candidate.assignment?.id ?? null })) };
}
export async function submitWorkerApplication(userId: string, jobId: string, input: ApplyForJobInput) {
  try {
    return await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true, isActive: true, role: true, emailVerifiedAt: true } });
      if (!user?.isActive || user.role !== "WORKER" || !user.emailVerifiedAt) throw new HttpError(403, "Verify your worker email to apply.", { code: "EMAIL_VERIFICATION_REQUIRED" });
      const existing = await tx.jobApplication.findUnique({ where: { jobId_workerUserId: { jobId, workerUserId: userId } }, select: { id: true } });
      if (existing) return { id: existing.id, created: false };
      await lockAvailableJob(tx, jobId);
      const job = await tx.job.findFirst({ where: { id: jobId, AND: [liveWorkerJobWhere()] }, select: { id: true, slug: true, title: true, location: true, city: true, category: true, engagementType: true, description: true, responsibilities: true, requirements: true, compensation: true } });
      if (!job) throw new HttpError(404, "This job is no longer accepting applications.", { code: "JOB_NOT_FOUND" });
      // An email-only historical submission is never treated as proof of account ownership.
      if (await tx.jobApplication.findUnique({ where: { jobId_email: { jobId, email: user.email } }, select: { id: true } })) throw new HttpError(409, "An earlier submission exists for this job and email. Contact our team to review it; it is not automatically attached to this account.", { code: "EXISTING_PUBLIC_APPLICATION" });
      const profile = await tx.workerProfile.findUnique({ where: { userId }, include: { resume: true } });
      if (!profile?.fullName || !profile.phone || !profile.city || !profile.state) throw new HttpError(400, "Save your name, phone, city and state in your profile before applying.", { code: "PROFILE_INCOMPLETE" });
      if (profile.revision !== input.profileRevision || (input.includeResume && profile.resumeRevision !== input.resumeRevision)) throw new HttpError(409, "Your profile or CV changed. Reload the application preview before submitting.", { code: "APPLICATION_PROFILE_CHANGED" });
      if (input.includeResume && !profile.resume) throw new HttpError(400, "Upload a PDF CV first, or choose to apply without a CV.", { code: "RESUME_REQUIRED" });
      if (input.includeResume && profile.resume && !profile.resume.storagePublicId) throw new HttpError(503, "Your existing CV is awaiting secure-storage migration. Retry after the deployment migration completes.", { code: "FILE_STORAGE_MIGRATION_REQUIRED" });
      const snapshot = { fullName: profile.fullName, headline: profile.headline, about: profile.about, city: profile.city, state: profile.state, postalCode: profile.postalCode, skills: profile.skills, languages: profile.languages, experienceYears: profile.experienceYears, education: profile.education, workExperience: profile.workExperience, preferredLocations: profile.preferredLocations, preferredCategories: profile.preferredCategories, preferredEngagements: profile.preferredEngagements, availability: profile.availability } as Prisma.InputJsonObject;
      const application = await tx.jobApplication.create({ data: { jobId, workerUserId: userId, name: profile.fullName, email: user.email, phone: profile.phone, city: profile.city,
        experience: profile.experienceYears === null ? profile.headline : profile.experienceYears === 0 ? "Fresher" : `${profile.experienceYears} years of experience`,
        availableFrom: input.availableFrom ? new Date(`${input.availableFrom}T00:00:00Z`) : null, message: input.message, consentAt: new Date(), profileSnapshot: snapshot,
        jobSnapshot: { ...job, searchText: `${job.title} ${job.location} ${job.category}`.toLowerCase() },
        workerEvents: { create: { kind: "SUBMITTED", stage: "SUBMITTED", title: "Application submitted", message: "Your profile was sent to the ZOBHUNGER hiring team." } },
        ...(input.includeResume && profile.resume ? { submittedResume: { create: {
          fileName: profile.resume.fileName, mimeType: profile.resume.mimeType, size: profile.resume.size, sha256: profile.resume.sha256, data: null,
          storagePublicId: profile.resume.storagePublicId, storageResourceType: profile.resume.storageResourceType,
          storageDeliveryType: profile.resume.storageDeliveryType, storageFormat: profile.resume.storageFormat,
          storageVersion: profile.resume.storageVersion, storageAssetId: profile.resume.storageAssetId,
        } } } : {}),
      }, select: { id: true } });
      await tx.auditLog.create({ data: { actorUserId: userId, action: "WORKER_APPLICATION_SUBMITTED", entityType: "JobApplication", entityId: application.id } });
      return { id: application.id, created: true };
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new HttpError(409, "An application already exists for this job. Refresh your applications before trying again.", { code: "DUPLICATE_APPLICATION" });
    throw error;
  }
}
export async function workerApplications(userId: string, query: WorkerApplicationQuery, admin = false) {
  const where: Prisma.JobApplicationWhereInput = { ...(admin ? { workerUserId: { not: null } } : { workerUserId: userId }),
    ...(query.query ? { OR: [{ jobSnapshot: { path: ["searchText"], string_contains: query.query.toLowerCase() } }, ...(admin ? [{ name: { contains: query.query, mode: "insensitive" as const } }, { email: { contains: query.query, mode: "insensitive" as const } }] : [])] } : {}) };
  return prisma.$transaction(async tx => {
    const values = await Promise.all(applicationStages.map(status => tx.jobApplication.count({ where: { AND: [where, stageWhere(status)] } })));
    const counts = Object.fromEntries(applicationStages.map((status, index) => [status, values[index]]));
    const total = query.status === "ALL" ? values.reduce((sum, value) => sum + value, 0) : counts[query.status];
    const totalPages = Math.max(1, Math.ceil(total / pageSize)), page = Math.min(query.page, totalPages);
    const items = await tx.jobApplication.findMany({ where: { AND: [where, ...(query.status === "ALL" ? [] : [stageWhere(query.status)])] }, select: applicationSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: pageSize, skip: (page - 1) * pageSize });
    return { items: items.map(dto), total, counts, page, pageSize, totalPages };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
export async function workerApplicationDetail(userId: string, id: string, historyPage = 1, admin = false) {
  return prisma.$transaction(async tx => {
    const row = await tx.jobApplication.findFirst({ where: { id, ...(admin ? { workerUserId: { not: null } } : { workerUserId: userId }) }, select: { ...applicationSelect, profileSnapshot: true } });
    if (!row) throw missing();
    const total = await tx.workerApplicationEvent.count({ where: { applicationId: id } }); const totalPages = Math.max(1, Math.ceil(total / 15)), page = Math.min(historyPage, totalPages);
    const history = await tx.workerApplicationEvent.findMany({ where: { applicationId: id }, select: { id: true, kind: true, stage: true, title: true, message: true, interviewAt: true, interviewMode: true, createdAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 15, skip: (page - 1) * 15 });
    const { profileSnapshot, ...application } = row;
    return { application: dto(application), profile: snapshotObject(profileSnapshot), history: { items: history, total, totalPages, page } };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
export async function withdrawWorkerApplication(userId: string, id: string, input: { revision: number; reason: string }) {
  await prisma.$transaction(async tx => {
    await lockApplication(tx, id);
    const row = await tx.jobApplication.findFirst({ where: { id, workerUserId: userId }, select: applicationSelect });
    if (!row) throw missing();
    if (row.withdrawnAt) return;
    if (row.revision !== input.revision) throw changed();
    if (!dto(row).canWithdraw) throw new HttpError(409, "This application is closed or already has a confirmed assignment. Contact the team to discuss the next step.", { code: "APPLICATION_NOT_WITHDRAWABLE" });
    const candidates = await tx.businessCandidate.findMany({ where: { applicationId: id, revokedAt: null }, select: { id: true, requirementId: true } });
    for (const requirementId of [...new Set(candidates.map(candidate => candidate.requirementId))].sort()) await tx.$queryRaw`SELECT id FROM "WorkforceRequirement" WHERE id = ${requirementId} FOR UPDATE`;
    await tx.jobApplication.update({ where: { id }, data: { withdrawnAt: new Date(), withdrawalReason: input.reason, revision: { increment: 1 } } });
    for (const candidate of candidates) {
      await tx.businessCandidate.update({ where: { id: candidate.id }, data: { revokedAt: new Date(), revision: { increment: 1 } } });
      await tx.candidateEvent.create({ data: { candidateId: candidate.id, kind: "ACCESS_REVOKED", actorRole: "WORKER", note: "The worker withdrew this application." } });
    }
    await applicationEvent(tx, id, { kind: "WITHDRAWN", stage: "WITHDRAWN", title: "You withdrew this application", message: input.reason });
    await tx.auditLog.create({ data: { actorUserId: userId, entityType: "JobApplication", entityId: id, action: "WORKER_APPLICATION_WITHDRAWN" } });
  });
  return workerApplicationDetail(userId, id);
}
export async function reviewWorkerApplication(userId: string, id: string, input: { revision: number; status: "SUBMITTED" | "REVIEWED" | "SHORTLISTED" | "REJECTED"; workerMessage: string }) {
  await prisma.$transaction(async tx => {
    await lockApplication(tx, id);
    const row = await tx.jobApplication.findFirst({ where: { id, workerUserId: { not: null } }, select: applicationSelect });
    if (!row) throw missing();
    if (row.withdrawnAt) throw new HttpError(409, "A withdrawn application cannot be reopened or reviewed.", { code: "APPLICATION_WITHDRAWN" });
    if (row.revision !== input.revision) throw changed();
    if (input.status === "REJECTED" && row.businessCandidates.some(candidate => !candidate.revokedAt || (candidate.assignment && !candidate.assignment.cancelledAt))) throw new HttpError(409, "Complete or revoke the business reviews before rejecting this application.", { code: "APPLICATION_IN_PIPELINE" });
    await tx.jobApplication.update({ where: { id }, data: { status: input.status, revision: { increment: 1 } } });
    await applicationEvent(tx, id, { kind: "ADMIN_REVIEW", stage: input.status, title: ({ SUBMITTED: "Application review reopened", REVIEWED: "Application reviewed", SHORTLISTED: "Shortlisted by the hiring team", REJECTED: "Application not selected" })[input.status], message: input.workerMessage || null });
    await tx.auditLog.create({ data: { actorUserId: userId, entityType: "JobApplication", entityId: id, action: "WORKER_APPLICATION_REVIEWED", metadata: { from: row.status, to: input.status } } });
  });
  return workerApplicationDetail(userId, id, 1, true);
}
export async function applicationResume(userId: string, id: string, admin = false) {
  const application = await prisma.jobApplication.findFirst({ where: { id, ...(admin ? { workerUserId: { not: null } } : { workerUserId: userId }) }, select: { id: true, submittedResume: { select: { fileName: true, mimeType: true, data: true, storagePublicId: true, storageResourceType: true, storageDeliveryType: true, storageFormat: true } } } });
  if (!application) throw missing();
  if (!application.submittedResume) throw new HttpError(404, "No CV was included with this application.", { code: "RESUME_NOT_FOUND" });
  const file = application.submittedResume;
  if (file.storagePublicId && file.storageResourceType === "raw" && file.storageDeliveryType === "authenticated" && file.storageFormat) {
    const { downloadPrivateFile } = await import("../../services/private-file-storage.js");
    return { fileName: file.fileName, mimeType: file.mimeType, bytes: await downloadPrivateFile({ publicId: file.storagePublicId, resourceType: "raw", deliveryType: "authenticated", format: file.storageFormat }, file.fileName) };
  }
  if (file.data) return { fileName: file.fileName, mimeType: file.mimeType, bytes: Buffer.from(file.data) };
  throw new HttpError(404, "No CV was included with this application.", { code: "RESUME_NOT_FOUND" });
}
