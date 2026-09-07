"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { ActionButton } from "@/components/common/ActionButton";
import { FeedbackMessage } from "@/components/common/FeedbackMessage";
import { SelectField, TextAreaField, TextField } from "@/components/forms/Fields";
import { placementCellApplicationSchema, type PlacementCellApplicationInput } from "@/schemas/placement-cell-application.schema";
import { submitPlacementCellApplication } from "@/services/placement-cells.service";

const opportunityOptions = [
  ["jobs", "Jobs"], ["internships", "Internships"], ["freelance", "Freelance Work"],
  ["apprenticeship", "Apprenticeship"], ["part-time", "Part-Time Work"], ["full-time", "Full-Time Work"],
  ["remote", "Remote Work"], ["hybrid", "Hybrid Work"], ["training", "Training"], ["certification", "Certification"],
] as const;

const emptyValues: PlacementCellApplicationInput = {
  institutionName: "", institutionType: "college", placementCellName: "", contactPersonName: "", designation: "",
  officialEmail: "", mobileNumber: "", city: "", state: "", website: "", numberOfStudents: 0,
  coursesDepartments: "", preferredOpportunityTypes: [],
};

export function PlacementCellApplicationForm() {
  const [status, setStatus] = React.useState<{type:"idle"}|{type:"submitting"}|{type:"success";id:string}|{type:"error";message:string}>({type:"idle"});
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<PlacementCellApplicationInput>({
    resolver: zodResolver(placementCellApplicationSchema), defaultValues: emptyValues, mode: "onBlur",
  });
  const busy = status.type === "submitting";

  async function submit(values: PlacementCellApplicationInput) {
    setStatus({type:"submitting"});
    try {
      const response = await submitPlacementCellApplication(values);
      setStatus({type:"success", id:response.data.id});
      reset(emptyValues);
    } catch (error) {
      setStatus({type:"error", message:error instanceof Error ? error.message : "We couldn't submit the onboarding request. Please try again."});
    }
  }

  if (status.type === "success") return (
    <div className="zb-placement-form-success" role="status">
      <CheckCircle2 aria-hidden="true" />
      <div><span className="zb-eyebrow">Onboarding request received</span><h2>Thank you for partnering with ZOBHUNGER.</h2>
      <p>Our team will review your institution details. Portal login access is provided only after approval and onboarding.</p><small>Reference: {status.id}</small></div>
    </div>
  );

  return <form className="zb-placement-application-form" noValidate aria-busy={busy} onSubmit={handleSubmit(submit)}>
    {status.type === "error" && <FeedbackMessage tone="error" title="We couldn't submit your request">{status.message}</FeedbackMessage>}
    <fieldset disabled={busy} className="zb-form-fieldset"><legend className="sr-only">Placement Cell onboarding form</legend>
      <fieldset className="zb-form-group"><legend><span>01</span> Institution details</legend><div className="zb-form-grid">
        <TextField label="Institution Name" required autoComplete="organization" error={errors.institutionName?.message} {...register("institutionName")} />
        <Controller name="institutionType" control={control} render={({field}) => <SelectField label="Institution Type" required name={field.name} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} inputRef={field.ref} disabled={busy} options={[{value:"college",label:"College"},{value:"university",label:"University"},{value:"training-institute",label:"Training Institute"},{value:"other",label:"Other Institution"}]} error={errors.institutionType?.message} />} />
        <TextField label="Placement Cell Name" required error={errors.placementCellName?.message} {...register("placementCellName")} />
        <TextField label="Website" type="url" placeholder="https://institution.edu" error={errors.website?.message} {...register("website")} />
        <TextField label="City" required autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
        <TextField label="State" required autoComplete="address-level1" error={errors.state?.message} {...register("state")} />
      </div></fieldset>
      <fieldset className="zb-form-group"><legend><span>02</span> Authorized contact</legend><div className="zb-form-grid">
        <TextField label="Contact Person Name" required autoComplete="name" error={errors.contactPersonName?.message} {...register("contactPersonName")} />
        <TextField label="Designation" required error={errors.designation?.message} {...register("designation")} />
        <TextField label="Official Email Address" required type="email" autoComplete="email" error={errors.officialEmail?.message} {...register("officialEmail")} />
        <TextField label="Mobile Number" required type="tel" autoComplete="tel" error={errors.mobileNumber?.message} {...register("mobileNumber")} />
      </div></fieldset>
      <fieldset className="zb-form-group"><legend><span>03</span> Students and opportunities</legend><div className="zb-form-grid">
        <TextField label="Number of Students" required type="number" min={1} max={1000000} step={1} error={errors.numberOfStudents?.message} {...register("numberOfStudents", {valueAsNumber:true})} />
        <div className="zb-form-full"><TextAreaField label="Courses / Departments Available" required rows={3} placeholder="For example: B.Tech CSE, BBA, MBA, Diploma..." error={errors.coursesDepartments?.message} {...register("coursesDepartments")} /></div>
      </div><div className="zb-placement-checkbox-field"><span className="zb-placement-checkbox-label">Preferred Opportunity Types <b>*</b></span><div className="zb-placement-checkbox-grid">
        {opportunityOptions.map(([value,label]) => <label key={value}><input type="checkbox" value={value} {...register("preferredOpportunityTypes")} /><span>{label}</span></label>)}
      </div>{errors.preferredOpportunityTypes?.message && <p className="zb-field-error" role="alert">{errors.preferredOpportunityTypes.message}</p>}</div></fieldset>
      <div className="zb-placement-form-note"><strong>Approval required.</strong><span>Submitting institution details does not create portal access. ZOBHUNGER reviews each request before approved Placement Cell credentials are provisioned.</span></div>
      <div className="zb-form-actions"><ActionButton type="submit" disabled={busy}>{busy ? "Submitting..." : "Submit for Placement Cell Onboarding"}</ActionButton></div>
    </fieldset>
  </form>;
}
