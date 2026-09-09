"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { BadgeCheck, BriefcaseBusiness, Building2, Check, CheckCircle2, FileText, LoaderCircle, Send, Upload, UserRound } from "lucide-react";
import { apiFieldErrors } from "@/lib/api";
import { vendorCategories, vendorDocuments, vendorOrganizations } from "@/data/vendors";
import { finishVendorApplication, startVendorApplication, uploadVendorDocument } from "@/services/vendors.service";
import type { VendorDocumentKind, VendorInput, VendorReceipt } from "@/types/vendor.types";

const initial: VendorInput = { companyName: "", organizationType: "", establishedYear: null, registrationNumber: "", gstNumber: "", msmeNumber: "", addressLine: "", city: "", state: "", postalCode: "", country: "India", contactName: "", contactRole: "", email: "", phone: "", alternatePhone: "", website: "", serviceCategories: [], specializedServices: "", serviceDescription: "", yearsExperience: 0, teamSize: 1, coverage: [], industries: [], projectExperience: "", notableClients: "", capacityNotes: "", consent: false };
function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) { return <label className="zb-intake-field"><span>{label}{required && <span aria-hidden="true"> *</span>}</span>{children}</label>; }
const split = (value: string) => [...new Set(value.split(",").map(item => item.trim()).filter(Boolean))];

