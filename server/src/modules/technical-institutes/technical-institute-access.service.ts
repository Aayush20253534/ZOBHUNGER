import { createHash } from "node:crypto";
import { PlacementCellApplicationStatus } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { hashPassword } from "../../utils/password.js";
import type { ActivateTechnicalInstituteInput } from "./technical-institute-access.schema.js";
import {
  activateProvisionedTechnicalInstitute,
  findTechnicalInstituteByActivationTokenHash,
  findTechnicalInstitutePortalProfile,
} from "./technical-institute-access.repository.js";

export async function activateTechnicalInstituteAccount(input: ActivateTechnicalInstituteInput) {
  const tokenHash = createHash("sha256").update(input.token).digest("hex");
  const application = await findTechnicalInstituteByActivationTokenHash(tokenHash);
  if (!application || application.status !== PlacementCellApplicationStatus.APPROVED || !application.provisionedUserId) {
    throw new HttpError(400, "This technical institute activation link is invalid or has already been used", {
      code: "TECHNICAL_INSTITUTE_ACTIVATION_INVALID",
    });
  }
  if (!application.activationExpiresAt || application.activationExpiresAt.getTime() < Date.now()) {
    throw new HttpError(410, "This activation link has expired. Contact ZOBHUNGER for fresh portal access.", {
      code: "TECHNICAL_INSTITUTE_ACTIVATION_EXPIRED",
    });
  }
  const passwordHash = await hashPassword(input.password);
  await activateProvisionedTechnicalInstitute(application.id, application.provisionedUserId, passwordHash);
  return { activated: true, email: application.officialEmail, institutionName: application.institutionName };
}

export async function getTechnicalInstitutePortalProfile(userId: string) {
  const profile = await findTechnicalInstitutePortalProfile(userId);
  if (!profile || profile.status !== PlacementCellApplicationStatus.APPROVED || !profile.partnershipCode) {
    throw new HttpError(403, "Approved ITI & Polytechnic institute partner access is required", {
      code: "TECHNICAL_INSTITUTE_PORTAL_ACCESS_REQUIRED",
    });
  }
  return profile;
}
