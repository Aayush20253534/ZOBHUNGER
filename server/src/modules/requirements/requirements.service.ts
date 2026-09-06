import { createRequirement } from "./requirements.repository.js";
import type { CreateRequirementInput } from "./requirements.schema.js";

export async function submitRequirement(input: CreateRequirementInput) {
  return createRequirement(input);
}
