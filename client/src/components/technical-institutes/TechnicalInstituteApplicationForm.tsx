"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { ActionButton } from "@/components/common/ActionButton";
import { FeedbackMessage } from "@/components/common/FeedbackMessage";
import { SelectField, TextAreaField, TextField } from "@/components/forms/Fields";
import {
  technicalInstituteApplicationSchema,
  type TechnicalInstituteApplicationInput,
} from "@/schemas/technical-institute-application.schema";
import { submitTechnicalInstituteApplication } from "@/services/technical-institutes.service";

const partnershipOptions = [
  ["jobs", "Jobs"],
  ["internships", "Internships"],
  ["apprenticeships", "Apprenticeships"],
  ["training", "Training Programs"],
  ["campus-hiring", "Campus Hiring"],
  ["technical-recruitment-drives", "Technical Recruitment Drives"],
  ["industry-visits", "Industry Visits"],
  ["skill-development", "Skill Development Programs"],
] as const;

const emptyValues: TechnicalInstituteApplicationInput = {
  institutionName: "",
  institutionType: "iti",
  ownershipType: "government",
  affiliationBody: "ncvt",
  affiliationNumber: "",
  website: "",
  district: "",
  city: "",
  state: "",
  postalCode: "",
  contactPersonName: "",
  designation: "",
  officialEmail: "",
  mobileNumber: "",
  alternateNumber: "",
  totalStudents: 0,
  finalYearStudents: 0,
  passingYear: "",
  tradesBranches: "",
  preferredOpportunityTypes: [],
  technicalHiringNotes: "",
};

type SubmissionState =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success"; id: string }
  | { type: "error"; message: string };

