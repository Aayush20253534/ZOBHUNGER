import { z } from "zod";

const optionalUrl = z.string().trim().max(1000).refine(
  (value) => !value || /^https?:\/\//i.test(value),
  "Enter a valid URL beginning with http:// or https://",
);

const optionalPhone = z.string().trim().max(24).refine(
  (value) => !value || value.replace(/\D/g, "").length >= 7,
  "Enter a valid phone number",
);

export const technicalPartnershipOpportunityValues = [
  "jobs",
  "internships",
  "apprenticeships",
  "training",
  "campus-hiring",
  "technical-recruitment-drives",
  "industry-visits",
  "skill-development",
] as const;

export const technicalInstituteApplicationSchema = z.object({
  institutionName: z.string().trim().min(2, "Enter the institute name").max(200),
  institutionType: z.enum(["iti", "polytechnic", "technical-institute"], {
    required_error: "Select an institute type",
  }),
  ownershipType: z.enum(["government", "private", "aided", "other"], {
    required_error: "Select the institute ownership type",
  }),
  affiliationBody: z.enum(["ncvt", "scvt", "aicte", "state-board", "other"], {
    required_error: "Select the affiliation or approval body",
  }),
  affiliationNumber: z.string().trim().max(160),
  website: optionalUrl,
  district: z.string().trim().min(2, "Enter the district").max(120),
  city: z.string().trim().min(2, "Enter the city").max(120),
  state: z.string().trim().min(2, "Enter the state").max(120),
  postalCode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  contactPersonName: z.string().trim().min(2, "Enter the placement or training officer name").max(120),
  designation: z.string().trim().min(2, "Enter the designation").max(120),
  officialEmail: z.string().trim().email("Enter a valid official email address").max(254),
  mobileNumber: z.string().trim().min(7, "Enter a valid mobile number").max(24),
  alternateNumber: optionalPhone,
  totalStudents: z.number().int().min(1, "Enter the total student strength").max(1000000),
  finalYearStudents: z.number().int().min(0, "Enter a valid final-year student count").max(1000000),
  passingYear: z.string().trim().min(4, "Enter the primary passing year or batch").max(40),
  tradesBranches: z.string().trim().min(2, "Enter the available trades or branches").max(3000),
  preferredOpportunityTypes: z.array(z.enum(technicalPartnershipOpportunityValues)).min(
    1,
    "Select at least one partnership area",
  ),
  technicalHiringNotes: z.string().trim().max(3000),
}).superRefine((value, ctx) => {
  if (value.finalYearStudents > value.totalStudents) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["finalYearStudents"],
      message: "Final-year students cannot exceed total student strength",
    });
  }
});

export type TechnicalInstituteApplicationInput = z.infer<typeof technicalInstituteApplicationSchema>;
