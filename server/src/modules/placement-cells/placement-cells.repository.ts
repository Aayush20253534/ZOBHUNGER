import { prisma } from "../../config/db.js";
import type { CreatePlacementCellApplicationInput } from "./placement-cells.schema.js";

export function createPlacementCellApplication(data: CreatePlacementCellApplicationInput) {
  return prisma.placementCellApplication.create({
    data,
    select: { id: true, institutionName: true, officialEmail: true, status: true, createdAt: true },
  });
}

export function findPlacementCellByActivationTokenHash(activationTokenHash: string) {
  return prisma.placementCellApplication.findUnique({
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

export function activateProvisionedPlacementCell(applicationId: string, userId: string, passwordHash: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { passwordHash, isActive: true, emailVerifiedAt: new Date() },
      select: { id: true, email: true, role: true, isActive: true },
    });
    await tx.placementCellApplication.update({
      where: { id: applicationId },
      data: { activationTokenHash: null, activationExpiresAt: null },
    });
    return user;
  });
}

export function findPlacementCellPortalProfile(userId: string) {
  return prisma.placementCellApplication.findUnique({
    where: { provisionedUserId: userId },
    select: {
      id: true,
      institutionName: true,
      institutionType: true,
      placementCellName: true,
      contactPersonName: true,
      designation: true,
      officialEmail: true,
      mobileNumber: true,
      city: true,
      state: true,
      website: true,
      numberOfStudents: true,
      coursesDepartments: true,
      preferredOpportunityTypes: true,
      status: true,
      createdAt: true,
    },
  });
}
