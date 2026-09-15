import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { TechnicalInstituteApplicationInput } from "@/schemas/technical-institute-application.schema";

interface TechnicalInstituteApplicationCreated {
  id: string;
  institutionName: string;
  officialEmail: string;
  status: "SUBMITTED";
  createdAt: string;
}

export function submitTechnicalInstituteApplication(input: TechnicalInstituteApplicationInput) {
  return apiFetch<ApiSuccessEnvelope<TechnicalInstituteApplicationCreated>>(
    "/technical-institute-applications",
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        website: input.website || undefined,
        affiliationNumber: input.affiliationNumber || undefined,
        alternateNumber: input.alternateNumber || undefined,
        technicalHiringNotes: input.technicalHiringNotes || undefined,
      }),
    },
  );
}
