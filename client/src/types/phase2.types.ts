import type { BusinessRequirementFormValues } from "@/schemas/business-requirement.schema";
export interface Page<T> { items: T[]; total: number; totalPages: number; page: number }
export type DraftData = Omit<BusinessRequirementFormValues, "workforceCount"> & { workforceCount: number | null };
export interface RequirementDraft { id: string; data: DraftData; revision: number; updatedAt: string; submittedAt?: string | null; submittedRequirementId?: string | null }
export interface HiringBrief { id: string; companyName: string; serviceRequired: string; workforceCount: number; jobLocation: string; locations: string[]; projectDuration: string; details: string; revision: number; status: string; _count?: { jobs: number }; hiring?: { open: number; draft: number; archived: number; applications: number } }
export interface HiringBriefsPage extends Page<HiringBrief> { summary: { briefs: number; open: number; drafts: number; applications: number } }
export interface JobInput { title: string; city: string; location: string; state: string; category: string; engagementType: string; description: string; compensation: string; responsibilities: string[]; requirements: string[] }
export interface LinkedJob extends JobInput { id: string; slug: string; status: "DRAFT" | "OPEN" | "CLOSED"; revision: number; createdAt: string; publishedAt?: string | null; archivedAt: string | null; _count: { applications: number } }
export interface LinkedJobs extends Page<LinkedJob> { requirement: HiringBrief; summary: { totalOpenings: number; open: number; draft: number; closed: number; archived: number; applications: number } }
export type ApprovalStatus = "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
export interface ApprovalRecord { id: string; assignmentId: string; date: string; status: string; checkInAt: string | null; checkOutAt: string | null; breakMinutes: number; workedMinutes: number | null; lateMinutes: number; note: string; revision: number; approvalRevision: number; approvalStatus: ApprovalStatus; correctionOpen?: boolean;
  assignment: { id: string; name: string; role: string; location: string; supervisor: string; requirementId: string; requirement: { companyName: string } } }
export interface ApprovalQueue extends Page<ApprovalRecord> { counts: Record<ApprovalStatus, number>; approvedMinutes: number }
export interface ApprovalDetail { record: ApprovalRecord; correction: { id: string; reason: string } | null;
  history: Page<{ id: string; action: string; actorRole: string; note: string; recordRevision: number; createdAt: string; snapshot: { date: string; status: string; checkInAt: string | null; checkOutAt: string | null; workedMinutes: number | null; breakMinutes: number; note: string } }> }
export type ReportType = "requirements" | "candidates" | "deployments" | "attendance";
export interface ReportFilters { from: string; to: string; location: string; requirementId?: string }
export interface ReportData { type: ReportType; from: string; to: string; location: string; generatedAt: string; columns: { key: string; label: string }[]; rows: Record<string, string | number | null>[]; total: number; page: number; totalPages: number;
  charts: { requirements: { status: string; count: number; people: number }[]; candidates: { status: string; count: number }[]; deployments: { state: string; count: number }[];
    attendance: { status: string; count: number; approved: number; pending: number; changes: number; minutes: number; approvedMinutes: number }[];
    trend: { date: string; expected: number; missing: number; present: number; recorded: number }[] } }
export interface OperationsSummary { date: string; active: number; upcoming: number; approvals: number; oldestPendingId: string | null; corrections: number; drafts: number; jobs: number; candidates: { status: string; count: number }[] }
