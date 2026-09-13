import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { EmployeeComplianceProfile, EsicComplianceInput, PfComplianceInput } from "@/types/compliance.types";

const TOKEN_KEY = "zobhunger.employee.compliance.token";

export function complianceToken() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(TOKEN_KEY) ?? "";
}

export function storeComplianceToken(token: string) {
  if (typeof window !== "undefined") window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearComplianceToken() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(TOKEN_KEY);
}

function employeeHeaders(extra?: HeadersInit) {
  const headers = new Headers(extra);
  const token = complianceToken();
  if (token) headers.set("X-Employee-Compliance-Token", token);
  return headers;
}

export function createEmployeeComplianceAccess(input: { employeeNumber: string; personalEmail: string; dateOfBirth: string; aadhaarLast4: string }) {
  return apiFetch<ApiSuccessEnvelope<{ token: string; expiresAt: string }>>("/employee-compliance/access", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getEmployeeComplianceProfile() {
  return apiFetch<ApiSuccessEnvelope<EmployeeComplianceProfile>>("/employee-compliance/profile", { headers: employeeHeaders() });
}

export function savePfCompliance(input: PfComplianceInput) {
  return apiFetch<ApiSuccessEnvelope<{ pf: EmployeeComplianceProfile["pf"] }>>("/employee-compliance/pf", { method: "PUT", headers: employeeHeaders(), body: JSON.stringify(input) });
}

export function submitPfCompliance() {
  return apiFetch<ApiSuccessEnvelope<{ pf: EmployeeComplianceProfile["pf"] }>>("/employee-compliance/pf/submit", { method: "POST", headers: employeeHeaders(), body: JSON.stringify({}) });
}

export function saveEsicCompliance(input: EsicComplianceInput) {
  return apiFetch<ApiSuccessEnvelope<{ esic: EmployeeComplianceProfile["esic"] }>>("/employee-compliance/esic", { method: "PUT", headers: employeeHeaders(), body: JSON.stringify(input) });
}

export function submitEsicCompliance() {
  return apiFetch<ApiSuccessEnvelope<{ esic: EmployeeComplianceProfile["esic"] }>>("/employee-compliance/esic/submit", { method: "POST", headers: employeeHeaders(), body: JSON.stringify({}) });
}

export async function uploadComplianceDocument(path: "pf/document" | "esic/document", file: File) {
  return apiFetch<ApiSuccessEnvelope<{ document: { id: string; fileName: string } }>>(`/employee-compliance/${path}`, {
    method: "PUT",
    headers: employeeHeaders({ "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name) }),
    body: await file.arrayBuffer(),
  });
}

export async function uploadFamilyPhoto(joiningId: string, familyMemberId: string, file: File) {
  return apiFetch<ApiSuccessEnvelope<{ document: { id: string; fileName: string } }>>(`/employee-compliance/esic/family/${encodeURIComponent(joiningId)}/${encodeURIComponent(familyMemberId)}/photo`, {
    method: "PUT",
    headers: employeeHeaders({ "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name) }),
    body: await file.arrayBuffer(),
  });
}
