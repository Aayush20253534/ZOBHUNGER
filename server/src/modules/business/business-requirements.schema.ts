import { z } from "zod";

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in YYYY-MM-DD format")
  .refine(value => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid calendar date").transform(value => new Date(`${value}T00:00:00.000Z`));

const brief = z.object({
  companyName: z.string().trim().min(2).max(160),
  contactPerson: z.string().trim().min(2).max(120),
  businessEmail: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  mobileNumber: z.string().trim().min(7).max(24).regex(/^[+0-9 ()-]+$/),
  industry: z.string().trim().min(2).max(120),
  serviceRequired: z.string().trim().min(2).max(160),
  workforceCount: z.number().int().min(1).max(1_000_000),
  locations: z.array(z.string().trim().min(2).max(180)).min(1).max(50),
  projectDuration: z.string().trim().min(2).max(160),
  expectedStartAt: calendarDate.nullable().default(null),
  details: z.string().trim().min(5).max(6000),
}).strict();

function normalizeLocations<T extends { locations: string[] }>(value: T) {
  const seen = new Set<string>();
  const locations = value.locations.map(place => place.replace(/\s+/g, " ")).filter(place => {
    const key = place.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  return { ...value, locations, jobLocation: locations[0] };
}

export const createBusinessRequirementSchema = brief.extend({ requestKey: z.string().uuid() }).strict().transform(normalizeLocations);
export const updateBusinessRequirementSchema = brief.extend({ revision: z.number().int().min(0).max(2_147_483_646) }).strict().transform(normalizeLocations);
export const withdrawBusinessRequirementSchema = z.object({
  revision: z.number().int().min(0).max(2_147_483_646),
  reason: z.string().trim().min(5).max(600),
}).strict();
export const listBusinessRequirementsSchema = z.object({
  query: z.string().trim().max(120).default(""),
  status: z.enum(["ALL", "NEW", "CONTACTED", "QUALIFIED", "CLOSED"]).default("ALL"),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.string().regex(/^[1-9]\d{0,4}$/).default("1").transform(Number).refine(value => value <= 10000),
}).strict();

export type CreateBusinessRequirement = z.infer<typeof createBusinessRequirementSchema>;
export type UpdateBusinessRequirement = z.infer<typeof updateBusinessRequirementSchema>;
export type WithdrawBusinessRequirement = z.infer<typeof withdrawBusinessRequirementSchema>;
export type ListBusinessRequirements = z.infer<typeof listBusinessRequirementsSchema>;
