import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { InternshipApplicationInput, InternshipApplicationReceipt } from "@/types/internship-application.types";

export function submitInternshipApplication(profile: InternshipApplicationInput, requestKey: string) {
  return apiFetch<ApiSuccessEnvelope<InternshipApplicationReceipt>>("/internship-applications", {
    method: "POST",
    body: JSON.stringify({ ...profile, requestKey }),
  });
}

export function uploadInternshipResume(receipt: InternshipApplicationReceipt, file: File) {
  if (!receipt.resumeUploadToken) throw new Error("This application already has a resume. Contact HR if you need to replace it.");
  return apiFetch<ApiSuccessEnvelope<{ resumeUploaded: boolean }>>(`/internship-applications/${encodeURIComponent(receipt.id)}/resume`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/pdf",
      "X-Upload-Token": receipt.resumeUploadToken,
      "X-File-Name": encodeURIComponent(file.name),
    },
    body: file,
  });
}
