import { createTechnicalInstituteApplication } from "./technical-institutes.repository.js";
import type { CreateTechnicalInstituteApplicationInput } from "./technical-institutes.schema.js";

export function submitTechnicalInstituteApplication(input: CreateTechnicalInstituteApplicationInput) {
  return createTechnicalInstituteApplication(input);
}
