"use client";

import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Banknote, BriefcaseBusiness, Building2, CheckCircle2,
  FileCheck2, FileText, GraduationCap, HeartHandshake, IdCard, LoaderCircle, LockKeyhole,
  ShieldCheck, Upload, UserRound, X,
} from "lucide-react";
import { ApiError, apiFieldErrors } from "@/lib/api";
import { finalizeEmployeeJoining, startEmployeeJoining, uploadEmployeeDocument } from "@/services/employee-joining.service";
import type { EmployeeDocumentKind, EmployeeJoiningInput, EmployeeJoiningReceipt, PreviousEmploymentInput } from "@/types/employee-joining.types";

const steps = [
  { id: 1, label: "Personal", icon: UserRound },
  { id: 2, label: "Address", icon: Building2 },
  { id: 3, label: "Bank & ID", icon: IdCard },
  { id: 4, label: "Education", icon: GraduationCap },
  { id: 5, label: "Documents", icon: FileCheck2 },
] as const;
const indiaStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

const indiaUnionTerritories = [
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi (NCT)",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

const emptyEmployment = (): PreviousEmploymentInput => ({ company: "", designation: "", startDate: "", endDate: "", current: false, lastMonthlySalary: null, reasonForLeaving: "" });
const initial: EmployeeJoiningInput = {
  projectCode: "", projectAssignment: "", fullName: "", fatherGuardianName: "", personalEmail: "", phone: "", alternatePhone: "", dateOfBirth: "",
  gender: "PREFER_NOT_TO_SAY", maritalStatus: "", bloodGroup: "", shirtSize: "",
  currentAddressLine1: "", currentAddressLine2: "", currentCity: "", currentState: "", currentPostalCode: "", permanentSameAsCurrent: true,
  permanentAddressLine1: "", permanentAddressLine2: "", permanentCity: "", permanentState: "", permanentPostalCode: "",
  emergencyContactName: "", emergencyRelationship: "", emergencyPhone: "",
  aadhaarNumber: "", panNumber: "", bankAccountHolder: "", bankName: "", bankAccountNumber: "", ifscCode: "", bankBranch: "", upiId: "", uanNumber: "",
  highestQualification: "", institution: "", boardUniversity: "", graduationYear: null, grade: "", previousEmployment: [], consent: false,
};

const documentMeta: Array<{ kind: EmployeeDocumentKind; title: string; copy: string; required?: boolean; imageOnly?: boolean }> = [
  { kind: "PHOTO", title: "Employee photograph", copy: "Clear recent passport-style JPG or PNG.", required: true, imageOnly: true },
  { kind: "AADHAAR", title: "Aadhaar document", copy: "Front/back combined PDF or clear image.", required: true },
  { kind: "PAN", title: "PAN document", copy: "PAN card PDF or clear image.", required: true },
  { kind: "BANK_PROOF", title: "Bank proof", copy: "Cancelled cheque, passbook or statement page.", required: true },
  { kind: "ADDRESS_PROOF", title: "Address proof", copy: "Optional if Aadhaar already carries the current address." },
  { kind: "EDUCATION", title: "Education proof", copy: "Highest qualification certificate / marksheet." },
  { kind: "EXPERIENCE", title: "Previous employment proof", copy: "Experience / relieving letter, where applicable." },
];

function Field({ label, required, wide, hint, children }: { label: string; required?: boolean; wide?: boolean; hint?: string; children: ReactNode }) {
  return <label className={`zhr-field${wide ? " zhr-field--wide" : ""}`}><span>{label}{required && <b aria-hidden="true"> *</b>}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function IndiaStateSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <select required autoComplete="address-level1" value={value} onChange={event => onChange(event.target.value)}>
    <option value="">Select state / union territory</option>
    <optgroup label="States">{indiaStates.map(state => <option key={state} value={state}>{state}</option>)}</optgroup>
    <optgroup label="Union territories">{indiaUnionTerritories.map(territory => <option key={territory} value={territory}>{territory}</option>)}</optgroup>
  </select>;
}

function moneyNumber(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : null;
}

export function EmployeeJoiningForm() {
  const [step, setStep] = useState(1);
  const [completedStepCount, setCompletedStepCount] = useState(0);
  const [profile, setProfile] = useState<EmployeeJoiningInput>(initial);
  const [hasEmployment, setHasEmployment] = useState(false);
  const [employment, setEmployment] = useState<PreviousEmploymentInput>(emptyEmployment());
  const [files, setFiles] = useState<Partial<Record<EmployeeDocumentKind, File>>>({});
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [receipt, setReceipt] = useState<EmployeeJoiningReceipt | null>(null);
  const [employeeNumber, setEmployeeNumber] = useState("");
  const requestKey = useRef("");
  const form = useRef<HTMLFormElement>(null);

  const completion = useMemo(() => `${Math.round((completedStepCount / steps.length) * 100)}%`, [completedStepCount]);
  function set<K extends keyof EmployeeJoiningInput>(key: K, value: EmployeeJoiningInput[K]) { setProfile(current => ({ ...current, [key]: value })); }
  function setEmploymentField<K extends keyof PreviousEmploymentInput>(key: K, value: PreviousEmploymentInput[K]) { setEmployment(current => ({ ...current, [key]: value })); }

  function chooseFile(kind: EmployeeDocumentKind, file?: File, imageOnly = false) {
    setFileError("");
    if (!file) { setFiles(current => { const next = { ...current }; delete next[kind]; return next; }); return; }
    const allowed = imageOnly ? ["image/jpeg", "image/png"] : ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) { setFileError(`${file.name}: use ${imageOnly ? "JPG or PNG" : "PDF, JPG or PNG"}.`); return; }
    if (!file.size || file.size > 5 * 1024 * 1024) { setFileError(`${file.name}: choose a non-empty file up to 5 MB.`); return; }
    setFiles(current => ({ ...current, [kind]: file }));
  }

  function next() {
    setError(""); setFileError("");
    if (!form.current?.reportValidity()) return;
    setCompletedStepCount(value => Math.max(value, step));
    setStep(value => Math.min(5, value + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() { setError(""); setFileError(""); setStep(value => Math.max(1, value - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || step !== 5) return;
    const missing = documentMeta.filter(item => item.required && !files[item.kind]);
    if (missing.length) { setFileError(`Attach: ${missing.map(item => item.title).join(", ")}.`); return; }
    if (!profile.consent) { setError("Please confirm the employee joining declaration before submitting."); return; }
    setBusy(true); setError(""); setFileError("");
    try {
      if (!requestKey.current) requestKey.current = crypto.randomUUID();
      const finalProfile: EmployeeJoiningInput = {
        ...profile,
        permanentAddressLine1: profile.permanentSameAsCurrent ? profile.currentAddressLine1 : profile.permanentAddressLine1,
        permanentAddressLine2: profile.permanentSameAsCurrent ? profile.currentAddressLine2 : profile.permanentAddressLine2,
        permanentCity: profile.permanentSameAsCurrent ? profile.currentCity : profile.permanentCity,
        permanentState: profile.permanentSameAsCurrent ? profile.currentState : profile.permanentState,
        permanentPostalCode: profile.permanentSameAsCurrent ? profile.currentPostalCode : profile.permanentPostalCode,
        previousEmployment: hasEmployment ? [employment] : [],
      };
      setProgress("Securing your joining details…");
      const started = await startEmployeeJoining(finalProfile, requestKey.current);
      let saved = started.data;
      setReceipt(saved);
      const entries = documentMeta.flatMap(item => files[item.kind] ? [[item.kind, files[item.kind]!] as const] : []);
      for (let index = 0; index < entries.length; index += 1) {
        const [kind, file] = entries[index];
        const already = saved.documents.some(document => document.kind === kind);
        if (!already) {
          setProgress(`Uploading document ${index + 1} of ${entries.length}…`);
          const uploaded = await uploadEmployeeDocument(saved, kind, file);
          saved = { ...saved, documents: [...saved.documents, { id: uploaded.data.document.id, kind, fileName: uploaded.data.document.fileName, mimeType: file.type, size: file.size }] };
          setReceipt(saved);
        }
      }
      setProgress("Generating your employee number…");
      const finalized = await finalizeEmployeeJoining(saved);
      setCompletedStepCount(steps.length);
      setEmployeeNumber(finalized.data.employeeNumber);
      setReceipt({ ...saved, employeeNumber: finalized.data.employeeNumber, submitted: true, submittedAt: finalized.data.submittedAt, uploadToken: null });
      setProgress("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      const fields = apiFieldErrors(caught);
      const details = Object.entries(fields).map(([key, messages]) => `${key}: ${messages.join(" ")}`).join(" · ");
      setError(details || (caught instanceof ApiError || caught instanceof Error ? caught.message : "We could not complete the employee joining form. Please try again."));
    } finally { setBusy(false); }
  }

  if (employeeNumber && receipt?.submitted) return <section className="zhr-success" aria-labelledby="joining-complete-title">
    <div className="zhr-success-mark"><CheckCircle2 aria-hidden="true" /></div>
    <p className="zhr-kicker">Joining form submitted</p>
    <h1 id="joining-complete-title">Your employee number is ready.</h1>
    <div className="zhr-employee-number"><span>EMPLOYEE ID</span><strong>{employeeNumber}</strong></div>
    <p>Your personal, statutory and bank details have been securely submitted to ZOBHUNGER HR. The team will review your documents and contact you if anything needs clarification.</p>
    <div className="zhr-success-note"><ShieldCheck aria-hidden="true" /><div><strong>What happens next?</strong><span>HR review → approval → offer-letter preparation → authorized signature → issue to your registered email.</span></div></div>
    <p className="zhr-reference">Submission reference: <strong>{receipt.id}</strong></p>
  </section>;

  return <div className="zhr-shell">
    <header className="zhr-header">
      <div className="zhr-brand">
        <div className="zhr-wordmark" aria-label="ZOBHUNGER — Hire. Deploy. Deliver.">
          <div className="zhr-wordmark-name" aria-hidden="true"><span>ZOB</span><b>HUNGER</b></div>
          <div className="zhr-wordmark-tagline" aria-hidden="true">Hire. Deploy. Deliver.</div>
        </div>
        <span className="zhr-brand-divider" aria-hidden="true" />
        <span className="zhr-brand-context">Secure employee onboarding</span>
      </div>
      <div className="zhr-secure"><LockKeyhole aria-hidden="true" /><div><strong>Private HR form</strong><span>Not listed on the public website</span></div></div>
    </header>

    <section className="zhr-intro" aria-labelledby="joining-form-title">
      <div className="zhr-intro-copy">
        <p className="zhr-kicker">EMPLOYEE JOINING · ZOBHUNGER HR</p>
        <h1 id="joining-form-title">Complete your joining details.</h1>
        <p>Fill the five short sections below. Your employee ID is generated after successful submission.</p>
      </div>
    </section>

    <div className="zhr-progress" aria-label={`Step ${step} of ${steps.length}`}>
      <div className="zhr-progress-top"><span>Step {step} of {steps.length}</span><strong>{completedStepCount ? `${completion} complete` : "Complete this step to begin"}</strong></div>
      <div className="zhr-progress-track"><span style={{ width: completion }} /></div>
      <nav>{steps.map(item => { const Icon = item.icon; const canOpen = item.id <= completedStepCount + 1; return <button type="button" key={item.id} className={item.id === step ? "is-current" : item.id <= completedStepCount ? "is-done" : ""} onClick={() => canOpen && setStep(item.id)} disabled={busy || !canOpen}><Icon aria-hidden="true" /><span>{item.label}</span></button>; })}</nav>
    </div>

    <form ref={form} className="zhr-form" onSubmit={submit} aria-busy={busy}>
      {error && <div className="zhr-alert" role="alert">{error}</div>}
      {fileError && <div className="zhr-alert" role="alert">{fileError}</div>}

      {step === 1 && <fieldset disabled={busy}><legend className="zhr-sr-only">Personal & assignment details</legend><div className="zhr-section-heading"><span className="zhr-section-icon"><UserRound aria-hidden="true" /></span><div><span>STEP 01</span><h2>Personal & assignment details</h2></div></div><p className="zhr-section-copy">Use the details exactly as they should appear in company records.</p><div className="zhr-grid">
        <Field label="Project / assignment code" required hint="Use the short code shared by HR, e.g. PL, MCD01."><input required minLength={2} maxLength={16} pattern="[A-Za-z0-9-]+" value={profile.projectCode} onChange={e => set("projectCode", e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))} /></Field>
        <Field label="Project / assignment name" required><input required minLength={2} maxLength={180} value={profile.projectAssignment} onChange={e => set("projectAssignment", e.target.value)} /></Field>
        <Field label="Full legal name" required><input autoComplete="name" required minLength={2} maxLength={120} value={profile.fullName} onChange={e => set("fullName", e.target.value)} /></Field>
        <Field label="Father / guardian name" required><input required minLength={2} maxLength={120} value={profile.fatherGuardianName} onChange={e => set("fatherGuardianName", e.target.value)} /></Field>
        <Field label="Personal email" required><input type="email" autoComplete="email" required maxLength={254} value={profile.personalEmail} onChange={e => set("personalEmail", e.target.value)} /></Field>
        <Field label="Mobile number" required><input type="tel" autoComplete="tel" required minLength={7} maxLength={24} value={profile.phone} onChange={e => set("phone", e.target.value)} /></Field>
        <Field label="Alternate mobile"><input type="tel" maxLength={24} value={profile.alternatePhone} onChange={e => set("alternatePhone", e.target.value)} /></Field>
        <Field label="Date of birth" required><input type="date" required value={profile.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} /></Field>
        <Field label="Gender" required><select required value={profile.gender} onChange={e => set("gender", e.target.value as EmployeeJoiningInput["gender"])}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option></select></Field>
        <Field label="Marital status"><select value={profile.maritalStatus} onChange={e => set("maritalStatus", e.target.value as EmployeeJoiningInput["maritalStatus"])}><option value="">Select (optional)</option><option value="SINGLE">Single</option><option value="MARRIED">Married</option><option value="OTHER">Other</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option></select></Field>
        <Field label="Blood group"><select value={profile.bloodGroup} onChange={e => set("bloodGroup", e.target.value as EmployeeJoiningInput["bloodGroup"])}><option value="">Select (optional)</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(value => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Employee kit shirt size"><select value={profile.shirtSize} onChange={e => set("shirtSize", e.target.value as EmployeeJoiningInput["shirtSize"])}><option value="">Select (optional)</option>{["XS","S","M","L","XL","XXL","XXXL"].map(value => <option key={value}>{value}</option>)}</select></Field>
      </div></fieldset>}

      {step === 2 && <fieldset disabled={busy}><legend className="zhr-sr-only">Address & emergency contact</legend><div className="zhr-section-heading"><span className="zhr-section-icon"><Building2 aria-hidden="true" /></span><div><span>STEP 02</span><h2>Address & emergency contact</h2></div></div><p className="zhr-section-copy">These details are maintained in the employee record and used only for legitimate HR requirements.</p><div className="zhr-grid">
        <Field label="Current address" required wide><input required minLength={5} maxLength={220} autoComplete="street-address" value={profile.currentAddressLine1} onChange={e => set("currentAddressLine1", e.target.value)} /></Field>
        <Field label="Address line 2" wide><input maxLength={220} value={profile.currentAddressLine2} onChange={e => set("currentAddressLine2", e.target.value)} /></Field>
        <Field label="City" required><input required minLength={2} maxLength={120} value={profile.currentCity} onChange={e => set("currentCity", e.target.value)} /></Field>
        <Field label="State / union territory" required><IndiaStateSelect value={profile.currentState} onChange={value => set("currentState", value)} /></Field>
        <Field label="PIN code" required><input inputMode="numeric" required pattern="[0-9]{6}" maxLength={6} value={profile.currentPostalCode} onChange={e => set("currentPostalCode", e.target.value.replace(/\D/g, "").slice(0,6))} /></Field>
      </div><label className="zhr-check"><input type="checkbox" checked={profile.permanentSameAsCurrent} onChange={e => set("permanentSameAsCurrent", e.target.checked)} /><span>Permanent address is the same as current address</span></label>
      {!profile.permanentSameAsCurrent && <div className="zhr-grid zhr-subgrid"><Field label="Permanent address" required wide><input required minLength={5} maxLength={220} value={profile.permanentAddressLine1} onChange={e => set("permanentAddressLine1", e.target.value)} /></Field><Field label="Address line 2" wide><input maxLength={220} value={profile.permanentAddressLine2} onChange={e => set("permanentAddressLine2", e.target.value)} /></Field><Field label="City" required><input required minLength={2} maxLength={120} value={profile.permanentCity} onChange={e => set("permanentCity", e.target.value)} /></Field><Field label="State / union territory" required><IndiaStateSelect value={profile.permanentState} onChange={value => set("permanentState", value)} /></Field><Field label="PIN code" required><input inputMode="numeric" required pattern="[0-9]{6}" maxLength={6} value={profile.permanentPostalCode} onChange={e => set("permanentPostalCode", e.target.value.replace(/\D/g, "").slice(0,6))} /></Field></div>}
      <div className="zhr-divider" /><h3 className="zhr-mini-title"><HeartHandshake />Emergency contact</h3><div className="zhr-grid"><Field label="Contact name" required><input required minLength={2} maxLength={120} value={profile.emergencyContactName} onChange={e => set("emergencyContactName", e.target.value)} /></Field><Field label="Relationship" required><input required minLength={2} maxLength={80} value={profile.emergencyRelationship} onChange={e => set("emergencyRelationship", e.target.value)} /></Field><Field label="Emergency mobile" required><input type="tel" required minLength={7} maxLength={24} value={profile.emergencyPhone} onChange={e => set("emergencyPhone", e.target.value)} /></Field></div></fieldset>}

      {step === 3 && <fieldset disabled={busy}><legend className="zhr-sr-only">Statutory & bank details</legend><div className="zhr-section-heading"><span className="zhr-section-icon"><Banknote aria-hidden="true" /></span><div><span>STEP 03</span><h2>Statutory & bank details</h2></div></div><div className="zhr-security-note"><ShieldCheck /><div><strong>Sensitive fields are protected.</strong><span>Aadhaar, PAN, bank account and UAN values are encrypted before they are stored and are available only to authenticated HR administrators.</span></div></div><div className="zhr-grid">
        <Field label="Aadhaar number" required><input inputMode="numeric" autoComplete="off" required pattern="[0-9]{12}" maxLength={12} value={profile.aadhaarNumber} onChange={e => set("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0,12))} /></Field>
        <Field label="PAN number" required><input autoComplete="off" required pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]" maxLength={10} value={profile.panNumber} onChange={e => set("panNumber", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,10))} /></Field>
        <Field label="Bank account holder" required><input required minLength={2} maxLength={120} value={profile.bankAccountHolder} onChange={e => set("bankAccountHolder", e.target.value)} /></Field>
        <Field label="Bank name" required><input required minLength={2} maxLength={160} value={profile.bankName} onChange={e => set("bankName", e.target.value)} /></Field>
        <Field label="Bank account number" required><input inputMode="numeric" autoComplete="off" required pattern="[0-9]{6,20}" maxLength={20} value={profile.bankAccountNumber} onChange={e => set("bankAccountNumber", e.target.value.replace(/\D/g, "").slice(0,20))} /></Field>
        <Field label="IFSC code" required><input autoComplete="off" required pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}" maxLength={11} value={profile.ifscCode} onChange={e => set("ifscCode", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,11))} /></Field>
        <Field label="Bank branch" required><input required minLength={2} maxLength={160} value={profile.bankBranch} onChange={e => set("bankBranch", e.target.value)} /></Field>
        <Field label="UPI ID"><input maxLength={120} placeholder="name@bank" value={profile.upiId} onChange={e => set("upiId", e.target.value)} /></Field>
        <Field label="UAN / PF number" hint="Optional, if already allotted."><input inputMode="numeric" pattern="[0-9]{12}" maxLength={12} value={profile.uanNumber} onChange={e => set("uanNumber", e.target.value.replace(/\D/g, "").slice(0,12))} /></Field>
      </div></fieldset>}

      {step === 4 && <fieldset disabled={busy}><legend className="zhr-sr-only">Education & previous employment</legend><div className="zhr-section-heading"><span className="zhr-section-icon"><BriefcaseBusiness aria-hidden="true" /></span><div><span>STEP 04</span><h2>Education & previous employment</h2></div></div><div className="zhr-grid">
        <Field label="Highest qualification" required><input required minLength={2} maxLength={120} placeholder="e.g. B.Tech, B.Com, Class 12" value={profile.highestQualification} onChange={e => set("highestQualification", e.target.value)} /></Field>
        <Field label="School / college / institution" required><input required minLength={2} maxLength={180} value={profile.institution} onChange={e => set("institution", e.target.value)} /></Field>
        <Field label="Board / university"><input maxLength={180} value={profile.boardUniversity} onChange={e => set("boardUniversity", e.target.value)} /></Field>
        <Field label="Completion year"><input type="number" min={1950} max={new Date().getFullYear()+8} value={profile.graduationYear ?? ""} onChange={e => set("graduationYear", e.target.value ? Number(e.target.value) : null)} /></Field>
        <Field label="Percentage / CGPA / grade"><input maxLength={60} value={profile.grade} onChange={e => set("grade", e.target.value)} /></Field>
      </div><label className="zhr-check zhr-check--card"><input type="checkbox" checked={hasEmployment} onChange={e => { setHasEmployment(e.target.checked); if (!e.target.checked) setEmployment(emptyEmployment()); }} /><span><strong>I have previous employment experience</strong><small>Add your most recent employer. Additional history can be verified by HR if required.</small></span></label>
      {hasEmployment && <div className="zhr-grid zhr-subgrid"><Field label="Previous company" required><input required minLength={2} maxLength={180} value={employment.company} onChange={e => setEmploymentField("company", e.target.value)} /></Field><Field label="Designation" required><input required minLength={2} maxLength={120} value={employment.designation} onChange={e => setEmploymentField("designation", e.target.value)} /></Field><Field label="Start date" required><input type="date" required value={employment.startDate} onChange={e => setEmploymentField("startDate", e.target.value)} /></Field><Field label="End date" required={!employment.current}><input type="date" required={!employment.current} disabled={employment.current} min={employment.startDate || undefined} value={employment.endDate} onChange={e => setEmploymentField("endDate", e.target.value)} /></Field><Field label="Last monthly salary"><input type="number" min={0} step={1} value={employment.lastMonthlySalary ?? ""} onChange={e => setEmploymentField("lastMonthlySalary", moneyNumber(e.target.value))} /></Field><Field label="Reason for leaving" wide><textarea rows={3} maxLength={500} value={employment.reasonForLeaving} onChange={e => setEmploymentField("reasonForLeaving", e.target.value)} /></Field><label className="zhr-check zhr-field--wide"><input type="checkbox" checked={employment.current} onChange={e => setEmployment(current => ({ ...current, current: e.target.checked, endDate: e.target.checked ? "" : current.endDate }))} /><span>I currently work here</span></label></div>}
      </fieldset>}

      {step === 5 && <fieldset disabled={busy}><legend className="zhr-sr-only">Documents & declaration</legend><div className="zhr-section-heading"><span className="zhr-section-icon"><FileText aria-hidden="true" /></span><div><span>STEP 05</span><h2>Documents & declaration</h2></div></div><p className="zhr-section-copy">Required documents are marked below. PDF, JPG or PNG up to 5 MB each.</p><div className="zhr-upload-grid">{documentMeta.map(item => { const file = files[item.kind]; return <label className={`zhr-upload${file ? " has-file" : ""}`} key={item.kind}><input type="file" accept={item.imageOnly ? ".jpg,.jpeg,.png,image/jpeg,image/png" : ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"} onChange={event => chooseFile(item.kind, event.target.files?.[0], item.imageOnly)} /><span className="zhr-upload-icon">{file ? <CheckCircle2 /> : <Upload />}</span><span><strong>{item.title}{item.required && <b> *</b>}</strong><small>{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : item.copy}</small></span>{file && <button type="button" aria-label={`Remove ${item.title}`} onClick={event => { event.preventDefault(); chooseFile(item.kind); }}><X /></button>}</label>; })}</div>
      <label className="zhr-check zhr-declaration"><input type="checkbox" required checked={profile.consent} onChange={e => set("consent", e.target.checked)} /><span><strong>I confirm these details and documents are accurate.</strong><small>I authorize Zobhungr Solutions Private Limited to securely store, review and verify this information for employment onboarding, payroll, statutory compliance and related HR administration.</small></span></label>
      {progress && <div className="zhr-submit-progress" role="status"><LoaderCircle className="zhr-spin" />{progress}</div>}
      </fieldset>}

      <div className="zhr-actions">{step > 1 ? <button type="button" className="zhr-button zhr-button--secondary" onClick={back} disabled={busy}><ArrowLeft />Back</button> : <span />}{step < 5 ? <button type="button" className="zhr-button" onClick={next} disabled={busy}>Continue<ArrowRight /></button> : <button type="submit" className="zhr-button" disabled={busy}>{busy ? <LoaderCircle className="zhr-spin" /> : <BadgeCheck />}{busy ? "Submitting securely…" : "Submit joining form"}</button>}</div>
    </form>
    <footer className="zhr-foot"><LockKeyhole /><span>Private HR onboarding · Zobhungr Solutions Private Limited · Vijay Tower, Ghazipur, Uttar Pradesh 233001</span></footer>
  </div>;
}
