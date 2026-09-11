"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton } from "@/components/common/ActionButton";
import { FeedbackMessage } from "@/components/common/FeedbackMessage";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/Fields";
import { FormModeNotice } from "@/components/forms/FormModeNotice";
import { SubmissionResult } from "@/components/forms/SubmissionResult";
import { solutions } from "@/data/solutions";
import { useFormSubmission } from "@/hooks/use-form-submission";
import { enquirySchema } from "@/schemas/enquiry.schema";
import { submitEnquiry } from "@/services/enquiries.service";
import type { EnquiryInput } from "@/types/enquiry.types";

const contactServiceOptions = [...solutions.map((solution) => ({ value: solution.slug, label: solution.label })), { value: "legal-privacy-compliance", label: "Legal, privacy & compliance" }];

const emptyValues = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  serviceRequired: "",
  message: "",
};

export function ContactForm({
  initialService = "",
}: {
  initialService?: string;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { ...emptyValues, serviceRequired: initialService },
    mode: "onBlur",
  });
  const submission = useFormSubmission(submitEnquiry);
  const { state, busy, feedbackRef } = submission;
  function edit() {
    submission.clear();
    requestAnimationFrame(() => setFocus("name"));
  }
  function clearForm() {
    reset(emptyValues);
    edit();
  }

  if (state.status === "complete") {
    return (
      <SubmissionResult
        receipt={state.receipt}
        subject="enquiry"
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
      aria-label="Business enquiry"
      aria-busy={busy}
    >
      <FormModeNotice />
      {state.status === "error" && (
        <div ref={feedbackRef} tabIndex={-1} className="zb-form-result">
          <FeedbackMessage
            tone="error"
            title="We couldn't complete your enquiry"
          >
            {state.message} Your entries are still available. Please try again.
          </FeedbackMessage>
        </div>
      )}
      <fieldset disabled={busy} className="zb-form-fieldset">
        <legend className="sr-only">Business enquiry details</legend>
        <div className="zb-form-grid">
          <TextField
            label="Your name"
            required
            autoComplete="name"
            maxLength={120}
            error={errors.name?.message}
            {...register("name")}
          />
          <TextField
            label="Company name"
            autoComplete="organization"
            maxLength={160}
            hint="Optional."
            error={errors.companyName?.message}
            {...register("companyName")}
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
          <div className="zb-form-full">
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
                  options={contactServiceOptions}
                  error={errors.serviceRequired?.message}
                />
              )}
            />
          </div>
          <div className="zb-form-full">
            <TextAreaField
              label="Message"
              required
              rows={6}
              maxLength={4000}
              hint="Tell us the work you have in mind and any questions you want to discuss."
              error={errors.message?.message}
              {...register("message")}
            />
          </div>
        </div>
        <div className="zb-form-actions">
          <ActionButton
            type="submit"
            loading={busy}
            loadingLabel="Checking enquiry…"
          >
            Submit enquiry
          </ActionButton>
          <ActionButton variant="outline" onClick={clearForm}>
            Clear form
          </ActionButton>
        </div>
      </fieldset>
    </form>
  );
}
