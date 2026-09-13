"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Banknote, Building2, CheckCircle2, FileText, IdCard, Landmark, LoaderCircle, LockKeyhole, Save, Send, ShieldCheck, Upload } from "lucide-react";
import { ApiError } from "@/lib/api";
import { getEmployeeComplianceProfile, savePfCompliance, submitPfCompliance, uploadComplianceDocument } from "@/services/compliance.service";
import type { EmployeeComplianceProfile, PfComplianceInput } from "@/types/compliance.types";

const initial: PfComplianceInput = { appointmentDate: "", epfWages: null, monthlyGross: null, department: "", designation: "", husbandName: "", presentDistrict: "", permanentDistrict: "", bankAccountType: "", existingUanNumber: "" };
function money(value: string) { return value === "" ? null : Math.max(0, Math.round(Number(value) || 0)); }
function Field({ label, required, wide, hint, children }: { label: string; required?: boolean; wide?: boolean; hint?: string; children: ReactNode }) { return <label className={`zhr-field${wide ? " zhr-field--wide" : ""}`}><span>{label}{required && <b> *</b>}</span>{children}{hint && <small>{hint}</small>}</label>; }
function Master({ label, value }: { label: string; value: string }) { return <div className="zcomp-master-field"><small>{label}</small><strong>{value || "—"}</strong><span>Prefilled from Employee Profile</span></div>; }
function locked(status?: string) { return Boolean(status && !["DRAFT","NEEDS_CORRECTION"].includes(status)); }

