import { apiFetch, apiRawFetch, EXPORT_API_TIMEOUT_MS, type ApiSuccessEnvelope } from "@/lib/api";
import type { AdminComplianceMaster, ComplianceHistoryItem, ComplianceStatus, EsicComplianceRecord, PfComplianceRecord } from "@/types/compliance.types";

export interface ComplianceStats { totalEmployees: number; pendingSubmission: number; byStatus: Partial<Record<ComplianceStatus, number>>; }
export interface PfComplianceListItem {
  id: string; employeeNumber: string; fullName: string; personalEmail: string; projectAssignment: string; aadhaar: string; bankAccount: string; uan: string;
  pfCompliance: null | { id: string; status: ComplianceStatus; department: string | null; designation: string | null; existingUanLast4: string | null; revision: number; updatedAt: string };
}
export interface EsicComplianceListItem {
  id: string; employeeNumber: string; fullName: string; personalEmail: string; projectAssignment: string; aadhaar: string; esiNumber: string;
  esicCompliance: null | { id: string; status: ComplianceStatus; esiApplicable: boolean | null; esiNumberLast4: string | null; revision: number; updatedAt: string; _count: { familyMembers: number } };
}
export interface CompliancePage<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number; stats: ComplianceStats; }
export interface ComplianceDocument { id: string; kind: string; familyMemberId?: string | null; fileName: string; mimeType: string; size: number; createdAt: string; }
export interface PfComplianceDetail { employee: AdminComplianceMaster; pf: PfComplianceRecord | null; documents: ComplianceDocument[]; history: ComplianceHistoryItem[]; }
export interface EsicComplianceDetail { employee: AdminComplianceMaster; esic: EsicComplianceRecord | null; documents: ComplianceDocument[]; history: ComplianceHistoryItem[]; }

export function complianceQuery(params: { page?: number; query?: string; status?: ComplianceStatus | ""; department?: string }) {
  const q = new URLSearchParams({ page: String(params.page ?? 1), pageSize: "25" });
  if (params.query?.trim()) q.set("query", params.query.trim());
  if (params.status) q.set("status", params.status);
  if (params.department?.trim()) q.set("department", params.department.trim());
  return q.toString();
}

export function listPfCompliance(params: { page?: number; query?: string; status?: ComplianceStatus | ""; department?: string }) {
  return apiFetch<ApiSuccessEnvelope<CompliancePage<PfComplianceListItem>>>(`/admin/compliance/pf?${complianceQuery(params)}`);
}
export function listEsicCompliance(params: { page?: number; query?: string; status?: ComplianceStatus | "" }) {
  return apiFetch<ApiSuccessEnvelope<CompliancePage<EsicComplianceListItem>>>(`/admin/compliance/esic?${complianceQuery(params)}`);
}
export function getPfCompliance(id: string) { return apiFetch<ApiSuccessEnvelope<PfComplianceDetail>>(`/admin/compliance/pf/${encodeURIComponent(id)}`); }
export function getEsicCompliance(id: string) { return apiFetch<ApiSuccessEnvelope<EsicComplianceDetail>>(`/admin/compliance/esic/${encodeURIComponent(id)}`); }
export function reviewPfCompliance(id: string, input: { status: "UNDER_REVIEW"|"NEEDS_CORRECTION"|"VERIFIED"|"PROCESSED"; remarks: string; expectedRevision: number }) { return apiFetch<ApiSuccessEnvelope<{ record: PfComplianceRecord }>>(`/admin/compliance/pf/${encodeURIComponent(id)}/review`, { method: "POST", body: JSON.stringify(input) }); }
export function reviewEsicCompliance(id: string, input: { status: "UNDER_REVIEW"|"NEEDS_CORRECTION"|"VERIFIED"|"PROCESSED"; remarks: string; expectedRevision: number }) { return apiFetch<ApiSuccessEnvelope<{ record: EsicComplianceRecord }>>(`/admin/compliance/esic/${encodeURIComponent(id)}/review`, { method: "POST", body: JSON.stringify(input) }); }

export async function downloadAdminCompliance(path: string, fileName: string) {
  const response = await apiRawFetch(path, { timeoutMs: EXPORT_API_TIMEOUT_MS });
  if (!response.ok) throw new Error(`Download failed (${response.status})`);
  const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href=url; anchor.download=fileName; anchor.click(); URL.revokeObjectURL(url);
}


export function updatePfCompliance(id: string, input: {
  expectedRevision: number;
  appointmentDate: string;
  epfWages: number | null;
  monthlyGross: number | null;
  department: string;
  designation: string;
  bankAccountType: "" | "SAVINGS" | "CURRENT";
  existingUanNumber: string;
}) {
  return apiFetch<ApiSuccessEnvelope<{ pf: PfComplianceRecord }>>(`/admin/compliance/pf/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) });
}

export function updateEsicCompliance(id: string, input: {
  expectedRevision: number;
  esiApplicable: boolean;
  esiNumber: string;
}) {
  return apiFetch<ApiSuccessEnvelope<{ esic: EsicComplianceRecord }>>(`/admin/compliance/esic/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) });
}
