import { z } from "zod";

export const technicalStudentOpportunityValues = ["jobs", "internships", "apprenticeships", "training"] as const;
export const technicalStudentQualificationValues = ["iti", "diploma-polytechnic"] as const;
export const technicalStudentGenderValues = ["male", "female", "other", "prefer-not-to-say"] as const;

const optionalText = (max: number) => z.union([z.string().trim().max(max), z.literal("")]).optional().transform((value) => value || undefined);
const stringList = (maxItems: number) => z.array(z.string().trim().min(1).max(120)).max(maxItems).default([]);
const validDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for date of birth").refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid calendar date");
const optionalDate = z.union([validDate, z.literal("")]).optional().transform((value) => value || undefined);

export const technicalStudentCoreSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  mobileNumber: z.string().trim().min(7).max(24),
  enrollmentNumber: optionalText(100),
  dateOfBirth: optionalDate,
  gender: z.enum(technicalStudentGenderValues).optional(),
  qualification: z.enum(technicalStudentQualificationValues),
  tradeBranch: z.string().trim().min(2).max(160),
  passingYear: z.string().trim().regex(/^20\d{2}$/, "Passing year must be a four-digit year"),
  currentSemesterYear: optionalText(80),
  academicScore: optionalText(80),
  skills: stringList(30),
  certifications: stringList(30),
  currentCity: z.string().trim().min(2).max(120),
  currentState: z.string().trim().min(2).max(120),
  preferredLocations: stringList(20),
  preferredOpportunityTypes: z.array(z.enum(technicalStudentOpportunityValues)).min(1).max(technicalStudentOpportunityValues.length),
});

export const publicTechnicalStudentRegistrationSchema = technicalStudentCoreSchema.extend({
  partnershipCode: z.string().trim().min(6).max(100).transform((value) => value.toUpperCase()),
  consentAccepted: z.literal(true),
});

export const adminTechnicalStudentBodySchema = technicalStudentCoreSchema;

export const technicalStudentPartnerParamsSchema = z.object({
  partnershipCode: z.string().trim().min(6).max(100).transform((value) => value.toUpperCase()),
});

export const technicalStudentAdminInstituteParamsSchema = z.object({
  id: z.string().trim().min(1).max(180),
});

export const technicalStudentAdminParamsSchema = z.object({
  id: z.string().trim().min(1).max(180),
  studentId: z.string().trim().min(1).max(180),
});

export const technicalStudentAdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().min(1).max(160).optional(),
  status: z.enum(["PENDING", "VERIFIED", "INACTIVE"]).optional(),
  qualification: z.enum(technicalStudentQualificationValues).optional(),
  tradeBranch: z.string().trim().min(1).max(160).optional(),
  passingYear: z.string().trim().regex(/^20\d{2}$/).optional(),
});

export const technicalStudentStatusSchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "INACTIVE"]),
});

export const technicalStudentImportQuerySchema = z.object({
  mode: z.enum(["validate", "import"]).default("validate"),
});

export type TechnicalStudentCoreInput = z.infer<typeof technicalStudentCoreSchema>;
export type PublicTechnicalStudentRegistrationInput = z.infer<typeof publicTechnicalStudentRegistrationSchema>;
export type TechnicalStudentAdminListQuery = z.infer<typeof technicalStudentAdminListQuerySchema>;
export type TechnicalStudentAdminParams = z.infer<typeof technicalStudentAdminParamsSchema>;
export type TechnicalStudentAdminInstituteParams = z.infer<typeof technicalStudentAdminInstituteParamsSchema>;
export type TechnicalStudentImportQuery = z.infer<typeof technicalStudentImportQuerySchema>;
