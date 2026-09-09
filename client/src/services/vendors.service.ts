import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { VendorDetail, VendorDocument, VendorDocumentKind, VendorInput, VendorList, VendorReceipt, VendorRecordInput, VendorStatus } from "@/types/vendor.types";

export function startVendorApplication(input: VendorInput, requestKey: string) {
  return apiFetch<ApiSuccessEnvelope<VendorReceipt>>("/vendor-applications", { method: "POST", body: JSON.stringify({ ...input, requestKey }) });
}
export function uploadVendorDocument(receipt: VendorReceipt, kind: VendorDocumentKind, file: File) {
  if (!receipt.uploadToken) throw new Error("This application is already submitted.");
  return apiFetch<ApiSuccessEnvelope<{ document: VendorDocument }>>(`/vendor-applications/${encodeURIComponent(receipt.id)}/documents/${kind}`, {
    method: "PUT", headers: { "Content-Type": "application/pdf", "X-Upload-Token": receipt.uploadToken, "X-File-Name": encodeURIComponent(file.name) }, body: file,
  });
}
export function finishVendorApplication(receipt: VendorReceipt) {
  if (!receipt.uploadToken) throw new Error("This application is already submitted.");
  return apiFetch<ApiSuccessEnvelope<{ id: string; submitted: true; submittedAt: string }>>(`/vendor-applications/${encodeURIComponent(receipt.id)}/submit`, {
    method: "POST", headers: { "X-Upload-Token": receipt.uploadToken },
  });
}
export function listVendors(query: URLSearchParams, signal?: AbortSignal) { return apiFetch<ApiSuccessEnvelope<VendorList>>(`/admin/vendors?${query}`, { signal }); }
export function getVendor(id: string, signal?: AbortSignal) { return apiFetch<ApiSuccessEnvelope<VendorDetail>>(`/admin/vendors/${encodeURIComponent(id)}`, { signal }); }
export function reviewVendor(id: string, expectedRevision: number, status: Exclude<VendorStatus, "DRAFT" | "SUBMITTED">, notes: string) {
  return apiFetch<ApiSuccessEnvelope<{ application: VendorDetail }>>(`/admin/vendors/${encodeURIComponent(id)}/review`, { method: "POST", headers: { "X-Requested-With": "XMLHttpRequest" }, body: JSON.stringify({ expectedRevision, status, notes }) });
}
export function updateVendorRecord(id: string, expectedRevision: number, record: VendorRecordInput) {
  return apiFetch<ApiSuccessEnvelope<{ application: VendorDetail }>>(`/admin/vendors/${encodeURIComponent(id)}/record`, { method: "PATCH", headers: { "X-Requested-With": "XMLHttpRequest" }, body: JSON.stringify({ ...record, expectedRevision }) });
}
