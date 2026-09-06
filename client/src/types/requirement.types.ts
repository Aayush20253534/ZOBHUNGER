import type { z } from "zod";
import type { requirementSchema } from "@/schemas/requirement.schema";

export type RequirementInput = z.infer<typeof requirementSchema>;
