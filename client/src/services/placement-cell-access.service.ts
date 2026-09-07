import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";

export interface PlacementCellProfile {
  id: string;
  institutionName: string;
  institutionType: string;
  placementCellName: string;
  contactPersonName: string;
  designation: string;
  officialEmail: string;
  mobileNumber: string;
  city: string;
  state: string;
  website: string | null;
  numberOfStudents: number;
  coursesDepartments: string;
  preferredOpportunityTypes: string[];
  status: "APPROVED";
}

export function activatePlacementCell(token: string, password: string) {
  return apiFetch<ApiSuccessEnvelope<{ activated: boolean; email: string; institutionName: string }>>("/placement-cell-applications/activate", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function getPlacementCellProfile() {
  return apiFetch<ApiSuccessEnvelope<{ profile: PlacementCellProfile }>>("/placement-cell-applications/portal/profile");
}
