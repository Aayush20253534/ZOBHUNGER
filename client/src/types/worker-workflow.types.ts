import type { WorkerProfile } from "./worker.types";
export interface PageResult<T> { items: T[]; page: number; totalPages: number; total: number }
export interface WorkerApplication {
  id: string; revision: number; stage: string; status: string; source: "WORKER_PORTAL" | "PUBLIC_FORM" | "PLACEMENT_CELL"; isPortalApplicant: boolean; name: string; email: string; phone: string; city: string | null;
  experience: string | null; availableFrom: string | null; message: string | null; resumeUrl: string | null; createdAt: string; withdrawnAt: string | null; withdrawalReason: string | null; canWithdraw: boolean;
  job: { id: string; requirementId: string | null; status: string; title: string; location: string; category: string; engagementType: string; slug: string | null };
  submittedResume: { fileName: string; size: number } | null;
  hiringReviews: { company: string; status: string; assignmentId: string | null }[];
}
export interface ApplicationDetail { application: WorkerApplication; profile: Partial<WorkerProfile>; history: PageResult<{ id: string; kind: string; stage: string; title: string; message: string | null; interviewAt: string | null; interviewMode: string | null; createdAt: string }> }
export interface WorkerAssignment { id: string; name: string; role: string; location: string; company: string; supervisor: string; startDate: string; endDate: string; shiftStart: number; shiftEnd: number; graceMinutes: number; workingDays: number[]; revision: number; state: string; cancelledAt: string | null; schedule: { date: string; state: string; startAt: string | null; endAt: string | null }[] }
export interface WorkerRecord { id: string; date: string; status: string; checkInAt: string | null; checkOutAt: string | null; breakMinutes: number; workedMinutes: number | null; lateMinutes: number; revision: number; approvalRevision: number; approvalStatus: string }
export interface AttendanceRequest { id: string; assignmentId: string; date: string; kind: string; status: string; attendanceStatus: string; checkInAt: string | null; checkOutAt: string | null; breakMinutes: number; workedMinutes: number | null; lateMinutes: number; reason: string; revision: number; createdAt: string; reviewedAt: string | null; reviewNote: string | null; approvedRecordRevision: number | null; assignment: WorkerAssignment }
export interface AssignmentDay { assignment: WorkerAssignment; date: string; today: string; status: string; record: WorkerRecord | null; businessCorrection: boolean; pending: AttendanceRequest | null; history: PageResult<AttendanceRequest> }
export interface AssignmentMonth { assignment: WorkerAssignment; month: string; today: string; recordedDays: number; approvedDays: number; workedMinutes: number; days: { date: string; status: string; record: WorkerRecord | null; pendingId: string | null }[] }
export interface AttendanceReview { request: AttendanceRequest & { worker: { email: string } }; assignment: WorkerAssignment; record: WorkerRecord | null; stale: boolean; businessCorrection: boolean }
