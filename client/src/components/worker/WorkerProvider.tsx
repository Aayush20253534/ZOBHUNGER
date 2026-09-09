"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { workerAccessHref } from "@/lib/worker-navigation";
import { getWorkerWorkspace } from "@/services/worker.service";
import { logout } from "@/services/auth.service";
import type { WorkerProfileResult, WorkerWorkspace } from "@/types/worker.types";
import { WorkerAlert, WorkerLoading, WorkerWordmark } from "./WorkerUI";
import { WorkerDraftProvider } from "./WorkerDraft";

interface WorkerContextValue extends WorkerWorkspace { updateProfile: (data: WorkerProfileResult) => void; signOut: () => Promise<void>; notice: string; refresh: () => void }
const WorkerContext = createContext<WorkerContextValue | null>(null);
export function useWorker() { const context = useContext(WorkerContext); if (!context) throw new Error("WorkerProvider is required"); return context; }
export function WorkerProvider({ children }: { children: ReactNode }) {
  const router = useRouter(); const pathname = usePathname();
  const [workspace, setWorkspace] = useState<WorkerWorkspace | null>(null);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [loading, setLoading] = useState(true);
  const state = useRef({ version: 0, ready: false, unavailable: false });
  const load = useCallback(async () => {
    if (state.current.unavailable) return;
    const version = ++state.current.version;
    try {
      const response = await getWorkerWorkspace();
      if (version !== state.current.version) return;
      if (response.data.user.role !== "WORKER") throw new ApiError("Use a worker account to open this space.", 403);
      if (!response.data.user.emailVerifiedAt) throw new ApiError("Verify your email to continue.", 403, "EMAIL_VERIFICATION_REQUIRED");
      state.current.ready = true; setWorkspace(response.data); setNotice(""); setError("");
    } catch (caught) {
      if (version !== state.current.version) return;
      if (state.current.ready && (!(caught instanceof ApiError) || caught.status >= 500 || caught.status === 429)) {
        setNotice("Connection interrupted. Your open form is still here; showing your last loaded workspace."); return;
      }
      state.current.ready = false; setWorkspace(null); setNotice("");
      if (caught instanceof ApiError && caught.status === 401) router.replace(workerAccessHref("login", pathname));
      else if (caught instanceof ApiError && caught.code === "EMAIL_VERIFICATION_REQUIRED") router.replace(workerAccessHref("verify", pathname));
      else if (caught instanceof ApiError && caught.status === 404) { state.current.unavailable = true; setError("The worker area is temporarily unavailable. Please try again later or contact our team."); }
      else setError(caught instanceof ApiError ? caught.message : "We couldn't open your worker space. Check your connection and try again.");
    } finally { if (version === state.current.version) setLoading(false); }
  }, [pathname, router]);
  useEffect(() => {
    const requests = state.current; let mounted = true;
    queueMicrotask(() => { if (mounted) void load(); });
    const check = () => { if (document.visibilityState === "visible") void load(); };
    window.addEventListener("focus", check); window.addEventListener("pageshow", check); document.addEventListener("visibilitychange", check);
    const timer = window.setInterval(check, 60_000);
    return () => { mounted = false; requests.version++; window.clearInterval(timer); window.removeEventListener("focus", check); window.removeEventListener("pageshow", check); document.removeEventListener("visibilitychange", check); };
  }, [load]);
  function refresh() { state.current.unavailable = false; if (!state.current.ready) setLoading(true); void load(); }
  async function signOut() { await logout(); state.current.version++; state.current.ready = false; setWorkspace(null); setNotice(""); router.replace("/worker/login"); router.refresh(); }
  if (!workspace) return <div className="zw-gate"><WorkerWordmark /><main className="zw-card">{loading ? <WorkerLoading /> : <><h1>Let’s get you connected.</h1><WorkerAlert message={error || "Please sign in or verify your email to continue."} /><div className="zw-actions"><button type="button" className="zw-button" onClick={refresh}>Try again</button><Link className="zw-button zw-button--secondary" href={workerAccessHref("login", pathname)}>Worker sign in</Link><Link href="/contact">Contact support</Link></div></>}</main></div>;
  return <WorkerContext.Provider key={workspace.user.id} value={{ ...workspace, updateProfile: data => setWorkspace(current => current?.user.id === workspace.user.id ? { ...current, ...data } : current), signOut, notice, refresh }}><WorkerDraftProvider>{children}</WorkerDraftProvider></WorkerContext.Provider>;
}
