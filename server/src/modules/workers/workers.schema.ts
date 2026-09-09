import { z } from "zod";
import { passwordSchema } from "../auth/auth.schema.js";

const email = z.string().trim().email().max(254).transform(value => value.toLowerCase());
export const workerPhone = z.string().trim().transform(value => value.replace(/[\s()-]/g, ""))
  .pipe(z.string().regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number with 10–15 digits"));
const text = (max: number) => z.string().trim().max(max);
const list = (max = 20) => z.array(z.string().trim().min(1).max(80)).max(max).transform(items => [...new Set(items)]);

// No external, protocol-relative, encoded or arbitrary post-login destinations.
export function workerDestination(value: unknown) {
  if (typeof value !== "string") return "/worker/profile";
  if (["/worker", "/worker/jobs", "/worker/profile", "/worker/saved-jobs", "/worker/applications", "/worker/assignments", "/worker/attendance"].includes(value)) return value;
  if (/^\/worker\/jobs\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,179}(?:\/apply)?$/.test(value)) return value;
  if (/^\/worker\/(applications|assignments)\/[a-zA-Z0-9_-]{1,64}$/.test(value)) return value;
  if (/^\/jobs\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,179}$/.test(value)) return `/worker${value}`;
  return "/worker/profile";
}
const next = z.string().max(240).optional().transform(workerDestination);
export const workerRegisterSchema = z.object({ fullName: z.string().trim().min(2).max(120), email, phone: workerPhone, password: passwordSchema, consent: z.literal(true, "Please agree to creating your worker profile"), next }).strict();
export const workerLoginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const workerEmailSchema = z.object({ email, next }).strict();
export const workerTokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, "This link is invalid. Request a new email.") }).strict();
export const workerResetSchema = workerTokenSchema.extend({ password: passwordSchema });
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a valid month")
  .refine(value => value >= "1950-01" && value <= new Date().toISOString().slice(0, 7), "Choose a month that has already started");
const education = z.object({ qualification: z.string().trim().min(2).max(120), institution: z.string().trim().min(2).max(160), year: z.number().int().min(1950).max(new Date().getUTCFullYear() + 6) }).strict();
const experience = z.object({ company: z.string().trim().min(2).max(160), role: z.string().trim().min(2).max(120), startMonth: month, endMonth: month.nullable(), current: z.boolean(), description: text(600) }).strict()
  .refine(value => value.current ? value.endMonth === null : Boolean(value.endMonth && value.endMonth >= value.startMonth), "Check the work dates; current roles have no end date");
export const workerProfileSchema = z.object({
  revision: z.number().int().min(0), fullName: z.string().trim().min(2).max(120), phone: workerPhone,
  headline: text(100), about: text(1200), city: text(120), state: text(120),
  postalCode: z.union([z.literal(""), z.string().regex(/^[0-9]{6}$/, "Enter a six-digit PIN code")]),
  skills: list(), languages: list(10), experienceYears: z.number().int().min(0).max(60).nullable(),
  education: z.array(education).max(8), workExperience: z.array(experience).max(10),
  preferredLocations: list(10), preferredCategories: list(10), preferredEngagements: list(10),
  availability: text(80), isAvailable: z.boolean(), consent: z.literal(true, "Please confirm that these details can be stored in your worker profile"),
}).strict();
export const resumeRevisionSchema = z.object({ revision: z.number().int().min(0) }).strict();
export const resumeHeadersSchema = z.object({ revision: z.coerce.number().int().min(0) });
export const workerJobsQuerySchema = z.object({ query: text(120).optional(), city: text(120).optional(), category: text(120).optional(), engagementType: text(120).optional(), page: z.coerce.number().int().min(1).max(5000).default(1) }).strict();
export const savedJobsQuerySchema = z.object({ page: z.coerce.number().int().min(1).max(100).default(1) }).strict();
export const workerJobIdSchema = z.object({ jobId: z.string().min(1).max(180) }).strict();
export const workerJobSlugSchema = z.object({ slug: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,179}$/) }).strict();
export type WorkerProfileInput = z.infer<typeof workerProfileSchema>;
export type WorkerJobsQuery = z.infer<typeof workerJobsQuerySchema>;
