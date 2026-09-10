import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { EmployeeDocumentKind, EmployeeJoiningInput, EmployeeJoiningReceipt } from "@/types/employee-joining.types";

export async function startEmployeeJoining(input: EmployeeJoiningInput, requestKey: string) {
  return apiFetch<ApiSuccessEnvelope<EmployeeJoiningReceipt>>("/employee-joining", {
    method: "POST",
    body: JSON.stringify({ requestKey, ...input }),
  });
}

export async function uploadEmployeeDocument(receipt: EmployeeJoiningReceipt, kind: EmployeeDocumentKind, file: File) {
  if (!receipt.uploadToken) throw new Error("This joining form is already submitted or its upload receipt has expired.");
  return apiFetch<ApiSuccessEnvelope<{ document: { id: string; kind: EmployeeDocumentKind; fileName: string } }>>(`/employee-joining/${receipt.id}/documents/${kind}`, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      "X-Upload-Token": receipt.uploadToken,
      "X-File-Name": encodeURIComponent(file.name),
    },
    body: await file.arrayBuffer(),
  });
}

export async function finalizeEmployeeJoining(receipt: EmployeeJoiningReceipt) {
  if (!receipt.uploadToken) throw new Error("This joining form is already submitted or its upload receipt has expired.");
  return apiFetch<ApiSuccessEnvelope<{ id: string; employeeNumber: string; submitted: true; submittedAt: string }>>(`/employee-joining/${receipt.id}/submit`, {
    method: "POST",
    headers: { "X-Upload-Token": receipt.uploadToken },
    body: JSON.stringify({}),
  });
}
