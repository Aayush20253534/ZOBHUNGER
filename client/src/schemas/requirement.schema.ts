import { z } from "zod";
import { industries } from "@/data/industries";
import {
  emailSchema,
  phoneSchema,
  serviceSchema,
} from "@/schemas/common.schema";

export const requirementSchema = z.object({
  companyName: z.string().trim().min(2, "Enter your company name.").max(160),
  contactPerson: z
    .string()
    .trim()
    .min(2, "Enter the contact person's name.")
    .max(120),
  businessEmail: emailSchema,
  mobileNumber: phoneSchema,
  industry: z
    .string()
    .refine(
      (value) => industries.some((industry) => industry.slug === value),
      "Choose an industry.",
    ),
  serviceRequired: serviceSchema,
  workforceCount: z
    .number()
    .int("Use a whole number.")
    .min(1, "Enter at least one person.")
    .max(100000),
  locations: z
    .array(z.string().trim().min(2, "Enter a location.").max(120))
    .min(1, "Add at least one location.")
    .max(50),
  projectDuration: z
    .string()
    .trim()
    .min(1, "Specify the project duration.")
    .max(120),
  expectedStartAt: z
    .union([z.iso.date(), z.iso.datetime(), z.literal("")])
    .optional(),
  details: z
    .string()
    .trim()
    .min(10, "Add a short description of your requirement.")
    .max(6000),
});
