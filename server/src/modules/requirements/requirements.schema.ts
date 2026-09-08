import { z } from "zod";

const locationSchema = z.string().trim().min(2).max(180);
const optionalDateSchema = z.preprocess(
  value => value === null || (typeof value === "string" && !value.trim()) ? undefined : value,
  z.union([z.date(), z.iso.date().transform(value => new Date(`${value}T00:00:00.000Z`)),
    z.iso.datetime().transform(value => new Date(value))]).optional(),
);

export const createRequirementSchema = z
  .object({
    companyName: z.string().trim().min(2).max(160),
    contactPerson: z.string().trim().min(2).max(120),
    businessEmail: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    mobileNumber: z.string().trim().min(7).max(24),
    industry: z.string().trim().min(2).max(120),
    serviceRequired: z.string().trim().min(2).max(160),
    workforceCount: z.coerce.number().int().positive().max(1_000_000),
    jobLocation: z.preprocess(value => value === "" ? undefined : value, locationSchema.optional()),
    locations: z.array(locationSchema).max(50).default([]),
    projectDuration: z.string().trim().min(2, "Include the duration and unit, for example 1 day or 3 months.").max(160),
    expectedStartAt: optionalDateSchema,
    details: z.string().trim().min(5).max(6000),
  })
  .superRefine((value, ctx) => {
    if (!value.jobLocation && value.locations.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["locations"],
        message: "At least one job location is required",
      });
    }
  })
  .transform((value) => {
    const locations = [...new Set(value.locations.map((location) => location.trim()))];
    const jobLocation = value.jobLocation?.trim() || locations[0];
    const allLocations = jobLocation && !locations.includes(jobLocation)
      ? [jobLocation, ...locations]
      : locations;

    return {
      ...value,
      jobLocation: jobLocation as string,
      locations: allLocations,
    };
  });

export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;
