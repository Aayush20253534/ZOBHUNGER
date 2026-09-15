import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";

export type TechnicalStudentStatus = "PENDING" | "VERIFIED" | "INACTIVE";
export type TechnicalStudentSource = "SELF_REGISTRATION" | "ADMIN_ENTRY" | "BULK_IMPORT";

export interface TechnicalStudentRecord {
  id: string;
  technicalInstituteApplicationId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  enrollmentNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
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
  preferredOpportunityTypes: Array<"jobs" | "internships" | "apprenticeships" | "training">;
  status: TechnicalStudentStatus;
  source: TechnicalStudentSource;
  importBatch?: string | null;
  submittedByUserId?: string | null;
  consentAcceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalStudentSummary {
  counts: { total: number; pending: number; verified: number; inactive: number };
  qualifications: Array<{ qualification: string; count: number }>;
  passingYears: Array<{ passingYear: string; count: number }>;
  topTrades: Array<{ tradeBranch: string; count: number }>;
}

export interface TechnicalStudentListResult {
  items: TechnicalStudentRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: TechnicalStudentSummary;
}

export interface TechnicalStudentInput {
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

export interface TechnicalStudentImportResult {
  mode: "validate" | "import";
  totalRows: number;
  validRows: number;
  errorRows: number;
  existingRows?: number;
  importedRows?: number;
  skippedRows?: number;
  skippedDuplicates?: number;
  canImport?: boolean;
  importBatch?: string;
  preview?: TechnicalStudentInput[];
  errors: Array<{ row: number; field?: string; message: string }>;
}

export function listTechnicalStudentsAdmin(instituteId: string, filters: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TechnicalStudentStatus | "";
  qualification?: "iti" | "diploma-polytechnic" | "";
  tradeBranch?: string;
  passingYear?: string;
}) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.qualification) params.set("qualification", filters.qualification);
  if (filters.tradeBranch) params.set("tradeBranch", filters.tradeBranch);
  if (filters.passingYear) params.set("passingYear", filters.passingYear);
  return apiFetch<ApiSuccessEnvelope<TechnicalStudentListResult>>(`/admin/technical-institutes/${encodeURIComponent(instituteId)}/students?${params}`);
}

export function createTechnicalStudentAdmin(instituteId: string, input: TechnicalStudentInput) {
  return apiFetch<ApiSuccessEnvelope<TechnicalStudentRecord>>(`/admin/technical-institutes/${encodeURIComponent(instituteId)}/students`, { method: "POST", body: JSON.stringify(input) });
}

export function updateTechnicalStudentAdmin(instituteId: string, studentId: string, input: TechnicalStudentInput) {
  return apiFetch<ApiSuccessEnvelope<TechnicalStudentRecord>>(`/admin/technical-institutes/${encodeURIComponent(instituteId)}/students/${encodeURIComponent(studentId)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function updateTechnicalStudentStatusAdmin(instituteId: string, studentId: string, status: TechnicalStudentStatus) {
  return apiFetch<ApiSuccessEnvelope<TechnicalStudentRecord>>(`/admin/technical-institutes/${encodeURIComponent(instituteId)}/students/${encodeURIComponent(studentId)}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function importTechnicalStudentsAdmin(instituteId: string, file: File, mode: "validate" | "import") {
  const isCsv = file.name.toLowerCase().endsWith(".csv");
  const contentType = isCsv ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return apiFetch<ApiSuccessEnvelope<TechnicalStudentImportResult>>(`/admin/technical-institutes/${encodeURIComponent(instituteId)}/students/import?mode=${mode}`, {
    method: "POST",
    body: file,
    headers: { "Content-Type": contentType, "X-File-Name": encodeURIComponent(file.name) },
  });
}
