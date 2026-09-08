import { prisma } from "../../config/db.js";
import type { BusinessProfileInput } from "./business.schema.js";

export function getBusinessProfile(userId: string) {
  return prisma.businessProfile.findUnique({ where: { userId } });
}

export function saveBusinessProfile(userId: string, input: BusinessProfileInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.businessProfile.findUnique({ where: { userId } });
    const profile = await tx.businessProfile.upsert({
      where: { userId },
      create: { ...input, userId, onboardedAt: new Date() },
      update: { ...input, onboardedAt: existing?.onboardedAt ?? new Date() },
    });
    // Attach only records already linked to this authenticated submitter.
    await tx.workforceRequirement.updateMany({
      where: { submittedByUserId: userId, businessProfileId: null },
      data: { businessProfileId: profile.id },
    });
    await tx.auditLog.create({ data: {
      actorUserId: userId, action: existing ? "business.profile_updated" : "business.profile_created",
      entityType: "BusinessProfile", entityId: profile.id,
      metadata: { fields: Object.keys(input) },
    } });
    return profile;
  });
}
