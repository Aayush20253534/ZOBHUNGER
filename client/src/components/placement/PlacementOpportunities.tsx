"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, ChevronLeft, ChevronRight, MapPin, Search, Send, UsersRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import { listPlacementCandidates, type PlacementCandidate } from "@/services/placement-candidates.service";
import { listPlacementOpportunities, submitCandidateForOpportunity, type PlacementOpportunity } from "@/services/placement-opportunities.service";

const PAGE_SIZE = 12;
const CANDIDATE_PAGE_SIZE = 25;

export function PlacementOpportunities() {
  const [items, setItems] = useState<PlacementOpportunity[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [opportunityTypes, setOpportunityTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState("");
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidateResults, setCandidateResults] = useState<PlacementCandidate[]>([]);
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      listPlacementOpportunities({
        search: search || undefined,
        opportunityType: type || undefined,
        page,
        pageSize: PAGE_SIZE,
        signal: controller.signal,
      }).then((response) => {
        setItems(response.data.opportunities);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
        setOpportunityTypes(response.data.opportunityTypes);
      }).catch((cause) => {
        if (cause instanceof ApiError && cause.code === "REQUEST_ABORTED") return;
        setError(cause instanceof ApiError ? cause.message : "Unable to load opportunities.");
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search, type, page]);

  useEffect(() => {
    if (!selectedJob) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setCandidateLoading(true);
      listPlacementCandidates({
        page: 1,
        pageSize: CANDIDATE_PAGE_SIZE,
        search: candidateQuery || undefined,
        signal: controller.signal,
      }).then((response) => {
        setCandidateResults(response.data.candidates);
        setCandidateTotal(response.data.total);
      }).catch((cause) => {
        if (cause instanceof ApiError && cause.code === "REQUEST_ABORTED") return;
        setError(cause instanceof ApiError ? cause.message : "Unable to search candidates.");
      }).finally(() => {
        if (!controller.signal.aborted) setCandidateLoading(false);
      });
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [selectedJob, candidateQuery]);

  async function submit(jobId: string) {
    if (!candidateId) {
      setError("Select a candidate before submitting.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await submitCandidateForOpportunity(jobId, candidateId, message || undefined);
      setSuccess(`${response.data.application.placementCandidate?.fullName ?? "Candidate"} submitted successfully.`);
      setSelectedJob(null);
      setCandidateId("");
      setCandidateQuery("");
      setCandidateResults([]);
      setCandidateTotal(0);
      setCandidateLoading(false);
      setMessage("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to submit candidate.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="zb-placement-opportunity-shell">
    <header className="zb-candidate-toolbar">
      <div>
        <Link href="/placement-portal"><ArrowLeft />Portal dashboard</Link>
        <p className="zb-eyebrow">Opportunity matching</p>
        <h1>Jobs, internships & flexible opportunities</h1>
        <p>Match institution candidates with currently open ZOBHUNGER opportunities.</p>
      </div>
      <Link className="zb-placement-secondary-link" href="/placement-portal/applications">Track applications</Link>
    </header>

    {error && <p className="zb-login-error">{error}</p>}
    {success && <p className="zb-placement-success"><CheckCircle2 />{success}</p>}

    <section className="zb-opportunity-filterbar">
      <label><Search /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search title, location or category" /></label>
      <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
        <option value="">All opportunity types</option>
        {opportunityTypes.map((value) => <option value={value} key={value}>{value}</option>)}
      </select>
      <span>{loading ? "Loading…" : `${total} open`}</span>
    </section>

    <div className="zb-opportunity-grid">
      {!loading && items.length === 0 ? <div className="zb-candidate-empty"><BriefcaseBusiness /><strong>No matching opportunities</strong><span>Adjust the filters or check again when new roles are published.</span></div> : items.map((job) => <article className="zb-opportunity-card" key={job.id}>
        <div className="zb-opportunity-card-top"><span>{job.engagementType}</span><small>{job.category}</small></div>
        <h2>{job.title}</h2>
        <p className="zb-opportunity-location"><MapPin />{job.location}</p>
        <p>{job.description}</p>
        {job.compensation && <strong className="zb-opportunity-pay">{job.compensation}</strong>}
        <button onClick={() => {
          const next = selectedJob === job.id ? null : job.id;
          setSelectedJob(next);
          setCandidateId("");
          setCandidateQuery("");
          setCandidateResults([]);
          setCandidateTotal(0);
          setCandidateLoading(false);
          setError(null);
          setSuccess(null);
        }}><UsersRound />Match a candidate</button>
        {selectedJob === job.id && <div className="zb-opportunity-submit-panel">
          <label>Find candidate
            <input value={candidateQuery} onChange={(event) => { setCandidateQuery(event.target.value); setCandidateId(""); }} placeholder="Search name, email, course or city" />
            <small>{candidateLoading ? "Searching…" : candidateTotal > CANDIDATE_PAGE_SIZE ? `Showing ${candidateResults.length} of ${candidateTotal}. Type to narrow the list.` : `${candidateTotal} candidate${candidateTotal === 1 ? "" : "s"} found.`}</small>
          </label>
          <label>Candidate
            <select value={candidateId} onChange={(event) => setCandidateId(event.target.value)} disabled={candidateLoading}>
              <option value="">Select candidate</option>
              {candidateResults.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.fullName} · {candidate.course}</option>)}
            </select>
          </label>
          <label>Note <span>Optional</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add a short note for the opportunity team." /></label>
          <button disabled={busy || !candidateId} onClick={() => void submit(job.id)}><Send />{busy ? "Submitting..." : "Submit candidate"}</button>
        </div>}
      </article>)}
    </div>

    {totalPages > 1 && <nav className="zb-placement-pagination" aria-label="Opportunity pages">
      <button type="button" disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft />Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next<ChevronRight /></button>
    </nav>}
  </div>;
}
