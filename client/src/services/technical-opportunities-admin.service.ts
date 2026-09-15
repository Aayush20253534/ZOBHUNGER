import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";

export type TechnicalOpportunityType = "JOB" | "INTERNSHIP" | "APPRENTICESHIP" | "TRAINING";
export type TechnicalOpportunityStatus = "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
export type TechnicalOpportunityApplicationStatus = "SUBMITTED" | "REVIEWED" | "SHORTLISTED" | "SELECTED" | "REJECTED" | "JOINED";

export interface TechnicalOpportunityInput {
  title: string;
  employerName: string;
  opportunityType: TechnicalOpportunityType;
  status: TechnicalOpportunityStatus;
  description: string;
  location: string;
  city?: string;
  state?: string;
  workMode?: string;
  eligibleQualifications: Array<"iti" | "diploma-polytechnic">;
  eligibleTradesBranches: string[];
  eligiblePassingYears: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  eligibleStates: string[];
  vacancies?: number;
  compensation?: string;
  duration?: string;
  applicationDeadline?: string;
  joiningDate?: string;
  adminNotes?: string;
}

export interface TechnicalOpportunityApplicationRecord {
  id: string;
  opportunityId: string;
  studentId: string;
  status: TechnicalOpportunityApplicationStatus;
  matchScore: number;
  matchReasons: string[];
  note?: string | null;
  createdByUserId?: string | null;
  reviewedAt?: string | null;
  selectedAt?: string | null;
  joinedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  student: TechnicalMatchStudent;
}

export interface TechnicalOpportunityRecord extends Omit<TechnicalOpportunityInput, "vacancies" | "city" | "state" | "workMode" | "compensation" | "duration" | "applicationDeadline" | "joiningDate" | "adminNotes"> {
  id: string;
  vacancies?: number | null;
  city?: string | null;
  state?: string | null;
  workMode?: string | null;
  compensation?: string | null;
  duration?: string | null;
  applicationDeadline?: string | null;
  joiningDate?: string | null;
  adminNotes?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { applications: number };
  applications?: TechnicalOpportunityApplicationRecord[];
}

export interface TechnicalOpportunitySummary {
  opportunities: { total: number; draft: number; open: number; closed: number; archived: number };
  applications: { total: number; shortlisted: number; selected: number; joined: number };
}

export interface TechnicalOpportunityListResult {
  items: TechnicalOpportunityRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: TechnicalOpportunitySummary;
}

export interface TechnicalMatchStudent {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  qualification: "iti" | "diploma-polytechnic";
  tradeBranch: string;
  passingYear: string;
  skills: string[];
  certifications: string[];
  currentCity: string;
  currentState: string;
  preferredLocations: string[];
  preferredOpportunityTypes: Array<"jobs" | "internships" | "apprenticeships" | "training">;
  institute: {
    id: string;
    institutionName: string;
    partnershipCode?: string | null;
    city: string;
    state: string;
  };
}

export interface TechnicalOpportunityMatch {
  student: TechnicalMatchStudent;
  score: number;
  reasons: string[];
  application?: { id: string; status: TechnicalOpportunityApplicationStatus; createdAt: string } | null;
}

export interface TechnicalOpportunityMatchResult {
  opportunity: TechnicalOpportunityRecord;
  matches: TechnicalOpportunityMatch[];
  totalMatches: number;
}

export function listTechnicalOpportunitiesAdmin(filters: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TechnicalOpportunityStatus | "";
  opportunityType?: TechnicalOpportunityType | "";
}) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.opportunityType) params.set("opportunityType", filters.opportunityType);
  return apiFetch<ApiSuccessEnvelope<TechnicalOpportunityListResult>>(`/admin/technical-opportunities?${params.toString()}`);
}

export function getTechnicalOpportunityAdmin(id: string) {
  return apiFetch<ApiSuccessEnvelope<TechnicalOpportunityRecord>>(`/admin/technical-opportunities/${encodeURIComponent(id)}`);
}

export function createTechnicalOpportunityAdmin(input: TechnicalOpportunityInput) {
  return apiFetch<ApiSuccessEnvelope<TechnicalOpportunityRecord>>("/admin/technical-opportunities", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTechnicalOpportunityAdmin(id: string, input: TechnicalOpportunityInput) {
  return apiFetch<ApiSuccessEnvelope<TechnicalOpportunityRecord>>(`/admin/technical-opportunities/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getTechnicalOpportunityMatchesAdmin(id: string, filters: {
  search?: string;
  instituteId?: string;
  minScore?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.instituteId) params.set("instituteId", filters.instituteId);
  if (filters.minScore !== undefined) params.set("minScore", String(filters.minScore));
  if (filters.limit) params.set("limit", String(filters.limit));
  return apiFetch<ApiSuccessEnvelope<TechnicalOpportunityMatchResult>>(`/admin/technical-opportunities/${encodeURIComponent(id)}/matches?${params.toString()}`);
}

export function submitTechnicalOpportunityCandidateAdmin(id: string, studentId: string, note?: string) {
  return apiFetch<ApiSuccessEnvelope<TechnicalOpportunityApplicationRecord>>(`/admin/technical-opportunities/${encodeURIComponent(id)}/applications`, {
    method: "POST",
    body: JSON.stringify({ studentId, note }),
  });
}

export function updateTechnicalOpportunityApplicationStatusAdmin(
  opportunityId: string,
  applicationId: string,
  status: TechnicalOpportunityApplicationStatus,
) {
  return apiFetch<ApiSuccessEnvelope<TechnicalOpportunityApplicationRecord>>(`/admin/technical-opportunities/${encodeURIComponent(opportunityId)}/applications/${encodeURIComponent(applicationId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
