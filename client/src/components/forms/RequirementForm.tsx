"use client";

import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/common/ActionButton";
import { FeedbackMessage } from "@/components/common/FeedbackMessage";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/Fields";
import { FormModeNotice } from "@/components/forms/FormModeNotice";
import { SubmissionResult } from "@/components/forms/SubmissionResult";
import { industries } from "@/data/industries";
import { workforceSolutions } from "@/data/solutions";
import { useFormSubmission } from "@/hooks/use-form-submission";
import {
  requirementFormSchema,
  type RequirementFormValues,
} from "@/schemas/requirement-form.schema";
import { submitRequirement } from "@/services/requirements.service";
import type { RequirementInput } from "@/types/requirement.types";

const emptyValues = {
  companyName: "",
  contactPerson: "",
  businessEmail: "",
  mobileNumber: "",
  industry: "",
  serviceRequired: "",
  workforceCount: undefined,
  locations: [{ name: "" }],
  projectDuration: "",
  expectedStartAt: "",
  details: "",
};

const fieldLabels = {
  companyName: "Company name", contactPerson: "Contact person", businessEmail: "Business email",
  mobileNumber: "Mobile number", industry: "Industry", serviceRequired: "Service required",
  workforceCount: "Number of people", locations: "Job locations", projectDuration: "Project duration",
  expectedStartAt: "Expected start date", details: "Requirement details",
} as const;
type RequirementField = keyof typeof fieldLabels;

