import { z } from "zod";
import type { BusinessRequirementInput } from "@/types/business-requirements.types";

const date = z.string().refine(value => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Enter a valid calendar date");

export const businessRequirementFormSchema = z.object({
  companyName: z.string().trim().min(2, "Enter your company name").max(160),
  contactPerson: z.string().trim().min(2, "Enter the contact person’s name").max(120),
  businessEmail: z.string().trim().email("Enter a valid business email").max(254),
  mobileNumber: z.string().trim().min(7, "Enter a valid phone number").max(24).regex(/^[+0-9 ()-]+$/, "Use numbers and an optional country code"),
  industry: z.string().trim().min(2, "Choose or enter an industry").max(120),
  serviceRequired: z.string().trim().min(2, "Choose or describe the service you need").max(160),
  workforceCount: z.number({ invalid_type_error: "Enter the number of people" }).int("Use a whole number").min(1, "Request at least one person").max(1000000),
  locations: z.array(z.object({ name: z.string().trim().min(2, "Enter a city, area or site").max(180) })).min(1).max(50),
  projectDuration: z.string().trim().min(2, "Enter the expected duration").max(160),
  expectedStartAt: date,
  details: z.string().trim().min(5, "Describe the work your team will do").max(6000),
});
export type BusinessRequirementFormValues = z.infer<typeof businessRequirementFormSchema>;

export function toBusinessRequirementInput(values: BusinessRequirementFormValues): BusinessRequirementInput {
  const parsed = businessRequirementFormSchema.parse(values);
  const seen = new Set<string>();
  const locations = parsed.locations.map(row => row.name.replace(/\s+/g, " ")).filter(place => {
    const key = place.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true;
  });
  return { ...parsed, locations, businessEmail: parsed.businessEmail.toLowerCase(), expectedStartAt: parsed.expectedStartAt || null };
}
