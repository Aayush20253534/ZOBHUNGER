import { z } from "zod";

export const partnerReviewQuery = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  query: z.string().trim().max(160).default(""),
  status: z.enum(["SUBMITTED", "REVIEWED", "CONTACTED", "CLOSED", "APPROVED", "REJECTED"]).optional(),
});
export const partnerReviewSchema = z.object({
  status: z.enum(["REVIEWED", "CONTACTED", "CLOSED", "APPROVED", "REJECTED"]),
  notes: z.string().trim().max(4000).default(""),
  expectedUpdatedAt: z.iso.datetime(),
}).strict();
export const reissueCredentialsSchema = z.object({ expectedUpdatedAt: z.iso.datetime() }).strict();
export type PartnerReviewQuery = z.infer<typeof partnerReviewQuery>;
export type PartnerReviewInput = z.infer<typeof partnerReviewSchema>;
