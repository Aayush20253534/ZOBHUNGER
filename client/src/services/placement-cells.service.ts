import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { PlacementCellApplicationInput } from "@/schemas/placement-cell-application.schema";

interface PlacementCellApplicationCreated {
  id: string; institutionName: string; officialEmail: string; status: "SUBMITTED"; createdAt: string;
}

export function submitPlacementCellApplication(input: PlacementCellApplicationInput) {
  return apiFetch<ApiSuccessEnvelope<PlacementCellApplicationCreated>>("/placement-cell-applications", {
    method: "POST",
    body: JSON.stringify({ ...input, website: input.website || undefined }),
  });
}
