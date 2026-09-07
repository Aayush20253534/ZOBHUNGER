import { prisma } from "../../config/db.js";
import type { CreatePlacementCellApplicationInput } from "./placement-cells.schema.js";

export function createPlacementCellApplication(data: CreatePlacementCellApplicationInput) {
  return prisma.placementCellApplication.create({
    data,
    select: { id: true, institutionName: true, officialEmail: true, status: true, createdAt: true },
  });
}
