import { Prisma } from "../../generated/prisma/client.js";

export const requirementSummarySelect = {
  id: true, serviceRequired: true, workforceCount: true, locations: true,
  jobLocation: true, projectDuration: true, status: true, revision: true, createdAt: true, updatedAt: true,
} satisfies Prisma.WorkforceRequirementSelect;

export function ownedRequirements(userId: string): Prisma.WorkforceRequirementWhereInput {
  // An explicit company association takes precedence over the submitting user.
  // Never claim guest submissions through a matching business email.
  return { OR: [
    { businessProfile: { is: { userId } } },
    { businessProfileId: null, submittedByUserId: userId },
  ] };
}

export function ownedRequirementSql(userId: string) {
  return Prisma.sql`(b."userId" = ${userId} OR (r."businessProfileId" IS NULL AND r."submittedByUserId" = ${userId}))`;
}

export const editableRequirementFields = [
  "companyName", "contactPerson", "businessEmail", "mobileNumber", "industry", "serviceRequired",
  "workforceCount", "locations", "projectDuration", "expectedStartAt", "details",
] as const;
