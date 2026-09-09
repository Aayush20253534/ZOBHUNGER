"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch, type FieldErrors, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ClipboardList, FileCheck2, LoaderCircle, MapPin, Send, UsersRound } from "lucide-react";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { executionVisuals } from "@/data/execution-visuals";
import { ApiError } from "@/lib/api";
import { saveDraft, submitDraft } from "@/services/phase2.service";
import type { RequirementDraft } from "@/types/phase2.types";
import { createBusinessRequirement, updateBusinessRequirement } from "@/services/business.service";
import { businessRequirementFormSchema, toBusinessRequirementInput, type BusinessRequirementFormValues } from "@/schemas/business-requirement.schema";
import type { BusinessRequirementData } from "@/types/business-dashboard.types";
import type { BusinessRequirementReceipt } from "@/types/business-requirements.types";
import { useBusiness } from "./BusinessProvider";
import { businessDate, count, requirementIndustryLabel, requirementLocations, requirementServiceLabel } from "./BusinessDashboardUI";
import { BusinessRequirementFields } from "./BusinessRequirementFields";

const steps = [
  { title: "The team", copy: "Choose the service and scale of your requirement.", icon: UsersRound },
  { title: "The assignment", copy: "Give your team a place, a timeline and a clear brief.", icon: MapPin },
  { title: "Review & submit", copy: "Confirm your contact details and review the assignment.", icon: FileCheck2 },
];
const stepFields: FieldPath<BusinessRequirementFormValues>[][] = [
  ["serviceRequired", "workforceCount", "projectDuration", "industry"],
  ["locations", "expectedStartAt", "details"],
  ["companyName", "contactPerson", "businessEmail", "mobileNumber"],
];

