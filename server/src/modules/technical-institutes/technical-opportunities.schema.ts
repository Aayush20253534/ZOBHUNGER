import { z } from "zod";

export const technicalOpportunityTypeValues = ["JOB", "INTERNSHIP", "APPRENTICESHIP", "TRAINING"] as const;
export const technicalOpportunityStatusValues = ["DRAFT", "OPEN", "CLOSED", "ARCHIVED"] as const;
export const technicalOpportunityApplicationStatusValues = ["SUBMITTED", "REVIEWED", "SHORTLISTED", "SELECTED", "REJECTED", "JOINED"] as const;

const optionalText = (max: number) => z.union([z.string().trim().max(max), z.literal("")]).optional().transform((value) => value || undefined);
const optionalDateTime = z.union([z.string().datetime({ offset: true }), z.literal("")]).optional().transform((value) => value || undefined);
const list = (maxItems: number) => z.array(z.string().trim().min(1).max(120)).max(maxItems).default([]);

export const technicalOpportunityBodySchema = z.object({
  title: z.string().trim().min(3).max(180),
  employerName: z.string().trim().min(2).max(180),
  opportunityType: z.enum(technicalOpportunityTypeValues),
  status: z.enum(technicalOpportunityStatusValues).default("DRAFT"),
  description: z.string().trim().min(20).max(5000),
  location: z.string().trim().min(2).max(180),
  city: optionalText(120),
  state: optionalText(120),
  workMode: optionalText(80),
  eligibleQualifications: z.array(z.enum(["iti", "diploma-polytechnic"])).max(2).default([]),
  eligibleTradesBranches: list(40),
  eligiblePassingYears: z.array(z.string().trim().regex(/^20\d{2}$/)).max(12).default([]),
  requiredSkills: list(30),
  preferredSkills: list(30),
  eligibleStates: list(30),
  vacancies: z.number().int().min(1).max(100000).optional(),
  compensation: optionalText(180),
  duration: optionalText(160),
  applicationDeadline: optionalDateTime,
  joiningDate: optionalDateTime,
  adminNotes: optionalText(3000),
});

export const technicalOpportunityListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(140).optional(),
  status: z.enum(technicalOpportunityStatusValues).optional(),
  opportunityType: z.enum(technicalOpportunityTypeValues).optional(),
});

export const technicalOpportunityParamsSchema = z.object({
  id: z.string().trim().min(1).max(180),
});

export const technicalOpportunityMatchQuerySchema = z.object({
  search: z.string().trim().max(140).optional(),
  instituteId: z.string().trim().max(180).optional(),
  minScore: z.coerce.number().int().min(0).max(100).default(55),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const technicalOpportunitySubmitSchema = z.object({
  studentId: z.string().trim().min(1).max(180),
  note: optionalText(1200),
});

export const technicalOpportunityApplicationParamsSchema = z.object({
  id: z.string().trim().min(1).max(180),
  applicationId: z.string().trim().min(1).max(180),
});

export const technicalOpportunityApplicationStatusSchema = z.object({
  status: z.enum(technicalOpportunityApplicationStatusValues),
});

export type TechnicalOpportunityInput = z.infer<typeof technicalOpportunityBodySchema>;
export type TechnicalOpportunityListQuery = z.infer<typeof technicalOpportunityListQuerySchema>;
export type TechnicalOpportunityMatchQuery = z.infer<typeof technicalOpportunityMatchQuerySchema>;
export type TechnicalOpportunitySubmitInput = z.infer<typeof technicalOpportunitySubmitSchema>;
