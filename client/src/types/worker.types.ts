import type { AuthUser } from "./auth.types";
export interface WorkerEducation { qualification: string; institution: string; year: number }
export interface WorkerExperience { company: string; role: string; startMonth: string; endMonth: string | null; current: boolean; description: string }
export interface WorkerResume { id: string; fileName: string; mimeType: string; size: number; revision: number; updatedAt: string }
export interface WorkerProfile {
  id: string; fullName: string; phone: string | null; headline: string | null; about: string | null;
  city: string | null; state: string | null; postalCode: string | null; skills: string[]; languages: string[];
  experienceYears: number | null; education: WorkerEducation[]; workExperience: WorkerExperience[];
  preferredLocations: string[]; preferredCategories: string[]; preferredEngagements: string[];
  availability: string | null; isAvailable: boolean; consentAt: string | null; revision: number; resumeRevision: number;
  updatedAt: string; resume: WorkerResume | null;
}
export interface WorkerProfileInput {
  revision: number; fullName: string; phone: string; headline: string; about: string; city: string; state: string; postalCode: string;
  skills: string[]; languages: string[]; experienceYears: number | null; education: WorkerEducation[]; workExperience: WorkerExperience[];
  preferredLocations: string[]; preferredCategories: string[]; preferredEngagements: string[]; availability: string; isAvailable: boolean; consent: boolean;
}
export interface WorkerCompletion { percent: number; checklist: { id: string; label: string; done: boolean }[] }
export interface WorkerProfileResult { profile: WorkerProfile | null; completion: WorkerCompletion }
export interface WorkerWorkspace extends WorkerProfileResult { user: AuthUser }
export interface WorkerJob {
  applicationId?: string | null;
  id: string; slug: string | null; title: string; location: string; city: string; state: string | null;
  category: string; engagementType: string; description: string; responsibilities: string[]; requirements: string[];
  compensation: string | null; publishedAt: string | null; saved: boolean; available?: boolean; savedAt?: string;
}
export interface WorkerJobList { items: WorkerJob[]; total: number; page: number; pageSize: number; totalPages: number }
export interface WorkerJobFacets { cities: string[]; categories: string[]; engagementTypes: string[] }
