import { prisma } from "../../config/db.js";
import type { PlacementCandidateInput, PlacementCandidateQuery } from "./placement-candidates.schema.js";

export function listPlacementCandidates(placementCellApplicationId: string, query: PlacementCandidateQuery) {
  const search = query.search?.trim();
  return prisma.placementCandidate.findMany({
    where: {
      placementCellApplicationId,
      ...(query.city ? { city: { equals: query.city, mode: "insensitive" as const } } : {}),
      ...(query.workType ? { preferredWorkTypes: { has: query.workType } } : {}),
      ...(search ? { OR: [
        { fullName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { course: { contains: search, mode: "insensitive" as const } },
        { qualification: { contains: search, mode: "insensitive" as const } },
      ] } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}
export function countPlacementCandidates(placementCellApplicationId: string) {
  return prisma.placementCandidate.count({ where: { placementCellApplicationId } });
}
export function createPlacementCandidate(placementCellApplicationId: string, data: PlacementCandidateInput) {
  return prisma.placementCandidate.create({ data: { ...data, placementCellApplicationId } });
}
export function findOwnedPlacementCandidate(id: string, placementCellApplicationId: string) {
  return prisma.placementCandidate.findFirst({ where: { id, placementCellApplicationId } });
}
export function updatePlacementCandidate(id: string, placementCellApplicationId: string, data: PlacementCandidateInput) {
  return prisma.placementCandidate.updateMany({ where: { id, placementCellApplicationId }, data });
}
export function deletePlacementCandidate(id: string, placementCellApplicationId: string) {
  return prisma.placementCandidate.deleteMany({ where: { id, placementCellApplicationId } });
}
