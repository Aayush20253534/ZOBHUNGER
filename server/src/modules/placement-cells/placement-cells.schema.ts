import { z } from "zod";

const opportunityTypes = [
  "jobs", "internships", "freelance", "apprenticeship", "part-time",
  "full-time", "remote", "hybrid", "training", "certification",
] as const;

export const createPlacementCellApplicationSchema = z.object({
  institutionName: z.string().trim().min(2).max(200),
  institutionType: z.enum(["college", "university", "training-institute", "other"]),
  placementCellName: z.string().trim().min(2).max(180),
  contactPersonName: z.string().trim().min(2).max(120),
  designation: z.string().trim().min(2).max(120),
  officialEmail: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  mobileNumber: z.string().trim().min(7).max(24),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  website: z.union([z.string().trim().url().max(1000), z.literal("")]).optional().transform((value) => value || undefined),
  numberOfStudents: z.coerce.number().int().min(1).max(1000000),
  coursesDepartments: z.string().trim().min(2).max(3000),
  preferredOpportunityTypes: z.array(z.enum(opportunityTypes)).min(1).max(opportunityTypes.length),
});

export type CreatePlacementCellApplicationInput = z.infer<typeof createPlacementCellApplicationSchema>;
