import type { RequirementFilter, RequirementStatus, RequirementSummary } from "./business-dashboard.types";

export interface BusinessRequirementInput {
  companyName: string;
  contactPerson: string;
  businessEmail: string;
  mobileNumber: string;
  industry: string;
  serviceRequired: string;
  workforceCount: number;
  locations: string[];
  projectDuration: string;
  expectedStartAt: string | null;
  details: string;
}
export interface BusinessRequirementsQuery {
  query: string; status: RequirementFilter; sort: "newest" | "oldest"; page: number;
}
export interface BusinessRequirementsData extends BusinessRequirementsQuery {
  items: RequirementSummary[];
  total: number; totalRequirements: number; pageSize: number; totalPages: number;
  counts: { status: RequirementStatus; count: number }[];
}
export interface BusinessRequirementReceipt {
  id: string; revision: number; status: RequirementStatus; replayed?: boolean; changed?: boolean;
}
export type BusinessRequirementActivity = { id: string; createdAt: string } & (
  { kind: "updated"; fields: string[] } |
  { kind: "status" | "withdrawn"; from: RequirementStatus; to: RequirementStatus; reason?: string }
);
