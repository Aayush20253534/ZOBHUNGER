import { createPlacementCellApplication } from "./placement-cells.repository.js";
import type { CreatePlacementCellApplicationInput } from "./placement-cells.schema.js";

export function submitPlacementCellApplication(input: CreatePlacementCellApplicationInput) {
  return createPlacementCellApplication(input);
}
