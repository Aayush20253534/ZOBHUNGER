import type { BusinessRequirementActivity } from "./business-requirements.types";

export type RequirementStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CLOSED";
export type RequirementFilter = "ALL" | RequirementStatus;
export type DashboardRange = 7 | 30 | 90;

export interface RequirementSummary {
  id: string;
  serviceRequired: string;
  workforceCount: number;
  locations: string[];
  jobLocation: string;
  projectDuration: string;
  status: RequirementStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessDashboardData {
  generatedAt: string;
  period: { days: DashboardRange; timeZone: string; startsAt: string; endsAt: string };
  summary: { totalRequirements: number; openRequirements: number; peopleRequested: number; newRequirements: number; requestedLocations: number };
  statuses: { status: RequirementStatus; count: number; peopleRequested: number }[];
  activity: { date: string; requirements: number }[];
  locations: { name: string; requirements: number }[];
  requirements: { items: RequirementSummary[]; page: number; pageSize: number; total: number; totalPages: number; status: RequirementFilter };
}

export interface BusinessRequirementData {
  requirement: RequirementSummary & {
    companyName: string; contactPerson: string; businessEmail: string; mobileNumber: string;
    industry: string; expectedStartAt: string | null; details: string;
  };
  history: { id: string; createdAt: string; from: RequirementStatus; to: RequirementStatus }[];
  activity: BusinessRequirementActivity[];
  hasEarlierHistory: boolean;
}
