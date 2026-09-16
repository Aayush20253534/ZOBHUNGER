"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  createPlacementCandidate,
  deletePlacementCandidate,
  listPlacementCandidates,
  updatePlacementCandidate,
  type PlacementCandidate,
  type PlacementCandidateInput,
} from "@/services/placement-candidates.service";

const PAGE_SIZE = 25;
const empty = {
  fullName: "",
  email: "",
  mobileNumber: "",
  qualification: "",
  course: "",
  department: "",
  skills: "",
  interests: "",
  city: "",
  state: "",
  availability: "",
  experience: "",
  preferredWorkTypes: "",
};

type FormState = typeof empty;
const split = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
function toInput(form: FormState): PlacementCandidateInput {
  return {
    ...form,
    skills: split(form.skills),
    interests: split(form.interests),
    preferredWorkTypes: split(form.preferredWorkTypes),
    department: form.department || undefined,
    experience: form.experience || undefined,
  };
}
function fromCandidate(candidate: PlacementCandidate): FormState {
  return {
    fullName: candidate.fullName,
    email: candidate.email,
    mobileNumber: candidate.mobileNumber,
    qualification: candidate.qualification,
    course: candidate.course,
    department: candidate.department ?? "",
    skills: candidate.skills.join(", "),
    interests: candidate.interests.join(", "),
    city: candidate.city,
    state: candidate.state,
    availability: candidate.availability,
    experience: candidate.experience ?? "",
    preferredWorkTypes: candidate.preferredWorkTypes.join(", "),
  };
}

export function PlacementCandidateManager() {
  const [items, setItems] = useState<PlacementCandidate[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await listPlacementCandidates({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        signal,
      });
      setItems(response.data.candidates);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
      if (page > response.data.totalPages) setPage(response.data.totalPages);
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "REQUEST_ABORTED") return;
      setError(cause instanceof ApiError ? cause.message : "Unable to load candidates.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const controller = new AbortController();
    const handle = window.setTimeout(() => void load(controller.signal), 220);
    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [load]);

  const set = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editing) await updatePlacementCandidate(editing, toInput(form));
      else await createPlacementCandidate(toInput(form));
      setForm(empty);
      setEditing(null);
      if (page === 1) await load();
      else setPage(1);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to save candidate.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this candidate record?")) return;
    try {
      await deletePlacementCandidate(id);
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to remove candidate.");
    }
  }

  return <div className="zb-candidate-shell">
    <header className="zb-candidate-toolbar">
      <div>
        <Link href="/placement-portal"><ArrowLeft />Portal dashboard</Link>
        <p className="zb-eyebrow">Candidate management</p>
        <h1>Student & candidate records</h1>
        <p>Add, update and manage candidates belonging to your institution.</p>
      </div>
      <div className="zb-candidate-count"><UserRound /><strong>{total}</strong><span>Total records</span></div>
    </header>

    <div className="zb-candidate-layout">
      <section className="zb-candidate-panel">
        <div className="zb-candidate-panel-title">
          <div><p className="zb-eyebrow">{editing ? "Update record" : "New candidate"}</p><h2>{editing ? "Edit candidate" : "Add candidate"}</h2></div>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }}>Cancel edit</button>}
        </div>
        {error && <p className="zb-login-error">{error}</p>}
        <form className="zb-candidate-form" onSubmit={submit}>
          {([['fullName','Full name'],['email','Email'],['mobileNumber','Mobile number'],['qualification','Qualification'],['course','Course'],['department','Department'],['city','City'],['state','State'],['availability','Availability'],['experience','Experience']] as [keyof FormState,string][]).map(([key,label]) => <label key={key}>{label}{!["department","experience"].includes(key) && <span>*</span>}<input type={key === "email" ? "email" : "text"} value={form[key]} onChange={(event) => set(key,event.target.value)} required={!['department','experience'].includes(key)} /></label>)}
          <label className="zb-candidate-wide">Skills <small>Comma separated</small><input value={form.skills} onChange={(event) => set('skills',event.target.value)} placeholder="Sales, Excel, Communication" /></label>
          <label className="zb-candidate-wide">Interests <small>Comma separated</small><input value={form.interests} onChange={(event) => set('interests',event.target.value)} placeholder="Marketing, Operations" /></label>
          <label className="zb-candidate-wide">Preferred work types <small>Comma separated</small><input value={form.preferredWorkTypes} onChange={(event) => set('preferredWorkTypes',event.target.value)} placeholder="Internship, Part-Time, Remote" /></label>
          <button className="zb-candidate-submit" disabled={busy}><Plus />{busy ? "Saving..." : editing ? "Update candidate" : "Add candidate"}</button>
        </form>
      </section>

      <section className="zb-candidate-panel">
        <div className="zb-candidate-list-head">
          <div><p className="zb-eyebrow">Institution records</p><h2>Candidates</h2></div>
          <label><Search /><input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Search candidates" /></label>
        </div>
        <div className="zb-candidate-list">
          {loading ? <div className="zb-candidate-empty"><UserRound /><strong>Loading candidate records…</strong><span>Fetching this page securely.</span></div>
            : items.length === 0 ? <div className="zb-candidate-empty"><UserRound /><strong>No candidate records found</strong><span>Add the first candidate or adjust your search.</span></div>
            : items.map((candidate) => <article key={candidate.id}>
              <div className="zb-candidate-avatar">{candidate.fullName.slice(0,1).toUpperCase()}</div>
              <div className="zb-candidate-main"><strong>{candidate.fullName}</strong><span>{candidate.course} · {candidate.qualification}</span><span>{candidate.city}, {candidate.state} · {candidate.availability}</span><div>{candidate.skills.slice(0,3).map((skill) => <small key={skill}>{skill}</small>)}</div></div>
              <div className="zb-candidate-row-actions">
                <button onClick={() => { setEditing(candidate.id); setForm(fromCandidate(candidate)); window.scrollTo({top:0,behavior:'smooth'}); }} aria-label={`Edit ${candidate.fullName}`}><Pencil /></button>
                <button onClick={() => void remove(candidate.id)} aria-label={`Delete ${candidate.fullName}`}><Trash2 /></button>
              </div>
            </article>)}
        </div>
        <div className="zb-candidate-list-head" aria-label="Candidate pagination">
          <span>Page {page} of {totalPages} · {total} records</span>
          <div className="zb-candidate-row-actions">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
          </div>
        </div>
      </section>
    </div>
  </div>;
}
