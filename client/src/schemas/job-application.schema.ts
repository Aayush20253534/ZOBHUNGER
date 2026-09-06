import { z } from "zod";
import { emailSchema, phoneSchema } from "@/schemas/common.schema";
import { isoDateSchema } from "@/schemas/date.schema";

export const jobApplicationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  email: emailSchema,
  phone: phoneSchema,
  currentLocation: z
    .string()
    .trim()
    .min(2, "Enter your current city or area.")
    .max(120),
  experience: z.string().trim().max(2000).optional(),
  availableFrom: z.union([isoDateSchema, z.literal("")]).optional(),
  message: z.string().trim().max(3000).optional(),
});

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
