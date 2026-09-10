import type { ExecutionVisualId } from "@/data/execution-visuals";
import type { SolutionSlug } from "@/types/solution-detail.types";

export const solutionCoverVisuals = {
  "website-application-development": "digital-development",
  "verification-services": "verification",
  "workforce-solutions": "workforce-hiring",
  "sales-force": "field-executives",
  "promoter-solutions": "product-demonstration",
  "retail-execution": "audit",
  "brand-activation": "brand-deployment",
  "business-operations": "operations-coordination",
  "gig-workforce": "last-mile-delivery",
} as const satisfies Record<SolutionSlug, ExecutionVisualId>;
