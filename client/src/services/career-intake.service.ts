import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { CareerProfileInput, CareerReceipt } from "@/types/career-intake.types";

export function submitCareerProfile(profile: CareerProfileInput, requestKey: string) {
  return apiFetch<ApiSuccessEnvelope<CareerReceipt>>("/career-applications", { method: "POST", body: JSON.stringify({ ...profile, requestKey }) });
}
export function uploadCareerResume(receipt: CareerReceipt, file: File) {
  if (!receipt.resumeUploadToken) throw new Error("This profile already has a resume. Contact our team if you need to replace it.");
  return apiFetch<ApiSuccessEnvelope<{ resumeUploaded: boolean }>>(`/career-applications/${encodeURIComponent(receipt.id)}/resume`, {
    method: "PUT", headers: { "Content-Type": "application/pdf", "X-Upload-Token": receipt.resumeUploadToken, "X-File-Name": encodeURIComponent(file.name) }, body: file,
  });
}
