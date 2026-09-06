import { z } from "zod";

const optionalFilter = z.string().trim().min(1).max(120).optional();

export const listJobsQuerySchema = z
  .object({
    city: optionalFilter,
    location: optionalFilter,
    category: optionalFilter,
    engagementType: optionalFilter,
    jobType: optionalFilter,
    query: z.string().trim().min(1).max(160).optional(),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(6),
  })
  .transform((value) => ({
    city: value.city ?? value.location,
    category: value.category,
    engagementType: value.engagementType ?? value.jobType,
    query: value.query,
    page: value.page,
    pageSize: value.pageSize,
  }));

export const jobSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(180),
});

export const jobApplicationParamsSchema = z.object({
  jobId: z.string().trim().min(1).max(180),
});

export const createJobApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(30),
  currentLocation: z.string().trim().min(2).max(120),
  experience: z.string().trim().max(2000).optional(),
  availableFrom: z
    .union([z.iso.date(), z.literal("")])
    .optional()
    .transform((value) => (value ? new Date(`${value}T00:00:00.000Z`) : undefined)),
  message: z.string().trim().max(3000).optional(),
  resumeUrl: z.string().trim().url().max(2000).optional(),
});

export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
export type JobSlugParams = z.infer<typeof jobSlugParamsSchema>;
export type JobApplicationParams = z.infer<typeof jobApplicationParamsSchema>;
export type CreateJobApplicationInput = z.infer<typeof createJobApplicationSchema>;
