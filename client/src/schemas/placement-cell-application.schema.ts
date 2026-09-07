import { z } from "zod";

const optionalUrl = z.string().trim().max(1000).refine((value) => !value || /^https?:\/\//i.test(value), "Enter a valid URL");

export const opportunityTypeValues = [
  "jobs", "internships", "freelance", "apprenticeship", "part-time",
  "full-time", "remote", "hybrid", "training", "certification",
] as const;

export const placementCellApplicationSchema = z.object({
  institutionName: z.string().trim().min(2, "Enter the institution name").max(200),
  institutionType: z.enum(["college", "university", "training-institute", "other"], { required_error: "Select an institution type" }),
  placementCellName: z.string().trim().min(2, "Enter the Placement Cell or Career Services name").max(180),
  contactPersonName: z.string().trim().min(2, "Enter the contact person's name").max(120),
  designation: z.string().trim().min(2, "Enter the designation").max(120),
  officialEmail: z.string().trim().email("Enter a valid official email address").max(254),
  mobileNumber: z.string().trim().min(7, "Enter a valid mobile number").max(24),
  city: z.string().trim().min(2, "Enter the city").max(120),
  state: z.string().trim().min(2, "Enter the state").max(120),
  website: optionalUrl,
  numberOfStudents: z.number().int().min(1, "Enter the number of students").max(1000000),
  coursesDepartments: z.string().trim().min(2, "Enter the courses or departments").max(3000),
  preferredOpportunityTypes: z.array(z.enum(opportunityTypeValues)).min(1, "Select at least one opportunity type"),
});

export type PlacementCellApplicationInput = z.infer<typeof placementCellApplicationSchema>;