export function RequirementForm({
  initialIndustry = "",
  initialService = "",
}: {
  initialIndustry?: string;
  initialService?: string;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setFocus,
    setError,
    formState: { errors },
  } = useForm<RequirementFormValues, unknown, RequirementInput>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues: {
      ...emptyValues,
      industry: initialIndustry,
      serviceRequired: initialService,
    },
    mode: "onBlur",
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "locations",
  });
  const submission = useFormSubmission(submitRequirement);
  const { state, busy, feedbackRef } = submission;
  useEffect(() => {
    if (state.status !== "error") return;
    for (const field of Object.keys(fieldLabels) as RequirementField[]) {
      const message = state.fieldErrors[field]?.[0];
      if (message) setError(field, { type: "server", message });
    }
  }, [state, setError]);
  const rejectedFields = state.status === "error"
    ? (Object.keys(fieldLabels) as RequirementField[]).filter(field => state.fieldErrors[field]?.length)
    : [];

  function edit() {
    submission.clear();
    requestAnimationFrame(() => setFocus("companyName"));
  }
  function clearForm() {
    reset(emptyValues);
    edit();
  }

  if (state.status === "complete") {
    return (
      <SubmissionResult
        receipt={state.receipt}
        subject="requirement"
        feedbackRef={feedbackRef}
        onEdit={edit}
        onClear={clearForm}
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submission.submit)}
      aria-label="Workforce requirement"
      aria-busy={busy}
    >
      <FormModeNotice />
      {state.status === "error" && (
        <div ref={feedbackRef} tabIndex={-1} className="zb-form-result">
          <FeedbackMessage
            tone="error"
            title="We couldn't complete your requirement"
          >
            {rejectedFields.length ? "Please correct the fields below. Your entries are still available." : `${state.message.replace(/[.!?]$/, "")}. Your entries are still available. Please try again.`}
          </FeedbackMessage>
          {state.status === "error" && rejectedFields.length > 0 && <ul className="mt-3 grid gap-1 text-sm" aria-label="Fields to correct">
            {rejectedFields.map(field => <li key={field}><button type="button" className="min-h-11 w-full rounded px-2 py-2 text-left text-red-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => setFocus(field === "locations" ? "locations.0.name" : field)}>
              {fieldLabels[field]}: {state.fieldErrors[field][0]}
            </button></li>)}
          </ul>}
        </div>
      )}
      <fieldset disabled={busy} className="zb-form-fieldset">
        <legend className="sr-only">Your requirement details</legend>
        <fieldset className="zb-form-group">
          <legend>
            <span aria-hidden="true">01</span> Company and contact
          </legend>
          <div className="zb-form-grid">
            <TextField
              label="Company name"
              required
              autoComplete="organization"
              maxLength={160}
              error={errors.companyName?.message}
              {...register("companyName")}
            />
            <TextField
              label="Contact person"
              required
              autoComplete="name"
              maxLength={120}
              error={errors.contactPerson?.message}
              {...register("contactPerson")}
            />
            <TextField
              label="Business email"
              type="email"
              required
              autoComplete="email"
              maxLength={254}
              error={errors.businessEmail?.message}
              {...register("businessEmail")}
            />
            <TextField
              label="Mobile number"
              type="tel"
              required
              autoComplete="tel"
              maxLength={24}
              hint="Include your country code, for example +91."
              error={errors.mobileNumber?.message}
              {...register("mobileNumber")}
            />
          </div>
        </fieldset>
        <fieldset className="zb-form-group">
          <legend>
            <span aria-hidden="true">02</span> Service and team
          </legend>
          <div className="zb-form-grid">
            <Controller
              name="industry"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Industry"
                  required
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  disabled={busy}
                  options={industries.map((industry) => ({
                    value: industry.slug,
                    label: industry.title,
                  }))}
                  error={errors.industry?.message}
                />
              )}
            />
            <Controller
              name="serviceRequired"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Service required"
                  required
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  disabled={busy}
                  options={workforceSolutions.map((solution) => ({
                    value: solution.slug,
                    label: solution.label,
                  }))}
                  error={errors.serviceRequired?.message}
                />
              )}
            />
            <TextField
              label="Number of people"
              type="number"
              inputMode="numeric"
              required
              min={1}
              max={100000}
              step={1}
              hint="Enter the total across all locations."
              error={errors.workforceCount?.message}
              {...register("workforceCount", { valueAsNumber: true })}
            />
            <TextField
              label="Project duration"
              required
              maxLength={120}
              placeholder="For example, 3 months or ongoing"
              hint="Include a unit, for example 1 day or 3 months."
              error={errors.projectDuration?.message}
              {...register("projectDuration")}
            />
          </div>
        </fieldset>
        <fieldset className="zb-form-group">
          <legend>
            <span aria-hidden="true">03</span> Locations and timeline
          </legend>
          <p className="zb-field-note zb-locations-hint">
            Add one location per row. For multiple locations, explain the team
            split in your requirement details.
          </p>
          <div className="zb-location-list">
            {fields.map((field, index) => (
              <div className="zb-location-row" key={field.id}>
                <TextField
                  label={"Job location " + (index + 1)}
                  required
                  maxLength={120}
                  placeholder="City, area or site"
                  error={errors.locations?.[index]?.name?.message}
                  {...register(`locations.${index}.name`)}
                />
                {fields.length > 1 && (
                  <ActionButton
                    variant="outline"
                    aria-label={"Remove location " + (index + 1)}
                    onClick={() => {
                      remove(index);
                      requestAnimationFrame(() =>
                        setFocus(`locations.${Math.max(0, index - 1)}.name`),
                      );
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    <span>Remove</span>
                  </ActionButton>
                )}
              </div>
            ))}
          </div>
          {(errors.locations?.root?.message || errors.locations?.message) && (
            <p className="zb-field-error" role="alert">
              {errors.locations?.root?.message || errors.locations?.message}
            </p>
          )}
          <div className="zb-location-actions">
            <ActionButton
              variant="outline"
              disabled={fields.length >= 50}
              onClick={() => append({ name: "" })}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add another location
            </ActionButton>
            <span className="zb-field-note">
              {fields.length} / 50 locations
            </span>
          </div>
          <div className="zb-date-field">
            <TextField
              label="Expected start date"
              type="date"
              hint="Optional. Leave this blank if the date is still being decided."
              error={errors.expectedStartAt?.message}
              {...register("expectedStartAt")}
            />
          </div>
        </fieldset>
        <fieldset className="zb-form-group">
          <legend>
            <span aria-hidden="true">04</span> The work to be done
          </legend>
          <TextAreaField
            label="Requirement details"
            required
            rows={6}
            maxLength={6000}
            hint="Include responsibilities, working hours, skills, team size by location and any other services you need."
            error={errors.details?.message}
            {...register("details")}
          />
        </fieldset>
        <div className="zb-form-actions">
          <ActionButton
            type="submit"
            loading={busy}
            loadingLabel="Checking requirement…"
          >
            Submit requirement
          </ActionButton>
          <ActionButton variant="outline" onClick={clearForm}>
            Clear form
          </ActionButton>
        </div>
      </fieldset>
    </form>
  );
}
