"use client";

import Link from "next/link";
import { CalendarClock, CheckCheck, ChevronLeft, ChevronRight, CircleAlert, FileSearch, ListChecks, RotateCcw, UsersRound, XCircle } from "lucide-react";
import { ApiError } from "@/lib/api";
import type { CandidateStatus } from "@/types/business-candidates.types";

export const candidateStages = {
  SHARED: { label: "Shared", icon: UsersRound, description: "Ready for your review" },
  SHORTLISTED: { label: "Shortlisted", icon: ListChecks, description: "Profiles you want to explore" },
  INTERVIEW_REQUESTED: { label: "Interview requested", icon: CalendarClock, description: "Awaiting coordination" },
  SELECTED: { label: "Selected", icon: CheckCheck, description: "Your selection decision" },
  REJECTED: { label: "Not selected", icon: XCircle, description: "Review completed" },
} satisfies Record<CandidateStatus, { label: string; icon: typeof UsersRound; description: string }>;
export function CandidateBadge({ status }: { status: CandidateStatus }) {
  const stage = candidateStages[status]; const Icon = stage.icon;
  return <span className="zb-cand-badge" data-stage={status}><Icon aria-hidden="true" />{stage.label}</span>;
}
export function CandidateLoading() {
  return <div className="zb-cand-loading" role="status"><FileSearch aria-hidden="true" /><span>Loading candidate workspace…</span><div aria-hidden="true" /><div aria-hidden="true" /><div aria-hidden="true" /></div>;
}
export function CandidateError({ error, retry, admin = false }: { error: Error; retry: () => void; admin?: boolean }) {
  const expired = error instanceof ApiError && [401, 403].includes(error.status);
  return <div className="zb-cand-empty" role="alert"><CircleAlert aria-hidden="true" /><h2>{expired ? "Sign in to continue" : "This view is unavailable"}</h2><p>{error.message}</p>{expired ? <Link className="zb-biz-button" href={admin ? "/login?next=/admin/candidate-management" : "/business/login?next=/business/candidates"}>Sign in</Link> : <button type="button" className="zb-biz-button zb-biz-button--secondary" onClick={retry}><RotateCcw aria-hidden="true" />Try again</button>}</div>;
}
export function CandidatePagination({ page, totalPages, onChange, label = "Candidate pages" }: { page: number; totalPages: number; onChange: (page: number) => void; label?: string }) {
  if (totalPages <= 1) return null;
  return <nav className="zb-cand-pagination" aria-label={label}><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft aria-hidden="true" /></button><span>Page {page} of {totalPages}</span><button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => onChange(page + 1)}><ChevronRight aria-hidden="true" /></button></nav>;
}
export function safeCvLink(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function reviewError(error: unknown) {
  if (error instanceof ApiError && error.code === "VALIDATION_ERROR") return "Check the required fields and their length before saving. Your entries are still here.";
  return error instanceof Error ? error.message : "The update could not be saved. Your entries are still here.";
}
