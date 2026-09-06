import { z } from "zod";
import {
  emailSchema,
  phoneSchema,
  serviceSchema,
} from "@/schemas/common.schema";

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  companyName: z.string().trim().max(160).optional(),
  email: emailSchema,
  phone: phoneSchema,
  serviceRequired: serviceSchema,
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more about your requirement.")
    .max(4000),
});
