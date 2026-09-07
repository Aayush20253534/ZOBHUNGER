import { createHash } from "node:crypto";
import { PlacementCellApplicationStatus } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { hashPassword } from "../../utils/password.js";
import type { ActivatePlacementCellInput } from "./placement-cell-access.schema.js";
import {
  activateProvisionedPlacementCell,
  createPlacementCellApplication,
  findPlacementCellByActivationTokenHash,
  findPlacementCellPortalProfile,
} from "./placement-cells.repository.js";
import type { CreatePlacementCellApplicationInput } from "./placement-cells.schema.js";

export function submitPlacementCellApplication(input: CreatePlacementCellApplicationInput) {
  return createPlacementCellApplication(input);
}

export async function activatePlacementCellAccount(input: ActivatePlacementCellInput) {
  const tokenHash = createHash("sha256").update(input.token).digest("hex");
  const application = await findPlacementCellByActivationTokenHash(tokenHash);
  if (!application || application.status !== PlacementCellApplicationStatus.APPROVED || !application.provisionedUserId) {
    throw new HttpError(400, "This activation link is invalid or has already been used", { code: "PLACEMENT_CELL_ACTIVATION_INVALID" });
  }
  if (!application.activationExpiresAt || application.activationExpiresAt.getTime() < Date.now()) {
    throw new HttpError(410, "This activation link has expired. Contact ZOBHUNGER for a new activation link.", { code: "PLACEMENT_CELL_ACTIVATION_EXPIRED" });
  }
  const passwordHash = await hashPassword(input.password);
  await activateProvisionedPlacementCell(application.id, application.provisionedUserId, passwordHash);
  return { activated: true, email: application.officialEmail, institutionName: application.institutionName };
}

export async function getPlacementCellPortalProfile(userId: string) {
  const profile = await findPlacementCellPortalProfile(userId);
  if (!profile || profile.status !== PlacementCellApplicationStatus.APPROVED) {
    throw new HttpError(403, "Approved institution partner access is required", { code: "PLACEMENT_CELL_ACCESS_REQUIRED" });
  }
  return profile;
}
