"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, FileText, GraduationCap, LoaderCircle, Plus, Send, Sparkles, Trash2, Upload, UserRound } from "lucide-react";
import { ApiError, apiFieldErrors } from "@/lib/api";
import { submitCareerProfile, uploadCareerResume } from "@/services/career-intake.service";
import type { CareerEducation, CareerExperience, CareerProfileInput, CareerReceipt } from "@/types/career-intake.types";

const newEducation = (): CareerEducation => ({ qualification: "", institution: "", fieldOfStudy: "", graduationYear: null });
const newExperience = (): CareerExperience => ({ company: "", title: "", startMonth: "", endMonth: "", current: false, description: "" });
const initialProfile: CareerProfileInput = { fullName: "", email: "", phone: "", city: "", state: "", preferredRole: "", experienceYears: 0, education: [newEducation()], workExperience: [], skills: [], preferredLocations: [], availability: "", portfolioUrl: "", coverNote: "", consent: false };
function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return <label className="zb-intake-field"><span>{label}{required && <span aria-hidden="true"> *</span>}</span>{children}</label>;
}

export function CareerProfileForm() {
  const [profile, setProfile] = useState(initialProfile);
  const [skills, setSkills] = useState("");
  const [locations, setLocations] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<CareerReceipt | null>(null);
  const requestKey = useRef("");
  const resumeInput = useRef<HTMLInputElement>(null);
  function set<K extends keyof CareerProfileInput>(key: K, value: CareerProfileInput[K]) { setProfile(current => ({ ...current, [key]: value })); }
  function updateEducation(index: number, value: Partial<CareerEducation>) { setProfile(current => ({ ...current, education: current.education.map((item, i) => i === index ? { ...item, ...value } : item) })); }
  function updateExperience(index: number, value: Partial<CareerExperience>) { setProfile(current => ({ ...current, workExperience: current.workExperience.map((item, i) => i === index ? { ...item, ...value } : item) })); }
  const split = (value: string) => [...new Set(value.split(",").map(item => item.trim()).filter(Boolean))];

  function chooseResume(file?: File) {
    setResume(null); setFileError("");
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) { setFileError("Choose a PDF resume. You can export a Word document as PDF first."); return; }
    if (!file.size || file.size > 2 * 1024 * 1024) { setFileError("Choose a non-empty PDF, 2 MB or smaller."); return; }
    setResume(file);
  }

  async function attach(saved: CareerReceipt) {
    if (!resume || saved.resumeUploaded) return;
    await uploadCareerResume(saved, resume);
    setReceipt({ ...saved, resumeUploaded: true, resumeUploadToken: null });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || fileError) return;
    setBusy(true); setError("");
    try {
      if (!requestKey.current) requestKey.current = crypto.randomUUID();
      const response = await submitCareerProfile({ ...profile, skills: split(skills), preferredLocations: split(locations) }, requestKey.current);
      setReceipt(response.data);
      await attach(response.data);
    } catch (caught) {
      const fields = apiFieldErrors(caught);
      const details = Object.entries(fields).map(([key, messages]) => `${key}: ${messages.join(" ")}`).join(" · ");
      setError(details || (caught instanceof ApiError || caught instanceof Error ? caught.message : "We couldn't complete the submission. Please try again."));
    } finally { setBusy(false); }
  }

  async function retryUpload() {
    if (!receipt || !resume || fileError || busy) return;
    setBusy(true); setError("");
    try { await attach(receipt); } catch (caught) { setError(caught instanceof Error ? caught.message : "The resume upload did not finish. Please try again."); } finally { setBusy(false); }
  }

  const filePicker = <div className="zb-intake-upload">
    <Upload aria-hidden="true" /><div><strong>{resume?.name ?? "Add your CV / resume"}</strong><p>PDF · up to 2 MB · optional</p></div>
    <input ref={resumeInput} type="file" accept=".pdf,application/pdf" aria-label="Choose a PDF resume" disabled={busy} onChange={event => chooseResume(event.target.files?.[0])} />
    {(resume || fileError) && <button type="button" className="zb-intake-add" disabled={busy} onClick={() => { setResume(null); setFileError(""); if (resumeInput.current) resumeInput.current.value = ""; }}>Remove file</button>}
    {fileError && <p className="zb-intake-error" role="alert">{fileError}</p>}
  </div>;

  if (receipt) return <section className="zb-intake-success" aria-labelledby="career-received-title">
    <span className="zb-intake-success-icon"><CheckCircle2 aria-hidden="true" /></span>
    <p className="zb-eyebrow">Profile received</p><h2 id="career-received-title">Thank you for sharing your story.</h2>
    <p>Your details are saved for our HR team. We will contact you using the email or phone number you provided if you are shortlisted for a suitable opportunity.</p>
    <p className="zb-intake-reference">Your reference <strong>{receipt.id}</strong></p>
    {busy && <p role="status"><LoaderCircle className="zb-biz-spin" aria-hidden="true" /> Attaching your resume…</p>}
    {receipt.resumeUploaded ? <p className="zb-intake-confirmation"><FileText aria-hidden="true" />Your resume is attached.</p> : <>
      <p>Your profile is saved. You can attach a resume here within 30 minutes of submitting.</p>{filePicker}
      <button className="zb-intake-button" type="button" onClick={() => void retryUpload()} disabled={busy || !resume || Boolean(fileError)}><Upload aria-hidden="true" />{busy ? "Uploading…" : "Attach / retry resume"}</button>
    </>}
    {error && <p className="zb-intake-error" role="alert">{error} Your profile is saved; there is no need to submit it again.</p>}
    <div className="zb-intake-actions"><Link href="/jobs" className="zb-intake-button zb-intake-button--secondary">Explore opportunities<ArrowUpRight aria-hidden="true" /></Link><Link href="/contact">Need to amend your details? Contact us with your reference.</Link></div>
  </section>;

  return <form className="zb-intake-form" onSubmit={submit} aria-busy={busy}>
    <p className="zb-intake-required">Fields marked * are required. You do not need an account to apply.</p>
    {error && <p className="zb-intake-error" role="alert">{error} Your entries are still available below.</p>}
    <fieldset disabled={busy}>
      <legend><UserRound aria-hidden="true" /><span>01 · Personal information</span></legend>
      <div className="zb-intake-fields">
        <Field label="Full name" required><input autoComplete="name" required minLength={2} maxLength={120} value={profile.fullName} onChange={e => set("fullName", e.target.value)} /></Field>
        <Field label="Email address" required><input type="email" autoComplete="email" required maxLength={254} value={profile.email} onChange={e => set("email", e.target.value)} /></Field>
        <Field label="Phone number" required><input type="tel" autoComplete="tel" required minLength={7} maxLength={24} value={profile.phone} onChange={e => set("phone", e.target.value)} /></Field>
        <Field label="Current city" required><input autoComplete="address-level2" required minLength={2} maxLength={120} value={profile.city} onChange={e => set("city", e.target.value)} /></Field>
        <Field label="State / region" required><input autoComplete="address-level1" required minLength={2} maxLength={120} value={profile.state} onChange={e => set("state", e.target.value)} /></Field>
        <Field label="Role or function of interest" required><input required minLength={2} maxLength={160} placeholder="e.g. Field sales, operations, recruitment" value={profile.preferredRole} onChange={e => set("preferredRole", e.target.value)} /></Field>
      </div>
    </fieldset>
    <fieldset disabled={busy}>
      <legend><GraduationCap aria-hidden="true" /><span>02 · Education</span></legend>
      {profile.education.map((item, index) => <div className="zb-intake-repeat" key={index}>
        <div className="zb-intake-repeat-title"><h3>Qualification {index + 1}</h3>{profile.education.length > 1 && <button type="button" aria-label={`Remove qualification ${index + 1}`} onClick={() => set("education", profile.education.filter((_, i) => i !== index))}><Trash2 aria-hidden="true" /></button>}</div>
        <div className="zb-intake-fields">
          <Field label="Qualification / degree" required><input required minLength={2} maxLength={120} placeholder="e.g. Class 12, diploma, bachelor's degree" value={item.qualification} onChange={e => updateEducation(index, { qualification: e.target.value })} /></Field>
          <Field label="School / college / institution" required><input required minLength={2} maxLength={180} value={item.institution} onChange={e => updateEducation(index, { institution: e.target.value })} /></Field>
          <Field label="Field of study"><input maxLength={160} value={item.fieldOfStudy} onChange={e => updateEducation(index, { fieldOfStudy: e.target.value })} /></Field>
          <Field label="Completion year (or expected)"><input type="number" min={1950} max={2100} value={item.graduationYear ?? ""} onChange={e => updateEducation(index, { graduationYear: e.target.value ? Number(e.target.value) : null })} /></Field>
        </div>
      </div>)}
      {profile.education.length < 5 && <button type="button" className="zb-intake-add" onClick={() => set("education", [...profile.education, newEducation()])}><Plus aria-hidden="true" />Add education</button>}
    </fieldset>
    <fieldset disabled={busy}>
      <legend><BriefcaseBusiness aria-hidden="true" /><span>03 · Work experience</span></legend>
      <Field label="Completed years of experience" required><input type="number" required min={0} max={60} step={1} value={profile.experienceYears} onChange={e => set("experienceYears", Number(e.target.value))} /></Field>
      <p className="zb-intake-hint">Freshers are welcome. Enter 0 and leave employment history empty if this is your first role.</p>
      {profile.workExperience.map((item, index) => <div className="zb-intake-repeat" key={index}>
        <div className="zb-intake-repeat-title"><h3>Experience {index + 1}</h3><button type="button" aria-label={`Remove experience ${index + 1}`} onClick={() => set("workExperience", profile.workExperience.filter((_, i) => i !== index))}><Trash2 aria-hidden="true" /></button></div>
        <div className="zb-intake-fields">
          <Field label="Company / organisation" required><input required minLength={2} maxLength={180} value={item.company} onChange={e => updateExperience(index, { company: e.target.value })} /></Field>
          <Field label="Role / job title" required><input required minLength={2} maxLength={120} value={item.title} onChange={e => updateExperience(index, { title: e.target.value })} /></Field>
          <Field label="Start month" required><input type="month" required value={item.startMonth} onChange={e => updateExperience(index, { startMonth: e.target.value })} /></Field>
          <Field label="End month" required={!item.current}><input type="month" required={!item.current} disabled={item.current} min={item.startMonth || undefined} value={item.endMonth} onChange={e => updateExperience(index, { endMonth: e.target.value })} /></Field>
        </div>
        <label className="zb-intake-check"><input type="checkbox" checked={item.current} onChange={e => updateExperience(index, { current: e.target.checked, endMonth: "" })} />I currently work here</label>
        <Field label="Responsibilities and achievements"><textarea rows={3} maxLength={2000} value={item.description} onChange={e => updateExperience(index, { description: e.target.value })} /></Field>
      </div>)}
      {profile.workExperience.length < 6 && <button type="button" className="zb-intake-add" onClick={() => set("workExperience", [...profile.workExperience, newExperience()])}><Plus aria-hidden="true" />Add work experience</button>}
    </fieldset>
    <fieldset disabled={busy}>
      <legend><Sparkles aria-hidden="true" /><span>04 · Skills & preferences</span></legend>
      <Field label="Skills (separate with commas)" required><input required maxLength={1500} placeholder="Customer engagement, Excel, field sales" value={skills} onChange={e => setSkills(e.target.value)} /></Field>
      <p className="zb-intake-hint">Add up to 25 skills, with a maximum of 60 characters per skill.</p>
      <div className="zb-intake-fields">
        <Field label="Preferred locations (separate with commas)"><input maxLength={960} placeholder="Delhi, Ghazipur, Bengaluru" value={locations} onChange={e => setLocations(e.target.value)} /></Field>
        <Field label="Availability / notice period" required><input required minLength={2} maxLength={160} placeholder="Immediately, 30 days, after graduation…" value={profile.availability} onChange={e => set("availability", e.target.value)} /></Field>
      </div>
      <Field label="LinkedIn / portfolio URL"><input type="url" maxLength={1000} placeholder="https://" value={profile.portfolioUrl} onChange={e => set("portfolioUrl", e.target.value)} /></Field>
      <Field label="Anything else you would like HR to know?"><textarea rows={4} maxLength={3000} placeholder="Achievements, certifications, languages or the work you enjoy." value={profile.coverNote} onChange={e => set("coverNote", e.target.value)} /></Field>
    </fieldset>
    <fieldset disabled={busy}>
      <legend><FileText aria-hidden="true" /><span>05 · Resume & submission</span></legend>
      {filePicker}
      <label className="zb-intake-check"><input type="checkbox" required checked={profile.consent} onChange={e => set("consent", e.target.checked)} /><span>I agree to ZOBHUNGER storing my profile and resume for recruitment review and contacting me about relevant opportunities. *</span></label>
      <p className="zb-intake-hint">Please keep identity documents, bank details and other sensitive information out of your resume.</p>
      <button type="submit" className="zb-intake-button" disabled={busy || Boolean(fileError)}>{busy ? <LoaderCircle className="zb-biz-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}{busy ? "Submitting profile…" : "Submit profile for HR review"}</button>
    </fieldset>
  </form>;
}
