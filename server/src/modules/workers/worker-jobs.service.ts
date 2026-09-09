import { prisma } from "../../config/db.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { availableJobWhere, lockAvailableJob } from "../jobs/job-availability.js";
import type { WorkerJobsQuery } from "./workers.schema.js";

const pageSize = 9;
const select = { id: true, slug: true, title: true, location: true, city: true, state: true, category: true, engagementType: true, description: true, responsibilities: true, requirements: true, compensation: true, publishedAt: true } satisfies Prisma.JobSelect;
// Worker discovery always uses live records; demo, scheduled and unpublished
// vacancies cannot be presented as opportunities or saved into an account.
export const liveWorkerJobWhere = (): Prisma.JobWhereInput => ({ AND: [availableJobWhere, { isDemo: false, publishedAt: { lte: new Date() } }] });
const literal = (value: string) => value.replace(/[\\%_]/g, character => `\\${character}`);
export async function workerJobs(userId: string, filters: WorkerJobsQuery) {
  const terms: Prisma.JobWhereInput[] = [liveWorkerJobWhere()];
  if (filters.city) terms.push({ OR: [{ city: { equals: literal(filters.city), mode: "insensitive" } }, { location: { equals: literal(filters.city), mode: "insensitive" } }] });
  if (filters.category) terms.push({ category: { equals: literal(filters.category), mode: "insensitive" } });
  if (filters.engagementType) terms.push({ engagementType: { equals: literal(filters.engagementType), mode: "insensitive" } });
  if (filters.query) terms.push({ OR: ["title", "description", "city", "location", "category"].map(field => ({ [field]: { contains: literal(filters.query!), mode: "insensitive" } })) });
  const where: Prisma.JobWhereInput = { AND: terms };
  const [items, total] = await prisma.$transaction([
    prisma.job.findMany({ where, select: { ...select, savedBy: { where: { userId }, select: { id: true } } }, orderBy: [{ publishedAt: "desc" }, { id: "desc" }], skip: (filters.page - 1) * pageSize, take: pageSize }),
    prisma.job.count({ where }),
  ]);
  return { items: items.map(({ savedBy, ...job }) => ({ ...job, saved: savedBy.length > 0 })), total, page: filters.page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
export async function workerJobFacets() {
  const where = liveWorkerJobWhere();
  const [cities, categories, engagements] = await Promise.all([
    prisma.job.findMany({ where, distinct: ["city"], select: { city: true }, orderBy: { city: "asc" }, take: 100 }),
    prisma.job.findMany({ where, distinct: ["category"], select: { category: true }, orderBy: { category: "asc" }, take: 100 }),
    prisma.job.findMany({ where, distinct: ["engagementType"], select: { engagementType: true }, orderBy: { engagementType: "asc" }, take: 100 }),
  ]);
  return { cities: cities.map(item => item.city), categories: categories.map(item => item.category), engagementTypes: engagements.map(item => item.engagementType) };
}
export async function workerJobDetail(userId: string, slug: string) {
  const job = await prisma.job.findFirst({ where: { slug, AND: [liveWorkerJobWhere()] }, select: { ...select, savedBy: { where: { userId }, select: { id: true } } } });
  if (!job) throw new HttpError(404, "This opening is no longer available. Explore other roles or review your saved jobs.", { code: "JOB_NOT_FOUND" });
  const { savedBy, ...data } = job;
  const application = await prisma.jobApplication.findUnique({ where: { jobId_workerUserId: { jobId: job.id, workerUserId: userId } }, select: { id: true } });
  return { ...data, saved: savedBy.length > 0, applicationId: application?.id ?? null };
}
export async function saveWorkerJob(userId: string, jobId: string) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    await lockAvailableJob(tx, jobId);
    const job = await tx.job.findFirst({ where: { id: jobId, AND: [liveWorkerJobWhere()] }, select });
    if (!job) throw new HttpError(404, "This opening is no longer available", { code: "JOB_NOT_FOUND" });
    const existing = await tx.workerSavedJob.findUnique({ where: { userId_jobId: { userId, jobId } } });
    if (!existing && await tx.workerSavedJob.count({ where: { userId } }) >= 200) throw new HttpError(409, "You can keep up to 200 saved jobs. Remove an older opening before saving another.", { code: "SAVED_JOBS_LIMIT" });
    await tx.workerSavedJob.upsert({ where: { userId_jobId: { userId, jobId } }, update: {}, create: { userId, jobId, title: job.title, location: job.location, category: job.category, engagementType: job.engagementType } });
    return { jobId, saved: true };
  });
}
export async function removeWorkerJob(userId: string, jobId: string) {
  await prisma.workerSavedJob.deleteMany({ where: { userId, jobId } });
  return { jobId, saved: false };
}
export async function workerSavedJobs(userId: string, page: number) {
  const [records, total] = await prisma.$transaction([
    prisma.workerSavedJob.findMany({ where: { userId }, select: { id: true, jobId: true, title: true, location: true, category: true, engagementType: true, createdAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: pageSize, skip: (page - 1) * pageSize }),
    prisma.workerSavedJob.count({ where: { userId } }),
  ]);
  const available = await prisma.job.findMany({ where: { id: { in: records.map(record => record.jobId) }, AND: [liveWorkerJobWhere()] }, select });
  const byId = new Map(available.map(job => [job.id, job]));
  const items = records.map(record => {
    const job = byId.get(record.jobId);
    // An unpublished job can contain new private edits. Only return the small
    // snapshot captured while it was public when the current job is unavailable.
    return { ...(job ?? { id: record.jobId, slug: null, title: record.title, location: record.location, category: record.category, engagementType: record.engagementType, compensation: null, description: "This opening is no longer accepting applications.", responsibilities: [], requirements: [], city: "", state: null, publishedAt: null }), saved: true, available: Boolean(job), savedAt: record.createdAt };
  });
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
