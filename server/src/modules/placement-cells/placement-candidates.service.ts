import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { findPlacementCellPortalProfile } from "./placement-cells.repository.js";
import { createPlacementCandidate, deletePlacementCandidate, findOwnedPlacementCandidate, listPlacementCandidates, updatePlacementCandidate } from "./placement-candidates.repository.js";
import type { PlacementCandidateInput, PlacementCandidateQuery } from "./placement-candidates.schema.js";

async function placementCellIdForUser(userId: string) {
  const profile = await findPlacementCellPortalProfile(userId);
  if (!profile || profile.status !== "APPROVED") throw new HttpError(403, "Approved Placement Cell access is required", { code: "PLACEMENT_CELL_ACCESS_REQUIRED" });
  return profile.id;
}
function candidateWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new HttpError(409, "A candidate with this email already exists in your Placement Cell", { code: "PLACEMENT_CANDIDATE_EXISTS" });
  throw error;
}
export async function getPlacementCandidates(userId: string, query: PlacementCandidateQuery) {
  return listPlacementCandidates(await placementCellIdForUser(userId), query);
}
export async function addPlacementCandidate(userId: string, input: PlacementCandidateInput) {
  try { return await createPlacementCandidate(await placementCellIdForUser(userId), input); } catch (error) { return candidateWriteError(error); }
}
export async function editPlacementCandidate(userId: string, candidateId: string, input: PlacementCandidateInput) {
  const placementCellId = await placementCellIdForUser(userId);
  if (!await findOwnedPlacementCandidate(candidateId, placementCellId)) throw new HttpError(404, "Candidate not found", { code: "PLACEMENT_CANDIDATE_NOT_FOUND" });
  try { await updatePlacementCandidate(candidateId, placementCellId, input); return findOwnedPlacementCandidate(candidateId, placementCellId); } catch (error) { return candidateWriteError(error); }
}
export async function removePlacementCandidate(userId: string, candidateId: string) {
  const placementCellId = await placementCellIdForUser(userId);
  const result = await deletePlacementCandidate(candidateId, placementCellId);
  if (!result.count) throw new HttpError(404, "Candidate not found", { code: "PLACEMENT_CANDIDATE_NOT_FOUND" });
  return { deleted: true };
}