export function PfComplianceForm() {
  const [profile, setProfile] = useState<EmployeeComplianceProfile | null>(null);
  const [form, setForm] = useState<PfComplianceInput>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isLocked = locked(profile?.pf?.status);

  useEffect(() => { void (async () => {
    try {
      const response = await getEmployeeComplianceProfile(); const data = response.data; setProfile(data);
      setForm({
        appointmentDate: data.pf?.appointmentDate || data.employee.offer?.joiningDate || "",
        epfWages: data.pf?.epfWages ?? null,
        monthlyGross: data.pf?.monthlyGross ?? data.employee.offer?.monthlyGrossSalary ?? null,
        department: data.pf?.department || data.employee.offer?.department || "",
        designation: data.pf?.designation || data.employee.offer?.designation || "",
        husbandName: data.pf?.husbandName || "",
        presentDistrict: data.pf?.presentDistrict || "",
        permanentDistrict: data.pf?.permanentDistrict || "",
        bankAccountType: (data.pf?.bankAccountType as PfComplianceInput["bankAccountType"]) || "",
        existingUanNumber: data.pf?.existingUanNumber || data.employee.uanNumber || "",
      });
    } catch (err) { setError(err instanceof ApiError ? err.message : "Unable to load PF / EPFO details."); } finally { setBusy(false); }
  })(); }, []);

  const missing = useMemo(() => [!form.appointmentDate && "appointment date", form.epfWages === null && "EPF wages", form.monthlyGross === null && "monthly gross", !form.department && "department", !form.designation && "designation", !form.presentDistrict && "present district", !form.permanentDistrict && "permanent district", !form.bankAccountType && "bank account type"].filter(Boolean) as string[], [form]);
  function set<K extends keyof PfComplianceInput>(key: K, value: PfComplianceInput[K]) { setForm(current => ({ ...current, [key]: value })); }

  async function save(submit = false) {
    setBusy(true); setError(""); setMessage("");
    try {
      await savePfCompliance(form);
      if (file) await uploadComplianceDocument("pf/document", file);
      if (submit) {
        if (missing.length) throw new Error(`Complete ${missing.join(", ")} before submitting.`);
        await submitPfCompliance();
      }
      const refreshed = await getEmployeeComplianceProfile(); setProfile(refreshed.data);
      setMessage(submit ? "PF / EPFO details submitted for department review." : "PF / EPFO draft saved securely.");
    } catch (err) { setError(err instanceof ApiError || err instanceof Error ? err.message : "Unable to save PF / EPFO details."); } finally { setBusy(false); }
  }

  function onSubmit(event: FormEvent) { event.preventDefault(); void save(true); }
  if (busy && !profile) return <div className="zhr-shell zcomp-loading"><LoaderCircle className="zhr-spin" />Loading PF / EPFO record…</div>;
  if (!profile) return <div className="zhr-shell zcomp-access-wrap"><div className="zhr-alert zhr-alert--error"><strong>Compliance access required.</strong><span>{error || "Return to the employee compliance page and verify your record."}</span><Link href="/employee-compliance">Return to compliance</Link></div></div>;
  const e = profile.employee;

  return <div className="zhr-shell"><header className="zhr-header"><div className="zhr-brand"><div className="zhr-wordmark"><div className="zhr-wordmark-name"><span>ZOB</span><b>HUNGER</b></div><div className="zhr-wordmark-tagline">Hire. Deploy. Deliver.</div></div><span className="zhr-brand-divider" /><span className="zhr-brand-context">PF / EPFO compliance</span></div><div className="zhr-secure"><LockKeyhole /><div><strong>Private statutory record</strong><span>{e.employeeNumber}</span></div></div></header>
    <main className="zcomp-form-page"><Link className="zcomp-back" href="/employee-compliance"><ArrowLeft />Compliance overview</Link><section className="zcomp-form-hero"><div><p className="zhr-kicker">PF / EPFO · EMPLOYEE COMPLIANCE</p><h1>Provident Fund details</h1><p>Common identity, address and bank data is securely pulled from your approved Employee Joining record. Complete only the PF-specific fields below.</p></div><span className={`zcomp-status is-${(profile.pf?.status || "draft").toLowerCase()}`}>{profile.pf?.status?.replaceAll("_", " ") || "NOT SUBMITTED"}</span></section>
    {profile.pf?.correctionRemarks && <div className="zcomp-correction"><strong>Correction requested by PF / EPFO</strong><p>{profile.pf.correctionRemarks}</p></div>}{message && <div className="zhr-alert zcomp-success"><CheckCircle2 /><span>{message}</span></div>}{error && <div className="zhr-alert zhr-alert--error"><strong>We couldn’t save this yet.</strong><span>{error}</span></div>}
    <form className="zhr-form zcomp-form" onSubmit={onSubmit}><fieldset disabled={busy || isLocked}>
      <div className="zhr-section-heading"><span className="zhr-section-icon"><IdCard /></span><div><span>MASTER RECORD</span><h2>Employee information</h2></div></div><p className="zhr-section-copy">These values remain linked to your Employee Joining record and are not duplicated into a second employee database.</p><div className="zcomp-master-grid"><Master label="Employee ID" value={e.employeeNumber}/><Master label="Name as per record" value={e.fullName}/><Master label="Aadhaar" value={e.aadhaarNumber.replace(/^(\d{8})/, "XXXX XXXX ")}/><Master label="PAN" value={e.panNumber}/><Master label="Date of birth" value={e.dateOfBirth}/><Master label="Mobile" value={e.phone}/><Master label="Email" value={e.personalEmail}/><Master label="Father / guardian" value={e.fatherGuardianName}/></div>
      <div className="zhr-divider"/><div className="zhr-section-heading"><span className="zhr-section-icon"><Landmark /></span><div><span>PF / EPFO</span><h2>Employment & provident fund</h2></div></div><div className="zhr-grid"><Field label="Date of appointment" required><input type="date" required value={form.appointmentDate} onChange={x=>set("appointmentDate",x.target.value)}/></Field><Field label="Department" required><input required maxLength={140} value={form.department} onChange={x=>set("department",x.target.value)}/></Field><Field label="Designation" required><input required maxLength={140} value={form.designation} onChange={x=>set("designation",x.target.value)}/></Field><Field label="Monthly gross (INR)" required><input type="number" min={0} value={form.monthlyGross ?? ""} onChange={x=>set("monthlyGross",money(x.target.value))}/></Field><Field label="EPF wages (Gross - HRA)" required><input type="number" min={0} value={form.epfWages ?? ""} onChange={x=>set("epfWages",money(x.target.value))}/></Field><Field label="Existing UAN" hint="12 digits, if already allotted"><input inputMode="numeric" pattern="[0-9]{12}" maxLength={12} value={form.existingUanNumber} onChange={x=>set("existingUanNumber",x.target.value.replace(/\D/g,"").slice(0,12))}/></Field><Field label="Husband's name" hint="If applicable"><input maxLength={140} value={form.husbandName} onChange={x=>set("husbandName",x.target.value)}/></Field></div>
      <div className="zhr-divider"/><div className="zhr-section-heading"><span className="zhr-section-icon"><Building2 /></span><div><span>ADDRESS</span><h2>Excel-required district fields</h2></div></div><div className="zcomp-address-preview"><div><b>Present address</b><p>{[e.currentAddress.line1,e.currentAddress.line2,e.currentAddress.city,e.currentAddress.state,e.currentAddress.postalCode].filter(Boolean).join(", ")}</p></div><div><b>Permanent address</b><p>{[e.permanentAddress.line1,e.permanentAddress.line2,e.permanentAddress.city,e.permanentAddress.state,e.permanentAddress.postalCode].filter(Boolean).join(", ")}</p></div></div><div className="zhr-grid"><Field label="Present district" required><input required maxLength={120} value={form.presentDistrict} onChange={x=>set("presentDistrict",x.target.value)}/></Field><Field label="Permanent district" required><input required maxLength={120} value={form.permanentDistrict} onChange={x=>set("permanentDistrict",x.target.value)}/></Field></div>
      <div className="zhr-divider"/><div className="zhr-section-heading"><span className="zhr-section-icon"><Banknote /></span><div><span>BANK</span><h2>Bank details</h2></div></div><div className="zcomp-master-grid"><Master label="Account holder" value={e.bankAccountHolder}/><Master label="Bank" value={e.bankName}/><Master label="Account number" value={`•••• ${e.bankAccountNumber.slice(-4)}`}/><Master label="IFSC" value={e.ifscCode}/></div><div className="zhr-grid"><Field label="Account type" required><select required value={form.bankAccountType} onChange={x=>set("bankAccountType",x.target.value as PfComplianceInput["bankAccountType"])}><option value="">Select account type</option><option value="SAVINGS">Savings</option><option value="CURRENT">Current</option></select></Field></div>
      <div className="zhr-divider"/><div className="zhr-section-heading"><span className="zhr-section-icon"><FileText /></span><div><span>DOCUMENTS</span><h2>PF supporting document</h2></div></div><p className="zhr-section-copy">Aadhaar, PAN and bank proof already attached during joining remain available to authorised compliance staff. Add a PF/UAN supporting document only if relevant.</p><label className={`zcomp-file ${file ? "has-file" : ""}`}><Upload/><span><strong>{file ? file.name : "Choose PF / UAN document"}</strong><small>PDF, JPG or PNG · up to 5 MB</small></span><input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={x=>setFile(x.target.files?.[0]||null)}/></label>
      <label className="zhr-check zhr-declaration"><input required type="checkbox"/><span><strong>I confirm the PF / EPFO information is accurate.</strong><small>This information is available only to authorised PF / EPFO users and Main Administration according to assigned permissions.</small></span></label>
    </fieldset><div className="zhr-actions"><button type="button" className="zhr-button zhr-button--secondary" disabled={busy || isLocked} onClick={()=>void save(false)}>{busy?<LoaderCircle className="zhr-spin"/>:<Save/>}Save draft</button><button type="submit" className="zhr-button zhr-button--submit" disabled={busy || isLocked}>{busy?<LoaderCircle className="zhr-spin"/>:<Send/>}{profile.pf?.status==="NEEDS_CORRECTION"?"Resubmit to PF / EPFO":"Submit to PF / EPFO"}</button></div>{isLocked&&<div className="zcomp-locked"><ShieldCheck/><span>This record is locked while PF / EPFO reviews it. It will reopen only if a correction is requested.</span></div>}</form>
    </main></div>;
}
