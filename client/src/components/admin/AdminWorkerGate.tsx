"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getCurrentUser } from "@/services/auth.service";
import { ApiError } from "@/lib/api";
import { WorkerAlert, WorkerLoading } from "@/components/worker/WorkerUI";
import "@/styles/worker.css";
import "@/styles/worker-workflows.css";
export function AdminWorkerGate({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null), [error, setError] = useState(""); const version = useRef(0);
  useEffect(() => { let live = true; const check = async () => { const current = ++version.current; try { const response = await getCurrentUser(); if (!live || current !== version.current) return; if (response.data.user.role !== "ADMIN") throw new ApiError("Sign in with an administrator account to use the operations review desk.", 403); setUserId(response.data.user.id); setError(""); } catch (caught) { if (live && current === version.current) { setUserId(null); setError(caught instanceof Error ? caught.message : "Unable to verify administrator access."); } } }; void check(); const focus = () => { if (document.visibilityState === "visible") void check(); }; window.addEventListener("focus", focus); const timer = window.setInterval(focus, 60_000); return () => { live = false; window.removeEventListener("focus", focus); window.clearInterval(timer); }; }, []);
  return <div className="zw"><main className="zwf-admin"><nav className="zwf-admin-nav" aria-label="Worker operations"><Link href="/admin">Operations dashboard</Link><Link href="/admin/worker-applications">Worker applications</Link><Link href="/admin/worker-attendance">Attendance requests</Link><Link href="/admin/candidate-management">Candidate sharing</Link></nav>{userId ? <div key={userId}>{children}</div> : error ? <><WorkerAlert message={error} /><Link className="zw-button" href="/login">Administrator sign in</Link></> : <WorkerLoading />}</main></div>;
}
