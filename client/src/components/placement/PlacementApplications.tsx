"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, ChevronLeft, ChevronRight, FileCheck2, Search } from "lucide-react";
import { ApiError } from "@/lib/api";
import { listPlacementApplications, type PlacementOpportunityApplication } from "@/services/placement-opportunities.service";

const statuses = ["SUBMITTED", "REVIEWED", "SHORTLISTED", "REJECTED"] as const;
const PAGE_SIZE = 30;

export function PlacementApplications() {
  const [items, setItems] = useState<PlacementOpportunityApplication[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      listPlacementApplications({
        search: search || undefined,
        status: status || undefined,
        page,
        pageSize: PAGE_SIZE,
        signal: controller.signal,
      }).then((response) => {
        setItems(response.data.applications);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      }).catch((cause) => {
        if (cause instanceof ApiError && cause.code === "REQUEST_ABORTED") return;
        setError(cause instanceof ApiError ? cause.message : "Unable to load applications.");
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search, status, page]);

  return <div className="zb-placement-opportunity-shell">
    <header className="zb-candidate-toolbar">
      <div>
        <Link href="/placement-portal"><ArrowLeft />Portal dashboard</Link>
        <p className="zb-eyebrow">Application tracking</p>
        <h1>Candidate applications</h1>
        <p>Track candidate submissions and current opportunity status from one workspace.</p>
      </div>
      <Link className="zb-placement-secondary-link" href="/placement-portal/opportunities"><BriefcaseBusiness />View opportunities</Link>
    </header>

    {error && <p className="zb-login-error">{error}</p>}
    <section className="zb-opportunity-filterbar">
      <label><Search /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search candidate or opportunity" /></label>
      <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
        <option value="">All application statuses</option>
        {statuses.map((value) => <option key={value}>{value.replaceAll("_", " ")}</option>)}
      </select>
      <span>{loading ? "Loading…" : `${total} applications`}</span>
    </section>

    <div className="zb-placement-application-list">
      {!loading && items.length === 0 ? <div className="zb-candidate-empty"><FileCheck2 /><strong>No applications found</strong><span>Submit a candidate from the Opportunities page to begin tracking.</span></div> : items.map((application) => <article key={application.id}>
        <div>
          <span className={`zb-placement-status zb-placement-status-${application.status.toLowerCase()}`}>{application.status.replaceAll("_", " ")}</span>
          <h2>{application.placementCandidate?.fullName ?? "Candidate"}</h2>
          <p>{application.placementCandidate?.course} · {application.placementCandidate?.qualification}</p>
        </div>
        <div><strong>{application.job.title}</strong><span>{application.job.engagementType} · {application.job.location}</span><small>Opportunity: {application.job.status}</small></div>
        <time dateTime={application.createdAt}>{new Date(application.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>
      </article>)}
    </div>

    {totalPages > 1 && <nav className="zb-placement-pagination" aria-label="Application pages">
      <button type="button" disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft />Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next<ChevronRight /></button>
    </nav>}
  </div>;
}
