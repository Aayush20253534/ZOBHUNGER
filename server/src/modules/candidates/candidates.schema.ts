import { z } from "zod";

export const candidateStatuses = ["SHARED", "SHORTLISTED", "INTERVIEW_REQUESTED", "SELECTED", "REJECTED"] as const;
const id = z.string().trim().regex(/^[a-zA-Z0-9_-]{1,64}$/);
export const candidateParams = z.object({ id });
export const candidateQuery = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  query: z.string().trim().max(100).default(""),
  requirementId: id.optional(),
  status: z.enum(["ALL", ...candidateStatuses]).default("ALL"),
}).strict();
export const historyQuery = z.object({ historyPage: z.coerce.number().int().min(1).max(100000).default(1) }).strict();
export const lookupQuery = z.object({
  requirementId: id.optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  query: z.string().trim().max(100).default(""),
}).strict();

// CVs are external links, never fetched by this API or rendered as HTML.
export function safeResumeUrl(value: string | null | undefined): string | null {
  if (!value || value.length > 2000) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export const shareCandidateSchema = z.object({
  requirementId: id,
  applicationId: id,
  summary: z.string().trim().min(10).max(1500),
  skills: z.array(z.string().trim().min(1).max(60)).max(12).transform(values => values.filter((value, index) => values.findIndex(other => other.toLowerCase() === value.toLowerCase()) === index)),
}).strict();
const revision = z.number().int().min(0).max(2147483646);
const note = z.string().trim().min(3).max(2000);
export const reviewCandidateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("STATUS"), revision, status: z.enum(["SHARED", "SHORTLISTED", "SELECTED", "REJECTED"]), note }).strict(),
  z.object({ action: z.literal("FEEDBACK"), revision, note }).strict(),
  z.object({ action: z.literal("INTERVIEW"), revision, note,
    interviewAt: z.iso.datetime({ offset: true }).transform(value => new Date(value)),
    interviewMode: z.enum(["PHONE", "VIDEO", "IN_PERSON"]),
    interviewDetails: z.string().trim().min(3).max(1000),
  }).strict(),
]);
export const revokeCandidateSchema = z.object({ revision, note }).strict();
export type CandidateQuery = z.infer<typeof candidateQuery>;
export type LookupQuery = z.infer<typeof lookupQuery>;
export type ShareCandidateInput = z.infer<typeof shareCandidateSchema>;
export type ReviewCandidateInput = z.infer<typeof reviewCandidateSchema>;
