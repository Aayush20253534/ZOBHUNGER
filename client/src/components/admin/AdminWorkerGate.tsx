"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getCurrentUser } from "@/services/auth.service";
import { ApiError } from "@/lib/api";
import type { AdminPermission, AuthUser } from "@/types/auth.types";
import { WorkerAlert, WorkerLoading } from "@/components/worker/WorkerUI";
import "@/styles/worker.css";
import "@/styles/worker-workflows.css";

const workspaceLinks: readonly { href: string; label: string; permission: AdminPermission }[] = [
  { href: "/admin", label: "Operations dashboard", permission: "DASHBOARD_VIEW" },
  { href: "/admin/worker-applications", label: "Applications", permission: "WORKERS_MANAGE" },
  { href: "/admin/worker-attendance", label: "Attendance requests", permission: "ATTENDANCE_MANAGE" },
  { href: "/admin/earnings", label: "Earnings & payments", permission: "EARNINGS_MANAGE" },
  { href: "/admin/candidate-management", label: "Candidate sharing", permission: "CANDIDATES_MANAGE" },
];

export function AdminWorkerGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null), [error, setError] = useState("");
  const version = useRef(0);
  useEffect(() => {
    let live = true;
    const check = async () => {
      const current = ++version.current;
      try {
        const response = await getCurrentUser();
        if (!live || current !== version.current) return;
        if (response.data.user.role !== "ADMIN") throw new ApiError("Sign in with an administrator account to use the operations review desk.", 403);
        setUser(response.data.user);
        setError("");
      } catch (caught) {
        if (live && current === version.current) {
          setUser(null);
          setError(caught instanceof Error ? caught.message : "Unable to verify administrator access.");
        }
      }
    };
    void check();
    const focus = () => { if (document.visibilityState === "visible") void check(); };
    window.addEventListener("focus", focus);
    const timer = window.setInterval(focus, 60_000);
    return () => { live = false; window.removeEventListener("focus", focus); window.clearInterval(timer); };
  }, []);
  const granted = new Set(user?.adminPermissions ?? []);
  const links = workspaceLinks.filter(item => granted.has(item.permission));
  return <div className="zw"><main className="zwf-admin">{user && links.length > 0 && <nav className="zwf-admin-nav" aria-label="Hiring and worker operations">{links.map(item => <Link href={item.href} key={item.href}>{item.label}</Link>)}</nav>}{user ? <div key={user.id}>{children}</div> : error ? <><WorkerAlert message={error} /><Link className="zw-button" href="/login">Administrator sign in</Link></> : <WorkerLoading />}</main></div>;
}
