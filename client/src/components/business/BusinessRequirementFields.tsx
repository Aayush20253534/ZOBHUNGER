"use client";

import { useState, type ReactNode } from "react";
import { Controller, useFieldArray, type UseFormReturn } from "react-hook-form";
import { BriefcaseBusiness, ClipboardList, MapPin, Megaphone, Plus, Settings2, Shapes, Sparkles, Store, Trash2, TrendingUp, UsersRound } from "lucide-react";
import { industries } from "@/data/industries";
import { workforceSolutions } from "@/data/solutions";
import type { BusinessRequirementFormValues } from "@/schemas/business-requirement.schema";

const serviceIcons = [UsersRound, TrendingUp, Megaphone, Store, Sparkles, Settings2, BriefcaseBusiness];
export function RequirementField({ label, id, required = false, error, hint, children }: { label: string; id: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return <div className="zb-req-field"><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>{children}{hint && <p id={`${id}-hint`} className="zb-req-hint">{hint}</p>}{error && <p id={`${id}-error`} className="zb-req-field-error" role="alert">{error}</p>}</div>;
}

export function BusinessRequirementFields({ step, form }: { step: number; form: UseFormReturn<BusinessRequirementFormValues> }) {
  const { register, control, getValues, setFocus, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "locations" });
  const [customService, setCustomService] = useState(() => {
    const value = getValues("serviceRequired");
    return Boolean(value) && !workforceSolutions.some(service => service.slug === value || service.label === value);
  });
  const described = (id: string, error?: string, hint?: boolean) => [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

  if (step === 0) return <>
    <fieldset className="zb-req-service-field"><legend>What kind of team do you need? <span aria-hidden="true">*</span></legend><Controller name="serviceRequired" control={control} render={({ field }) => <>
      <div className="zb-req-service-options">{workforceSolutions.map((service, index) => {
        const Icon = serviceIcons[index] ?? ClipboardList;
        return <label key={service.slug}><input ref={index === 0 && !customService ? field.ref : undefined} type="radio" name="requirement-service" value={service.slug} checked={!customService && (field.value === service.slug || field.value === service.label)} onBlur={field.onBlur} onChange={() => { setCustomService(false); field.onChange(service.slug); }} aria-describedby={errors.serviceRequired ? "req-service-error" : undefined} /><span><Icon aria-hidden="true" /><strong>{service.label}</strong></span></label>;
      })}<label><input type="radio" name="requirement-service" checked={customService} onChange={() => { setCustomService(true); field.onChange(""); }} /><span><Shapes aria-hidden="true" /><strong>Other service</strong></span></label></div>
      {customService && <RequirementField label="Describe the service" id="req-service" required error={errors.serviceRequired?.message}><input {...field} id="req-service" maxLength={160} placeholder="For example, seller onboarding" aria-required="true" aria-invalid={Boolean(errors.serviceRequired)} aria-describedby={described("req-service", errors.serviceRequired?.message)} /></RequirementField>}
    </>} />{!customService && errors.serviceRequired && <p id="req-service-error" className="zb-req-field-error" role="alert">{errors.serviceRequired.message}</p>}</fieldset>
    <div className="zb-req-field-pair"><RequirementField id="req-people" label="Total people required" required error={errors.workforceCount?.message} hint="Total across all requested locations."><input id="req-people" type="number" inputMode="numeric" min={1} max={1000000} step={1} {...register("workforceCount", { valueAsNumber: true })} aria-required="true" aria-invalid={Boolean(errors.workforceCount)} aria-describedby={described("req-people", errors.workforceCount?.message, true)} /></RequirementField>
      <RequirementField id="req-duration" label="Project duration" required error={errors.projectDuration?.message}><input id="req-duration" {...register("projectDuration")} maxLength={160} placeholder="3 months, ongoing or project-based" aria-required="true" aria-invalid={Boolean(errors.projectDuration)} aria-describedby={described("req-duration", errors.projectDuration?.message)} /></RequirementField></div>
    <RequirementField id="req-industry" label="Your industry" required error={errors.industry?.message} hint="Choose a suggestion or enter your industry."><input id="req-industry" list="requirement-industries" {...register("industry")} maxLength={120} placeholder="For example, Retail" aria-required="true" aria-invalid={Boolean(errors.industry)} aria-describedby={described("req-industry", errors.industry?.message, true)} /><datalist id="requirement-industries">{industries.map(industry => <option key={industry.slug} value={industry.title} />)}</datalist></RequirementField>
  </>;

  if (step === 1) return <>
    <div className="zb-req-section-label"><MapPin aria-hidden="true" /><div><h3>Where will your team work?</h3><p>Add a city, area or site for each location.</p></div><span>{fields.length}/50</span></div>
    <div className="zb-req-location-fields">{fields.map((field, index) => <div key={field.id}><RequirementField label={`Location ${index + 1}`} id={`req-location-${index}`} required error={errors.locations?.[index]?.name?.message}><input id={`req-location-${index}`} {...register(`locations.${index}.name`)} maxLength={180} placeholder="City, area or site" aria-required="true" aria-invalid={Boolean(errors.locations?.[index]?.name)} aria-describedby={described(`req-location-${index}`, errors.locations?.[index]?.name?.message)} /></RequirementField>{fields.length > 1 && <button type="button" className="zb-req-remove-location" aria-label={`Remove location ${index + 1}`} onClick={() => { remove(index); requestAnimationFrame(() => setFocus(`locations.${Math.max(0, index - 1)}.name`)); }}><Trash2 aria-hidden="true" /></button>}</div>)}</div>
    <button type="button" className="zb-biz-text-link zb-req-add-location" disabled={fields.length >= 50} onClick={() => append({ name: "" })}><Plus aria-hidden="true" />Add another location</button>
    <RequirementField label="Expected start date" id="req-start" error={errors.expectedStartAt?.message} hint="Optional. Leave blank if the date is still being decided."><input id="req-start" type="date" {...register("expectedStartAt")} aria-invalid={Boolean(errors.expectedStartAt)} aria-describedby={described("req-start", errors.expectedStartAt?.message, true)} /></RequirementField>
    <RequirementField label="The work to be done" id="req-details" required error={errors.details?.message} hint="Include responsibilities, skills, shifts and the team split across locations."><textarea id="req-details" {...register("details")} rows={5} maxLength={6000} placeholder="For example: 20 field executives in Delhi and 10 in Noida for seller onboarding, six days a week…" aria-required="true" aria-invalid={Boolean(errors.details)} aria-describedby={described("req-details", errors.details?.message, true)} /></RequirementField>
  </>;

  return <><p className="zb-req-contact-intro">We’ve filled in available company details. Confirm who our team should contact for this assignment.</p><div className="zb-req-field-pair">
    <RequirementField label="Company name" id="req-company" required error={errors.companyName?.message}><input id="req-company" {...register("companyName")} maxLength={160} autoComplete="organization" aria-required="true" aria-invalid={Boolean(errors.companyName)} aria-describedby={described("req-company", errors.companyName?.message)} /></RequirementField>
    <RequirementField label="Contact person" id="req-contact" required error={errors.contactPerson?.message}><input id="req-contact" {...register("contactPerson")} maxLength={120} autoComplete="name" aria-required="true" aria-invalid={Boolean(errors.contactPerson)} aria-describedby={described("req-contact", errors.contactPerson?.message)} /></RequirementField>
    <RequirementField label="Business email" id="req-email" required error={errors.businessEmail?.message}><input id="req-email" {...register("businessEmail")} type="email" autoComplete="email" maxLength={254} aria-required="true" aria-invalid={Boolean(errors.businessEmail)} aria-describedby={described("req-email", errors.businessEmail?.message)} /></RequirementField>
    <RequirementField label="Mobile number" id="req-phone" required error={errors.mobileNumber?.message}><input id="req-phone" {...register("mobileNumber")} type="tel" autoComplete="tel" maxLength={24} aria-required="true" aria-invalid={Boolean(errors.mobileNumber)} aria-describedby={described("req-phone", errors.mobileNumber?.message)} /></RequirementField>
  </div></>;
}
