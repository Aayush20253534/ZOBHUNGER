"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Download, RefreshCw, Search } from "lucide-react";
import { ApiError, apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import { WorkerAlert, WorkerLoading, workerError } from "./WorkerUI";

export const workflowGet = async <T,>(path: string, signal?: AbortSignal) => (await apiFetch<ApiSuccessEnvelope<T>>(path, { signal })).data;
export const workflowPost = async <T,>(path: string, body: unknown) => (await apiFetch<ApiSuccessEnvelope<T>>(path, { method: "POST", headers: { "X-Requested-With": "XMLHttpRequest" }, body: JSON.stringify(body) })).data;
export const workflowPut = async <T,>(path: string, body: unknown) => (await apiFetch<ApiSuccessEnvelope<T>>(path, { method: "PUT", headers: { "X-Requested-With": "XMLHttpRequest" }, body: JSON.stringify(body) })).data;
export function useWorkflowRead<T>(path: string) {
  const [version, setVersion] = useState(0); const key = `${path}:${version}`;
  const [result, setResult] = useState<{ key: string; data?: T; error?: string } | null>(null);
  useEffect(() => { if (!path) { queueMicrotask(() => setResult({ key })); return; } const controller = new AbortController(); void workflowGet<T>(path, controller.signal).then(data => { if (!controller.signal.aborted) setResult({ key, data }); }).catch(error => { if (!controller.signal.aborted) setResult({ key, error: workerError(error) }); }); return () => controller.abort(); }, [path, key]);
  return { data: result?.key === key ? result.data : undefined, error: result?.key === key ? result.error : undefined, loading: result?.key !== key, reload: () => setVersion(value => value + 1) };
}
export function ReadState({ loading, error, reload, children }: { loading: boolean; error?: string; reload: () => void; children: ReactNode }) {
  if (loading) return <WorkerLoading />;
  if (error) return <><WorkerAlert message={error} /><button className="zw-button" onClick={reload}><RefreshCw aria-hidden="true" />Try again</button></>;
  return children;
}
export const stageLabel = (value: string) => ({ PENDING: "Awaiting review", APPROVED: "Approved", REJECTED: "Not approved", SUBMITTED: "Submitted", REVIEWED: "In review", SHORTLISTED: "Shortlisted", INTERVIEW_REQUESTED: "Interview", SELECTED: "Selected", ASSIGNED: "Assigned", WITHDRAWN: "Withdrawn", NOT_RECORDED: "Not recorded", SCHEDULED_OFF: "Scheduled off", NOT_ASSIGNED: "Outside assignment", CHANGES_REQUESTED: "Changes requested", DRAFT: "Draft", UNPAID: "Unpaid", PARTIALLY_PAID: "Partially paid", PAID: "Paid", RECORDED: "Recorded", VOIDED: "Voided" } as Record<string, string>)[value] || value.toLowerCase().replaceAll("_", " ");
export function Status({ value }: { value: string }) { return <span className={`zwf-status zwf-status--${value.toLowerCase()}`}>{["APPROVED", "ASSIGNED", "PRESENT", "SELECTED"].includes(value) ? <Check aria-hidden="true" /> : <Clock3 aria-hidden="true" />}{stageLabel(value)}</span>; }
export const dateLabel = (value: string) => new Date(value.length === 10 ? `${value}T00:00:00+05:30` : value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export const timeLabel = (value: string | null) => value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—";
export const minuteClock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
export const istDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export function Pagination({ page, totalPages, change }: { page: number; totalPages: number; change: (page: number) => void }) { return totalPages > 1 ? <nav className="zw-pagination" aria-label="Results pages"><button className="zw-button zw-button--secondary" disabled={page <= 1} onClick={() => change(page - 1)}><ArrowLeft aria-hidden="true" />Previous</button><span>{page} / {totalPages}</span><button className="zw-button zw-button--secondary" disabled={page >= totalPages} onClick={() => change(page + 1)}>Next<ArrowRight aria-hidden="true" /></button></nav> : null; }
export function WorkflowFilters({ statuses, status, setStatus, onSearch, reload }: { statuses: string[]; status: string; setStatus: (value: string) => void; onSearch: (value: string) => void; reload: () => void }) {
  return <form className="zwf-filters" onSubmit={event => { event.preventDefault(); onSearch(String(new FormData(event.currentTarget).get("query") || "")); }}><label className="zw-field"><span>Search</span><input name="query" maxLength={120} placeholder="Role, location or keyword" type="search" /></label><label className="zw-field"><span>Status</span><select value={status} onChange={event => setStatus(event.target.value)}>{["ALL", ...statuses].map(value => <option key={value} value={value}>{value === "ALL" ? "All statuses" : stageLabel(value)}</option>)}</select></label><button className="zw-button"><Search aria-hidden="true" />Search</button><button type="button" className="zw-button zw-button--secondary" onClick={reload}><RefreshCw aria-hidden="true" />Refresh</button></form>;
}
export function PrivateResume({ path, name = "submitted-resume.pdf", className = "zw-button zw-button--secondary" }: { path: string; name?: string; className?: string }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const lock = useRef(false);
  async function download() { if (lock.current) return; lock.current = true; setBusy(true); setError(""); try { const response = await fetch(`/api/backend${path}`, { credentials: "include", cache: "no-store" }); if (!response.ok) throw new ApiError("Your CV download is unavailable. Refresh the page or sign in again.", response.status); const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 10_000); } catch (caught) { setError(workerError(caught)); } finally { lock.current = false; setBusy(false); } }
  return <div><button type="button" className={className} onClick={download} disabled={busy}><Download aria-hidden="true" />{busy ? "Downloading…" : "Download submitted CV"}</button><WorkerAlert message={error} /></div>;
}
export function WorkflowBack({ href, children }: { href: string; children: ReactNode }) { return <Link className="zw-back" href={href}><ArrowLeft aria-hidden="true" />{children}</Link>; }
