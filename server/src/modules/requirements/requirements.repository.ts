import { prisma } from "../../config/db.js";
import type { CreateRequirementInput } from "./requirements.schema.js";

export interface RequirementOwner { id: string; role: string }

export async function createRequirement(data: CreateRequirementInput, owner?: RequirementOwner) {
  // Ownership is derived from the verified session, never from form fields or matching emails.
  const profile = owner?.role === "BUSINESS"
    ? await prisma.businessProfile.findUnique({ where: { userId: owner.id }, select: { id: true } })
    : null;
  return prisma.workforceRequirement.create({ data: {
    ...data,
    submittedByUserId: owner?.id ?? null,
    businessProfileId: profile?.id ?? null,
  } });
}
