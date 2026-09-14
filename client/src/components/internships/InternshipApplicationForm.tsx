"use client";

import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, FileText, GraduationCap,
  LoaderCircle, LockKeyhole, Send, ShieldCheck, Upload, UserRound, X,
} from "lucide-react";
import { ApiError, apiFieldErrors } from "@/lib/api";
import { submitInternshipApplication, uploadInternshipResume } from "@/services/internship-application.service";
import type { InternshipApplicationInput, InternshipApplicationReceipt } from "@/types/internship-application.types";

const steps = [
  { id: 1, label: "Personal", icon: UserRound },
  { id: 2, label: "Education", icon: GraduationCap },
  { id: 3, label: "Preferences", icon: BriefcaseBusiness },
  { id: 4, label: "Resume", icon: FileText },
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

const initial: InternshipApplicationInput = {
  fullName: "", email: "", phone: "", city: "", state: "",
  qualification: "", institution: "", fieldOfStudy: "", graduationYear: null,
  preferredRole: "", preferredLocation: "", availability: "", skills: [],
  portfolioUrl: "", coverNote: "", consent: false,
};

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

export function InternshipApplicationForm() {
  const [step, setStep] = useState(1);
  const [completedStepCount, setCompletedStepCount] = useState(0);
  const [profile, setProfile] = useState<InternshipApplicationInput>(initial);
  const [skillsText, setSkillsText] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [receipt, setReceipt] = useState<InternshipApplicationReceipt | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const requestKey = useRef("");
  const form = useRef<HTMLFormElement>(null);

  const completion = useMemo(() => `${Math.round((completedStepCount / steps.length) * 100)}%`, [completedStepCount]);
  function set<K extends keyof InternshipApplicationInput>(key: K, value: InternshipApplicationInput[K]) { setProfile(current => ({ ...current, [key]: value })); }

  function chooseResume(file?: File) {
    setFileError("");
    if (!file) { setResume(null); return; }
    if (file.type !== "application/pdf") { setFileError(`${file.name}: upload a PDF resume.`); return; }
    if (!file.size || file.size > 2 * 1024 * 1024) { setFileError(`${file.name}: choose a non-empty PDF up to 2 MB.`); return; }
    setResume(file);
  }

  function next() {
    setError(""); setFileError("");
    if (!form.current?.reportValidity()) return;
    if (step === 3) {
      const skills = skillsText.split(",").map(value => value.trim()).filter(Boolean);
      if (!skills.length) { setError("Add at least one relevant skill before continuing."); return; }
      if (skills.length > 20 || skills.some(skill => skill.length > 60)) { setError("Add up to 20 skills, with each skill limited to 60 characters."); return; }
      set("skills", skills);
    }
    setCompletedStepCount(value => Math.max(value, step));
    setStep(value => Math.min(steps.length, value + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError(""); setFileError("");
    setStep(value => Math.max(1, value - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || step !== 4) return;
    if (!resume) { setFileError("Attach your CV / resume as a PDF before submitting."); return; }
    if (!profile.consent) { setError("Please confirm the internship application declaration before submitting."); return; }
    setBusy(true); setError(""); setFileError("");
    try {
      if (!requestKey.current) requestKey.current = crypto.randomUUID();
      const skills = skillsText.split(",").map(value => value.trim()).filter(Boolean);
      const finalProfile = { ...profile, skills };
      setProgress("Securing your application details…");
      const started = await submitInternshipApplication(finalProfile, requestKey.current);
      const saved = started.data;
      setReceipt(saved);
      if (!saved.resumeUploaded) {
        setProgress("Uploading your resume…");
        await uploadInternshipResume(saved, resume);
      }
      setCompletedStepCount(steps.length);
      setProgress("");
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      const fields = apiFieldErrors(caught);
      const details = Object.entries(fields).map(([key, messages]) => `${key}: ${messages.join(" ")}`).join(" · ");
      setProgress("");
      setError(details || (caught instanceof ApiError || caught instanceof Error ? caught.message : "We could not submit your internship application. Please try again."));
    } finally { setBusy(false); }
  }

  if (submitted && receipt) return <section className="zhr-success" aria-labelledby="internship-complete-title">
    <div className="zhr-success-head">
      <div className="zhr-success-mark"><CheckCircle2 aria-hidden="true" /></div>
      <div><p className="zhr-kicker">Internship application submitted</p><h1 id="internship-complete-title">Application received.</h1></div>
    </div>
    <div className="zhr-employee-number">
      <div className="zhr-employee-number-head"><span>APPLICATION REFERENCE</span><b>Saved</b></div>
      <strong>{receipt.id}</strong>
      <small>Keep this reference if you need to contact the ZOBHUNGER HR team.</small>
    </div>
    <p className="zhr-success-copy">Your application and resume have been securely submitted for HR review.</p>
    <div className="zhr-success-note"><ShieldCheck aria-hidden="true" /><div><strong>What happens next</strong><span>HR review → shortlist → contact → internship selection.</span></div></div>
  </section>;

  return <div className="zhr-shell">
    <header className="zhr-header">
      <div className="zhr-brand">
        <div className="zhr-wordmark" aria-label="ZOBHUNGER — Hire. Deploy. Deliver.">
          <div className="zhr-wordmark-name" aria-hidden="true"><span>ZOB</span><b>HUNGER</b></div>
          <div className="zhr-wordmark-tagline" aria-hidden="true">Hire. Deploy. Deliver.</div>
        </div>
        <span className="zhr-brand-divider" aria-hidden="true" />
        <span className="zhr-brand-context">Internship applications</span>
      </div>
      <div className="zhr-secure"><LockKeyhole aria-hidden="true" /><div><strong>Secure application form</strong><span>Your submission goes directly to HR</span></div></div>
    </header>

    <div className="zhr-page-grid">
      <aside className="zhr-rail" aria-label="Internship application progress">
        <div className="zhr-rail-copy">
          <p className="zhr-rail-eyebrow">INTERNSHIP APPLICATION</p>
          <h2>Start with the work you want to learn.</h2>
          <p>Share your education, preferred internship role and resume once. HR can review everything from one application record.</p>
        </div>
        <div className="zhr-rail-time"><strong>~5 minutes</strong><span>Keep a current PDF resume ready.</span></div>
        <div className="zhr-progress" aria-label={`Step ${step} of ${steps.length}`}>
          <div className="zhr-progress-top"><span>Step {step} of {steps.length}</span><strong aria-live="polite">{completedStepCount ? `${completion} complete` : "Ready to begin"}</strong></div>
          <div className="zhr-progress-track"><span style={{ width: completion }} /></div>
          <nav aria-label="Internship form steps">{steps.map(item => { const Icon = item.icon; const canOpen = item.id <= completedStepCount + 1; return <button type="button" key={item.id} className={item.id === step ? "is-current" : item.id <= completedStepCount ? "is-done" : ""} aria-label={`Step ${item.id}: ${item.label}`} aria-current={item.id === step ? "step" : undefined} onClick={() => { if (!canOpen) return; setStep(item.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={busy || !canOpen}><Icon aria-hidden="true" /><span>{item.label}</span></button>; })}</nav>
        </div>
        <div className="zhr-rail-note"><ShieldCheck aria-hidden="true" /><span>Your application is available only to authorised recruitment and HR administrators.</span></div>
      </aside>

      <section className="zhr-content" aria-labelledby="internship-form-title">
        <section className="zhr-intro">
          <div className="zhr-intro-copy">
            <p className="zhr-kicker">APPLY FOR INTERNSHIP · ZOBHUNGER HR</p>
            <h1 id="internship-form-title">Tell us where you want to contribute.</h1>
            <p>Complete the four sections below. Use current contact details and attach the resume you want our team to review.</p>
          </div>
          <div className="zhr-intro-meta" aria-label="Form overview"><span><strong>4</strong><small>sections</small></span><span><strong>~5</strong><small>minutes</small></span><span><strong>1</strong><small>resume</small></span></div>
        </section>

        <div className="zhr-form-caption"><span>Step {step}: {steps[step - 1].label}</span><span><b aria-hidden="true">*</b> Required fields</span></div>
        <form ref={form} className="zhr-form" onSubmit={submit} aria-busy={busy}>
          {error && <div className="zhr-alert zhr-alert--error" role="alert"><strong>We couldn’t save this yet.</strong><span>{error}</span></div>}
          {fileError && <div className="zhr-alert zhr-alert--file" role="alert"><strong>Check your resume.</strong><span>{fileError}</span></div>}

          {step === 1 && <fieldset disabled={busy}><legend className="zhr-sr-only">Personal and contact details</legend><div className="zhr-section-heading"><span className="zhr-section-icon"><UserRound aria-hidden="true" /></span><div><span>STEP 01</span><h2>Personal & contact details</h2></div></div><p className="zhr-section-copy">Use contact details you check regularly so the HR team can reach you if your profile is shortlisted.</p><div className="zhr-grid">
            <Field label="Full name" required><input autoComplete="name" required minLength={2} maxLength={120} value={profile.fullName} onChange={e => set("fullName", e.target.value)} /></Field>
            <Field label="Email address" required><input type="email" autoComplete="email" required maxLength={254} value={profile.email} onChange={e => set("email", e.target.value)} /></Field>
            <Field label="Mobile number" required><input type="tel" autoComplete="tel" required minLength={7} maxLength={24} value={profile.phone} onChange={e => set("phone", e.target.value)} /></Field>
            <Field label="Current city" required><input autoComplete="address-level2" required minLength={2} maxLength={120} value={profile.city} onChange={e => set("city", e.target.value)} /></Field>
            <Field label="State / union territory" required><IndiaStateSelect value={profile.state} onChange={value => set("state", value)} /></Field>
          </div></fieldset>}

          {step === 2 && <fieldset disabled={busy}><legend className="zhr-sr-only">Education details</legend><div className="zhr-section-heading"><span className="zhr-section-icon"><GraduationCap aria-hidden="true" /></span><div><span>STEP 02</span><h2>Education & qualification</h2></div></div><p className="zhr-section-copy">Share your current or highest qualification. Students who are still studying can enter their expected completion year.</p><div className="zhr-grid">
            <Field label="Current / highest qualification" required><input required minLength={2} maxLength={120} placeholder="e.g. B.Tech, BBA, B.Com, MBA" value={profile.qualification} onChange={e => set("qualification", e.target.value)} /></Field>
            <Field label="College / institution" required><input required minLength={2} maxLength={180} value={profile.institution} onChange={e => set("institution", e.target.value)} /></Field>
            <Field label="Course / field of study"><input maxLength={160} placeholder="e.g. Computer Science, Marketing" value={profile.fieldOfStudy} onChange={e => set("fieldOfStudy", e.target.value)} /></Field>
            <Field label="Completion / expected year"><input type="number" min={1950} max={new Date().getFullYear() + 8} value={profile.graduationYear ?? ""} onChange={e => set("graduationYear", e.target.value ? Number(e.target.value) : null)} /></Field>
          </div></fieldset>}

          {step === 3 && <fieldset disabled={busy}><legend className="zhr-sr-only">Internship preferences</legend><div className="zhr-section-heading"><span className="zhr-section-icon"><BriefcaseBusiness aria-hidden="true" /></span><div><span>STEP 03</span><h2>Internship role & preferences</h2></div></div><p className="zhr-section-copy">Tell us the kind of internship you want and where you would prefer to work.</p><div className="zhr-grid">
            <Field label="Preferred internship role" required><input required minLength={2} maxLength={160} placeholder="e.g. Software Development, HR, Operations" value={profile.preferredRole} onChange={e => set("preferredRole", e.target.value)} /></Field>
            <Field label="Preferred internship location" required><input required minLength={2} maxLength={120} placeholder="e.g. Prayagraj, Noida, Remote" value={profile.preferredLocation} onChange={e => set("preferredLocation", e.target.value)} /></Field>
            <Field label="Availability / start date" required><input required minLength={2} maxLength={160} placeholder="e.g. Immediately, from 1 October, winter break" value={profile.availability} onChange={e => set("availability", e.target.value)} /></Field>
            <Field label="Key skills" required hint="Separate skills with commas. Example: React, Excel, content writing"><input required maxLength={1200} value={skillsText} onChange={e => setSkillsText(e.target.value)} /></Field>
            <Field label="LinkedIn / portfolio URL" wide><input type="url" maxLength={1000} placeholder="https://" value={profile.portfolioUrl} onChange={e => set("portfolioUrl", e.target.value)} /></Field>
            <Field label="Note for HR" wide><textarea rows={4} maxLength={2000} placeholder="Projects, interests, achievements or what you hope to learn during the internship." value={profile.coverNote} onChange={e => set("coverNote", e.target.value)} /></Field>
          </div></fieldset>}

          {step === 4 && <fieldset disabled={busy}><legend className="zhr-sr-only">Resume and declaration</legend><div className="zhr-section-heading"><span className="zhr-section-icon"><FileText aria-hidden="true" /></span><div><span>STEP 04</span><h2>Resume & declaration</h2></div></div><p className="zhr-section-copy">Attach one current PDF resume up to 2 MB. Keep Aadhaar, PAN, bank information and other sensitive identity data out of your resume.</p><div className="zhr-upload-grid">
            <div className={`zhr-upload${resume ? " has-file" : ""}`}><input id="internship-resume" type="file" accept=".pdf,application/pdf" onClick={event => { event.currentTarget.value = ""; }} onChange={event => chooseResume(event.target.files?.[0])} /><label htmlFor="internship-resume" className="zhr-upload-main"><span className="zhr-upload-icon">{resume ? <CheckCircle2 /> : <Upload />}</span><span><strong>CV / resume <b>*</b></strong><small>{resume ? `${resume.name} · ${(resume.size / 1024 / 1024).toFixed(2)} MB` : "PDF format · maximum 2 MB"}</small></span></label>{resume && <button type="button" aria-label="Remove resume" onClick={() => chooseResume()}><X /></button>}</div>
          </div>
          <label className="zhr-check zhr-declaration"><input type="checkbox" required checked={profile.consent} onChange={e => set("consent", e.target.checked)} /><span><strong>I confirm that the information in this application is accurate.</strong><small>I authorize Zobhungr Solutions Private Limited to securely store and review my application and contact me regarding internship opportunities.</small></span></label>
          {progress && <div className="zhr-submit-progress" role="status"><LoaderCircle className="zhr-spin" />{progress}</div>}
          </fieldset>}

          <div className="zhr-actions">{step > 1 ? <button type="button" className="zhr-button zhr-button--secondary" onClick={back} disabled={busy}><ArrowLeft />Back</button> : <span />}{step < steps.length ? <button type="button" className="zhr-button" onClick={next} disabled={busy}>Continue<ArrowRight /></button> : <button type="submit" className="zhr-button zhr-button--submit" disabled={busy}>{busy ? <LoaderCircle className="zhr-spin" /> : <Send aria-hidden="true" />}{busy ? "Sending…" : "Submit internship application"}</button>}</div>
        </form>
      </section>
    </div>
  </div>;
}
