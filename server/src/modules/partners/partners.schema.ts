import { z } from "zod";

const optionalUrl = z
  .union([z.string().trim().url().max(1000), z.literal("")])
  .optional()
  .transform((value) => value || undefined);

export const createPartnerApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  mobileNumber: z.string().trim().min(7).max(24),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  currentCity: z.string().trim().min(2).max(120),
  currentProfession: z.string().trim().min(2).max(160),
  companyName: z.string().trim().min(2).max(180),
  totalExperienceYears: z.coerce.number().int().min(0).max(80),
  specialization: z.string().trim().min(2).max(180),
  industryExperience: z.string().trim().min(2).max(1000),
  linkedInUrl: optionalUrl,
  contributionPreference: z.string().trim().min(2).max(500),
  expertiseDescription: z.string().trim().min(20).max(6000),
  professionalNetwork: z.string().trim().max(2500).optional().transform((value) => value || undefined),
  preferredPartnershipArea: z.string().trim().min(2).max(500),
});

export const partnerResumeParamsSchema = z.object({
  id: z.string().trim().min(1).max(180),
});

export type CreatePartnerApplicationInput = z.infer<typeof createPartnerApplicationSchema>;