export function TechnicalInstituteApplicationForm() {
  const [status, setStatus] = React.useState<SubmissionState>({ type: "idle" });
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TechnicalInstituteApplicationInput>({
    resolver: zodResolver(technicalInstituteApplicationSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });

  const busy = status.type === "submitting";

  async function submit(values: TechnicalInstituteApplicationInput) {
    setStatus({ type: "submitting" });
    try {
      const response = await submitTechnicalInstituteApplication(values);
      setStatus({ type: "success", id: response.data.id });
      reset(emptyValues);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error
          ? error.message
          : "We couldn't submit the institute partnership request. Please try again.",
      });
    }
  }

  if (status.type === "success") {
    return (
      <div className="zb-tech-form-success" role="status">
        <span className="zb-tech-form-success-icon" aria-hidden="true">
          <CheckCircle2 />
        </span>
        <div>
          <span className="zb-eyebrow">Partnership request received</span>
          <h2>Your technical institute profile is now in review.</h2>
          <p>
            The ZOBHUNGER team will review the institute details, trades or branches and partnership interests before any further onboarding step.
          </p>
          <small>Reference: {status.id}</small>
        </div>
      </div>
    );
  }

  return (
    <form
      className="zb-tech-application-form"
      noValidate
      aria-busy={busy}
      onSubmit={handleSubmit(submit)}
    >
      {status.type === "error" && (
        <FeedbackMessage tone="error" title="We couldn't submit your request">
          {status.message}
        </FeedbackMessage>
      )}

      <fieldset disabled={busy} className="zb-form-fieldset">
        <legend className="sr-only">ITI and Polytechnic institute partnership onboarding form</legend>

        <fieldset className="zb-form-group">
          <legend><span>01</span> Institute profile</legend>
          <div className="zb-form-grid zb-tech-form-grid">
            <TextField
              label="Institute Name"
              required
              autoComplete="organization"
              error={errors.institutionName?.message}
              {...register("institutionName")}
            />
            <Controller
              name="institutionType"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Institute Type"
                  required
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  disabled={busy}
                  options={[
                    { value: "iti", label: "Industrial Training Institute (ITI)" },
                    { value: "polytechnic", label: "Polytechnic College" },
                    { value: "technical-institute", label: "Other Technical Institute" },
                  ]}
                  error={errors.institutionType?.message}
                />
              )}
            />
            <Controller
              name="ownershipType"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Institute Ownership"
                  required
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  disabled={busy}
                  options={[
                    { value: "government", label: "Government" },
                    { value: "private", label: "Private" },
                    { value: "aided", label: "Government Aided" },
                    { value: "other", label: "Other" },
                  ]}
                  error={errors.ownershipType?.message}
                />
              )}
            />
            <Controller
              name="affiliationBody"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Affiliation / Approval Body"
                  required
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  disabled={busy}
                  options={[
                    { value: "ncvt", label: "NCVT" },
                    { value: "scvt", label: "SCVT" },
                    { value: "aicte", label: "AICTE" },
                    { value: "state-board", label: "State Board / Directorate" },
                    { value: "other", label: "Other" },
                  ]}
                  error={errors.affiliationBody?.message}
                />
              )}
            />
            <TextField
              label="Affiliation / Registration Number"
              hint="Optional at initial submission; the team may request verification later."
              error={errors.affiliationNumber?.message}
              {...register("affiliationNumber")}
            />
            <TextField
              label="Official Website"
              type="url"
              placeholder="https://institute.edu.in"
              error={errors.website?.message}
              {...register("website")}
            />
          </div>
        </fieldset>

        <fieldset className="zb-form-group">
          <legend><span>02</span> Institute location</legend>
          <div className="zb-form-grid zb-tech-form-grid">
            <TextField label="District" required error={errors.district?.message} {...register("district")} />
            <TextField label="City / Town" required autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
            <TextField label="State" required autoComplete="address-level1" error={errors.state?.message} {...register("state")} />
            <TextField
              label="PIN Code"
              required
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              error={errors.postalCode?.message}
              {...register("postalCode")}
            />
          </div>
        </fieldset>

        <fieldset className="zb-form-group">
          <legend><span>03</span> Placement / training officer</legend>
          <div className="zb-form-grid zb-tech-form-grid">
            <TextField
              label="TPO / Placement Officer Name"
              required
              autoComplete="name"
              error={errors.contactPersonName?.message}
              {...register("contactPersonName")}
            />
            <TextField label="Designation" required error={errors.designation?.message} {...register("designation")} />
            <TextField
              label="Official Email Address"
              required
              type="email"
              autoComplete="email"
              error={errors.officialEmail?.message}
              {...register("officialEmail")}
            />
            <TextField
              label="Mobile Number"
              required
              type="tel"
              autoComplete="tel"
              error={errors.mobileNumber?.message}
              {...register("mobileNumber")}
            />
            <TextField
              label="Alternate Number"
              type="tel"
              error={errors.alternateNumber?.message}
              {...register("alternateNumber")}
            />
          </div>
        </fieldset>

        <fieldset className="zb-form-group">
          <legend><span>04</span> Student & technical talent profile</legend>
          <div className="zb-form-grid zb-tech-form-grid">
            <TextField
              label="Total Student Strength"
              required
              type="number"
              min={1}
              max={1000000}
              step={1}
              error={errors.totalStudents?.message}
              {...register("totalStudents", { valueAsNumber: true })}
            />
            <TextField
              label="Final-Year / Passing-Out Students"
              required
              type="number"
              min={0}
              max={1000000}
              step={1}
              error={errors.finalYearStudents?.message}
              {...register("finalYearStudents", { valueAsNumber: true })}
            />
            <TextField
              label="Primary Passing Year / Batch"
              required
              placeholder="For example: 2026"
              error={errors.passingYear?.message}
              {...register("passingYear")}
            />
            <div className="zb-form-full">
              <TextAreaField
                label="Available Trades / Branches"
                required
                rows={4}
                placeholder="For example: Electrician, Fitter, Welder, Mechanical, Civil, Automobile, Electrical, Computer Science..."
                hint="List the major technical trades or diploma branches available at your institute."
                error={errors.tradesBranches?.message}
                {...register("tradesBranches")}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="zb-form-group">
          <legend><span>05</span> Partnership requirements</legend>
          <div className="zb-tech-checkbox-field">
            <span className="zb-tech-checkbox-label">Interested In <b>*</b></span>
            <div className="zb-tech-checkbox-grid">
              {partnershipOptions.map(([value, label]) => (
                <label key={value}>
                  <input type="checkbox" value={value} {...register("preferredOpportunityTypes")} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {errors.preferredOpportunityTypes?.message && (
              <p className="zb-field-error" role="alert">{errors.preferredOpportunityTypes.message}</p>
            )}
          </div>
          <div className="zb-tech-notes-field">
            <TextAreaField
              label="Technical Hiring / Partnership Notes"
              rows={4}
              placeholder="Share upcoming batches, placement priorities, employer requirements, preferred locations or any context useful for the partnership team."
              error={errors.technicalHiringNotes?.message}
              {...register("technicalHiringNotes")}
            />
          </div>
        </fieldset>

        <div className="zb-tech-form-note">
          <ShieldCheck aria-hidden="true" />
          <div>
            <strong>Review before activation.</strong>
            <span>
              Submission does not automatically create portal credentials or guarantee an opportunity. ZOBHUNGER reviews institute details and collaboration fit before the next onboarding step.
            </span>
          </div>
        </div>

        <div className="zb-form-actions">
          <ActionButton type="submit" disabled={busy}>
            {busy ? "Submitting..." : "Submit Institute Partnership Request"}
          </ActionButton>
        </div>
      </fieldset>
    </form>
  );
}
