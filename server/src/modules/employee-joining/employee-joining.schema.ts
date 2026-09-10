import { z } from "zod";

const text = (max: number, min = 2) => z.string().trim().min(min).max(max);
const optionalText = (max: number) => z.string().trim().max(max).default("");
const phone = z.string().trim().regex(/^\+?[\d ()-]{7,24}$/, "Enter a valid phone number").refine(value => value.replace(/\D/g, "").length >= 7, "Enter a valid phone number");
const email = z.string().trim().email().max(254).transform(value => value.toLowerCase());
function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").refine(isCalendarDate, "Enter a valid date");
const currentYear = new Date().getUTCFullYear();
const compactDigits = (min: number, max: number, message: string) => z.string().trim().transform(value => value.replace(/\s+/g, "")).refine(value => new RegExp(`^\\d{${min},${max}}$`).test(value), message);
const optionalTwelveDigits = z.string().trim().default("").transform(value => value.replace(/\s+/g, "")).refine(value => value === "" || /^\d{12}$/.test(value), "Enter a valid 12-digit UAN");

const previousEmployment = z.object({
  company: text(180),
  designation: text(120),
  startDate: dateOnly,
  endDate: z.union([dateOnly, z.literal("")]).default(""),
  current: z.boolean().default(false),
  lastMonthlySalary: z.number().int().min(0).max(100_000_000).nullable().default(null),
  reasonForLeaving: optionalText(500),
}).strict().refine(value => value.current ? !value.endDate : Boolean(value.endDate) && value.endDate >= value.startDate, "Check previous employment dates");

export const employeeDocumentKinds = ["PHOTO", "AADHAAR", "PAN", "BANK_PROOF", "ADDRESS_PROOF", "EDUCATION", "EXPERIENCE", "OTHER"] as const;
export const requiredEmployeeDocumentKinds = ["PHOTO", "AADHAAR", "PAN", "BANK_PROOF"] as const;
export const employeeJoiningStatuses = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;
export const employeeOfferStatuses = ["DRAFT", "APPROVED", "ISSUING", "ISSUED"] as const;

export const employeeJoiningSubmissionSchema = z.object({
  requestKey: z.uuid(),
  projectCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9-]{1,15}$/, "Use the project code shared by HR"),
  projectAssignment: text(180),
  fullName: text(120),
  fatherGuardianName: text(120),
  personalEmail: email,
  phone,
  alternatePhone: z.union([phone, z.literal("")]).default(""),
  dateOfBirth: dateOnly.refine(value => {
    const date = new Date(`${value}T00:00:00.000Z`);
    const now = new Date();
    const age = now.getUTCFullYear() - date.getUTCFullYear() - (now < new Date(Date.UTC(now.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())) ? 1 : 0);
    return age >= 16 && age <= 80;
  }, "Employee age must be between 16 and 80"),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "OTHER", "PREFER_NOT_TO_SAY"]).or(z.literal("")).default(""),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).or(z.literal("")).default(""),
  shirtSize: z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]).or(z.literal("")).default(""),
  currentAddressLine1: text(220, 5),
  currentAddressLine2: optionalText(220),
  currentCity: text(120),
  currentState: text(120),
  currentPostalCode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  permanentSameAsCurrent: z.boolean().default(true),
  permanentAddressLine1: text(220, 5),
  permanentAddressLine2: optionalText(220),
  permanentCity: text(120),
  permanentState: text(120),
  permanentPostalCode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  emergencyContactName: text(120),
  emergencyRelationship: text(80),
  emergencyPhone: phone,
  aadhaarNumber: compactDigits(12, 12, "Enter a valid 12-digit Aadhaar number"),
  panNumber: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN number"),
  bankAccountHolder: text(120),
  bankName: text(160),
  bankAccountNumber: compactDigits(6, 20, "Enter a valid bank account number"),
  ifscCode: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code"),
  bankBranch: text(160),
  upiId: z.string().trim().max(120).default(""),
  uanNumber: optionalTwelveDigits,
  highestQualification: text(120),
  institution: text(180),
  boardUniversity: optionalText(180),
  graduationYear: z.number().int().min(1950).max(currentYear + 8).nullable().default(null),
  grade: optionalText(60),
  previousEmployment: z.array(previousEmployment).max(5).default([]),
  consent: z.literal(true),
}).strict();

export const employeeJoiningQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  query: optionalText(160),
  status: z.enum(employeeJoiningStatuses).optional(),
  projectCode: z.string().trim().toUpperCase().max(16).default(""),
});

export const employeeJoiningReviewSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED"]),
  notes: optionalText(4000),
  expectedRevision: z.number().int().nonnegative(),
}).strict().refine(value => value.status !== "REJECTED" || value.notes.length >= 10, "Add a reason of at least 10 characters when rejecting a joining record");

export const employeeOfferSchema = z.object({
  designation: text(140),
  department: text(140),
  projectAssignment: text(180),
  workLocation: text(180),
  joiningDate: dateOnly,
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "FIXED_TERM", "INTERNSHIP"]),
  monthlyGrossSalary: z.number().int().min(0).max(100_000_000),
  annualCtc: z.number().int().min(0).max(1_000_000_000),
  probationMonths: z.number().int().min(0).max(24).default(3),
  noticePeriodDays: z.number().int().min(0).max(365).default(30),
  additionalTerms: optionalText(5000),
  authorizedSignatoryName: text(120),
  authorizedSignatoryTitle: text(120),
  expectedRevision: z.number().int().nonnegative(),
}).strict();

export const employeeOfferActionSchema = z.object({ expectedRevision: z.number().int().nonnegative() }).strict();
export const employeeJoiningIdSchema = z.object({ id: z.uuid() });
export const employeeDocumentParamsSchema = employeeJoiningIdSchema.extend({ kind: z.enum(employeeDocumentKinds) });
export const employeeDocumentDownloadParamsSchema = employeeJoiningIdSchema.extend({ documentId: z.uuid() });

export type EmployeeJoiningSubmission = z.infer<typeof employeeJoiningSubmissionSchema>;
export type EmployeeJoiningQuery = z.infer<typeof employeeJoiningQuerySchema>;
export type EmployeeJoiningReview = z.infer<typeof employeeJoiningReviewSchema>;
export type EmployeeOfferInput = z.infer<typeof employeeOfferSchema>;
export type EmployeeOfferAction = z.infer<typeof employeeOfferActionSchema>;
