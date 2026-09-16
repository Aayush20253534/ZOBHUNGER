import { apiFetch, apiRawFetch, EXPORT_API_TIMEOUT_MS, UPLOAD_API_TIMEOUT_MS, type ApiSuccessEnvelope } from "@/lib/api";

export type TechnicalStudentStatus = "PENDING" | "VERIFIED" | "INACTIVE";
export type TechnicalOpportunityType = "JOB" | "INTERNSHIP" | "APPRENTICESHIP" | "TRAINING";
export type TechnicalApplicationStatus = "SUBMITTED" | "REVIEWED" | "SHORTLISTED" | "SELECTED" | "REJECTED" | "JOINED";

export interface TechnicalInstitutePortalProfile {
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
  partnershipCode: string;
  status: "APPROVED";
  approvedAt?: string | null;
}

export interface TechnicalPortalStudent {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  enrollmentNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: "male" | "female" | "other" | "prefer-not-to-say" | null;
  qualification: "iti" | "diploma-polytechnic";
  tradeBranch: string;
  passingYear: string;
  currentSemesterYear?: string | null;
  academicScore?: string | null;
  skills: string[];
  certifications: string[];
  currentCity: string;
  currentState: string;
  preferredLocations: string[];
  preferredOpportunityTypes: string[];
  status: TechnicalStudentStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}


export interface TechnicalPortalStudentInput {
  fullName: string;
  email: string;
  mobileNumber: string;
  enrollmentNumber?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  qualification: "iti" | "diploma-polytechnic";
  tradeBranch: string;
  passingYear: string;
  currentSemesterYear?: string;
  academicScore?: string;
  skills: string[];
  certifications: string[];
  currentCity: string;
  currentState: string;
  preferredLocations: string[];
  preferredOpportunityTypes: Array<"jobs" | "internships" | "apprenticeships" | "training">;
}

export interface TechnicalPortalStudentSummary {
  counts: { total: number; pending: number; verified: number; inactive: number };
  qualifications: Array<{ qualification: string; count: number }>;
  passingYears: Array<{ passingYear: string; count: number }>;
  topTrades: Array<{ tradeBranch: string; count: number }>;
}

export interface TechnicalPortalDashboard {
  profile: TechnicalInstitutePortalProfile;
  students: { total: number; verified: number; pending: number; inactive: number };
  applications: { total: number; shortlisted: number; selected: number; joined: number };
  opportunities: { open: number };
  recentApplications: Array<{
    id: string;
    status: TechnicalApplicationStatus;
    matchScore: number;
    updatedAt: string;
    student: { id: string; fullName: string; tradeBranch: string; passingYear: string };
    opportunity: { id: string; title: string; employerName: string; opportunityType: TechnicalOpportunityType; location: string };
  }>;
  topTrades: Array<{ tradeBranch: string; count: number }>;
}

export interface TechnicalPortalOpportunityMatch {
  student: Pick<TechnicalPortalStudent, "id" | "fullName" | "email" | "mobileNumber" | "qualification" | "tradeBranch" | "passingYear" | "skills" | "certifications" | "currentCity" | "currentState" | "preferredLocations" | "preferredOpportunityTypes">;
  score: number;
  reasons: string[];
  application: { id: string; status: TechnicalApplicationStatus; matchScore: number; createdAt: string } | null;
}

export interface TechnicalPortalOpportunity {
  id: string;
  title: string;
  employerName: string;
  opportunityType: TechnicalOpportunityType;
  description: string;
  location: string;
  city?: string | null;
  state?: string | null;
  workMode?: string | null;
  eligibleQualifications: string[];
  eligibleTradesBranches: string[];
  eligiblePassingYears: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  eligibleStates: string[];
  vacancies?: number | null;
  compensation?: string | null;
  duration?: string | null;
  applicationDeadline?: string | null;
  joiningDate?: string | null;
  submittedCount: number;
}


export interface TechnicalPortalOpportunityMatchResult {
  matches: TechnicalPortalOpportunityMatch[];
  totalMatches: number;
  scannedCandidates: number;
  candidatePoolTruncated: boolean;
}

export interface TechnicalPortalApplication {
  id: string;
  status: TechnicalApplicationStatus;
  matchScore: number;
  matchReasons: string[];
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  selectedAt?: string | null;
  joinedAt?: string | null;
  student: {
    id: string;
    fullName: string;
    email: string;
    mobileNumber: string;
    qualification: string;
    tradeBranch: string;
    passingYear: string;
  };
  opportunity: {
    id: string;
    title: string;
    employerName: string;
    opportunityType: TechnicalOpportunityType;
    status: string;
    location: string;
    compensation?: string | null;
    applicationDeadline?: string | null;
  };
}

