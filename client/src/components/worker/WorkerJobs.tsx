"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, BookmarkCheck, BriefcaseBusiness, CalendarDays, CircleHelp, Clock3, MapPin, Megaphone, Search, SlidersHorizontal, TrendingUp, UsersRound } from "lucide-react";
import { getWorkerJob, getWorkerJobFacets, getWorkerJobs, getWorkerSavedJobs, setWorkerJobSaved } from "@/services/worker.service";
import type { WorkerJob, WorkerJobFacets, WorkerJobList } from "@/types/worker.types";
import { useWorker } from "./WorkerProvider";
import { WorkerAlert, WorkerEmpty, WorkerHeading, WorkerLoading, WorkerProgress, workerError } from "./WorkerUI";

const filters = ["query", "city", "category", "engagementType"] as const;
function RoleIcon({ category }: { category: string }) {
  const key = category.toLowerCase();
  if (key.includes("sales")) return <TrendingUp aria-hidden="true" />;
  if (key.includes("promot") || key.includes("market")) return <Megaphone aria-hidden="true" />;
  if (key.includes("field")) return <MapPin aria-hidden="true" />;
  if (key.includes("recruit") || key.includes("staff")) return <UsersRound aria-hidden="true" />;
  return <BriefcaseBusiness aria-hidden="true" />;
}
function SaveJob({ job, onSaved }: { job: WorkerJob; onSaved: (saved: boolean) => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function toggle() { if (busy) return; setBusy(true); setError(""); try { const response = await setWorkerJobSaved(job.id, !job.saved); onSaved(response.data.saved); } catch (caught) { setError(workerError(caught)); } finally { setBusy(false); } }
  return <div className="zw-save-job"><button type="button" className={`zw-save-button${job.saved ? " is-saved" : ""}`} onClick={toggle} disabled={busy} aria-pressed={job.saved} aria-label={`${job.saved ? "Remove saved job" : "Save job"}: ${job.title}`}>{job.saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}{busy ? "Saving…" : job.saved ? "Saved" : "Save"}</button>{error && <p className="zw-inline-error" role="alert">{error}</p>}</div>;
}
function JobCard({ job, onSaved }: { job: WorkerJob; onSaved: (saved: boolean) => void }) {
  const unavailable = job.available === false;
  return <article className={`zw-job-card${unavailable ? " zw-job-card--unavailable" : ""}`}><div className="zw-job-card-top"><span className="zw-icon"><RoleIcon category={job.category} /></span><span className={`zw-badge${unavailable ? " zw-badge--muted" : ""}`}>{unavailable ? "No longer available" : "Open opportunity"}</span></div><p className="zw-eyebrow">{job.category}</p><h2>{job.slug && !unavailable ? <Link href={`/worker/jobs/${encodeURIComponent(job.slug)}`}>{job.title}</Link> : job.title}</h2><div className="zw-job-meta"><span><MapPin aria-hidden="true" />{job.location}</span><span><Clock3 aria-hidden="true" />{job.engagementType}</span></div><p className="zw-job-description">{job.description}</p>{job.compensation && <p className="zw-job-pay">{job.compensation}</p>}<div className="zw-job-card-bottom">{job.slug && !unavailable ? <Link className="zw-job-link" href={`/worker/jobs/${encodeURIComponent(job.slug)}`}>View role<ArrowUpRight aria-hidden="true" /></Link> : <span className="zw-muted">Saved for your reference</span>}<SaveJob job={job} onSaved={onSaved} /></div></article>;
}
function Filters({ query, facets, apply }: { query: URLSearchParams; facets: WorkerJobFacets; apply: (form: FormEvent<HTMLFormElement>) => void }) {
  return <form className="zw-filters" onSubmit={apply}><label className="zw-field"><span>Search roles</span><span className="zw-search-input"><Search aria-hidden="true" /><input name="query" defaultValue={query.get("query") || ""} maxLength={120} placeholder="Role, skill or keyword" /></span></label>{([{ name: "city", title: "Location", items: facets.cities }, { name: "category", title: "Category", items: facets.categories }, { name: "engagementType", title: "Work type", items: facets.engagementTypes }] as const).map(({ name, title, items }) => {
    const selected = query.get(name) || ""; const options = selected && !items.includes(selected) ? [selected, ...items] : items;
    return <label className="zw-field" key={name}><span>{title}</span><select name={name} defaultValue={selected}><option value="">{name === "category" ? "All categories" : name === "city" ? "All locations" : "All work types"}</option>{options.filter(Boolean).map(item => <option key={item}>{item}</option>)}</select></label>;
  })}<button className="zw-button" type="submit"><Search aria-hidden="true" />Find roles</button><Link className="zw-filter-clear" href="/worker/jobs">Clear filters</Link></form>;
}
export function WorkerJobs({ saved = false }: { saved?: boolean }) {
  const router = useRouter(); const search = useSearchParams(); const { completion, profile } = useWorker();
  const query = new URLSearchParams(); for (const key of [...filters, "page"] as const) { const value = search.get(key)?.trim(); if (value) query.set(key, value); }
  const queryString = query.toString(); const page = Math.max(1, Number(query.get("page")) || 1);
  const [version, setVersion] = useState(0); const key = `${saved}:${queryString}:${version}`;
  const [result, setResult] = useState<{ key: string; data?: WorkerJobList; error?: string } | null>(null);
  const [facets, setFacets] = useState<WorkerJobFacets>({ cities: [], categories: [], engagementTypes: [] });
  useEffect(() => { const controller = new AbortController(); if (!saved) void getWorkerJobFacets(controller.signal).then(response => setFacets(response.data)).catch(() => {}); return () => controller.abort(); }, [saved]);
  useEffect(() => {
    const controller = new AbortController();
    const request = saved ? getWorkerSavedJobs(page, controller.signal) : getWorkerJobs(queryString, controller.signal);
    void request.then(response => { if (!controller.signal.aborted) setResult({ key, data: response.data }); }).catch(caught => { if (!controller.signal.aborted) setResult({ key, error: workerError(caught) }); });
    return () => controller.abort();
  }, [key, page, queryString, saved]);
  function apply(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = new FormData(event.currentTarget); const next = new URLSearchParams(); for (const field of filters) { const value = String(values.get(field) ?? "").trim(); if (value) next.set(field, value); } router.push(`/worker/jobs${next.size ? `?${next}` : ""}`); }
  function pageHref(value: number) { const next = new URLSearchParams(saved ? "" : queryString); next.set("page", String(value)); return `${saved ? "/worker/saved-jobs" : "/worker/jobs"}?${next}`; }
  const current = result?.key === key ? result : null; const data = current?.data;
  return <><div className="zw-jobs-hero"><div><p className="zw-eyebrow">{saved ? "YOUR SHORTLIST" : `YOUR NEXT OPPORTUNITY${profile?.fullName ? `, ${profile.fullName.split(" ")[0].toUpperCase()}` : ""}`}</p><h1>{saved ? "Good roles. Kept close." : "Find work that fits your world."}</h1><p>{saved ? "Come back to the openings you saved. Availability is checked when you open this page." : "Explore published opportunities by location, category and type of work. Save the ones you want to revisit."}</p><div className="zw-hero-tags"><span><MapPin aria-hidden="true" />Your preferred locations</span><span><BriefcaseBusiness aria-hidden="true" />Real published openings</span></div></div><Link className="zw-hero-profile" href="/worker/profile"><span>{completion.percent}%</span><strong>Profile complete</strong><progress max={100} value={completion.percent} aria-label="Profile completion" /><small>Make your skills visible in your profile<ArrowUpRight aria-hidden="true" /></small></Link></div>
    {!saved && <details className="zw-filter-panel" open><summary><SlidersHorizontal aria-hidden="true" />Find your fit<span>Search & filters</span></summary><Filters key={queryString} query={query} facets={facets} apply={apply} /></details>}
    <div className="zw-results-heading"><h2>{saved ? "Your saved openings" : "Explore the opportunities"}</h2><p role="status">{data ? `${data.total} ${data.total === 1 ? "opening" : "openings"}` : ""}</p></div>
    {!current ? <WorkerLoading text="Finding your opportunities…" /> : current.error ? <><WorkerAlert message={current.error} /><button className="zw-button" onClick={() => setVersion(value => value + 1)}>Try again</button></> : data && data.items.length === 0 ? <WorkerEmpty icon={saved ? Bookmark : Search} title={page > data.totalPages ? "This page has no more openings" : saved ? "Keep a role for later" : "No roles match these filters yet"} copy={saved ? "Explore available roles and tap Save on the ones you want to revisit." : "Try a different location or category. Your profile is ready whenever new roles are published."} href={page > data.totalPages ? pageHref(1) : "/worker/jobs"} label={page > data.totalPages ? "Go to the first page" : saved ? "Find roles to save" : "Clear filters"} /> : <div className="zw-jobs-grid">{data?.items.map(job => <JobCard job={job} key={job.id} onSaved={isSaved => { if (saved) setVersion(value => value + 1); else setResult(current => current?.key === key && current.data ? { ...current, data: { ...current.data, items: current.data.items.map(item => item.id === job.id ? { ...item, saved: isSaved } : item) } } : current); }} />)}</div>}
    {data && data.totalPages > 1 && <nav className="zw-pagination" aria-label="Job results pages">{page > 1 ? <Link className="zw-button zw-button--secondary" href={pageHref(page - 1)}><ArrowLeft aria-hidden="true" />Previous</Link> : <span />}<span>Page {page} of {data.totalPages}</span>{page < data.totalPages ? <Link className="zw-button zw-button--secondary" href={pageHref(page + 1)}>Next<ArrowRight aria-hidden="true" /></Link> : <span />}</nav>}
    <div className="zw-help-strip"><CircleHelp aria-hidden="true" /><p>Questions about a role or your profile? Our team can help.</p><Link href="/contact">Talk to us<ArrowUpRight aria-hidden="true" /></Link></div>
  </>;
}
export function WorkerJobDetails({ slug }: { slug: string }) {
  const { completion } = useWorker(); const [result, setResult] = useState<{ slug: string; job?: WorkerJob; error?: string } | null>(null);
  useEffect(() => { const controller = new AbortController(); void getWorkerJob(slug, controller.signal).then(response => { if (!controller.signal.aborted) setResult({ slug, job: response.data }); }).catch(caught => { if (!controller.signal.aborted) setResult({ slug, error: workerError(caught) }); }); return () => controller.abort(); }, [slug]);
  if (result?.slug !== slug) return <WorkerLoading text="Opening role details…" />;
  const job = result.job;
  if (!job) return <><WorkerAlert message={result.error || "This role is unavailable."} /><WorkerEmpty icon={BriefcaseBusiness} title="Let’s find your next option" copy="Openings can close or change. You can explore current roles or revisit your saved list." href="/worker/jobs" label="Browse current openings" /><Link className="zw-text-button" href="/worker/saved-jobs">View saved jobs</Link></>;
  const applyHref = `/jobs/${encodeURIComponent(job.slug!)}#apply`;
  return <><Link className="zw-back" href="/worker/jobs"><ArrowLeft aria-hidden="true" />Back to opportunities</Link><section className="zw-card zw-job-detail-hero"><div className="zw-job-card-top"><span className="zw-icon"><RoleIcon category={job.category} /></span><span className="zw-badge">Open opportunity</span></div><WorkerHeading eyebrow={job.category} title={job.title} copy={job.location} /><div className="zw-job-meta"><span><Clock3 aria-hidden="true" />{job.engagementType}</span>{job.publishedAt && <span><CalendarDays aria-hidden="true" />Published {new Date(job.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</span>}</div><div className="zw-actions"><Link className="zw-button" href={applyHref}>Open application form<ArrowUpRight aria-hidden="true" /></Link><SaveJob job={job} onSaved={saved => setResult(current => current?.job ? { ...current, job: { ...current.job, saved } } : current)} /></div></section><div className="zw-job-detail-layout"><div><section className="zw-card"><h2>About the role</h2><p className="zw-job-copy">{job.description}</p></section>{job.responsibilities.length > 0 && <section className="zw-card"><h2>What you’ll do</h2><ul className="zw-role-list">{job.responsibilities.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}{job.requirements.length > 0 && <section className="zw-card"><h2>What the role needs</h2><ul className="zw-role-list">{job.requirements.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}</div><aside><div className="zw-card zw-role-summary"><p className="zw-eyebrow">ROLE AT A GLANCE</p><h2>The essentials</h2><dl><div><dt>Location</dt><dd>{job.location}</dd></div><div><dt>Category</dt><dd>{job.category}</dd></div><div><dt>Work type</dt><dd>{job.engagementType}</dd></div><div><dt>Compensation</dt><dd>{job.compensation || "Not listed"}</dd></div></dl><Link className="zw-button" href={applyHref}>Continue to application<ArrowRight aria-hidden="true" /></Link></div><WorkerProgress completion={completion} compact /></aside></div></>;
}
