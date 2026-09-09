import { z } from "zod";

const text = (max: number) => z.string().trim().min(2).max(max);
const month = z.string().regex(/^(19|20)\d{2}-(0[1-9]|1[0-2])$/, "Use a valid month and year");
const education = z.object({
  qualification: text(120), institution: text(180), fieldOfStudy: z.string().trim().max(160).default(""),
  graduationYear: z.number().int().min(1950).max(2100).nullable().default(null),
}).strict();
const workExperience = z.object({
  company: text(180), title: text(120), startMonth: month,
  endMonth: z.union([month, z.literal("")]).default(""), current: z.boolean().default(false),
  description: z.string().trim().max(2000).default(""),
}).strict().refine(value => value.current ? !value.endMonth : Boolean(value.endMonth) && value.endMonth >= value.startMonth, "Check the employment dates")
  .refine(value => value.startMonth <= new Date().toISOString().slice(0, 7) && (!value.endMonth || value.endMonth <= new Date().toISOString().slice(0, 7)), "Employment dates cannot be in the future");

export const careerSubmissionSchema = z.object({
  requestKey: z.uuid(), fullName: text(120),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  phone: z.string().trim().regex(/^\+?[\d ()-]{7,24}$/, "Enter a valid phone number").refine(value => value.replace(/\D/g, "").length >= 7, "Enter a valid phone number"),
  city: text(120), state: text(120), preferredRole: text(160),
  experienceYears: z.number().int().min(0).max(60),
  education: z.array(education).min(1).max(5),
  workExperience: z.array(workExperience).max(6),
  skills: z.array(z.string().trim().min(1).max(60)).min(1).max(25),
  preferredLocations: z.array(z.string().trim().min(2).max(120)).max(8).default([]),
  availability: text(160),
  portfolioUrl: z.union([z.string().trim().url().max(1000).refine(value => /^https?:\/\//i.test(value), "Use an http or https link"), z.literal("")]).default(""),
  coverNote: z.string().trim().max(3000).default(""), consent: z.literal(true),
}).strict().refine(value => value.experienceYears === 0 || value.workExperience.length > 0, "Add your work experience or enter zero years if you are a fresher");

export const careerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  query: z.string().trim().max(160).default(""),
  status: z.enum(["SUBMITTED", "REVIEWED", "SHORTLISTED", "CONTACTED", "HIRED", "REJECTED"]).optional(),
});
export const careerReviewSchema = z.object({
  status: z.enum(["REVIEWED", "SHORTLISTED", "CONTACTED", "HIRED", "REJECTED"]),
  notes: z.string().trim().max(4000).default(""), expectedUpdatedAt: z.iso.datetime(),
}).strict();
export type CareerSubmission = z.infer<typeof careerSubmissionSchema>;
export type CareerQuery = z.infer<typeof careerQuerySchema>;
export type CareerReview = z.infer<typeof careerReviewSchema>;
