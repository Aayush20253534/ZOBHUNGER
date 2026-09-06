import { prisma } from "../../config/db.js";
import type { CreateRequirementInput } from "./requirements.schema.js";

export function createRequirement(data: CreateRequirementInput) {
  return prisma.workforceRequirement.create({ data });
}