export function BusinessRequirementForm({ initial, draft }: { initial?: BusinessRequirementData["requirement"]; draft?: RequirementDraft }) {
  const { user, profile } = useBusiness();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [savedDraft, setSavedDraft] = useState(draft);
  const [draftNotice, setDraftNotice] = useState("");
  const draftKey = useRef<string | null>(draft?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [receipt, setReceipt] = useState<BusinessRequirementReceipt | null>(null);
  const pending = useRef(false);
  const requestKey = useRef<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const form = useForm<BusinessRequirementFormValues>({ resolver: zodResolver(businessRequirementFormSchema), mode: "onBlur", defaultValues: {
    companyName: initial?.companyName ?? profile?.companyName ?? "",
    contactPerson: initial?.contactPerson ?? profile?.contactPerson ?? "",
    businessEmail: initial?.businessEmail ?? user.email,
    mobileNumber: initial?.mobileNumber ?? profile?.phone ?? "",
    industry: initial?.industry ?? profile?.industry ?? "",
    serviceRequired: initial?.serviceRequired ?? "",
    locations: initial ? requirementLocations(initial).map(name => ({ name })) : [{ name: "" }],
    projectDuration: initial?.projectDuration ?? "",
    expectedStartAt: initial?.expectedStartAt?.slice(0, 10) ?? "",
    details: initial?.details ?? "",
    ...(draft?.data ?? {}),
    workforceCount: draft ? draft.data.workforceCount ?? undefined : initial?.workforceCount,
  } });
  const values = useWatch({ control: form.control });
  const places = [...new Set((values.locations ?? []).map(row => row?.name?.trim()).filter((name): name is string => Boolean(name)))];
  const dirty = form.formState.isDirty;
  useEffect(() => {
    if (!dirty || receipt) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, receipt]);

  function moveTo(value: number) { setStep(value); requestAnimationFrame(() => heading.current?.focus()); }
  async function next() { if (await form.trigger(stepFields[step], { shouldFocus: true })) moveTo(step + 1); }
  function invalid(errors: FieldErrors<BusinessRequirementFormValues>) {
    const invalidStep = stepFields.findIndex(fields => fields.some(field => field in errors));
    if (invalidStep >= 0) {
      setStep(invalidStep);
      const field = stepFields[invalidStep].find(field => field in errors)!;
      requestAnimationFrame(() => form.setFocus(field === "locations" ? "locations.0.name" : field));
    }
  }
  async function save(values: BusinessRequirementFormValues) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(null);
    try {
      const input = toBusinessRequirementInput(values);
      requestKey.current ??= crypto.randomUUID();
      const response = initial ? await updateBusinessRequirement(initial.id, input, initial.revision) : savedDraft ? await submitDraft(savedDraft, input) : await createBusinessRequirement(input, requestKey.current);
      setReceipt(response.data);
      requestAnimationFrame(() => feedback.current?.focus());
    } catch (error) {
      setError(error instanceof Error ? error : new Error("We couldn’t save the requirement. Your entries are still here; please try again."));
      requestAnimationFrame(() => feedback.current?.focus());
    } finally { pending.current = false; setBusy(false); }
  }
  async function saveDraftNow() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(null); setDraftNotice("");
    const values = form.getValues();
    try {
      draftKey.current ??= crypto.randomUUID();
      const response = await saveDraft(draftKey.current, savedDraft?.revision ?? null, { ...values, workforceCount: Number.isFinite(values.workforceCount) ? values.workforceCount : null });
      setSavedDraft(response.data); form.reset(values); setDraftNotice("Draft saved to your business account. You can continue from Saved drafts.");
    } catch (error) { setError(error instanceof Error ? error : new Error("Draft could not be saved. Your entries are still here.")); }
    finally { pending.current = false; setBusy(false); }
  }
  function cancel() {
    if (dirty && !window.confirm("Leave this form? Your unsaved changes will be lost.")) return;
    router.push(initial ? `/business/requirements/${initial.id}` : "/business/requirements");
  }
  const changed = error instanceof ApiError && ["REQUIREMENT_CHANGED", "REQUIREMENT_CLOSED", "DRAFT_CHANGED"].includes(error.code ?? "");
  const expired = error instanceof ApiError && (error.status === 401 || error.status === 403);

  if (receipt) return <div className="zb-dash zb-req"><div ref={feedback} tabIndex={-1} className="zb-biz-card zb-req-success" role="status"><span className="zb-req-success-icon"><CheckCircle2 aria-hidden="true" /></span><p className="zb-biz-eyebrow">{initial ? "BRIEF SAVED" : "REQUIREMENT RECEIVED"}</p><h1>{initial ? "Your brief is up to date." : "Your next team has a starting point."}</h1><p>{initial ? receipt.changed === false ? "There were no changes to save. Your request keeps its current status." : "Your changes are saved and the requirement is back in New for review." : "Your requirement is saved in your business workspace. Follow its recorded updates from the brief."}</p><span className="zb-req-receipt-id">Reference: {receipt.id}</span><div className="zb-biz-actions"><Link className="zb-biz-button" href={`/business/requirements/${receipt.id}`}>View requirement<ArrowRight aria-hidden="true" /></Link><Link className="zb-biz-button zb-biz-button--secondary" href="/business/requirements">All requirements</Link></div></div></div>;

  const StepIcon = steps[step].icon;
  return <div className="zb-dash zb-req">
    <button className="zb-biz-text-link zb-req-back" type="button" disabled={busy} onClick={cancel}><ArrowLeft aria-hidden="true" />{initial ? "Back to brief" : "Back to requirements"}</button>
    <header className="zb-dash-heading"><div><p className="zb-biz-eyebrow">{initial ? "KEEP YOUR BRIEF CURRENT" : "LET’S BUILD YOUR NEXT TEAM"}</p><h1>{initial ? "Update your requirement." : "Tell us the work. We’ll take it forward."}</h1><p>Three clear steps to bring the people, locations and assignment together.</p></div></header>
    <ol className="zb-req-steps" aria-label="Requirement form progress">{steps.map((item, index) => <li key={item.title} aria-current={step === index ? "step" : undefined} data-complete={step > index}><span>{step > index ? <Check aria-hidden="true" /> : String(index + 1).padStart(2, "0")}</span><div><small>STEP {index + 1}</small><strong>{item.title}</strong></div></li>)}</ol>
    <div className="zb-req-editor-grid"><form className="zb-biz-card zb-req-form" noValidate aria-label={initial ? "Edit business requirement" : "New business requirement"} aria-busy={busy} onSubmit={event => { event.preventDefault(); if (step < 2) void next(); else void form.handleSubmit(save, invalid)(); }}>
      <div className="zb-req-form-heading"><span className="zb-biz-icon"><StepIcon aria-hidden="true" /></span><div><h2 ref={heading} tabIndex={-1}>{steps[step].title}</h2><p>{steps[step].copy}</p></div></div>
      {!initial && <div className="zb-req-draft-actions"><button type="button" className="zb-biz-button zb-biz-button--secondary" disabled={busy || changed || expired} onClick={() => void saveDraftNow()}>Save draft</button><Link className="zb-biz-text-link" href="/business/requirements/drafts">Saved drafts</Link>{draftNotice && <p role="status">{draftNotice}</p>}{changed && savedDraft && <a className="zb-biz-text-link" href={`/business/requirements/drafts/${savedDraft.id}`}>Reload saved draft</a>}</div>}
      {initial && <p className="zb-req-edit-note">Saving a changed brief returns this open request to New so our team can review it again.</p>}
      {error && <div className="zb-req-form-error" ref={feedback} tabIndex={-1} role="alert"><strong>{changed ? "A newer update needs your attention" : "We couldn’t finish saving"}</strong><p>{error.message}</p>{changed && initial ? <Link className="zb-biz-text-link" href={`/business/requirements/${initial.id}`}>Open the latest brief<ArrowRight aria-hidden="true" /></Link> : expired ? <Link className="zb-biz-text-link" href={`/business/login?next=${encodeURIComponent(initial ? `/business/requirements/${initial.id}/edit` : "/business/requirements/new")}`}>Business sign in<ArrowRight aria-hidden="true" /></Link> : <Link className="zb-biz-text-link" href="/business/requirements">View your requirements<ArrowRight aria-hidden="true" /></Link>}</div>}
      <fieldset className="zb-req-form-fields" disabled={busy}><legend className="zb-dash-sr-only">{steps[step].title}</legend><BusinessRequirementFields step={step} form={form} />
        {step === 2 && <section className="zb-req-review" aria-label="Review assignment"><div><ClipboardList aria-hidden="true" /><h3>Your assignment at a glance</h3></div><dl><div><dt>Service</dt><dd>{requirementServiceLabel(values.serviceRequired ?? "")}</dd></div><div><dt>Industry</dt><dd>{requirementIndustryLabel(values.industry ?? "")}</dd></div><div><dt>People & duration</dt><dd>{count(values.workforceCount ?? 0)} people · {values.projectDuration}</dd></div><div><dt>Locations</dt><dd>{places.join(", ")}</dd></div><div><dt>Expected start</dt><dd>{values.expectedStartAt ? businessDate(`${values.expectedStartAt}T00:00:00Z`) : "To be discussed"}</dd></div></dl><details><summary>Read your full assignment brief</summary><p>{values.details}</p></details></section>}
        <div className="zb-req-form-actions"><button type="button" className="zb-biz-button zb-biz-button--secondary" onClick={() => step > 0 ? moveTo(step - 1) : cancel()}><ArrowLeft aria-hidden="true" />{step > 0 ? "Back" : "Cancel"}</button>{step < 2 ? <button type="button" className="zb-biz-button" onClick={() => void next()}>Continue<ArrowRight aria-hidden="true" /></button> : <button type="submit" className="zb-biz-button" disabled={busy || changed || expired}>{busy ? <LoaderCircle aria-hidden="true" className="zb-biz-spin" /> : <Send aria-hidden="true" />}{busy ? "Saving requirement…" : initial ? "Save changes" : "Submit requirement"}</button>}</div>
      </fieldset><p className="zb-req-form-footnote">Your entries stay here as you move between steps. Save before leaving the form.</p>
    </form><aside className="zb-req-form-side" aria-label="Requirement preview"><figure><ExecutionImage visual={executionVisuals["workforce-hiring"]} sizes="(max-width: 900px) 340px, 300px" /><figcaption>AI-generated illustration</figcaption></figure><div className="zb-req-form-side-copy"><p className="zb-biz-eyebrow">YOUR NEXT TEAM</p><h2>{values.serviceRequired ? requirementServiceLabel(values.serviceRequired) : "A brief that brings the work to life."}</h2><div className="zb-req-preview-people"><UsersRound aria-hidden="true" /><strong>{Number.isFinite(values.workforceCount) ? count(values.workforceCount!) : "—"}</strong><span>people requested</span></div><p><MapPin aria-hidden="true" />{places.length ? `${places.length} ${places.length === 1 ? "location" : "locations"} added` : "Add your work locations"}</p><p><CalendarDays aria-hidden="true" />{values.projectDuration || "Add the project duration"}</p><div className="zb-req-side-note"><FileCheck2 aria-hidden="true" /><span>A useful brief describes the work, skills, shifts and people needed in each location.</span></div></div></aside></div>
  </div>;
}
