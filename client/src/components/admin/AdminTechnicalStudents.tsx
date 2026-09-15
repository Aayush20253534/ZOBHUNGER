"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Download,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  LoaderCircle,
  MapPin,
  PencilLine,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  UserPlus,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { getTechnicalInstituteAdmin, type TechnicalInstituteAdminRecord } from "@/services/technical-institutes-admin.service";
import {
  createTechnicalStudentAdmin,
  importTechnicalStudentsAdmin,
  listTechnicalStudentsAdmin,
  updateTechnicalStudentAdmin,
  updateTechnicalStudentStatusAdmin,
  type TechnicalStudentImportResult,
  type TechnicalStudentInput,
  type TechnicalStudentListResult,
  type TechnicalStudentRecord,
  type TechnicalStudentStatus,
} from "@/services/technical-students-admin.service";
import "@/styles/admin-technical-students.css";

const opportunityOptions = ["jobs", "internships", "apprenticeships", "training"] as const;

type Draft = Omit<TechnicalStudentInput, "skills" | "certifications" | "preferredLocations"> & {
  skills: string;
  certifications: string;
  preferredLocations: string;
};

const blankDraft: Draft = {
  fullName: "",
  email: "",
  mobileNumber: "",
  enrollmentNumber: "",
  dateOfBirth: "",
  gender: undefined,
  qualification: "iti",
  tradeBranch: "",
  passingYear: "",
  currentSemesterYear: "",
  academicScore: "",
  skills: "",
  certifications: "",
  currentCity: "",
  currentState: "",
  preferredLocations: "",
  preferredOpportunityTypes: ["jobs"],
};

function splitList(value: string) {
  return value.split(/[,;|\n]/).map((item) => item.trim()).filter(Boolean);
}

function toInput(draft: Draft): TechnicalStudentInput {
  return {
    ...draft,
    enrollmentNumber: draft.enrollmentNumber || undefined,
    dateOfBirth: draft.dateOfBirth || undefined,
    currentSemesterYear: draft.currentSemesterYear || undefined,
    academicScore: draft.academicScore || undefined,
    skills: splitList(draft.skills),
    certifications: splitList(draft.certifications),
    preferredLocations: splitList(draft.preferredLocations),
  };
}

function toDraft(record: TechnicalStudentRecord): Draft {
  return {
    fullName: record.fullName,
    email: record.email,
    mobileNumber: record.mobileNumber,
    enrollmentNumber: record.enrollmentNumber ?? "",
    dateOfBirth: record.dateOfBirth?.slice(0, 10) ?? "",
    gender: record.gender as Draft["gender"],
    qualification: record.qualification,
    tradeBranch: record.tradeBranch,
    passingYear: record.passingYear,
    currentSemesterYear: record.currentSemesterYear ?? "",
    academicScore: record.academicScore ?? "",
    skills: record.skills.join(", "),
    certifications: record.certifications.join(", "),
    currentCity: record.currentCity,
    currentState: record.currentState,
    preferredLocations: record.preferredLocations.join(", "),
    preferredOpportunityTypes: record.preferredOpportunityTypes,
  };
}

function statusLabel(status: TechnicalStudentStatus) {
  return status === "PENDING" ? "Pending verification" : status === "VERIFIED" ? "Verified" : "Inactive";
}

function sourceLabel(source: TechnicalStudentRecord["source"]) {
  if (source === "SELF_REGISTRATION") return "Student registration";
  if (source === "BULK_IMPORT") return "Bulk import";
  return "Admin entry";
}

