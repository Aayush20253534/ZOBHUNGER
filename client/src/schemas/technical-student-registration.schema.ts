import { z } from "zod";

export const technicalStudentOpportunityValues = ["jobs", "internships", "apprenticeships", "training"] as const;

const optionalDate = z.string().trim().refine(
  (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
  "Enter a valid date of birth",
);

export const technicalStudentRegistrationSchema = z.object({
  partnershipCode: z.string().trim().min(6, "Enter the institute partnership code").max(100),
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(254),
  mobileNumber: z.string().trim().min(7, "Enter a valid mobile number").max(24),
  enrollmentNumber: z.string().trim().max(100),
  dateOfBirth: optionalDate,
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]),
  qualification: z.enum(["iti", "diploma-polytechnic"]),
  tradeBranch: z.string().trim().min(2, "Enter your ITI trade or Polytechnic branch").max(160),
  passingYear: z.string().trim().regex(/^20\d{2}$/, "Enter a four-digit passing year"),
  currentSemesterYear: z.string().trim().max(80),
  academicScore: z.string().trim().max(80),
  skills: z.string().trim().max(1200),
  certifications: z.string().trim().max(1200),
  currentCity: z.string().trim().min(2, "Enter your current city").max(120),
  currentState: z.string().trim().min(2, "Enter your current state").max(120),
  preferredLocations: z.string().trim().max(1200),
  preferredOpportunityTypes: z.array(z.enum(technicalStudentOpportunityValues)).min(1, "Select at least one opportunity type"),
  consentAccepted: z.boolean().refine((value) => value, "Confirm that the information is accurate and may be used for opportunity matching"),
});

export type TechnicalStudentRegistrationInput = z.infer<typeof technicalStudentRegistrationSchema>;
