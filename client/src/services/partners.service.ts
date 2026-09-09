import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { PartnerApplicationInput } from "@/schemas/partner-application.schema";

interface PartnerApplicationCreated {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  resumeUploadToken: string | null;
  resumeUploadExpiresAt: string | null;
  created: boolean;
}

export interface PartnerSubmissionReceipt {
  id: string;
  createdAt: string;
  message: string;
  resumeUploaded: boolean;
  warning?: string;
}

const allowedResumeTypes = new Set(["application/pdf"]);

export async function submitPartnerApplication(
  input: PartnerApplicationInput,
  resume?: File | null,
  requestKey = crypto.randomUUID(),
): Promise<PartnerSubmissionReceipt> {
  const response = await apiFetch<ApiSuccessEnvelope<PartnerApplicationCreated>>(
    "/partner-applications",
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        requestKey,
        linkedInUrl: input.linkedInUrl || undefined,
        professionalNetwork: input.professionalNetwork || undefined,
      }),
    },
  );

  let resumeUploaded = false;
  let warning: string | undefined;

  if (resume) {
    if (!allowedResumeTypes.has(resume.type)) {
      throw new Error("Resume must be a PDF file.");
    }
    if (resume.size > 2 * 1024 * 1024) {
      throw new Error("Resume must be 2 MB or smaller.");
    }

    if (!response.data.resumeUploadToken) {
      warning = "Your application already has a resume attached.";
    } else try {
      await apiFetch<ApiSuccessEnvelope<{ id: string; resumeFileName: string }>>(
        `/partner-applications/${encodeURIComponent(response.data.id)}/resume`,
        {
          method: "PUT",
          headers: {
            "Content-Type": resume.type,
            "X-Upload-Token": response.data.resumeUploadToken,
            "X-File-Name": resume.name,
          },
          body: resume,
        },
      );
      resumeUploaded = true;
    } catch {
      warning = "Your application was submitted, but the resume upload did not complete. Our team can request it later if needed.";
    }
  }

  return {
    id: response.data.id,
    createdAt: response.data.createdAt,
    message: response.message,
    resumeUploaded,
    warning,
  };
}
