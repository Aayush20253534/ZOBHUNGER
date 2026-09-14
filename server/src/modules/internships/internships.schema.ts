import { z } from "zod";

const text = (max: number) => z.string().trim().min(2).max(max);

export const internshipSubmissionSchema = z.object({
  requestKey: z.uuid(),
  fullName: text(120),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  phone: z.string().trim().regex(/^\+?[\d ()-]{7,24}$/, "Enter a valid phone number").refine(value => value.replace(/\D/g, "").length >= 7, "Enter a valid phone number"),
  city: text(120),
  state: text(120),
  qualification: text(120),
  institution: text(180),
  fieldOfStudy: z.string().trim().max(160).default(""),
  graduationYear: z.number().int().min(1950).max(new Date().getFullYear() + 8).nullable().default(null),
  preferredRole: text(160),
  preferredLocation: text(120),
  availability: text(160),
  skills: z.array(z.string().trim().min(1).max(60)).min(1).max(20),
  portfolioUrl: z.union([z.string().trim().url().max(1000).refine(value => /^https?:\/\//i.test(value), "Use an http or https link"), z.literal("")]).default(""),
  coverNote: z.string().trim().max(2000).default(""),
  consent: z.literal(true),
}).strict();

export type InternshipSubmission = z.infer<typeof internshipSubmissionSchema>;
