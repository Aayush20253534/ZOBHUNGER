import type { PageResult, WorkerAssignment } from "./worker-workflow.types";

export type EarningsStatus = "DRAFT" | "APPROVED";
export interface MoneyTotals {
  agreedPaise: number;
  allowancesPaise: number;
  reimbursementsPaise: number;
  deductionsPaise: number;
  adjustmentPaise: number;
  netPayablePaise: number;
  paidPaise: number;
  outstandingPaise: number;
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
}
export interface EarningsLine { id: string; type: "AGREED_EARNINGS" | "ALLOWANCE" | "REIMBURSEMENT" | "DEDUCTION"; label: string; amountPaise: number; reason: string | null; sortOrder: number }
export interface EarningsAdjustment { id: string; type: "CREDIT" | "DEBIT"; amountPaise: number; reason: string; createdAt: string }
export interface EarningsPayment { id: string; amountPaise: number; paidAt: string; method: string; reference: string; note: string | null; status: "RECORDED" | "VOIDED"; revision: number; voidedAt: string | null; voidReason: string | null; createdAt: string }
export interface EarningsStatement {
  id: string; assignmentId: string; periodStart: string; periodEnd: string; status: EarningsStatus; revision: number;
  approvedAt: string | null; approvalNote: string | null; approvalAttendanceSnapshot?: { recordedDays: number; approvedDays: number; workedMinutes: number; pendingDays: number; changesRequestedDays: number } | null;
  createdAt: string; updatedAt: string; assignment: WorkerAssignment; totals: MoneyTotals;
  lines?: EarningsLine[]; adjustments?: EarningsAdjustment[]; payments?: EarningsPayment[];
  currentAttendance?: EarningsContext["attendance"];
}
export interface EarningsList extends PageResult<EarningsStatement> { summary: { approvedPaise: number; paidPaise: number; outstandingPaise: number }; assignments: { id: string; role: string; company: string; location: string }[] }
export type AdminEarningsList = PageResult<EarningsStatement>;
export interface EarningsAssignmentOption extends WorkerAssignment { workerUserId: string; recordCount: number; statementCount: number }
export type EarningsAssignmentList = PageResult<EarningsAssignmentOption>;
export interface EarningsContext { assignment: WorkerAssignment; attendance: { records: { id: string; date: string; status: string; workedMinutes: number | null; approvalStatus: string; approvalRevision: number; revision: number }[]; recordedDays: number; approvedDays: number; workedMinutes: number; pendingDays: number; changesRequestedDays: number } }
export interface WorkerDashboardData {
  today: string;
  profile: { fullName: string | null; completion: { percent: number; checklist: { id: string; label: string; done: boolean }[] } };
  applications: { total: number; counts: Record<string, number>; recent: { id: string; stage: string; title: string; updatedAt: string }[] };
  assignments: { currentTotal: number; upcomingTotal: number; current: WorkerAssignment[]; upcoming: WorkerAssignment[]; nextShift: { assignmentId: string; role: string; company: string; location: string; supervisor: string; date: string; startAt: string; endAt: string; overnight: boolean } | null };
  attendance: { pending: number; recent: { id: string; assignmentId: string; date: string; kind: string; status: string; reviewNote: string | null; reviewedAt: string | null; createdAt: string; assignment: { role: string; location: string } }[] };
  earnings: { approvedPaise: number; paidPaise: number; outstandingPaise: number };
  activity: { id: string; kind: string; title: string; detail: string; at: string }[];
}
