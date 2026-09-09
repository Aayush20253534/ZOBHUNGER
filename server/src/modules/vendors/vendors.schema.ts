import { z } from "zod";

export const vendorCategories = ["WORKFORCE", "RECRUITMENT", "MARKETING", "OPERATIONS", "SPECIALIZED"] as const;
export const vendorStatuses = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"] as const;
export const vendorDocumentKinds = ["COMPANY_PROFILE", "REGISTRATION", "TAX", "MSME", "OTHER"] as const;
const text = (max: number, min = 2) => z.string().trim().min(min).max(max);
const optionalText = (max: number) => z.string().trim().max(max).default("");
const phone = z.string().trim().regex(/^\+?[\d ()-]{7,24}$/, "Enter a valid phone number").refine(value => value.replace(/\D/g, "").length >= 7, "Enter a valid phone number");
const email = z.string().trim().email().max(254).transform(value => value.toLowerCase());
const website = z.union([z.string().trim().url().max(1000).refine(value => /^https?:\/\//i.test(value), "Use an http or https URL"), z.literal("")]).default("");
const coverage = z.array(text(120)).min(1).max(30).transform(values => [...new Set(values)]);
const contactFields = { contactName: text(120), contactRole: text(100), email, phone, alternatePhone: z.union([phone, z.literal("")]).default(""), website };

export const vendorSubmissionSchema = z.object({
  requestKey: z.uuid(), companyName: text(180),
  organizationType: z.enum(["COMPANY", "AGENCY", "MSME", "STARTUP", "PARTNERSHIP", "SOLE_PROPRIETOR", "OTHER"]),
  establishedYear: z.number().int().min(1900).max(new Date().getFullYear()).nullable().default(null),
  registrationNumber: optionalText(80), gstNumber: optionalText(30), msmeNumber: optionalText(80),
  addressLine: text(350, 5), city: text(120), state: text(120), postalCode: z.string().trim().regex(/^[a-zA-Z0-9 -]{3,12}$/, "Enter a valid postal code"), country: text(120),
  ...contactFields,
  serviceCategories: z.array(z.enum(vendorCategories)).min(1).max(5).transform(values => [...new Set(values)].sort()),
  specializedServices: optionalText(600), serviceDescription: text(5000, 30),
  yearsExperience: z.number().int().min(0).max(100), teamSize: z.number().int().min(1).max(1000000),
  coverage, industries: z.array(text(100)).max(15).default([]).transform(values => [...new Set(values)]),
  projectExperience: text(5000, 20), notableClients: optionalText(1500), capacityNotes: optionalText(1500),
  consent: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.serviceCategories.includes("SPECIALIZED") && value.specializedServices.length < 10) context.addIssue({ code: "custom", path: ["specializedServices"], message: "Describe your specialized services in at least 10 characters" });
});
export const vendorQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1), query: optionalText(160),
  status: z.enum(vendorStatuses).optional(), category: z.enum(vendorCategories).optional(),
  view: z.enum(["applications", "directory"]).default("applications"),
});
export const vendorReviewSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"]),
  notes: optionalText(4000), expectedRevision: z.number().int().nonnegative(),
}).strict().refine(value => !["REJECTED", "SUSPENDED"].includes(value.status) || value.notes.length >= 10, "Add a reason of at least 10 characters when rejecting or suspending a vendor");
export const vendorRecordSchema = z.object({
  ...contactFields, teamSize: z.number().int().min(1).max(1000000), coverage, capacityNotes: optionalText(1500),
  accountManager: optionalText(120), internalNotes: optionalText(4000), expectedRevision: z.number().int().nonnegative(),
}).strict();
export const vendorIdSchema = z.object({ id: z.uuid() });
export const vendorUploadParamsSchema = vendorIdSchema.extend({ kind: z.enum(vendorDocumentKinds) });
export const vendorDownloadParamsSchema = vendorIdSchema.extend({ documentId: z.uuid() });
export type VendorSubmission = z.infer<typeof vendorSubmissionSchema>;
export type VendorQuery = z.infer<typeof vendorQuerySchema>;
export type VendorReview = z.infer<typeof vendorReviewSchema>;
export type VendorRecord = z.infer<typeof vendorRecordSchema>;
