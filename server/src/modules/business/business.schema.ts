import { z } from "zod";

export const businessProfileSchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  contactPerson: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20).regex(/^[+0-9 ()-]+$/),
  industry: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  website: z.union([
    z.literal(""),
    z.string().trim().max(240).url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "Use an http or https website URL"),
  ]).default("").transform((value) => value || null),
}).strict();

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
