"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, FileText, HeartHandshake, HeartPulse, IdCard, LoaderCircle, LockKeyhole, Plus, Save, Send, ShieldCheck, Trash2, Upload, UsersRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import { getEmployeeComplianceProfile, saveEsicCompliance, submitEsicCompliance, uploadComplianceDocument, uploadFamilyPhoto } from "@/services/compliance.service";
import type { EmployeeComplianceProfile, EsicComplianceInput, EsicFamilyMember } from "@/types/compliance.types";

const blankMember = (): EsicFamilyMember => ({ nameAsAadhaar: "", relationship: "", dateOfBirth: "", residesWithEmployee: true, address: "", aadhaarNumber: "" });
const initial: EsicComplianceInput = { esiApplicable: null, esiNumber: "", nomineeName: "", nomineeRelationship: "", nomineeAddress: "", nomineeMobile: "", nomineeEmail: "", familyMembers: [] };
function Field({ label, required, wide, hint, children }: { label: string; required?: boolean; wide?: boolean; hint?: string; children: ReactNode }) { return <label className={`zhr-field${wide ? " zhr-field--wide" : ""}`}><span>{label}{required && <b> *</b>}</span>{children}{hint && <small>{hint}</small>}</label>; }
function Master({ label, value }: { label: string; value: string }) { return <div className="zcomp-master-field"><small>{label}</small><strong>{value || "—"}</strong><span>Prefilled from Employee Profile</span></div>; }
function locked(status?: string) { return Boolean(status && !["DRAFT","NEEDS_CORRECTION"].includes(status)); }

