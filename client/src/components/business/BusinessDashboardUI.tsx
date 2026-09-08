"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CircleAlert, LockKeyhole, RefreshCw } from "lucide-react";
import { ApiError, type ApiSuccessEnvelope } from "@/lib/api";
import type { RequirementStatus, RequirementSummary } from "@/types/business-dashboard.types";

export const statusInfo: Record<RequirementStatus, { label: string; color: string; description: string }> = {
  NEW: { label: "New", color: "#c8202f", description: "Submitted and awaiting initial review by our team." },
  CONTACTED: { label: "Contacted", color: "#a66b13", description: "Our team has recorded a contact update for this request." },
  QUALIFIED: { label: "Qualified", color: "#27745f", description: "The request has been marked qualified after review." },
  CLOSED: { label: "Closed", color: "#796a80", description: "This request has been closed. This status does not confirm hiring or deployment." },
};
export const count = (value: number) => new Intl.NumberFormat("en-IN").format(value);
export function businessDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } as const : {}),
  }).format(new Date(value));
}
export function requirementLocations(item: Pick<RequirementSummary, "locations" | "jobLocation">) {
  const seen = new Set<string>();
  return [...item.locations, item.jobLocation].map(place => place.trim().replace(/\s+/g, " ")).filter(place => {
    const key = place.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}
export function StatusBadge({ status }: { status: RequirementStatus }) {
  return <span className="zb-dash-status" data-status={status}><span aria-hidden="true" />{statusInfo[status].label}</span>;
}

/** A response belongs to both its account and query. Old requests cannot reveal
 * a previous account's data or replace a more recent filter's response. */
export function useBusinessResource<T>(key: string, request: (signal: AbortSignal) => Promise<ApiSuccessEnvelope<T>>, scope = key) {
  const [resource, setResource] = useState<{ key: string; scope: string; data?: T; error?: Error } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void request(controller.signal).then(response => {
      if (!controller.signal.aborted) setResource({ key, scope, data: response.data });
    }).catch(error => {
      if (!controller.signal.aborted) setResource({ key, scope, error: error instanceof Error ? error : new Error("Check your connection and try again.") });
    });
    return () => controller.abort();
  }, [key, request, scope]);
  return { loading: resource?.key !== key, data: resource?.key === key ? resource.data : undefined,
    previousData: resource?.scope === scope ? resource.data : undefined,
    error: resource?.key === key ? resource.error : undefined };
}

export function DashboardLoading({ detail = false }: { detail?: boolean }) {
  return <div className="zb-dash-loading" role="status" aria-label={detail ? "Loading requirement brief" : "Loading business dashboard"}>
    <p className="zb-dash-sr-only">{detail ? "Loading requirement brief…" : "Loading your company’s dashboard…"}</p>
    <div className="zb-dash-metrics" aria-hidden="true">{[1, 2, 3, 4].map(key => <div className="zb-dash-skeleton zb-dash-skeleton--metric" key={key} />)}</div>
    <div className="zb-dash-chart-grid" aria-hidden="true"><div className="zb-dash-skeleton" /><div className="zb-dash-skeleton" /></div>
  </div>;
}

export function DashboardError({ error, retry, next }: { error: Error; retry: () => void; next: string }) {
  const expired = error instanceof ApiError && error.status === 401;
  const forbidden = error instanceof ApiError && error.status === 403;
  const missing = error instanceof ApiError && error.code === "REQUIREMENT_NOT_FOUND";
  return <section className="zb-biz-card zb-dash-error" role="alert">
    <span className="zb-biz-icon">{expired || forbidden ? <LockKeyhole aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}</span>
    <h2>{expired ? "Your session has ended" : forbidden ? "Use your business account" : missing ? "Requirement unavailable" : "We couldn’t load this view"}</h2>
    <p>{missing ? "This request is not available in your business account. Open your dashboard to see your requirements." : error.message}</p>
    <div className="zb-biz-actions">{expired || forbidden ? <Link className="zb-biz-button" href={`/business/login?next=${encodeURIComponent(next)}`}>Business sign in</Link> : !missing && <button className="zb-biz-button" onClick={retry}><RefreshCw aria-hidden="true" />Try again</button>}
      {missing ? <Link className="zb-biz-text-link" href="/business/dashboard"><ArrowLeft aria-hidden="true" />Back to dashboard</Link> : <Link className="zb-biz-text-link" href="/contact">Contact our team</Link>}</div>
  </section>;
}
