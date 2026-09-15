import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";

export type TechnicalInstituteStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export interface TechnicalInstituteAdminRecord {
  id: string;
  institutionName: string;
  institutionType: string;
  ownershipType: string;
  affiliationBody: string;
  affiliationNumber?: string | null;
  website?: string | null;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  contactPersonName: string;
  designation: string;
  officialEmail: string;
  mobileNumber: string;
  alternateNumber?: string | null;
  totalStudents: number;
  finalYearStudents: number;
  passingYear: string;
  tradesBranches: string;
  preferredOpportunityTypes: string[];
  technicalHiringNotes?: string | null;
  status: TechnicalInstituteStatus;
  partnershipCode?: string | null;
  reviewNotes?: string | null;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalInstituteAdminList {
  items: TechnicalInstituteAdminRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TechnicalInstituteAdminSummary {
  counts: {
    total: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
  };
  students: { total: number; finalYear: number };
  topStates: Array<{ state: string; count: number }>;
  recentApproved: Array<{
    id: string;
    institutionName: string;
    city: string;
    state: string;
    partnershipCode?: string | null;
    approvedAt?: string | null;
  }>;
}

export interface TechnicalInstituteAdminFilters {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: TechnicalInstituteStatus | "";
  institutionType?: "iti" | "polytechnic" | "technical-institute" | "";
  affiliationBody?: "ncvt" | "scvt" | "aicte" | "state-board" | "other" | "";
  state?: string;
}

export function getTechnicalInstituteAdminSummary() {
  return apiFetch<ApiSuccessEnvelope<TechnicalInstituteAdminSummary>>("/admin/technical-institutes/summary");
}

export function listTechnicalInstitutesAdmin(filters: TechnicalInstituteAdminFilters) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.query) params.set("query", filters.query);
  if (filters.status) params.set("status", filters.status);
  if (filters.institutionType) params.set("institutionType", filters.institutionType);
  if (filters.affiliationBody) params.set("affiliationBody", filters.affiliationBody);
  if (filters.state) params.set("state", filters.state);
  return apiFetch<ApiSuccessEnvelope<TechnicalInstituteAdminList>>(`/admin/technical-institutes?${params.toString()}`);
}

export function getTechnicalInstituteAdmin(id: string) {
  return apiFetch<ApiSuccessEnvelope<TechnicalInstituteAdminRecord>>(`/admin/technical-institutes/${encodeURIComponent(id)}`);
}

export function reviewTechnicalInstituteAdmin(
  id: string,
  input: { status: Exclude<TechnicalInstituteStatus, "SUBMITTED">; reviewNotes?: string },
) {
  return apiFetch<ApiSuccessEnvelope<TechnicalInstituteAdminRecord>>(
    `/admin/technical-institutes/${encodeURIComponent(id)}/review`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}
