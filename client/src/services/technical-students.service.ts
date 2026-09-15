import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { TechnicalStudentRegistrationInput } from "@/schemas/technical-student-registration.schema";

export interface TechnicalInstitutePublicPartner {
  id: string;
  institutionName: string;
  institutionType: string;
  city: string;
  state: string;
  partnershipCode: string;
  preferredOpportunityTypes: string[];
  tradesBranches: string;
}

export interface TechnicalStudentRegistrationResult {
  student: {
    id: string;
    fullName: string;
    email: string;
    qualification: string;
    tradeBranch: string;
    status: "PENDING";
    createdAt: string;
  };
  institute: { institutionName: string; partnershipCode: string };
}

function splitList(value: string) {
  return value.split(/[,;|\n]/).map((item) => item.trim()).filter(Boolean);
}

export function verifyTechnicalInstitutePartnership(partnershipCode: string) {
  return apiFetch<ApiSuccessEnvelope<TechnicalInstitutePublicPartner>>(
    `/technical-institute-applications/partners/${encodeURIComponent(partnershipCode.trim().toUpperCase())}`,
  );
}

export function registerTechnicalStudent(input: TechnicalStudentRegistrationInput) {
  return apiFetch<ApiSuccessEnvelope<TechnicalStudentRegistrationResult>>(
    "/technical-institute-applications/students",
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        partnershipCode: input.partnershipCode.trim().toUpperCase(),
        enrollmentNumber: input.enrollmentNumber || undefined,
        dateOfBirth: input.dateOfBirth || undefined,
        gender: input.gender || undefined,
        currentSemesterYear: input.currentSemesterYear || undefined,
        academicScore: input.academicScore || undefined,
        skills: splitList(input.skills),
        certifications: splitList(input.certifications),
        preferredLocations: splitList(input.preferredLocations),
      }),
    },
  );
}
