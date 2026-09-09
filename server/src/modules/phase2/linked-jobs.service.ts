import { randomUUID } from "node:crypto";
import { prisma } from "../../config/db.js";
import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { jobCache } from "../../services/job-cache.service.js";
import { ownedRequirements } from "../business/business-requirement-access.js";
import type { AttendanceAccess } from "../attendance/attendance.read.js";
import type { z } from "zod";
import type { createLinkedJobSchema, editLinkedJobSchema, linkedJobStatusSchema } from "./phase2.schema.js";
const missing = () => new HttpError(404, "Requirement or linked job not available.", { code: "REQUIREMENT_NOT_FOUND" });
const conflict = () => new HttpError(409, "This brief or job changed. Reload it before continuing.", { code: "JOB_CHANGED" });
export const businessOwned = { OR: [{ businessProfile: { is: { user: { is: { role: "BUSINESS" as const, isActive: true } } } } }, { businessProfileId: null, submittedBy: { is: { role: "BUSINESS" as const, isActive: true } } }] };
export const linkedJobSelect = { id: true, slug: true, title: true, city: true, location: true, state: true, category: true, engagementType: true, description: true, compensation: true, responsibilities: true, requirements: true, status: true, revision: true, createdAt: true, publishedAt: true } satisfies Prisma.JobSelect;
export async function pauseRequirementJobs(tx: Prisma.TransactionClient, id: string) {
  return tx.job.updateMany({ where: { requirementId: id, status: "OPEN" }, data: { status: "CLOSED", revision: { increment: 1 } } });
}
export async function eligibleRequirement(tx: Prisma.TransactionClient, id: string) {
  const row = await tx.workforceRequirement.findFirst({ where: { id, AND: [businessOwned] } });
  if (!row) throw missing();
  if (row.status !== "QUALIFIED") throw new HttpError(409, "Operations must mark this requirement Qualified before creating or publishing linked openings.", { code: "REQUIREMENT_NOT_QUALIFIED" });
  return row;
}
export async function qualifyRequirement(userId: string, id: string, revision: number) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "WorkforceRequirement" WHERE id = ${id} FOR UPDATE`);
    const row = await tx.workforceRequirement.findFirst({ where: { id, AND: [businessOwned] } });
    if (!row) throw missing();
    if (row.revision !== revision || row.status === "CLOSED") throw conflict();
    if (row.status === "QUALIFIED") return { id, revision };
    const result = await tx.workforceRequirement.update({ where: { id }, data: { status: "QUALIFIED", revision: { increment: 1 } }, select: { id: true, revision: true } });
    await tx.auditLog.create({ data: { actorUserId: userId, entityType: "WorkforceRequirement", entityId: id, action: "WORKFORCE_REQUIREMENT_STATUS_CHANGED", metadata: { from: row.status, to: "QUALIFIED", source: "ADMIN" } } });
    return result;
  });
}
export async function requirementJobs(access: AttendanceAccess, id: string, page: number) {
  return prisma.$transaction(async tx => {
    const requirement = await tx.workforceRequirement.findFirst({ where: { id, ...(access.admin ? businessOwned : ownedRequirements(access.userId)) }, select: { id: true, companyName: true, serviceRequired: true, workforceCount: true, jobLocation: true, locations: true, projectDuration: true, details: true, status: true, revision: true } });
    if (!requirement) throw missing();
    const total = await tx.job.count({ where: { requirementId: id } }), totalPages = Math.max(1, Math.ceil(total / 9)); page = Math.min(page, totalPages);
    const items = await tx.job.findMany({ where: { requirementId: id }, select: { ...linkedJobSelect, _count: { select: { applications: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 9, skip: (page - 1) * 9 });
    return { requirement, items, total, totalPages, page };
  }, { isolationLevel: "RepeatableRead" });
}
export async function createLinkedJob(userId: string, id: string, input: z.infer<typeof createLinkedJobSchema>) {
  const { requestKey, requirementRevision, ...data } = input;
  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "WorkforceRequirement" WHERE id = ${id} FOR UPDATE`);
    const requirement = await eligibleRequirement(tx, id);
    const existing = await tx.job.findUnique({ where: { creationKey: `${userId}:${requestKey}` }, select: { id: true, requirementId: true } });
    if (existing) { if (existing.requirementId !== id) throw conflict(); return { id: existing.id, created: false }; }
    if (requirement.revision !== requirementRevision) throw conflict();
    const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 110) || "opportunity"}-${randomUUID()}`;
    const job = await tx.job.create({ data: { ...data, slug, requirementId: id, createdByUserId: userId, creationKey: `${userId}:${requestKey}`, isDemo: false, status: "DRAFT" } });
    await tx.auditLog.create({ data: { actorUserId: userId, entityType: "Job", entityId: job.id, action: "LINKED_JOB_CREATED", metadata: { requirementId: id } } });
    return { id: job.id, created: true };
  });
  return result;
}
export async function changeLinkedJob(userId: string, id: string, input: z.infer<typeof editLinkedJobSchema> | z.infer<typeof linkedJobStatusSchema>) {
  const result = await prisma.$transaction(async tx => {
    const ref = await tx.job.findUnique({ where: { id }, select: { requirementId: true } });
    if (!ref?.requirementId) throw missing();
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "WorkforceRequirement" WHERE id = ${ref.requirementId} FOR UPDATE`);
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "Job" WHERE id = ${id} FOR UPDATE`);
    const job = await tx.job.findUniqueOrThrow({ where: { id } });
    if (job.revision !== input.revision) throw conflict();
    if (!("status" in input) || input.status === "OPEN") await eligibleRequirement(tx, ref.requirementId);
    const { revision, ...fields } = input;
    const data = "status" in fields ? { status: fields.status, publishedAt: fields.status === "OPEN" ? job.publishedAt ?? new Date() : job.publishedAt } : { ...fields, status: "DRAFT" as const };
    const updated = await tx.job.update({ where: { id }, data: { ...data, revision: { increment: 1 } }, select: linkedJobSelect });
    await tx.auditLog.create({ data: { actorUserId: userId, entityType: "Job", entityId: id, action: "status" in fields ? "JOB_STATUS_CHANGED" : "LINKED_JOB_EDITED", metadata: { from: job.status, to: updated.status } } });
    return updated;
  });
  await jobCache.invalidate(); return result;
}
