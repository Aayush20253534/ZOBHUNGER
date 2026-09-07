import { z } from "zod";

const list = z.array(z.string().trim().min(1).max(80)).max(30).default([]);
const optionalText = z.string().trim().max(300).optional().transform((value) => value || undefined);

export const placementCandidateBodySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  mobileNumber: z.string().trim().min(7).max(20),
  qualification: z.string().trim().min(2).max(120),
  course: z.string().trim().min(2).max(120),
  department: optionalText,
  skills: list,
  interests: list,
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  availability: z.string().trim().min(2).max(100),
  experience: optionalText,
  preferredWorkTypes: list,
});
export const placementCandidateParamsSchema = z.object({ id: z.string().trim().min(1).max(100) });
export const placementCandidateQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  city: z.string().trim().max(100).optional(),
  workType: z.string().trim().max(80).optional(),
});
export type PlacementCandidateInput = z.infer<typeof placementCandidateBodySchema>;
export type PlacementCandidateQuery = z.infer<typeof placementCandidateQuerySchema>;
