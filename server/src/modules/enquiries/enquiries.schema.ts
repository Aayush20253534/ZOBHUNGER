import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("")).transform((value) => value || undefined);

export const createEnquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  companyName: optionalText(160),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(24),
  city: optionalText(120),
  serviceRequired: optionalText(160),
  message: z.string().trim().min(5).max(4000),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
