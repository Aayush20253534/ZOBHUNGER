import { createRequirement, type RequirementOwner } from "./requirements.repository.js";
import type { CreateRequirementInput } from "./requirements.schema.js";

export async function submitRequirement(input: CreateRequirementInput, owner?: RequirementOwner) {
  return createRequirement(input, owner);
}
