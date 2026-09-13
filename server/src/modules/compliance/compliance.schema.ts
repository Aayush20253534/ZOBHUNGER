import { z } from "zod";
import { ComplianceStatus } from "../../generated/prisma/client.js";

const text = (max: number, min = 1) => z.string().trim().min(min).max(max);
const optionalText = (max: number) => z.string().trim().max(max).default("");
const dateOnly = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const optionalMoney = z.number().int().min(0).max(100_000_000).nullable().default(null);
const optionalIdentifier = z.string().trim().transform(value => value.replace(/\s+/g, "")).pipe(z.string().regex(/^\d{0,20}$/, "Use digits only").max(20)).default("");

export const complianceAccessSchema = z.object({
  employeeNumber: text(80).transform(value => value.toUpperCase()),
  personalEmail: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  dateOfBirth: dateOnly,
  aadhaarLast4: z.string().trim().regex(/^\d{4}$/, "Enter the last 4 Aadhaar digits"),
}).strict();

export const pfComplianceDraftSchema = z.object({
  appointmentDate: dateOnly.or(z.literal("")).default(""),
  epfWages: optionalMoney,
  monthlyGross: optionalMoney,
  department: optionalText(140),
  designation: optionalText(140),
  husbandName: optionalText(140),
  presentDistrict: optionalText(120),
  permanentDistrict: optionalText(120),
  bankAccountType: z.enum(["SAVINGS", "CURRENT"]).or(z.literal("")).default(""),
  existingUanNumber: optionalIdentifier.refine(value => !value || /^\d{12}$/.test(value), "UAN must contain 12 digits"),
}).strict();

const familyMemberSchema = z.object({
  id: z.uuid().optional(),
  nameAsAadhaar: text(140),
  relationship: text(80),
  dateOfBirth: dateOnly,
  residesWithEmployee: z.boolean(),
  address: optionalText(300),
  aadhaarNumber: z.string().trim().transform(value => value.replace(/\s+/g, "")).pipe(z.string().regex(/^\d{12}$/, "Enter a valid 12-digit Aadhaar number")),
}).strict().refine(value => value.residesWithEmployee || value.address.length >= 5, {
  message: "Add the family member address when they do not reside with the employee",
  path: ["address"],
});

export const esicComplianceDraftSchema = z.object({
  esiApplicable: z.boolean().nullable().default(null),
  esiNumber: optionalIdentifier,
  nomineeName: optionalText(140),
  nomineeRelationship: optionalText(80),
  nomineeAddress: optionalText(300),
  nomineeMobile: z.string().trim().max(24).default(""),
  nomineeEmail: z.string().trim().max(254).default("").refine(value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid nominee email"),
  familyMembers: z.array(familyMemberSchema).max(15).default([]),
}).strict();


export const pfComplianceAdminUpdateSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  appointmentDate: dateOnly.or(z.literal("")),
  epfWages: optionalMoney,
  monthlyGross: optionalMoney,
  department: optionalText(140),
  designation: optionalText(140),
  bankAccountType: z.enum(["SAVINGS", "CURRENT"]).or(z.literal("")).default(""),
  existingUanNumber: optionalIdentifier.refine(value => !value || /^\d{12}$/.test(value), "UAN must contain 12 digits"),
}).strict();

export const esicComplianceAdminUpdateSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  esiApplicable: z.boolean(),
  esiNumber: optionalIdentifier,
}).strict();

export const complianceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  query: z.string().trim().max(160).default(""),
  status: z.nativeEnum(ComplianceStatus).optional(),
  department: z.string().trim().max(140).default(""),
}).strict();

export const complianceJoiningParamsSchema = z.object({ joiningId: z.uuid() });
export const complianceDocumentParamsSchema = complianceJoiningParamsSchema.extend({ documentId: z.uuid() });
export const complianceFamilyPhotoParamsSchema = complianceJoiningParamsSchema.extend({ familyMemberId: z.uuid() });

export const complianceReviewSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "NEEDS_CORRECTION", "VERIFIED", "PROCESSED"]),
  remarks: optionalText(3000),
  expectedRevision: z.number().int().nonnegative(),
}).strict().refine(value => value.status !== "NEEDS_CORRECTION" || value.remarks.length >= 8, {
  message: "Add correction remarks of at least 8 characters",
  path: ["remarks"],
});

export type ComplianceAccessInput = z.infer<typeof complianceAccessSchema>;
export type PfComplianceDraftInput = z.infer<typeof pfComplianceDraftSchema>;
export type EsicComplianceDraftInput = z.infer<typeof esicComplianceDraftSchema>;
export type ComplianceListQuery = z.infer<typeof complianceListQuerySchema>;
export type ComplianceReviewInput = z.infer<typeof complianceReviewSchema>;
export type PfComplianceAdminUpdateInput = z.infer<typeof pfComplianceAdminUpdateSchema>;
export type EsicComplianceAdminUpdateInput = z.infer<typeof esicComplianceAdminUpdateSchema>;
