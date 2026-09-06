import { requirementSchema } from "@/schemas/requirement.schema";
import { getDataAdapter } from "@/services/adapters";
import type { DataRequestOptions } from "@/types/data.types";
import type { RequirementInput } from "@/types/requirement.types";

export function submitRequirement(
  input: RequirementInput,
  options?: DataRequestOptions,
) {
  return getDataAdapter().submitRequirement(
    requirementSchema.parse(input),
    options,
  );
}
