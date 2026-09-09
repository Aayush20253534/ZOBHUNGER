import { prisma } from "../../config/db.js";
import { guardAssignedCandidate } from "../attendance/attendance.guards.js";
import { Prisma, type BusinessCandidateStatus } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { ownedRequirements } from "../business/business-requirement-access.js";
import { candidateStatuses, safeResumeUrl, type CandidateQuery, type LookupQuery, type ReviewCandidateInput, type ShareCandidateInput } from "./candidates.schema.js";

export interface CandidateAccess { userId: string; admin: boolean }
const pageSize = 15;
const historyPageSize = 20;
const requirementSelect = { id: true, companyName: true, serviceRequired: true, jobLocation: true, status: true } satisfies Prisma.WorkforceRequirementSelect;
const candidateSelect = {
  id: true, requirementId: true, name: true, city: true, experience: true, skills: true,
  availableFrom: true, summary: true, jobTitle: true, status: true, revision: true,
  revokedAt: true, createdAt: true, updatedAt: true, requirement: { select: requirementSelect },
} satisfies Prisma.BusinessCandidateSelect;
const eventSelect = {
  id: true, kind: true, actorRole: true, fromStatus: true, toStatus: true, note: true,
  interviewAt: true, interviewMode: true, interviewDetails: true, createdAt: true,
} satisfies Prisma.CandidateEventSelect;
const unavailable = () => new HttpError(404, "This candidate is not available in your workspace.", { code: "CANDIDATE_NOT_FOUND" });
const changed = () => new HttpError(409, "This candidate changed. Refresh the profile before saving your review.", { code: "CANDIDATE_CHANGED" });

function accessWhere(access: CandidateAccess): Prisma.BusinessCandidateWhereInput {
  return access.admin ? {} : { revokedAt: null, requirement: { is: ownedRequirements(access.userId) } };
}
function requirementWhere(access: CandidateAccess): Prisma.WorkforceRequirementWhereInput {
  return access.admin ? {} : ownedRequirements(access.userId);
}

