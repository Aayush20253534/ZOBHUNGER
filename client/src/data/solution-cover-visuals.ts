import type { ExecutionVisualId } from "@/data/execution-visuals";
import type { SolutionSlug } from "@/types/solution-detail.types";

export const solutionCoverVisuals = {
  "workforce-solutions": "workforce-hiring",
  "sales-force": "field-executives",
  "promoter-solutions": "product-demonstration",
  "retail-execution": "audit",
  "brand-activation": "sampling",
  "business-operations": "operations-coordination",
  "gig-workforce": "last-mile-delivery",
} as const satisfies Record<SolutionSlug, ExecutionVisualId>;