export function VendorApplicationForm() {
  const [form, setForm] = useState<VendorInput>(initial);
  const [coverage, setCoverage] = useState("");
  const [industries, setIndustries] = useState("");
  const [files, setFiles] = useState<Partial<Record<VendorDocumentKind, File>>>({});
  const [fileErrors, setFileErrors] = useState<Partial<Record<VendorDocumentKind, string>>>({});
  const [receipt, setReceipt] = useState<VendorReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const requestKey = useRef("");
  const stageHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (receipt?.id) stageHeading.current?.focus();
  }, [receipt?.id, receipt?.submitted]);
  const uploadInputs = useRef<Partial<Record<VendorDocumentKind, HTMLInputElement | null>>>({});
  function set<K extends keyof VendorInput>(key: K, value: VendorInput[K]) { setForm(current => ({ ...current, [key]: value })); }
  function choose(kind: VendorDocumentKind, file?: File) {
    setFiles(current => ({ ...current, [kind]: undefined })); setFileErrors(current => ({ ...current, [kind]: "" }));
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) { setFileErrors(current => ({ ...current, [kind]: "Choose a PDF document." })); return; }
    if (!file.size || file.size > 2 * 1024 * 1024) { setFileErrors(current => ({ ...current, [kind]: "Choose a non-empty PDF, 2 MB or smaller." })); return; }
    setFiles(current => ({ ...current, [kind]: file }));
  }
  async function uploadAndFinish(saved: VendorReceipt) {
    if (saved.submitted) { setReceipt({ ...saved, uploadToken: null }); return; }
    let current = saved;
    for (const item of vendorDocuments) {
      const file = files[item.kind];
      if (!file || current.documents.some(document => document.kind === item.kind)) continue;
      setProgress("Uploading " + item.label.toLowerCase() + "…");
      const response = await uploadVendorDocument(current, item.kind, file);
      current = { ...current, documents: [...current.documents, response.data.document] };
      setReceipt(current);
    }
    setProgress("Submitting your application for review…");
    const response = await finishVendorApplication(current);
    setReceipt({ ...current, submitted: true, submittedAt: response.data.submittedAt, uploadToken: null });
    setFiles({});
  }
  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (busy) return;
    if (Object.values(fileErrors).some(Boolean)) { setError("Fix or remove the documents marked below before continuing."); return; }
    if (!files.COMPANY_PROFILE && !receipt?.documents.some(doc => doc.kind === "COMPANY_PROFILE")) { setError("Attach a company profile PDF before submitting."); return; }
    if (!receipt && form.serviceCategories.length === 0) { setError("Choose at least one service area."); return; }
    setBusy(true); setError(""); setProgress("Saving your company details…");
    try {
      if (receipt) await uploadAndFinish(receipt);
      else {
        if (!requestKey.current) requestKey.current = crypto.randomUUID();
        const response = await startVendorApplication({ ...form, coverage: split(coverage), industries: split(industries) }, requestKey.current);
        setReceipt(response.data);
        await uploadAndFinish(response.data);
      }
    } catch (caught) {
      const details = Object.entries(apiFieldErrors(caught)).map(([field, messages]) => field + ": " + messages.join(" ")).join(" · ");
      setError(details || (caught instanceof Error ? caught.message : "We couldn't complete your application. Please try again."));
    } finally { setBusy(false); setProgress(""); }
  }

  const documents = <div className="zb-vendor-documents">{vendorDocuments.map(item => {
    const uploaded = receipt?.documents.find(doc => doc.kind === item.kind);
    return <div className="zb-vendor-upload" key={item.kind}>
      <div><span className="zb-vendor-document-icon">{uploaded ? <Check aria-hidden="true" /> : <FileText aria-hidden="true" />}</span><div><h3>{item.label}{item.required && <span aria-hidden="true"> *</span>}</h3><p>{item.hint}</p></div></div>
      {uploaded ? <p className="zb-vendor-uploaded"><CheckCircle2 aria-hidden="true" />Attached: {uploaded.fileName}</p> : <>
        <input ref={node => { uploadInputs.current[item.kind] = node; }} type="file" accept=".pdf,application/pdf" aria-label={item.label} aria-required={item.required} disabled={busy} onChange={event => choose(item.kind, event.target.files?.[0])} />
        {(files[item.kind] || fileErrors[item.kind]) && <button type="button" className="zb-intake-add" disabled={busy} onClick={() => { choose(item.kind); const input = uploadInputs.current[item.kind]; if (input) input.value = ""; }}>Remove file</button>}
      </>}
      {fileErrors[item.kind] && <p className="zb-intake-error" role="alert">{fileErrors[item.kind]}</p>}
    </div>;
  })}</div>;

  if (receipt?.submitted) return <section className="zb-intake-success" aria-labelledby="vendor-success-title"><span className="zb-intake-success-icon"><CheckCircle2 aria-hidden="true" /></span><p className="zb-eyebrow">Application received</p><h2 id="vendor-success-title" ref={stageHeading} tabIndex={-1}>Thank you for introducing your business.</h2><p>Our team will review your capabilities and documents, and contact your nominated representative about the next steps.</p><p className="zb-intake-reference">Application reference <strong>{receipt.id}</strong></p><p>{receipt.documents.length} document{receipt.documents.length === 1 ? "" : "s"} attached. Please keep your reference for follow-up.</p><div className="zb-intake-actions"><Link className="zb-intake-button" href="/contact">Contact our team</Link><Link href="/solutions">Explore our services</Link></div></section>;
  if (receipt) return <section className="zb-intake-form" aria-labelledby="vendor-finish-title" aria-busy={busy}><div className="zb-vendor-resume"><p className="zb-eyebrow">Finish your application</p><h2 id="vendor-finish-title" ref={stageHeading} tabIndex={-1}>Your details are saved.</h2><p>Complete the document upload and submission below. We will send your application for review once this step finishes.</p><p className="zb-intake-reference">Reference <strong>{receipt.id}</strong></p><p className="zb-intake-hint">The upload receipt is valid for one hour after your details were first saved. Contact us with your reference if it expires.</p></div>{documents}{error && <p className="zb-intake-error" role="alert">{error} Your saved details and uploaded files are retained.</p>}{progress && <p role="status">{progress}</p>}<button type="button" className="zb-intake-button" disabled={busy} onClick={() => void submit()}>{busy ? <LoaderCircle aria-hidden="true" /> : <Upload aria-hidden="true" />}{busy ? "Completing submission…" : "Upload remaining documents & submit"}</button></section>;

  return <form className="zb-intake-form zb-vendor-form" onSubmit={submit} aria-busy={busy}>
    <p className="zb-intake-required">Fields marked * are required. Apply using your company details and an authorised contact.</p>
    {error && <p className="zb-intake-error" role="alert">{error} Your entries remain below.</p>}
    <fieldset disabled={busy}><legend><Building2 aria-hidden="true" />01 · Company information</legend><div className="zb-intake-fields">
      <Field label="Company / legal business name" required><input autoComplete="organization" required minLength={2} maxLength={180} value={form.companyName} onChange={e => set("companyName", e.target.value)} /></Field>
      <Field label="Type of organisation" required><select required value={form.organizationType} onChange={e => set("organizationType", e.target.value)}><option value="">Choose organisation type</option>{vendorOrganizations.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
      <Field label="Year established"><input type="number" min={1900} max={new Date().getFullYear()} value={form.establishedYear ?? ""} onChange={e => set("establishedYear", e.target.value ? Number(e.target.value) : null)} /></Field>
      <Field label="Registration number (if applicable)"><input maxLength={80} value={form.registrationNumber} onChange={e => set("registrationNumber", e.target.value)} /></Field>
      <Field label="GST / tax registration number"><input maxLength={30} value={form.gstNumber} onChange={e => set("gstNumber", e.target.value)} /></Field>
      <Field label="MSME / Udyam registration number"><input maxLength={80} value={form.msmeNumber} onChange={e => set("msmeNumber", e.target.value)} /></Field>
    </div><Field label="Business address" required><textarea autoComplete="street-address" required minLength={5} maxLength={350} rows={2} value={form.addressLine} onChange={e => set("addressLine", e.target.value)} /></Field><div className="zb-intake-fields">
      <Field label="City" required><input autoComplete="address-level2" required minLength={2} maxLength={120} value={form.city} onChange={e => set("city", e.target.value)} /></Field>
      <Field label="State / region" required><input autoComplete="address-level1" required minLength={2} maxLength={120} value={form.state} onChange={e => set("state", e.target.value)} /></Field>
      <Field label="PIN / postal code" required><input autoComplete="postal-code" required minLength={3} maxLength={12} value={form.postalCode} onChange={e => set("postalCode", e.target.value)} /></Field>
      <Field label="Country" required><input autoComplete="country-name" required minLength={2} maxLength={120} value={form.country} onChange={e => set("country", e.target.value)} /></Field>
    </div></fieldset>
    <fieldset disabled={busy}><legend><UserRound aria-hidden="true" />02 · Authorised contact</legend><div className="zb-intake-fields">
      <Field label="Contact person" required><input autoComplete="name" required minLength={2} maxLength={120} value={form.contactName} onChange={e => set("contactName", e.target.value)} /></Field>
      <Field label="Designation / role" required><input autoComplete="organization-title" required minLength={2} maxLength={100} value={form.contactRole} onChange={e => set("contactRole", e.target.value)} /></Field>
      <Field label="Business email" required><input type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={e => set("email", e.target.value)} /></Field>
      <Field label="Phone number" required><input type="tel" autoComplete="tel" required minLength={7} maxLength={24} value={form.phone} onChange={e => set("phone", e.target.value)} /></Field>
      <Field label="Alternate phone"><input type="tel" maxLength={24} value={form.alternatePhone} onChange={e => set("alternatePhone", e.target.value)} /></Field>
      <Field label="Website / portfolio URL"><input type="url" placeholder="https://" maxLength={1000} value={form.website} onChange={e => set("website", e.target.value)} /></Field>
    </div></fieldset>
    <fieldset disabled={busy}><legend><BriefcaseBusiness aria-hidden="true" />03 · Services & delivery capacity</legend><p className="zb-intake-hint">Choose at least one service area. Select every area your team can support.</p><div className="zb-vendor-check-grid">{vendorCategories.map(({ value, label, icon: Icon }) => <label key={value}><input type="checkbox" checked={form.serviceCategories.includes(value)} onChange={e => set("serviceCategories", e.target.checked ? [...form.serviceCategories, value] : form.serviceCategories.filter(item => item !== value))} /><Icon aria-hidden="true" /><span>{label}</span></label>)}</div>
      {form.serviceCategories.includes("SPECIALIZED") && <Field label="Describe your specialized services" required><textarea required minLength={10} maxLength={600} rows={2} value={form.specializedServices} onChange={e => set("specializedServices", e.target.value)} /></Field>}
      <Field label="Services and capabilities" required><textarea required minLength={30} maxLength={5000} rows={4} placeholder="Describe the work your company delivers and your areas of expertise." value={form.serviceDescription} onChange={e => set("serviceDescription", e.target.value)} /></Field>
      <div className="zb-intake-fields"><Field label="Years of relevant experience" required><input type="number" required min={0} max={100} value={form.yearsExperience} onChange={e => set("yearsExperience", Number(e.target.value))} /></Field><Field label="Team size / workforce capacity" required><input type="number" required min={1} max={1000000} value={form.teamSize} onChange={e => set("teamSize", Number(e.target.value))} /></Field></div>
      <Field label="Service locations (separate with commas)" required><input required maxLength={3600} placeholder="e.g. Delhi NCR, Uttar Pradesh, Maharashtra" value={coverage} onChange={e => setCoverage(e.target.value)} /></Field><Field label="Industries served (separate with commas)"><input maxLength={1500} placeholder="e.g. Retail, FMCG, FinTech" value={industries} onChange={e => setIndustries(e.target.value)} /></Field><Field label="Availability and delivery capacity"><textarea maxLength={1500} rows={3} placeholder="Typical mobilisation time, current availability and delivery capabilities." value={form.capacityNotes} onChange={e => set("capacityNotes", e.target.value)} /></Field>
    </fieldset>
    <fieldset disabled={busy}><legend><BadgeCheck aria-hidden="true" />04 · Experience & track record</legend><Field label="Relevant projects and experience" required><textarea required minLength={20} maxLength={5000} rows={4} placeholder="Describe relevant projects, your role and the work delivered. New businesses can describe their team's experience." value={form.projectExperience} onChange={e => set("projectExperience", e.target.value)} /></Field><Field label="Notable clients / reference work (optional)"><textarea rows={2} maxLength={1500} value={form.notableClients} onChange={e => set("notableClients", e.target.value)} /></Field></fieldset>
    <fieldset disabled={busy}><legend><FileText aria-hidden="true" />05 · Supporting documents</legend><p className="zb-intake-hint">PDF only · up to 2 MB per file · one file per category. A company profile is required.</p>{documents}<label className="zb-intake-check"><input required type="checkbox" checked={form.consent} onChange={e => set("consent", e.target.checked)} /><span>I am authorised to submit this application. I confirm the information is accurate and agree that ZOBHUNGER may store these details and documents, review our capabilities and contact us about empanelment and suitable projects.</span></label></fieldset>
    {progress && <p role="status">{progress}</p>}<button type="submit" className="zb-intake-button" disabled={busy}>{busy ? <LoaderCircle aria-hidden="true" /> : <Send aria-hidden="true" />}{busy ? "Submitting…" : "Submit vendor application"}</button>
  </form>;
}
