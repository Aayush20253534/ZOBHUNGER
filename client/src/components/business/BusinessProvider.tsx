"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { LoaderCircle, LockKeyhole, RefreshCw } from "lucide-react";
import { ApiError } from "@/lib/api";
import { businessDestination, getBusinessWorkspace } from "@/services/business.service";
import { logout } from "@/services/auth.service";
import type { BusinessProfile, BusinessWorkspace } from "@/types/business.types";
import { BusinessWordmark } from "./BusinessUI";

interface BusinessContextValue extends BusinessWorkspace {
  updateProfile: (profile: BusinessProfile) => void;
  signOut: () => Promise<void>;
}
const BusinessContext = createContext<BusinessContextValue | null>(null);

export function useBusiness() {
  const value = useContext(BusinessContext);
  if (!value) throw new Error("BusinessProvider is required");
  return value;
}

export function BusinessProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<BusinessWorkspace | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "forbidden" | "unauthenticated" | "unavailable">("loading");
  const [message, setMessage] = useState("");
  const requests = useRef({ version: 0, unavailable: false });

  const refresh = useCallback(async () => {
    // Focus/visibility events cannot repair missing backend routes. Retry those
    // only when the user asks, instead of flooding the API with the same 404.
    if (requests.current.unavailable) return;
    const current = ++requests.current.version;
    try {
      const response = await getBusinessWorkspace();
      if (current !== requests.current.version) return;
      if (response.data.user.role !== "BUSINESS") throw new ApiError("Use your business account to open this workspace.", 403);
      setWorkspace(response.data); setStatus("ready"); setMessage("");
    } catch (error) {
      if (current !== requests.current.version) return;
      setWorkspace(null);
      if (error instanceof ApiError && error.code === "BUSINESS_API_UNAVAILABLE") {
        requests.current.unavailable = true;
        setStatus("unavailable");
        setMessage(error.message);
      } else if (error instanceof ApiError && error.status === 401) {
        setStatus("unauthenticated");
        router.replace(`/business/login?next=${encodeURIComponent(businessDestination(pathname))}`);
      } else {
        setStatus(error instanceof ApiError && error.status === 403 ? "forbidden" : "error");
        setMessage(error instanceof ApiError ? error.message : "We couldn't load your workspace. Check your connection and try again.");
      }
    }
  }, [pathname, router]);

  useEffect(() => {
    const pending = requests.current;
    let mounted = true;
    queueMicrotask(() => { if (mounted) void refresh(); });
    const recheck = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", recheck);
    window.addEventListener("pageshow", recheck);
    document.addEventListener("visibilitychange", recheck);
    const timer = window.setInterval(recheck, 60_000);
    return () => {
      mounted = false;
      pending.version++;
      window.clearInterval(timer);
      window.removeEventListener("focus", recheck);
      window.removeEventListener("pageshow", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, [refresh]);

  async function signOut() {
    await logout();
    requests.current.version++;
    setWorkspace(null); setStatus("unauthenticated");
    router.replace("/business/login"); router.refresh();
  }

  function retry() {
    requests.current.unavailable = false;
    setStatus("loading");
    void refresh();
  }

  if (status !== "ready" || !workspace) {
    return <div className="zb-biz-gate"><BusinessWordmark /><div className="zb-biz-card">
      {status === "loading" ? <><LoaderCircle className="zb-biz-spin" aria-hidden="true" /><h1>Opening your workspace</h1><p role="status">Checking your business account…</p></> : <>
        <LockKeyhole aria-hidden="true" /><h1>{status === "forbidden" ? "Business access only" : status === "unauthenticated" ? "Please sign in" : status === "unavailable" ? "Business workspace unavailable" : "Let's reconnect"}</h1><p role="alert">{message || "Your session has ended. Sign in to continue."}</p>
        <div className="zb-biz-actions">{(status === "error" || status === "unavailable") && <button className="zb-biz-button" onClick={retry}><RefreshCw aria-hidden="true" />Try again</button>}{status === "unavailable" ? <Link href="/contact" className="zb-biz-button zb-biz-button--secondary">Contact our team</Link> : <><Link href="/business/login" className="zb-biz-button zb-biz-button--secondary">Business sign in</Link><Link href="/login" className="zb-biz-text-link">Other account access</Link></>}</div>
      </>}
    </div></div>;
  }

  return <BusinessContext.Provider value={{ ...workspace, updateProfile: profile => setWorkspace(current => current ? { ...current, profile } : current), signOut }}>{children}</BusinessContext.Provider>;
}