function qualificationLabel(value: string) {
  return value === "iti" ? "ITI" : "Diploma / Polytechnic";
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StudentStatus({ status }: { status: TechnicalStudentStatus }) {
  return <span className="zts-status" data-status={status}>{status === "VERIFIED" ? <BadgeCheck aria-hidden="true" /> : status === "INACTIVE" ? <CircleAlert aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}{statusLabel(status)}</span>;
}

function Summary({ data }: { data: TechnicalStudentListResult }) {
  const cards = [
    ["Registered students", data.summary.counts.total, UsersRound, "neutral"],
    ["Pending verification", data.summary.counts.pending, ShieldCheck, "warning"],
    ["Verified talent", data.summary.counts.verified, BadgeCheck, "success"],
    ["ITI profiles", data.summary.qualifications.find((item) => item.qualification === "iti")?.count ?? 0, Wrench, "technical"],
    ["Diploma profiles", data.summary.qualifications.find((item) => item.qualification === "diploma-polytechnic")?.count ?? 0, GraduationCap, "diploma"],
  ] as const;
  return <div className="zts-summary">{cards.map(([label, value, Icon, tone]) => <article key={label} data-tone={tone}><span><Icon aria-hidden="true" /></span><div><small>{label}</small><strong>{value.toLocaleString("en-IN")}</strong></div></article>)}</div>;
}

function StudentEditor({ record, onClose, onSaved, instituteId }: { record?: TechnicalStudentRecord; onClose: () => void; onSaved: () => void; instituteId: string }) {
  const [draft, setDraft] = useState<Draft>(() => record ? toDraft(record) : { ...blankDraft });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleOpportunity(value: typeof opportunityOptions[number]) {
    setDraft((current) => ({
      ...current,
      preferredOpportunityTypes: current.preferredOpportunityTypes.includes(value)
        ? current.preferredOpportunityTypes.filter((item) => item !== value)
        : [...current.preferredOpportunityTypes, value],
    }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!draft.fullName.trim() || !draft.email.trim() || !draft.mobileNumber.trim() || !draft.tradeBranch.trim() || !/^20\d{2}$/.test(draft.passingYear) || !draft.currentCity.trim() || !draft.currentState.trim() || draft.preferredOpportunityTypes.length === 0) {
      setError("Complete all required student, education and opportunity fields before saving.");
      return;
    }
    setSaving(true);
    try {
      if (record) await updateTechnicalStudentAdmin(instituteId, record.id, toInput(draft));
      else await createTechnicalStudentAdmin(instituteId, toInput(draft));
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save the student record.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="zts-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="zts-editor" onSubmit={save}>
      <header><div><small>{record ? "Edit technical student" : "Manual roster entry"}</small><h2>{record ? record.fullName : "Add student profile"}</h2></div><button type="button" onClick={onClose} aria-label="Close student editor"><X aria-hidden="true" /></button></header>
      {error && <div className="zts-form-error"><CircleAlert aria-hidden="true" />{error}</div>}
      <div className="zts-editor-scroll">
        <section><h3>Student identity</h3><div className="zts-form-grid">
          <label><span>Full name *</span><input value={draft.fullName} onChange={(e) => field("fullName", e.target.value)} /></label>
          <label><span>Email *</span><input type="email" value={draft.email} onChange={(e) => field("email", e.target.value)} /></label>
          <label><span>Mobile number *</span><input value={draft.mobileNumber} onChange={(e) => field("mobileNumber", e.target.value)} /></label>
          <label><span>Enrollment / roll no.</span><input value={draft.enrollmentNumber ?? ""} onChange={(e) => field("enrollmentNumber", e.target.value)} /></label>
          <label><span>Date of birth</span><input type="date" value={draft.dateOfBirth ?? ""} onChange={(e) => field("dateOfBirth", e.target.value)} /></label>
          <label><span>Gender</span><select value={draft.gender ?? ""} onChange={(e) => field("gender", (e.target.value || undefined) as Draft["gender"])}><option value="">Not specified</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer-not-to-say">Prefer not to say</option></select></label>
        </div></section>
        <section><h3>Technical education</h3><div className="zts-form-grid">
          <label><span>Qualification *</span><select value={draft.qualification} onChange={(e) => field("qualification", e.target.value as Draft["qualification"])}><option value="iti">ITI</option><option value="diploma-polytechnic">Diploma / Polytechnic</option></select></label>
          <label><span>Trade / branch *</span><input value={draft.tradeBranch} onChange={(e) => field("tradeBranch", e.target.value)} /></label>
          <label><span>Passing year *</span><input inputMode="numeric" maxLength={4} value={draft.passingYear} onChange={(e) => field("passingYear", e.target.value)} /></label>
          <label><span>Current semester / year</span><input value={draft.currentSemesterYear ?? ""} onChange={(e) => field("currentSemesterYear", e.target.value)} /></label>
          <label><span>Percentage / CGPA</span><input value={draft.academicScore ?? ""} onChange={(e) => field("academicScore", e.target.value)} /></label>
          <label><span>Current city *</span><input value={draft.currentCity} onChange={(e) => field("currentCity", e.target.value)} /></label>
          <label><span>Current state *</span><input value={draft.currentState} onChange={(e) => field("currentState", e.target.value)} /></label>
        </div></section>
        <section><h3>Skills & preferences</h3><div className="zts-form-grid">
          <label className="zts-span-2"><span>Skills</span><textarea rows={2} value={draft.skills} onChange={(e) => field("skills", e.target.value)} placeholder="Separate with commas" /></label>
          <label className="zts-span-2"><span>Certifications</span><textarea rows={2} value={draft.certifications} onChange={(e) => field("certifications", e.target.value)} placeholder="Separate with commas" /></label>
          <label className="zts-span-2"><span>Preferred locations</span><textarea rows={2} value={draft.preferredLocations} onChange={(e) => field("preferredLocations", e.target.value)} placeholder="Separate with commas" /></label>
        </div><div className="zts-opportunity-picker"><span>Interested in *</span><div>{opportunityOptions.map((item) => <label key={item}><input type="checkbox" checked={draft.preferredOpportunityTypes.includes(item)} onChange={() => toggleOpportunity(item)} /><span>{item[0].toUpperCase() + item.slice(1)}</span></label>)}</div></div></section>
      </div>
      <footer><button type="button" className="zts-button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="zts-button-primary" disabled={saving}>{saving && <LoaderCircle className="zts-spin" aria-hidden="true" />}{record ? "Save student" : "Add to roster"}</button></footer>
    </form>
  </div>;
}

function BulkImport({ instituteId, onImported }: { instituteId: string; onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<TechnicalStudentImportResult | null>(null);
  const [busy, setBusy] = useState<"validate" | "import" | "">("");
  const [error, setError] = useState("");

  function downloadTemplate() {
    const headers = ["Full Name", "Email", "Mobile Number", "Enrollment Number", "Date of Birth", "Gender", "Qualification", "Trade / Branch", "Passing Year", "Current Semester / Year", "Percentage / CGPA", "Skills", "Certifications", "Current City", "Current State", "Preferred Locations", "Interested In"];
    const example = ["Aman Kumar", "aman@example.com", "9876543210", "ITI2026001", "2006-03-14", "Male", "ITI", "Electrician", "2026", "Final Year", "78%", "Industrial wiring, PLC basics", "NCVT", "Prayagraj", "Uttar Pradesh", "Noida, Gurugram", "Jobs, Apprenticeships"];
    const csv = [headers, example].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "zobhunger-technical-students-template.csv"; link.click(); URL.revokeObjectURL(url);
  }

  async function run(mode: "validate" | "import") {
    if (!file) return;
    setBusy(mode); setError("");
    try {
      const response = await importTechnicalStudentsAdmin(instituteId, file, mode);
      setResult(response.data);
      if (mode === "import") onImported();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to process the student file.");
    } finally { setBusy(""); }
  }

  function downloadErrors() {
    if (!result?.errors.length) return;
    const rows = [["Row", "Field", "Message"], ...result.errors.map((item) => [String(item.row), item.field ?? "row", item.message])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "zobhunger-technical-student-import-errors.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return <section className="zts-import-card">
    <header><div><span><FileSpreadsheet aria-hidden="true" /></span><div><small>Excel / CSV onboarding</small><h2>Bulk student import</h2></div></div><button type="button" onClick={downloadTemplate}><Download aria-hidden="true" />Download template</button></header>
    <p>Upload an Excel <strong>.xlsx</strong> workbook or CSV using the template columns. The server validates every row before anything is added to the institute roster.</p>
    <input ref={inputRef} type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden onChange={(event) => { const next = event.target.files?.[0] ?? null; setFile(next); setResult(null); setError(""); }} />
    <div className="zts-import-drop"><button type="button" onClick={() => inputRef.current?.click()}><Upload aria-hidden="true" />{file ? "Choose another file" : "Choose student file"}</button><div><strong>{file?.name ?? "No file selected"}</strong><span>{file ? `${(file.size / 1024).toFixed(1)} KB · ready to validate` : "Maximum 1,000 student rows per file · up to 5 MB"}</span></div>{file && <button type="button" className="zts-analyze" onClick={() => void run("validate")} disabled={Boolean(busy)}>{busy === "validate" ? <LoaderCircle className="zts-spin" aria-hidden="true" /> : <Search aria-hidden="true" />}Analyze file</button>}</div>
    {error && <div className="zts-form-error"><CircleAlert aria-hidden="true" />{error}</div>}
    {result && <div className="zts-import-result">
      <div className="zts-import-metrics"><span><small>Rows found</small><strong>{result.totalRows}</strong></span><span><small>Ready</small><strong>{result.validRows}</strong></span><span><small>Needs correction</small><strong>{result.errorRows}</strong></span>{typeof result.existingRows === "number" && <span><small>Already registered</small><strong>{result.existingRows}</strong></span>}{typeof result.importedRows === "number" && <span><small>Imported</small><strong>{result.importedRows}</strong></span>}</div>
      {result.preview && result.preview.length > 0 && <div className="zts-import-preview"><div className="zts-import-preview-head"><div><small>Validated preview</small><strong>First {result.preview.length} import-ready profiles</strong></div><span>Nothing is saved until you confirm import.</span></div><div className="zts-import-preview-list">{result.preview.map((student, index) => <span key={`${student.email}-${index}`}><b>{student.fullName}</b><i>{student.qualification === "iti" ? "ITI" : "Diploma"} · {student.tradeBranch}</i><em>{student.passingYear} · {student.currentCity}</em></span>)}</div></div>}
      {result.errors.length > 0 && <details><summary><CircleAlert aria-hidden="true" />Review {result.errors.length} validation message{result.errors.length === 1 ? "" : "s"}<ChevronDown aria-hidden="true" /></summary><div className="zts-import-errors">{result.errors.slice(0, 25).map((item, index) => <span key={`${item.row}-${item.field}-${index}`}><b>Row {item.row}</b><i>{item.field ?? "row"}</i>{item.message}</span>)}</div><button type="button" className="zts-error-download" onClick={downloadErrors}><Download aria-hidden="true" />Download error report</button></details>}
      {result.mode === "validate" && result.canImport && <div className="zts-import-ready"><CheckCircle2 aria-hidden="true" /><div><strong>{result.validRows} new student records are ready.</strong><span>Rows with validation errors or existing institute records will be skipped.</span></div><button type="button" onClick={() => void run("import")} disabled={Boolean(busy)}>{busy === "import" ? <LoaderCircle className="zts-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}Import valid students</button></div>}
      {result.mode === "import" && <div className="zts-import-complete"><BadgeCheck aria-hidden="true" /><div><strong>Bulk onboarding completed.</strong><span>{result.importedRows ?? 0} students added · {result.skippedRows ?? 0} rows skipped.</span></div></div>}
    </div>}
  </section>;
}

export function AdminTechnicalStudents({ instituteId }: { instituteId: string }) {
  const [institute, setInstitute] = useState<TechnicalInstituteAdminRecord | null>(null);
  const [data, setData] = useState<TechnicalStudentListResult | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TechnicalStudentStatus | "">("");
  const [qualification, setQualification] = useState<"" | "iti" | "diploma-polytechnic">("");
  const [passingYear, setPassingYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<{ record?: TechnicalStudentRecord } | null>(null);
  const [changing, setChanging] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const instituteResponse = await getTechnicalInstituteAdmin(instituteId);
      setInstitute(instituteResponse.data);
      if (instituteResponse.data.status !== "APPROVED" || !instituteResponse.data.partnershipCode) {
        setData(null);
        setError("Approve this institute partnership before building its technical student roster.");
        return;
      }
      const rosterResponse = await listTechnicalStudentsAdmin(instituteId, { page, pageSize: 25, search: search || undefined, status, qualification, passingYear: passingYear || undefined });
      setData(rosterResponse.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load the technical student roster.");
    } finally { setLoading(false); }
  }, [instituteId, page, search, status, qualification, passingYear]);

  useEffect(() => { void load(); }, [load]);

  const hasFilters = Boolean(search || status || qualification || passingYear);
  const publicRegistrationUrl = useMemo(() => institute?.partnershipCode ? `/iti-polytechnic-cell/student-registration?code=${encodeURIComponent(institute.partnershipCode)}` : "/iti-polytechnic-cell/student-registration", [institute?.partnershipCode]);

  async function changeStatus(student: TechnicalStudentRecord, next: TechnicalStudentStatus) {
    setChanging(student.id); setError(""); setNotice("");
    try {
      await updateTechnicalStudentStatusAdmin(instituteId, student.id, next);
      setNotice(`${student.fullName} is now ${statusLabel(next).toLowerCase()}.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update the student status.");
    } finally { setChanging(null); }
  }

  function applyFilters(event: React.FormEvent) { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }
  function clearFilters() { setPage(1); setSearchInput(""); setSearch(""); setStatus(""); setQualification(""); setPassingYear(""); }

  if (loading && !data) return <div className="zts-page"><div className="zts-loading"><LoaderCircle className="zts-spin" aria-hidden="true" /><strong>Loading technical talent roster</strong><span>Retrieving institute students and verification status.</span></div></div>;
  if (!institute) return <div className="zts-page"><div className="zts-alert"><CircleAlert aria-hidden="true" /><span>{error || "The technical institute could not be loaded."}</span><Link href="/admin/technical-institutes">Back to institutes</Link></div></div>;
  if (institute.status !== "APPROVED" || !institute.partnershipCode) return <div className="zts-page"><nav className="zts-nav"><Link href={`/admin/technical-institutes/${institute.id}`}><ArrowLeft aria-hidden="true" />Institute record</Link></nav><div className="zts-approval-required"><ShieldCheck aria-hidden="true" /><div><small>Student roster locked</small><h1>Approve the institute partnership first.</h1><p>Student self-registration, manual onboarding and Excel imports are enabled only after an ITI or Polytechnic institute has a verified partnership code.</p><Link href={`/admin/technical-institutes/${institute.id}`}>Return to partnership review</Link></div></div></div>;

  return <div className="zts-page">
    <nav className="zts-nav"><Link href={`/admin/technical-institutes/${institute.id}`}><ArrowLeft aria-hidden="true" />Institute record</Link><a href={publicRegistrationUrl} target="_blank" rel="noreferrer">Student registration page</a></nav>
    <header className="zts-hero"><div className="zts-identity"><span><UsersRound aria-hidden="true" /></span><div><small>Technical talent roster</small><h1>{institute.institutionName}</h1><p><MapPin aria-hidden="true" />{institute.city}, {institute.state} · {institute.partnershipCode}</p></div></div><div className="zts-hero-actions"><button type="button" onClick={() => setEditor({})}><UserPlus aria-hidden="true" />Add student</button><button type="button" className="zts-refresh" onClick={() => void load()} disabled={loading}><RefreshCw aria-hidden="true" />Refresh</button></div></header>
    {error && <div className="zts-alert"><CircleAlert aria-hidden="true" /><span>{error}</span></div>}
    {notice && <div className="zts-notice"><CheckCircle2 aria-hidden="true" /><span>{notice}</span></div>}
    {data && <Summary data={data} />}

    <BulkImport instituteId={instituteId} onImported={() => { setNotice("Student file imported successfully."); void load(); }} />

    <section className="zts-roster-card">
      <header><div><small>Student records</small><h2>Institute technical talent pool</h2></div><span>{data?.total ?? 0} record{data?.total === 1 ? "" : "s"}</span></header>
      <form className="zts-filters" onSubmit={applyFilters}>
        <label className="zts-search"><span>Search</span><div><Search aria-hidden="true" /><input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Name, email, mobile, roll no. or trade" /></div></label>
        <label><span>Status</span><select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as typeof status); }}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="VERIFIED">Verified</option><option value="INACTIVE">Inactive</option></select></label>
        <label><span>Qualification</span><select value={qualification} onChange={(e) => { setPage(1); setQualification(e.target.value as typeof qualification); }}><option value="">All qualifications</option><option value="iti">ITI</option><option value="diploma-polytechnic">Diploma / Polytechnic</option></select></label>
        <label><span>Passing year</span><input inputMode="numeric" maxLength={4} value={passingYear} onChange={(e) => { setPage(1); setPassingYear(e.target.value); }} placeholder="2026" /></label>
        <button className="zts-filter-apply" type="submit"><Filter aria-hidden="true" />Apply</button>{hasFilters && <button className="zts-filter-clear" type="button" onClick={clearFilters}>Clear</button>}
      </form>

      <div className="zts-roster">
        {data?.items.map((student) => <article className="zts-student" key={student.id}>
          <div className="zts-student-primary"><span>{student.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div><div><h3>{student.fullName}</h3><StudentStatus status={student.status} /></div><p>{student.email} · {student.mobileNumber}</p></div></div>
          <div className="zts-student-cell"><small>Technical profile</small><strong>{qualificationLabel(student.qualification)} · {student.tradeBranch}</strong><span>{student.currentSemesterYear || `Passing ${student.passingYear}`} {student.academicScore ? `· ${student.academicScore}` : ""}</span></div>
          <div className="zts-student-cell"><small>Location</small><strong>{student.currentCity}, {student.currentState}</strong><span>{student.preferredLocations.length ? `Prefers ${student.preferredLocations.slice(0, 2).join(", ")}` : "No preferred location saved"}</span></div>
          <div className="zts-student-cell"><small>Source</small><strong>{sourceLabel(student.source)}</strong><span>{student.enrollmentNumber || "No enrollment number"} · {dateLabel(student.createdAt)}</span></div>
          <div className="zts-student-actions"><button type="button" onClick={() => setEditor({ record: student })}><PencilLine aria-hidden="true" />Edit</button>{student.status !== "VERIFIED" && <button type="button" disabled={changing === student.id} onClick={() => void changeStatus(student, "VERIFIED")}><BadgeCheck aria-hidden="true" />Verify</button>}{student.status !== "INACTIVE" && <button type="button" className="zts-deactivate" disabled={changing === student.id} onClick={() => void changeStatus(student, "INACTIVE")}>Deactivate</button>}</div>
        </article>)}
        {data && data.items.length === 0 && <div className="zts-empty"><UsersRound aria-hidden="true" /><strong>No student records match this view.</strong><span>{hasFilters ? "Clear or change the filters." : "Add a student manually, share the registration link, or upload an Excel roster."}</span></div>}
      </div>
      {data && data.totalPages > 1 && <div className="zts-pagination"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}><ArrowLeft aria-hidden="true" />Previous</button><span>Page {data.page} of {data.totalPages}</span><button type="button" disabled={page >= data.totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next<ArrowRight aria-hidden="true" /></button></div>}
    </section>

    {editor && <StudentEditor instituteId={instituteId} record={editor.record} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); setNotice(editor?.record ? "Student record updated." : "Student added to the verified roster."); void load(); }} />}
  </div>;
}