export function activateTechnicalInstitute(token: string, password: string) {
  return apiFetch<ApiSuccessEnvelope<{ activated: boolean; email: string; institutionName: string }>>("/technical-institute-applications/activate", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function getTechnicalInstitutePortalProfile() {
  return apiFetch<ApiSuccessEnvelope<{ profile: TechnicalInstitutePortalProfile }>>("/technical-institute-applications/portal/profile");
}

export function getTechnicalInstitutePortalDashboard() {
  return apiFetch<ApiSuccessEnvelope<TechnicalPortalDashboard>>("/technical-institute-applications/portal/dashboard");
}

export function listTechnicalInstitutePortalStudents(filters: { page?: number; pageSize?: number; search?: string; status?: TechnicalStudentStatus | ""; qualification?: string }) {
  const params = new URLSearchParams();
  params.set("page", String(filters.page ?? 1));
  params.set("pageSize", String(filters.pageSize ?? 50));
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.qualification) params.set("qualification", filters.qualification);
  return apiFetch<ApiSuccessEnvelope<{ items: TechnicalPortalStudent[]; total: number; page: number; pageSize: number; totalPages: number; summary: TechnicalPortalStudentSummary }>>(`/technical-institute-applications/portal/students?${params.toString()}`);
}


export function createTechnicalInstitutePortalStudent(input: TechnicalPortalStudentInput) {
  return apiFetch<ApiSuccessEnvelope<TechnicalPortalStudent>>("/technical-institute-applications/portal/students", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTechnicalInstitutePortalStudent(studentId: string, input: TechnicalPortalStudentInput) {
  return apiFetch<ApiSuccessEnvelope<TechnicalPortalStudent>>(`/technical-institute-applications/portal/students/${encodeURIComponent(studentId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function setTechnicalInstitutePortalStudentStatus(studentId: string, status: TechnicalStudentStatus) {
  return apiFetch<ApiSuccessEnvelope<TechnicalPortalStudent>>(`/technical-institute-applications/portal/students/${encodeURIComponent(studentId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function importTechnicalInstitutePortalStudents(file: File, mode: "validate" | "import") {
  return file.arrayBuffer().then(body => apiFetch<ApiSuccessEnvelope<{
    mode: "validate" | "import";
    totalRows: number;
    validRows: number;
    errorRows: number;
    existingRows?: number;
    importedRows?: number;
    skippedRows?: number;
    errors: Array<{ row: number; field?: string; message: string }>;
    preview?: Array<Record<string, unknown>>;
    canImport?: boolean;
  }>>(`/technical-institute-applications/portal/students/import?mode=${mode}`, {
    method: "POST",
    headers: {
      "Content-Type": file.type || (file.name.toLowerCase().endsWith(".csv") ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
      "X-File-Name": file.name,
    },
    body,
    timeoutMs: UPLOAD_API_TIMEOUT_MS,
  }));
}

export function listTechnicalInstitutePortalOpportunities(filters: { page?: number; pageSize?: number; search?: string; opportunityType?: TechnicalOpportunityType | "" }) {
  const params = new URLSearchParams();
  params.set("page", String(filters.page ?? 1));
  params.set("pageSize", String(filters.pageSize ?? 20));
  if (filters.search) params.set("search", filters.search);
  if (filters.opportunityType) params.set("opportunityType", filters.opportunityType);
  return apiFetch<ApiSuccessEnvelope<{ items: TechnicalPortalOpportunity[]; total: number; page: number; pageSize: number; totalPages: number }>>(`/technical-institute-applications/portal/opportunities?${params.toString()}`);
}

export function getTechnicalInstitutePortalOpportunityMatches(opportunityId: string, filters: { minScore?: number; limit?: number; search?: string } = {}) {
  const params = new URLSearchParams();
  params.set("minScore", String(filters.minScore ?? 55));
  params.set("limit", String(filters.limit ?? 30));
  if (filters.search) params.set("search", filters.search);
  return apiFetch<ApiSuccessEnvelope<TechnicalPortalOpportunityMatchResult>>(`/technical-institute-applications/portal/opportunities/${encodeURIComponent(opportunityId)}/matches?${params.toString()}`);
}

export function submitTechnicalInstitutePortalCandidate(opportunityId: string, studentId: string, note?: string) {
  return apiFetch<ApiSuccessEnvelope<TechnicalPortalApplication>>(`/technical-institute-applications/portal/opportunities/${encodeURIComponent(opportunityId)}/applications`, {
    method: "POST",
    body: JSON.stringify({ studentId, note }),
  });
}

export function listTechnicalInstitutePortalApplications(filters: { page?: number; pageSize?: number; search?: string; status?: TechnicalApplicationStatus | ""; opportunityType?: TechnicalOpportunityType | "" }) {
  const params = new URLSearchParams();
  params.set("page", String(filters.page ?? 1));
  params.set("pageSize", String(filters.pageSize ?? 50));
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.opportunityType) params.set("opportunityType", filters.opportunityType);
  return apiFetch<ApiSuccessEnvelope<{ items: TechnicalPortalApplication[]; total: number; page: number; pageSize: number; totalPages: number }>>(`/technical-institute-applications/portal/applications?${params.toString()}`);
}

export function getTechnicalInstitutePortalReports() {
  return apiFetch<ApiSuccessEnvelope<{
    profile: { institutionName: string; partnershipCode: string };
    dashboard: Omit<TechnicalPortalDashboard, "profile">;
    statusCounts: Record<string, number>;
    typeCounts: Record<string, number>;
    conversionRate: number;
    topEmployers: Array<{ employer: string; count: number }>;
  }>>("/technical-institute-applications/portal/reports");
}

export async function downloadTechnicalInstitutePortalReport() {
  const response = await apiRawFetch("/technical-institute-applications/portal/reports/export", { timeoutMs: EXPORT_API_TIMEOUT_MS });
  if (!response.ok) throw new Error("Unable to export the placement report.");
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const fileName = disposition.match(/filename="([^"]+)"/)?.[1] ?? "technical-placement-report.csv";
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
