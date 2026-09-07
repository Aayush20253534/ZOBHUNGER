import { z } from "zod";

export const placementOpportunityQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  city: z.string().trim().max(100).optional(),
  opportunityType: z.string().trim().max(80).optional(),
});

export const placementOpportunityParamsSchema = z.object({
  jobId: z.string().trim().min(1).max(180),
});

export const placementOpportunityApplicationSchema = z.object({
  candidateId: z.string().trim().min(1).max(180),
  message: z.string().trim().max(1200).optional().transform((value) => value || undefined),
});

export const placementApplicationQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["SUBMITTED", "REVIEWED", "SHORTLISTED", "REJECTED"]).optional(),
});

export type PlacementOpportunityQuery = z.infer<typeof placementOpportunityQuerySchema>;
export type PlacementOpportunityApplicationInput = z.infer<typeof placementOpportunityApplicationSchema>;
export type PlacementApplicationQuery = z.infer<typeof placementApplicationQuerySchema>;