export function EsicComplianceForm() {
  const [profile, setProfile] = useState<EmployeeComplianceProfile | null>(null);
  const [form, setForm] = useState<EsicComplianceInput>(initial);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [photos, setPhotos] = useState<Record<number, File>>({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isLocked = locked(profile?.esic?.status);

  useEffect(() => { void (async () => {
    try {
      const response = await getEmployeeComplianceProfile(); const data=response.data; setProfile(data);
      setForm(data.esic ? {
        esiApplicable: data.esic.esiApplicable,
        esiNumber: data.esic.esiNumber || "",
        nomineeName: data.esic.nomineeName || "",
        nomineeRelationship: data.esic.nomineeRelationship || "",
        nomineeAddress: data.esic.nomineeAddress || "",
        nomineeMobile: data.esic.nomineeMobile || "",
        nomineeEmail: data.esic.nomineeEmail || "",
        familyMembers: data.esic.familyMembers.map(m => ({ ...m, address: m.address || "" })),
      } : initial);
    } catch (err) { setError(err instanceof ApiError ? err.message : "Unable to load ESIC details."); } finally { setBusy(false); }
  })(); }, []);

  function set<K extends keyof EsicComplianceInput>(key: K, value: EsicComplianceInput[K]) { setForm(current=>({...current,[key]:value})); }
  function memberSet<K extends keyof EsicFamilyMember>(index: number, key: K, value: EsicFamilyMember[K]) { setForm(current=>({ ...current, familyMembers: current.familyMembers.map((m,i)=>i===index?{...m,[key]:value}:m) })); }
  function addMember() { set("familyMembers", [...form.familyMembers, blankMember()]); }
  function removeMember(index: number) { set("familyMembers", form.familyMembers.filter((_m,i)=>i!==index)); setPhotos(current=>Object.fromEntries(Object.entries(current).filter(([key])=>Number(key)!==index).map(([key,value])=>[Number(key)>index?Number(key)-1:Number(key),value]))); }

  async function save(submit=false) {
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = await saveEsicCompliance(form);
      const savedMembers = saved.data.esic?.familyMembers ?? [];
      if (docFile) await uploadComplianceDocument("esic/document", docFile);
      for (const [index, file] of Object.entries(photos)) {
        const member=savedMembers[Number(index)];
        if (member?.id && profile) await uploadFamilyPhoto(profile.employee.id, member.id, file);
      }
      if (submit) await submitEsicCompliance();
      const refreshed=await getEmployeeComplianceProfile(); setProfile(refreshed.data);
      setForm(current=>({ ...current, familyMembers: refreshed.data.esic?.familyMembers.map(m=>({...m,address:m.address||""})) ?? current.familyMembers }));
      setMessage(submit?"ESIC details submitted for department review.":"ESIC draft saved securely.");
    } catch (err) { setError(err instanceof ApiError || err instanceof Error ? err.message : "Unable to save ESIC details."); } finally { setBusy(false); }
  }
  function onSubmit(event: FormEvent) { event.preventDefault(); void save(true); }
  if (busy&&!profile) return <div className="zhr-shell zcomp-loading"><LoaderCircle className="zhr-spin"/>Loading ESIC record…</div>;
  if (!profile) return <div className="zhr-shell zcomp-access-wrap"><div className="zhr-alert zhr-alert--error"><strong>Compliance access required.</strong><span>{error||"Return to the employee compliance page and verify your record."}</span><Link href="/employee-compliance">Return to compliance</Link></div></div>;
  const e=profile.employee;

  return <div className="zhr-shell"><header className="zhr-header"><div className="zhr-brand"><div className="zhr-wordmark"><div className="zhr-wordmark-name"><span>ZOB</span><b>HUNGER</b></div><div className="zhr-wordmark-tagline">Hire. Deploy. Deliver.</div></div><span className="zhr-brand-divider"/><span className="zhr-brand-context">ESIC compliance</span></div><div className="zhr-secure"><LockKeyhole/><div><strong>Private statutory record</strong><span>{e.employeeNumber}</span></div></div></header>
    <main className="zcomp-form-page"><Link className="zcomp-back" href="/employee-compliance"><ArrowLeft/>Compliance overview</Link><section className="zcomp-form-hero"><div><p className="zhr-kicker">ESIC · EMPLOYEE COMPLIANCE</p><h1>ESI & family details</h1><p>Employee identity and address data remains linked to the master joining record. Add only ESIC-specific nominee and eligible family details.</p></div><span className={`zcomp-status is-${(profile.esic?.status||"draft").toLowerCase()}`}>{profile.esic?.status?.replaceAll("_"," ")||"NOT SUBMITTED"}</span></section>
    {profile.esic?.correctionRemarks&&<div className="zcomp-correction"><strong>Correction requested by ESIC</strong><p>{profile.esic.correctionRemarks}</p></div>}{message&&<div className="zhr-alert zcomp-success"><CheckCircle2/><span>{message}</span></div>}{error&&<div className="zhr-alert zhr-alert--error"><strong>We couldn’t save this yet.</strong><span>{error}</span></div>}
    <form className="zhr-form zcomp-form" onSubmit={onSubmit}><fieldset disabled={busy||isLocked}>
      <div className="zhr-section-heading"><span className="zhr-section-icon"><IdCard/></span><div><span>MASTER RECORD</span><h2>Employee information</h2></div></div><div className="zcomp-master-grid"><Master label="Employee ID" value={e.employeeNumber}/><Master label="Employee name" value={e.fullName}/><Master label="Date of birth" value={e.dateOfBirth}/><Master label="Gender" value={e.gender}/><Master label="Mobile" value={e.phone}/><Master label="Email" value={e.personalEmail}/><Master label="Current address" value={[e.currentAddress.line1,e.currentAddress.line2,e.currentAddress.city,e.currentAddress.state,e.currentAddress.postalCode].filter(Boolean).join(", ")}/><Master label="Employee photo" value={e.joiningDocuments.some(d=>d.kind==="PHOTO")?"Available in joining record":"Not attached"}/></div>
      <div className="zhr-divider"/><div className="zhr-section-heading"><span className="zhr-section-icon"><HeartPulse/></span><div><span>ESIC</span><h2>Insurance details</h2></div></div><div className="zhr-grid"><Field label="ESIC applicable" required><select required value={form.esiApplicable===null?"":form.esiApplicable?"YES":"NO"} onChange={x=>set("esiApplicable",x.target.value===""?null:x.target.value==="YES")}><option value="">Select</option><option value="YES">Yes</option><option value="NO">No</option></select></Field>{form.esiApplicable&&<Field label="Existing ESI / insurance number" hint="Leave blank if a new number will be created"><input inputMode="numeric" maxLength={20} value={form.esiNumber} onChange={x=>set("esiNumber",x.target.value.replace(/\D/g,"").slice(0,20))}/></Field>}</div>
      {form.esiApplicable&&<><div className="zhr-divider"/><div className="zhr-section-heading"><span className="zhr-section-icon"><HeartHandshake/></span><div><span>NOMINEE</span><h2>ESI nominee details</h2></div></div><div className="zhr-grid"><Field label="Nominee name" required><input required maxLength={140} value={form.nomineeName} onChange={x=>set("nomineeName",x.target.value)}/></Field><Field label="Relationship" required><input required maxLength={80} value={form.nomineeRelationship} onChange={x=>set("nomineeRelationship",x.target.value)}/></Field><Field label="Nominee mobile" required><input required type="tel" maxLength={24} value={form.nomineeMobile} onChange={x=>set("nomineeMobile",x.target.value)}/></Field><Field label="Nominee email"><input type="email" maxLength={254} value={form.nomineeEmail} onChange={x=>set("nomineeEmail",x.target.value)}/></Field><Field label="Nominee address" required wide><textarea required rows={3} maxLength={300} value={form.nomineeAddress} onChange={x=>set("nomineeAddress",x.target.value)}/></Field></div>
      <div className="zhr-divider"/><div className="zcomp-family-head"><div className="zhr-section-heading"><span className="zhr-section-icon"><UsersRound/></span><div><span>FAMILY DETAILS</span><h2>ESI-eligible family members</h2></div></div><button type="button" onClick={addMember}><Plus/>Add family member</button></div><p className="zhr-section-copy">This follows the “Family details-ESI Eligible Emp” sheet. Add only members that need to be included for ESIC processing.</p><div className="zcomp-family-list">{form.familyMembers.length===0&&<div className="zcomp-empty">No family members added.</div>}{form.familyMembers.map((member,index)=><section className="zcomp-family-card" key={member.id||index}><header><div><span>Family member {index+1}</span><strong>{member.nameAsAadhaar||"New member"}</strong></div><button type="button" onClick={()=>removeMember(index)} aria-label={`Remove family member ${index+1}`}><Trash2/></button></header><div className="zhr-grid"><Field label="Name as per Aadhaar" required><input required maxLength={140} value={member.nameAsAadhaar} onChange={x=>memberSet(index,"nameAsAadhaar",x.target.value)}/></Field><Field label="Relationship" required><input required maxLength={80} value={member.relationship} onChange={x=>memberSet(index,"relationship",x.target.value)}/></Field><Field label="Date of birth" required><input required type="date" value={member.dateOfBirth} onChange={x=>memberSet(index,"dateOfBirth",x.target.value)}/></Field><Field label="Aadhaar number" required><input required inputMode="numeric" pattern="[0-9]{12}" maxLength={12} value={member.aadhaarNumber} onChange={x=>memberSet(index,"aadhaarNumber",x.target.value.replace(/\D/g,"").slice(0,12))}/></Field><Field label="Residing with employee?" required><select value={member.residesWithEmployee?"YES":"NO"} onChange={x=>memberSet(index,"residesWithEmployee",x.target.value==="YES")}><option value="YES">Yes</option><option value="NO">No</option></select></Field>{!member.residesWithEmployee&&<Field label="Family member address" required wide><textarea required rows={2} maxLength={300} value={member.address} onChange={x=>memberSet(index,"address",x.target.value)}/></Field>}<Field label="Family member photo" wide><label className={`zcomp-file ${photos[index]?"has-file":""}`}><Upload/><span><strong>{photos[index]?.name||"Choose photo"}</strong><small>JPG or PNG · up to 5 MB</small></span><input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={x=>{const f=x.target.files?.[0]; if(f)setPhotos(current=>({...current,[index]:f}));}}/></label></Field></div></section>)}</div></>}
      <div className="zhr-divider"/><div className="zhr-section-heading"><span className="zhr-section-icon"><FileText/></span><div><span>DOCUMENTS</span><h2>ESIC supporting document</h2></div></div><label className={`zcomp-file ${docFile?"has-file":""}`}><Upload/><span><strong>{docFile?docFile.name:"Choose ESIC supporting document"}</strong><small>PDF, JPG or PNG · up to 5 MB</small></span><input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={x=>setDocFile(x.target.files?.[0]||null)}/></label>
      <label className="zhr-check zhr-declaration"><input required type="checkbox"/><span><strong>I confirm these ESIC details are accurate.</strong><small>Family identifiers and documents are encrypted/private and available only to authorised ESIC users and Main Administration according to assigned permissions.</small></span></label>
    </fieldset><div className="zhr-actions"><button type="button" className="zhr-button zhr-button--secondary" disabled={busy||isLocked} onClick={()=>void save(false)}>{busy?<LoaderCircle className="zhr-spin"/>:<Save/>}Save draft</button><button type="submit" className="zhr-button zhr-button--submit" disabled={busy||isLocked}>{busy?<LoaderCircle className="zhr-spin"/>:<Send/>}{profile.esic?.status==="NEEDS_CORRECTION"?"Resubmit to ESIC":"Submit to ESIC"}</button></div>{isLocked&&<div className="zcomp-locked"><ShieldCheck/><span>This record is locked while ESIC reviews it. It will reopen only if a correction is requested.</span></div>}</form>
    </main></div>;
}
