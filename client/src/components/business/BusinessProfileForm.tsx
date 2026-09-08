"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, LoaderCircle, MapPin, ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/api";
import { saveBusinessProfile } from "@/services/business.service";
import type { BusinessProfileInput } from "@/types/business.types";
import { useBusiness } from "./BusinessProvider";

const fields = {
  companyName: { label: "Company name", autoComplete: "organization", placeholder: "Your company or trading name", max: 160, min: 2 },
  contactPerson: { label: "Contact person", autoComplete: "name", placeholder: "Your full name", max: 100, min: 2 },
  industry: { label: "Industry", autoComplete: "off", placeholder: "e.g. Retail, FMCG or logistics", max: 100, min: 2 },
  phone: { label: "Contact phone", autoComplete: "tel", placeholder: "+91 98765 43210", max: 20, min: 8 },
  city: { label: "City", autoComplete: "address-level2", placeholder: "Your business city", max: 100, min: 2 },
  state: { label: "State / region", autoComplete: "address-level1", placeholder: "Your state or region", max: 100, min: 2 },
  website: { label: "Website (optional)", autoComplete: "url", placeholder: "https://yourcompany.com", max: 240, min: 0 },
} as const;
const steps = [{ label: "Company", icon: Building2 }, { label: "Contact", icon: MapPin }, { label: "Review", icon: CheckCircle2 }];

export function BusinessProfileForm({ editing = false, onSaved, onCancel }: { editing?: boolean; onSaved?: () => void; onCancel?: () => void }) {
  const { profile, user, updateProfile } = useBusiness();
  const router = useRouter();
  const [values, setValues] = useState<BusinessProfileInput>({ companyName: profile?.companyName ?? "", contactPerson: profile?.contactPerson ?? "", industry: profile?.industry ?? "", phone: profile?.phone ?? user.phone ?? "", city: profile?.city ?? "", state: profile?.state ?? "", website: profile?.website ?? "" });
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  function goToStep(next: number) { setStep(next); setError(""); requestAnimationFrame(() => heading.current?.focus()); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const activeFields: (keyof BusinessProfileInput)[] = editing ? Object.keys(fields) as (keyof BusinessProfileInput)[] : step === 0 ? ["companyName", "contactPerson", "industry"] : ["phone", "city", "state", "website"];
    for (const name of activeFields) {
      if (values[name].trim().length < fields[name].min) { setError(`Please enter a valid ${fields[name].label.toLowerCase()}.`); return; }
    }
    if ((!editing && step === 1) || editing) {
      if (!/^[+0-9 ()-]+$/.test(values.phone.trim())) { setError("Use numbers, spaces, +, parentheses or hyphens for the phone number."); return; }
      if (values.website && !/^https?:\/\//i.test(values.website.trim())) { setError("Start your website address with https:// or http://."); return; }
    }
    if (!editing && step < 2) { goToStep(step + 1); return; }
    setBusy(true);
    try {
      const response = await saveBusinessProfile(values);
      updateProfile(response.data.profile);
      if (editing) onSaved?.(); else router.push("/business");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        setError("Your session has ended. Sign in again to save your company details.");
      } else setError(caught instanceof ApiError ? caught.code === "VALIDATION_ERROR" ? "Please review the company and contact fields, then try again." : caught.message : "Your changes weren't saved. Check your connection and try again.");
    } finally { setBusy(false); }
  }

  function renderField(name: keyof BusinessProfileInput) {
    const field = fields[name];
    return <label className="zb-biz-field" key={name}><span>{field.label}</span><input name={name} type={name === "website" ? "url" : name === "phone" ? "tel" : "text"} autoComplete={field.autoComplete} minLength={field.min} maxLength={field.max} required={name !== "website"} placeholder={field.placeholder} value={values[name]} onChange={event => setValues(previous => ({ ...previous, [name]: event.target.value }))} /></label>;
  }
  return <div className="zb-biz-setup-grid">
    <aside className="zb-biz-setup-guide"><span className="zb-biz-icon"><Building2 aria-hidden="true" /></span><h2>{editing ? "Keep your details current." : "A few details. A better starting point."}</h2><p>Help our team understand your business and reach the right person.</p>
      <ol className="zb-biz-steps" aria-label="Company setup progress">{steps.map(({ label, icon: Icon }, index) => <li key={label} aria-current={!editing && step === index ? "step" : undefined} data-complete={!editing && step > index}><span>{!editing && step > index ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}</span><div><small>STEP 0{index + 1}</small><strong>{label}</strong></div></li>)}</ol>
      <div className="zb-biz-setup-note"><ShieldCheck aria-hidden="true" /><p>Your company profile belongs to your business account. You can update it any time.</p></div>
    </aside>
    <form className="zb-biz-card zb-biz-profile-form" onSubmit={submit} aria-busy={busy}>
      <div className="zb-biz-form-title"><p className="zb-biz-eyebrow">{editing ? "COMPANY DETAILS" : `STEP ${step + 1} OF 3`}</p><h2 ref={heading} tabIndex={-1}>{editing ? "Edit company profile" : ["Introduce your company", "Where can we reach you?", "Everything look right?"][step]}</h2><p>{editing ? "Save your changes when you're ready." : ["Start with the company and person behind this account.", "Add your business location and contact number.", "Review your details before completing setup."][step]}</p></div>
      <fieldset disabled={busy} className="zb-biz-fields">
        {(editing || step === 0) && <>{renderField("companyName")}{renderField("contactPerson")}{renderField("industry")}</>}
        {(editing || step === 1) && <>{renderField("phone")}<div className="zb-biz-field-pair">{renderField("city")}{renderField("state")}</div>{renderField("website")}</>}
        {!editing && step === 2 && <dl className="zb-biz-details">{(Object.keys(fields) as (keyof BusinessProfileInput)[]).map(name => <div key={name}><dt>{fields[name].label}</dt><dd>{values[name].trim() || "Not added"}</dd></div>)}<div><dt>Account email</dt><dd>{user.email}</dd></div></dl>}
      </fieldset>
      {error && <p className="zb-biz-error" role="alert">{error}</p>}
      <div className="zb-biz-form-actions">{editing ? <button type="button" className="zb-biz-button zb-biz-button--secondary" onClick={onCancel} disabled={busy}>Cancel</button> : step > 0 && <button type="button" className="zb-biz-button zb-biz-button--secondary" onClick={() => goToStep(step - 1)} disabled={busy}><ArrowLeft aria-hidden="true" />Back</button>}<button type="submit" className="zb-biz-button" disabled={busy}>{busy ? <LoaderCircle className="zb-biz-spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}{busy ? "Saving…" : editing ? "Save company details" : step === 2 ? "Complete company setup" : "Continue"}</button></div>
    </form>
  </div>;
}
