"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton } from "@/components/common/ActionButton";
import { FeedbackMessage } from "@/components/common/FeedbackMessage";
import { TextAreaField, TextField } from "@/components/forms/Fields";
import { FormModeNotice } from "@/components/forms/FormModeNotice";
import { SubmissionResult } from "@/components/forms/SubmissionResult";
import { useFormSubmission } from "@/hooks/use-form-submission";
import {
  jobApplicationSchema,
  type JobApplicationInput,
} from "@/schemas/job-application.schema";
import { submitJobApplication } from "@/services/jobs.service";
import type { DataRequestOptions } from "@/types/data.types";

const emptyValues = {
  fullName: "",
  email: "",
  phone: "",
  currentLocation: "",
  experience: "",
  availableFrom: "",
  message: "",
};

export function JobApplicationForm({ jobSlug }: { jobSlug: string }) {
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<JobApplicationInput>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });
  const submission = useFormSubmission(
    (values: JobApplicationInput, options?: DataRequestOptions) =>
      submitJobApplication(jobSlug, values, options),
  );
  const { state, busy, feedbackRef } = submission;
  function edit() {
    submission.clear();
    requestAnimationFrame(() => setFocus("fullName"));
  }
  function clearForm() {
    reset(emptyValues);
    edit();
  }
  if (state.status === "complete")
    return (
      <SubmissionResult
        subject="application"
        receipt={state.receipt}
        feedbackRef={feedbackRef}
        onEdit={edit}
        onClear={clearForm}
      />
    );

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submission.submit)}
      aria-label="Job application"
      aria-busy={busy}
    >
      <FormModeNotice />
      {state.status === "error" && (
        <div className="zb-form-result" tabIndex={-1} ref={feedbackRef}>
          <FeedbackMessage
            tone="error"
            title="We couldn't complete your application"
          >
            {state.message} Your entries are still available.
          </FeedbackMessage>
        </div>
      )}
      <fieldset className="zb-form-fieldset" disabled={busy}>
        <legend className="sr-only">Application details</legend>
        <div className="zb-form-grid">
          <TextField
            label="Full name"
            required
            autoComplete="name"
            maxLength={120}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <TextField
            label="Email"
            required
            type="email"
            autoComplete="email"
            maxLength={254}
            error={errors.email?.message}
            {...register("email")}
          />
          <TextField
            label="Phone"
            required
            type="tel"
            autoComplete="tel"
            maxLength={24}
            hint="Include your country code, for example +91."
            error={errors.phone?.message}
            {...register("phone")}
          />
          <TextField
            label="Current city or area"
            required
            autoComplete="address-level2"
            maxLength={120}
            error={errors.currentLocation?.message}
            {...register("currentLocation")}
          />
          <TextField
            label="Available from"
            type="date"
            hint="Optional. Leave blank if you are flexible."
            error={errors.availableFrom?.message}
            {...register("availableFrom")}
          />
          <div className="zb-form-full">
            <TextAreaField
              label="Relevant experience"
              rows={3}
              maxLength={2000}
              hint="Optional. You can also describe your skills or interest in the role."
              error={errors.experience?.message}
              {...register("experience")}
            />
          </div>
          <div className="zb-form-full">
            <TextAreaField
              label="Anything else to share?"
              rows={3}
              maxLength={3000}
              hint="Optional. Include any questions about the work or your availability."
              error={errors.message?.message}
              {...register("message")}
            />
          </div>
        </div>
        <div className="zb-form-actions">
          <ActionButton
            type="submit"
            loading={busy}
            loadingLabel="Checking application…"
          >
            Submit application
          </ActionButton>
          <ActionButton variant="outline" onClick={clearForm}>
            Clear form
          </ActionButton>
        </div>
      </fieldset>
    </form>
  );
}
