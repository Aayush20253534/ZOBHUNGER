"use client";

import Link from "next/link";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, CircleAlert, FileSpreadsheet, PencilLine, RefreshCw, Search, Upload, UserPlus, UserRoundCheck, UsersRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import { TechnicalInstitutePortalStudentEditor } from "./TechnicalInstitutePortalStudentEditor";
import {
  getTechnicalInstitutePortalProfile,
  importTechnicalInstitutePortalStudents,
  listTechnicalInstitutePortalStudents,
  setTechnicalInstitutePortalStudentStatus,
  type TechnicalInstitutePortalProfile,
  type TechnicalPortalStudent,
  type TechnicalPortalStudentSummary,
  type TechnicalStudentStatus,
} from "@/services/technical-institute-portal.service";

const label = (value: string) => value.replaceAll("-", " ").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export function TechnicalInstitutePortalStudents() {
  const [profile, setProfile] = useState<TechnicalInstitutePortalProfile | null>(null);
  const [items, setItems] = useState<TechnicalPortalStudent[]>([]);
  const [summary, setSummary] = useState<TechnicalPortalStudentSummary | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TechnicalStudentStatus | "">("");
  const [qualification, setQualification] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<{ totalRows: number; validRows: number; errorRows: number; existingRows?: number; errors: Array<{ row: number; field?: string; message: string }> } | null>(null);
  const [importing, setImporting] = useState(false);
  const [editor, setEditor] = useState<{ student?: TechnicalPortalStudent } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [students, profileResponse] = await Promise.all([
        listTechnicalInstitutePortalStudents({ page, pageSize: 25, search: search || undefined, status, qualification }),
        profile ? Promise.resolve(null) : getTechnicalInstitutePortalProfile(),
      ]);
      setItems(students.data.items); setSummary(students.data.summary); setTotalPages(students.data.totalPages); setTotal(students.data.total);
      if (profileResponse) setProfile(profileResponse.data.profile);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to load the student roster.");
    } finally { setLoading(false); }
  }, [search, status, qualification, profile, page]);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(student: TechnicalPortalStudent, next: TechnicalStudentStatus) {
    setError(""); setNotice("");
    try {
      await setTechnicalInstitutePortalStudentStatus(student.id, next);
      setNotice(`${student.fullName} updated to ${label(next)}.`);
      await load();
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to update student status."); }
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    setFile(next); setValidation(null); setNotice(""); setError("");
  }

  async function processFile(mode: "validate" | "import") {
    if (!file) return;
    setImporting(true); setError(""); setNotice("");
    try {
      const response = await importTechnicalInstitutePortalStudents(file, mode);
      if (mode === "validate") {
        setValidation(response.data);
        setNotice(response.data.validRows ? `${response.data.validRows} valid new student rows are ready to import.` : "No new valid rows are ready to import.");
      } else {
        setValidation(null); setFile(null); setNotice(`${response.data.importedRows ?? 0} student records imported successfully.`); await load();
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to process the student file."); }
    finally { setImporting(false); }
  }

  const registrationUrl = useMemo(() => profile ? `/iti-polytechnic-cell/student-registration?code=${encodeURIComponent(profile.partnershipCode)}` : "/iti-polytechnic-cell/student-registration", [profile]);

  return <div className="zti-portal-shell">
    <header className="zti-portal-subhero"><div><Link href="/technical-institute-portal"><ArrowLeft />Portal dashboard</Link><small>Student roster</small><h1>Technical talent management</h1><p>Verify student profiles, keep the institute roster current and onboard batches without manual spreadsheet chaos.</p></div><div className="zti-portal-subhero-actions"><button type="button" onClick={() => setEditor({})}><UserPlus />Add student</button><Link href={registrationUrl} target="_blank">Student registration link</Link><button type="button" onClick={() => void load()} disabled={loading}><RefreshCw />Refresh</button></div></header>

    {error && <div className="zti-portal-alert"><CircleAlert />{error}</div>}{notice && <div className="zti-portal-notice"><BadgeCheck />{notice}</div>}

    {summary && <section className="zti-portal-mini-metrics"><article><strong>{summary.counts.total}</strong><span>Total profiles</span></article><article><strong>{summary.counts.verified}</strong><span>Verified</span></article><article><strong>{summary.counts.pending}</strong><span>Pending</span></article><article><strong>{summary.counts.inactive}</strong><span>Inactive</span></article></section>}

    <section className="zti-portal-card zti-portal-import">
      <div><span><FileSpreadsheet /></span><div><small>Batch onboarding</small><h2>Excel / CSV student import</h2><p>Validate the file first. Existing emails or enrollment numbers are skipped before anything is written.</p></div></div>
      <div className="zti-portal-import-actions"><label><Upload /><span>{file?.name ?? "Choose .xlsx or .csv"}</span><input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={selectFile} /></label><button disabled={!file || importing} onClick={() => void processFile("validate")}>{importing ? "Checking…" : "Validate file"}</button>{validation?.validRows ? <button className="primary" disabled={importing} onClick={() => void processFile("import")}>Import {validation.validRows} valid rows</button> : null}</div>
      {validation && <div className="zti-portal-import-result"><strong>{validation.totalRows} rows checked · {validation.validRows} valid · {validation.errorRows} error rows{validation.existingRows ? ` · ${validation.existingRows} existing` : ""}</strong>{validation.errors.length ? <ul>{validation.errors.slice(0, 8).map((item, index) => <li key={`${item.row}-${item.field}-${index}`}>Row {item.row}{item.field ? ` · ${item.field}` : ""}: {item.message}</li>)}</ul> : <p>No row-level errors found.</p>}</div>}
    </section>

    <section className="zti-portal-card">
      <div className="zti-portal-list-head"><div><small>Institute roster</small><h2>Students</h2></div><div className="zti-portal-filters"><label><Search /><input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Name, trade, email or city" /></label><select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as TechnicalStudentStatus | ""); }}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="VERIFIED">Verified</option><option value="INACTIVE">Inactive</option></select><select value={qualification} onChange={(event) => { setPage(1); setQualification(event.target.value); }}><option value="">All qualifications</option><option value="iti">ITI</option><option value="diploma-polytechnic">Diploma / Polytechnic</option></select></div></div>
      {loading ? <div className="zti-portal-empty"><UsersRound /><strong>Loading student roster…</strong></div> : items.length ? <div className="zti-portal-student-list">{items.map((student) => <article key={student.id}><span className="zti-portal-avatar">{student.fullName.slice(0, 1).toUpperCase()}</span><div className="main"><div><strong>{student.fullName}</strong><span className="zti-portal-status" data-status={student.status}>{label(student.status)}</span></div><p>{student.tradeBranch} · {label(student.qualification)} · {student.passingYear}</p><small>{student.email} · {student.currentCity}, {student.currentState}</small><div className="chips">{student.skills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}</div></div><div className="actions"><button className="muted" onClick={() => setEditor({ student })}><PencilLine />Edit</button>{student.status !== "VERIFIED" && <button onClick={() => void updateStatus(student, "VERIFIED")}><UserRoundCheck />Verify</button>}{student.status !== "INACTIVE" && <button className="muted" onClick={() => void updateStatus(student, "INACTIVE")}>Deactivate</button>}{student.status === "INACTIVE" && <button className="muted" onClick={() => void updateStatus(student, "PENDING")}>Restore</button>}</div></article>)}</div> : <div className="zti-portal-empty"><UsersRound /><strong>No students match these filters</strong><p>Use the institute registration link or import a batch to build the technical roster.</p></div>}
      <div className="zti-portal-pagination"><span>{total.toLocaleString("en-IN")} students · Page {page} of {totalPages}</span><div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button></div></div>
    </section>
    {editor && <TechnicalInstitutePortalStudentEditor student={editor.student} onClose={() => setEditor(null)} onSaved={(message) => { setEditor(null); setNotice(message); void load(); }} />}
  </div>;
}
