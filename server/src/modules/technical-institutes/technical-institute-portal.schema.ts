import { z } from "zod";
import { technicalOpportunityApplicationStatusValues, technicalOpportunityTypeValues } from "./technical-opportunities.schema.js";

export const technicalInstitutePortalOpportunityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(160).optional(),
  opportunityType: z.enum(technicalOpportunityTypeValues).optional(),
});

export const technicalInstitutePortalApplicationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(160).optional(),
  status: z.enum(technicalOpportunityApplicationStatusValues).optional(),
  opportunityType: z.enum(technicalOpportunityTypeValues).optional(),
});


export const technicalInstitutePortalMatchQuerySchema = z.object({
  search: z.string().trim().max(140).optional(),
  minScore: z.coerce.number().int().min(0).max(100).default(55),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const technicalInstitutePortalOpportunityParamsSchema = z.object({
  opportunityId: z.string().trim().min(1).max(180),
});

export const technicalInstitutePortalStudentParamsSchema = z.object({
  studentId: z.string().trim().min(1).max(180),
});

export const technicalInstitutePortalSubmitSchema = z.object({
  studentId: z.string().trim().min(1).max(180),
  note: z.union([z.string().trim().max(1200), z.literal("")]).optional().transform((value) => value || undefined),
});

export type TechnicalInstitutePortalOpportunityQuery = z.infer<typeof technicalInstitutePortalOpportunityQuerySchema>;
export type TechnicalInstitutePortalMatchQuery = z.infer<typeof technicalInstitutePortalMatchQuerySchema>;
export type TechnicalInstitutePortalApplicationQuery = z.infer<typeof technicalInstitutePortalApplicationQuerySchema>;
export type TechnicalInstitutePortalSubmitInput = z.infer<typeof technicalInstitutePortalSubmitSchema>;
