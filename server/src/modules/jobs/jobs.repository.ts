import { JobStatus, Prisma } from "../../generated/prisma/client.js";
import { availableJobWhere, lockAvailableJob } from "./job-availability.js";
import { prisma } from "../../config/db.js";
import type { CreateJobApplicationInput, ListJobsQuery } from "./jobs.schema.js";

const publicJobSelect = {
  id: true,
  slug: true,
  title: true,
  location: true,
  city: true,
  state: true,
  category: true,
  engagementType: true,
  description: true,
  responsibilities: true,
  requirements: true,
  compensation: true,
  isDemo: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.JobSelect;

function buildPublicJobWhere(filters: ListJobsQuery): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = {
    status: JobStatus.OPEN,
  };

  if (filters.city) {
    where.OR = [
      { city: { equals: filters.city, mode: "insensitive" } },
      { location: { equals: filters.city, mode: "insensitive" } },
    ];
  }

  if (filters.category) {
    where.category = { equals: filters.category, mode: "insensitive" };
  }

  if (filters.engagementType) {
    where.engagementType = {
      equals: filters.engagementType,
      mode: "insensitive",
    };
  }

  if (filters.query) {
    const queryFilters: Prisma.JobWhereInput[] = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { description: { contains: filters.query, mode: "insensitive" } },
      { category: { contains: filters.query, mode: "insensitive" } },
      { city: { contains: filters.query, mode: "insensitive" } },
      { location: { contains: filters.query, mode: "insensitive" } },
    ];

    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: queryFilters }];
      delete where.OR;
    } else {
      where.OR = queryFilters;
    }
  }

  return where;
}

export async function findPublicJobs(filters: ListJobsQuery) {
  const where = { AND: [buildPublicJobWhere(filters), availableJobWhere] };
  const skip = (filters.page - 1) * filters.pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      select: publicJobSelect,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: filters.pageSize,
    }),
    prisma.job.count({ where }),
  ]);

  return { items, total };
}

export function findPublicJobBySlug(slug: string) {
  return prisma.job.findFirst({
    where: {
      slug,
      status: JobStatus.OPEN,
      AND: [availableJobWhere],
    },
    select: publicJobSelect,
  });
}

export function findOpenJobByReference(reference: string) {
  return prisma.job.findFirst({
    where: {
      status: JobStatus.OPEN,
      AND: [availableJobWhere],
      OR: [{ id: reference }, { slug: reference }],
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });
}

export function findApplicationByJobAndEmail(jobId: string, email: string) {
  return prisma.jobApplication.findUnique({
    where: {
      jobId_email: {
        jobId,
        email,
      },
    },
    select: { id: true },
  });
}

export function createJobApplication(jobId: string, input: CreateJobApplicationInput) {
  return prisma.$transaction(async tx => {
    await lockAvailableJob(tx, jobId);
    return tx.jobApplication.create({
    data: {
      jobId,
      name: input.fullName,
      email: input.email,
      phone: input.phone,
      city: input.currentLocation,
      experience: input.experience,
      availableFrom: input.availableFrom,
      message: input.message,
      resumeUrl: input.resumeUrl,
    },
    select: {
      id: true,
      jobId: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
    },
    });
  });
}
