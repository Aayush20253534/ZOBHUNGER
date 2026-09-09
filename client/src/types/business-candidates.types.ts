export const candidateStatuses = ["SHARED", "SHORTLISTED", "INTERVIEW_REQUESTED", "SELECTED", "REJECTED"] as const;
export type CandidateStatus = typeof candidateStatuses[number];
export interface CandidateRequirement {
  id: string; companyName: string; serviceRequired: string; jobLocation: string; status: string;
}
export interface BusinessCandidate {
  id: string; requirementId: string; name: string; city: string | null; experience: string | null;
  skills: string[]; availableFrom: string | null; summary: string; jobTitle: string;
  status: CandidateStatus; revision: number; revokedAt: string | null; createdAt: string; updatedAt: string;
  requirement: CandidateRequirement;
}
export interface CandidateEvent {
  id: string; kind: "SHARED" | "STATUS_CHANGED" | "INTERVIEW_REQUESTED" | "FEEDBACK" | "ACCESS_REVOKED";
  actorRole: string; fromStatus: CandidateStatus | null; toStatus: CandidateStatus | null; note: string;
  interviewAt: string | null; interviewMode: string | null; interviewDetails: string | null; createdAt: string;
}
export interface CandidateDetail {
  candidate: BusinessCandidate & { resumeUrl: string | null };
  history: { items: CandidateEvent[]; total: number; page: number; totalPages: number };
}
export interface CandidateList {
  items: BusinessCandidate[]; total: number; page: number; pageSize: number; totalPages: number;
  counts: Record<CandidateStatus, number>; requirement: CandidateRequirement | null;
}
export interface CandidateListQuery { page: number; query: string; status: CandidateStatus | "ALL"; requirementId?: string }
export type CandidateReview = { revision: number; note: string } & (
  { action: "STATUS"; status: Exclude<CandidateStatus, "INTERVIEW_REQUESTED"> }
  | { action: "FEEDBACK" }
  | { action: "INTERVIEW"; interviewAt: string; interviewMode: "PHONE" | "VIDEO" | "IN_PERSON"; interviewDetails: string }
);
export interface ApplicationOption {
  id: string; name: string; city: string | null; experience: string | null; resumeUrl: string | null;
  availableFrom: string | null; job: { title: string; requirementId: string | null }; skills: string[];
}
export interface CandidateOptions<T> { items: T[]; total: number; page: number; totalPages: number }
