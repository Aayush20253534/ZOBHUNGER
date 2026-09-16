import { ApplicationStatus, JobStatus, Prisma } from "../../generated/prisma/client.js";
import { availableJobWhere, lockAvailableJob } from "../jobs/job-availability.js";
import { prisma } from "../../config/db.js";
import type { PlacementApplicationQuery, PlacementOpportunityQuery } from "./placement-opportunities.schema.js";

const opportunitySelect = {
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
  status: true,
  publishedAt: true,
} satisfies Prisma.JobSelect;

export async function listPlacementOpportunities(query: PlacementOpportunityQuery) {
  const where: Prisma.JobWhereInput = { status: JobStatus.OPEN };
  if (query.city) {
    where.OR = [
      { city: { equals: query.city, mode: "insensitive" } },
      { location: { contains: query.city, mode: "insensitive" } },
    ];
  }
  if (query.opportunityType) {
    where.engagementType = { equals: query.opportunityType, mode: "insensitive" };
  }
  if (query.search) {
    const search: Prisma.JobWhereInput[] = [
      { title: { contains: query.search, mode: "insensitive" } },
      { category: { contains: query.search, mode: "insensitive" } },
      { engagementType: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { city: { contains: query.search, mode: "insensitive" } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: search }];
      delete where.OR;
    } else {
      where.OR = search;
    }
  }
  const boundedWhere = { AND: [where, availableJobWhere] } satisfies Prisma.JobWhereInput;
  const skip = (query.page - 1) * query.pageSize;
  const [items, total, typeRows] = await prisma.$transaction([
    prisma.job.findMany({
      where: boundedWhere,
      select: opportunitySelect,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: query.pageSize,
    }),
    prisma.job.count({ where: boundedWhere }),
    prisma.job.findMany({
      where: { AND: [{ status: JobStatus.OPEN }, availableJobWhere] },
      distinct: ["engagementType"],
      select: { engagementType: true },
      orderBy: { engagementType: "asc" },
      take: 100,
    }),
  ]);
  return { items, total, opportunityTypes: typeRows.map((row) => row.engagementType) };
}

export function findOpenPlacementOpportunity(jobId: string) {
  return prisma.job.findFirst({
    where: { status: JobStatus.OPEN, AND: [availableJobWhere], OR: [{ id: jobId }, { slug: jobId }] },
    select: { id: true, slug: true, title: true, status: true },
  });
}

export function createPlacementOpportunityApplication(input: {
  jobId: string;
  placementCellApplicationId: string;
  placementCandidateId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  experience?: string | null;
  message?: string;
}) {
  return prisma.$transaction(async tx => {
    await lockAvailableJob(tx, input.jobId);
    return tx.jobApplication.create({
    data: {
      jobId: input.jobId,
      placementCellApplicationId: input.placementCellApplicationId,
      placementCandidateId: input.placementCandidateId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      city: input.city,
      experience: input.experience ?? undefined,
      message: input.message,
    },
    include: {
      job: { select: { id: true, slug: true, title: true, engagementType: true, location: true, status: true } },
      placementCandidate: { select: { id: true, fullName: true, email: true, course: true, qualification: true } },
    },
    });
  });
}

export function findPlacementApplicationByJobAndCandidate(jobId: string, candidateId: string) {
  return prisma.jobApplication.findFirst({
    where: { jobId, placementCandidateId: candidateId },
    select: { id: true },
  });
}

export async function listPlacementOpportunityApplications(placementCellApplicationId: string, query: PlacementApplicationQuery) {
  const where: Prisma.JobApplicationWhereInput = { placementCellApplicationId };
  if (query.status) where.status = ApplicationStatus[query.status];
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { job: { title: { contains: query.search, mode: "insensitive" } } },
      { placementCandidate: { course: { contains: query.search, mode: "insensitive" } } },
    ];
  }
  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.jobApplication.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        job: { select: { id: true, slug: true, title: true, engagementType: true, location: true, status: true } },
        placementCandidate: { select: { id: true, fullName: true, email: true, course: true, qualification: true } },
      },
      skip,
      take: query.pageSize,
    }),
    prisma.jobApplication.count({ where }),
  ]);
  return { items, total };
}

export function countPlacementOpportunityApplications(placementCellApplicationId: string) {
  return prisma.jobApplication.count({ where: { placementCellApplicationId } });
}
