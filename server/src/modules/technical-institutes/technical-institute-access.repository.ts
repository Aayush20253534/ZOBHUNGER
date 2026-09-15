import { prisma } from "../../config/db.js";

export function findTechnicalInstituteByActivationTokenHash(activationTokenHash: string) {
  return prisma.technicalInstituteApplication.findUnique({
    where: { activationTokenHash },
    select: {
      id: true,
      institutionName: true,
      officialEmail: true,
      status: true,
      provisionedUserId: true,
      activationExpiresAt: true,
    },
  });
}

export function activateProvisionedTechnicalInstitute(applicationId: string, userId: string, passwordHash: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { passwordHash, isActive: true, emailVerifiedAt: new Date() },
      select: { id: true, email: true, role: true, isActive: true },
    });
    await tx.technicalInstituteApplication.update({
      where: { id: applicationId },
      data: { activationTokenHash: null, activationExpiresAt: null },
    });
    return user;
  });
}

export function findTechnicalInstitutePortalProfile(userId: string) {
  return prisma.technicalInstituteApplication.findUnique({
    where: { provisionedUserId: userId },
    select: {
      id: true,
      institutionName: true,
      institutionType: true,
      ownershipType: true,
      affiliationBody: true,
      affiliationNumber: true,
      website: true,
      district: true,
      city: true,
      state: true,
      postalCode: true,
      contactPersonName: true,
      designation: true,
      officialEmail: true,
      mobileNumber: true,
      alternateNumber: true,
      totalStudents: true,
      finalYearStudents: true,
      passingYear: true,
      tradesBranches: true,
      preferredOpportunityTypes: true,
      partnershipCode: true,
      status: true,
      approvedAt: true,
      createdAt: true,
    },
  });
}