export async function listCandidates(access: CandidateAccess, query: CandidateQuery) {
  return prisma.$transaction(async tx => {
    const requirement = query.requirementId ? await tx.workforceRequirement.findFirst({
      where: { id: query.requirementId, ...requirementWhere(access) }, select: requirementSelect,
    }) : null;
    if (query.requirementId && !requirement) throw new HttpError(404, "This requirement is not available in your workspace.", { code: "REQUIREMENT_NOT_FOUND" });
    const where: Prisma.BusinessCandidateWhereInput = {
      ...accessWhere(access), ...(query.requirementId ? { requirementId: query.requirementId } : {}),
      ...(query.query ? { OR: [
        { name: { contains: query.query, mode: "insensitive" } },
        { city: { contains: query.query, mode: "insensitive" } },
        { jobTitle: { contains: query.query, mode: "insensitive" } },
      ] } : {}),
    };
    // Status totals cover the same search and requirement across all pages.
    const groups = await tx.businessCandidate.groupBy({ by: ["status"], where, _count: { _all: true } });
    const counts = Object.fromEntries(candidateStatuses.map(status => [status, groups.find(group => group.status === status)?._count._all ?? 0])) as Record<BusinessCandidateStatus, number>;
    const total = query.status === "ALL" ? Object.values(counts).reduce((sum, value) => sum + value, 0) : counts[query.status];
    const totalPages = Math.ceil(total / pageSize);
    const page = Math.min(query.page, Math.max(1, totalPages));
    const items = await tx.businessCandidate.findMany({
      where: { ...where, ...(query.status === "ALL" ? {} : { status: query.status }) },
      select: candidateSelect, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize,
    });
    return { items, total, page, pageSize, totalPages, counts, requirement };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

export async function candidateDetail(access: CandidateAccess, id: string, historyPage = 1) {
  return prisma.$transaction(async tx => {
    const candidate = await tx.businessCandidate.findFirst({ where: { id, ...accessWhere(access) }, select: { ...candidateSelect, resumeUrl: true } });
    if (!candidate) throw unavailable();
    const total = await tx.candidateEvent.count({ where: { candidateId: id } });
    const totalPages = Math.ceil(total / historyPageSize);
    const page = Math.min(historyPage, Math.max(1, totalPages));
    const events = await tx.candidateEvent.findMany({ where: { candidateId: id }, select: eventSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * historyPageSize, take: historyPageSize });
    return { candidate: { ...candidate, resumeUrl: safeResumeUrl(candidate.resumeUrl) }, history: { items: events, total, page, totalPages } };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

const eligibleRequirements: Prisma.WorkforceRequirementWhereInput = { status: { not: "CLOSED" }, OR: [
  { businessProfile: { is: { user: { is: { role: "BUSINESS", isActive: true } } } } },
  { businessProfileId: null, submittedBy: { is: { role: "BUSINESS", isActive: true } } },
] };

export async function candidateLookups(kind: "requirements" | "applications", query: LookupQuery) {
  const search = { contains: query.query, mode: "insensitive" as const };
  return prisma.$transaction(async tx => {
    if (kind === "requirements") {
      const where: Prisma.WorkforceRequirementWhereInput = { AND: [eligibleRequirements,
        ...(query.query ? [{ OR: [{ companyName: search }, { serviceRequired: search }, { jobLocation: search }, { id: search }] }] : []),
      ] };
      const total = await tx.workforceRequirement.count({ where });
      const page = Math.min(query.page, Math.max(1, Math.ceil(total / 10)));
      const items = await tx.workforceRequirement.findMany({ where, select: requirementSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 10, take: 10 });
      return { items, total, page, totalPages: Math.ceil(total / 10) };
    }
    const where: Prisma.JobApplicationWhereInput = { job: { is: { isDemo: false, ...(query.requirementId ? { OR: [{ requirementId: null }, { requirementId: query.requirementId }] } : {}) } }, status: { not: "REJECTED" },
      ...(query.query ? { OR: [{ name: search }, { city: search }, { job: { is: { title: search } } }] } : {}) };
    const total = await tx.jobApplication.count({ where });
    const page = Math.min(query.page, Math.max(1, Math.ceil(total / 10)));
    const applications = await tx.jobApplication.findMany({ where, select: {
      id: true, name: true, city: true, experience: true, resumeUrl: true, availableFrom: true, job: { select: { title: true, requirementId: true } },
      workerUser: { select: { workerProfile: { select: { skills: true } } } }, placementCandidate: { select: { skills: true } },
    }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 10, take: 10 });
    const items = applications.map(({ workerUser, placementCandidate, resumeUrl, ...application }) => ({
      ...application, resumeUrl: safeResumeUrl(resumeUrl), skills: (workerUser?.workerProfile?.skills ?? placementCandidate?.skills ?? []).slice(0, 12),
    }));
    return { items, total, page, totalPages: Math.ceil(total / 10) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

async function lockRequirement(tx: Prisma.TransactionClient, id: string) {
  // Serializes with requirement closure/withdrawal, including concurrent writes.
  await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "WorkforceRequirement" WHERE "id" = ${id} FOR UPDATE`);
}
async function audit(tx: Prisma.TransactionClient, userId: string, candidateId: string, action: string) {
  await tx.auditLog.create({ data: { actorUserId: userId, entityType: "BusinessCandidate", entityId: candidateId, action } });
}

export async function shareCandidate(userId: string, input: ShareCandidateInput) {
  return prisma.$transaction(async tx => {
    await lockRequirement(tx, input.requirementId);
    const requirement = await tx.workforceRequirement.findFirst({ where: { id: input.requirementId, AND: [eligibleRequirements] }, select: { id: true } });
    if (!requirement) throw new HttpError(409, "Choose an open requirement linked to an active business account.", { code: "REQUIREMENT_NOT_SHAREABLE" });
    const existing = await tx.businessCandidate.findUnique({ where: { requirementId_applicationId: { requirementId: input.requirementId, applicationId: input.applicationId } } });
    if (existing) {
      if (existing.revokedAt) throw new HttpError(409, "Access to this submission was revoked. Choose another application or contact the account team.", { code: "CANDIDATE_REVOKED" });
      return { id: existing.id, created: false };
    }
    const application = await tx.jobApplication.findFirst({ where: { id: input.applicationId, status: { not: "REJECTED" }, job: { is: { isDemo: false } } },
      select: { id: true, name: true, city: true, experience: true, resumeUrl: true, availableFrom: true, job: { select: { title: true, requirementId: true } } } });
    if (!application) throw new HttpError(404, "Choose an available application from a real job opening.", { code: "APPLICATION_NOT_FOUND" });
    if (application.job.requirementId && application.job.requirementId !== input.requirementId) throw new HttpError(409, "This application belongs to another requirement. Select its linked hiring brief.", { code: "APPLICATION_REQUIREMENT_MISMATCH" });
    const candidate = await tx.businessCandidate.create({ data: {
      requirementId: input.requirementId, applicationId: application.id, name: application.name, city: application.city,
      experience: application.experience, resumeUrl: safeResumeUrl(application.resumeUrl), availableFrom: application.availableFrom,
      jobTitle: application.job.title, skills: input.skills, summary: input.summary,
      events: { create: { kind: "SHARED", actorRole: "ADMIN", toStatus: "SHARED", note: "Profile shared by the ZOBHUNGER team." } },
    } });
    await audit(tx, userId, candidate.id, "BUSINESS_CANDIDATE_SHARED");
    return { id: candidate.id, created: true };
  });
}

const transitions: Record<BusinessCandidateStatus, BusinessCandidateStatus[]> = {
  SHARED: ["SHORTLISTED", "INTERVIEW_REQUESTED", "SELECTED", "REJECTED"],
  SHORTLISTED: ["INTERVIEW_REQUESTED", "SELECTED", "REJECTED"],
  INTERVIEW_REQUESTED: ["SHORTLISTED", "SELECTED", "REJECTED"],
  SELECTED: ["SHARED"], REJECTED: ["SHARED"],
};

export async function reviewCandidate(access: CandidateAccess, id: string, input: ReviewCandidateInput) {
  await prisma.$transaction(async tx => {
    const reference = await tx.businessCandidate.findFirst({ where: { id, ...accessWhere(access) }, select: { requirementId: true } });
    if (!reference) throw unavailable();
    await lockRequirement(tx, reference.requirementId);
    const current = await tx.businessCandidate.findFirst({ where: { id, ...accessWhere(access) }, select: { revision: true, status: true, requirement: { select: { status: true } } } });
    if (!current) throw unavailable();
    if (current.requirement.status === "CLOSED") throw new HttpError(409, "This requirement is closed. Candidate history remains available for reference.", { code: "REQUIREMENT_CLOSED" });
    if (current.revision !== input.revision) throw changed();
    const status = input.action === "STATUS" ? input.status : input.action === "INTERVIEW" ? "INTERVIEW_REQUESTED" : current.status;
    const rescheduling = input.action === "INTERVIEW" && current.status === "INTERVIEW_REQUESTED";
    if (status !== current.status && current.status === "SELECTED") await guardAssignedCandidate(tx, id);
    if (input.action !== "FEEDBACK" && !rescheduling && !transitions[current.status].includes(status)) {
      throw new HttpError(409, "This decision is not available at the current stage. Reopen a completed review before changing its decision.", { code: "INVALID_CANDIDATE_TRANSITION" });
    }
    if (input.action === "INTERVIEW") {
      const delay = input.interviewAt.getTime() - Date.now();
      if (delay < 5 * 60_000 || delay > 180 * 86400_000) throw new HttpError(400, "Choose an interview time at least 5 minutes from now and within 180 days.", { code: "INVALID_INTERVIEW_TIME" });
    }
    const result = await tx.businessCandidate.updateMany({ where: { id, revision: input.revision, ...accessWhere(access) }, data: { status, revision: { increment: 1 } } });
    if (result.count !== 1) throw changed();
    await tx.candidateEvent.create({ data: {
      candidateId: id, kind: input.action === "INTERVIEW" ? "INTERVIEW_REQUESTED" : input.action === "FEEDBACK" ? "FEEDBACK" : "STATUS_CHANGED",
      actorRole: "BUSINESS", fromStatus: current.status, toStatus: status, note: input.note,
      ...(input.action === "INTERVIEW" ? { interviewAt: input.interviewAt, interviewMode: input.interviewMode, interviewDetails: input.interviewDetails } : {}),
    } });
    await audit(tx, access.userId, id, `BUSINESS_CANDIDATE_${input.action}`);
  });
  return candidateDetail(access, id);
}

export async function revokeCandidate(userId: string, id: string, input: { revision: number; note: string }) {
  await prisma.$transaction(async tx => {
    const row = await tx.businessCandidate.findUnique({ where: { id }, select: { requirementId: true } });
    if (!row) throw unavailable();
    await lockRequirement(tx, row.requirementId);
    await guardAssignedCandidate(tx, id);
    const result = await tx.businessCandidate.updateMany({ where: { id, revision: input.revision, revokedAt: null }, data: { revokedAt: new Date(), revision: { increment: 1 } } });
    if (result.count !== 1) throw changed();
    await tx.candidateEvent.create({ data: { candidateId: id, kind: "ACCESS_REVOKED", actorRole: "ADMIN", note: input.note } });
    await audit(tx, userId, id, "BUSINESS_CANDIDATE_ACCESS_REVOKED");
  });
  return candidateDetail({ userId, admin: true }, id);
}
