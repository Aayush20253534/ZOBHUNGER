import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => !value || /^https?:\/\//i.test(value), "Enter a valid URL")
  .max(1000);

export const partnerApplicationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  mobileNumber: z.string().trim().min(7, "Enter a valid mobile number").max(24),
  email: z.string().trim().email("Enter a valid email address").max(254),
  currentCity: z.string().trim().min(2, "Enter your current city").max(120),
  currentProfession: z.string().trim().min(2, "Enter your current profession").max(160),
  companyName: z.string().trim().min(2, "Enter your current company or business name").max(180),
  totalExperienceYears: z.number().int().min(0).max(80),
  specialization: z.string().trim().min(2, "Enter your area of specialization").max(180),
  industryExperience: z.string().trim().min(2, "Describe your industry experience").max(1000),
  linkedInUrl: optionalUrl,
  contributionPreference: z.string().trim().min(2, "Tell us how you would like to contribute").max(500),
  expertiseDescription: z.string().trim().min(20, "Please add a little more detail about your experience").max(6000),
  professionalNetwork: z.string().trim().max(2500),
  preferredPartnershipArea: z.string().trim().min(2, "Enter your preferred partnership area").max(500),
});

export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>;
