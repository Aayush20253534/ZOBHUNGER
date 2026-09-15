import { z } from "zod";

const opportunityTypes = [
  "jobs",
  "internships",
  "apprenticeships",
  "training",
  "campus-hiring",
  "technical-recruitment-drives",
  "industry-visits",
  "skill-development",
] as const;

const optionalTrimmed = (max: number) => z.union([
  z.string().trim().max(max),
  z.literal(""),
]).optional().transform((value) => value || undefined);

export const createTechnicalInstituteApplicationSchema = z.object({
  institutionName: z.string().trim().min(2).max(200),
  institutionType: z.enum(["iti", "polytechnic", "technical-institute"]),
  ownershipType: z.enum(["government", "private", "aided", "other"]),
  affiliationBody: z.enum(["ncvt", "scvt", "aicte", "state-board", "other"]),
  affiliationNumber: optionalTrimmed(160),
  website: z.union([z.string().trim().url().max(1000), z.literal("")]).optional().transform((value) => value || undefined),
  district: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().regex(/^\d{6}$/),
  contactPersonName: z.string().trim().min(2).max(120),
  designation: z.string().trim().min(2).max(120),
  officialEmail: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  mobileNumber: z.string().trim().min(7).max(24),
  alternateNumber: optionalTrimmed(24),
  totalStudents: z.coerce.number().int().min(1).max(1000000),
  finalYearStudents: z.coerce.number().int().min(0).max(1000000),
  passingYear: z.string().trim().min(4).max(40),
  tradesBranches: z.string().trim().min(2).max(3000),
  preferredOpportunityTypes: z.array(z.enum(opportunityTypes)).min(1).max(opportunityTypes.length),
  technicalHiringNotes: optionalTrimmed(3000),
}).superRefine((value, ctx) => {
  if (value.finalYearStudents > value.totalStudents) {
    ctx.addIssue({
      code: "custom",
      path: ["finalYearStudents"],
      message: "Final-year students cannot exceed total student strength",
    });
  }
});

export type CreateTechnicalInstituteApplicationInput = z.infer<typeof createTechnicalInstituteApplicationSchema>;
