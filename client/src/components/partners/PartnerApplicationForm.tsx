"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, FileText, Upload } from "lucide-react";
import { ActionButton } from "@/components/common/ActionButton";
import { FeedbackMessage } from "@/components/common/FeedbackMessage";
import { TextAreaField, TextField } from "@/components/forms/Fields";
import {
  partnerApplicationSchema,
  type PartnerApplicationInput,
} from "@/schemas/partner-application.schema";
import { submitPartnerApplication } from "@/services/partners.service";

const emptyValues: PartnerApplicationInput = {
  fullName: "",
  mobileNumber: "",
  email: "",
  currentCity: "",
  currentProfession: "",
  companyName: "",
  totalExperienceYears: 0,
  specialization: "",
  industryExperience: "",
  linkedInUrl: "",
  contributionPreference: "",
  expertiseDescription: "",
  professionalNetwork: "",
  preferredPartnershipArea: "",
};

export function PartnerApplicationForm() {
  const [resume, setResume] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [status, setStatus] = useState<
    | { type: "idle" }
    | { type: "submitting" }
    | { type: "success"; id: string; warning?: string }
    | { type: "error"; message: string }
  >({ type: "idle" });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartnerApplicationInput>({
    resolver: zodResolver(partnerApplicationSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });

  const busy = status.type === "submitting";

  function chooseResume(file?: File) {
    if (!file) {
      setResume(null);
      setResumeError(null);
      return;
    }
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      setResume(null);
      setResumeError("Use a PDF, DOC or DOCX file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setResume(null);
      setResumeError("Resume must be 2 MB or smaller.");
      return;
    }
    setResume(file);
    setResumeError(null);
  }

  async function submit(values: PartnerApplicationInput) {
    if (resumeError) return;
    setStatus({ type: "submitting" });
    try {
      const receipt = await submitPartnerApplication(values, resume);
      setStatus({ type: "success", id: receipt.id, warning: receipt.warning });
      reset(emptyValues);
      setResume(null);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "We couldn't submit your partner application. Please try again.",
      });
    }
  }

  if (status.type === "success") {
    return (
      <div className="zb-partner-form-success" role="status">
        <CheckCircle2 aria-hidden="true" />
        <div>
          <span className="zb-eyebrow">Application received</span>
          <h3>Thank you for your interest in becoming an Independent Business Partner.</h3>
          <p>
            Our company team will review your application. Once approved, we will issue
            your Business Portal Partner ID and temporary password. You will need
            to change that password when you first sign in.
          </p>
          {status.warning && <p className="zb-partner-form-warning">{status.warning}</p>}
          <small>Reference: {status.id}</small>
        </div>
      </div>
    );
  }

  return (
    <form
      className="zb-partner-form"
      noValidate
      aria-busy={busy}
      onSubmit={handleSubmit(submit)}
    >
      {status.type === "error" && (
        <FeedbackMessage tone="error" title="We couldn't submit your application">
          {status.message}
        </FeedbackMessage>
      )}

      <fieldset disabled={busy} className="zb-form-fieldset">
        <legend className="sr-only">Independent Business Partner application</legend>
        <div className="zb-form-grid">
          <TextField label="Full name" required autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
          <TextField label="Mobile number" required type="tel" autoComplete="tel" error={errors.mobileNumber?.message} {...register("mobileNumber")} />
          <TextField label="Email address" required type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <TextField label="Current city" required autoComplete="address-level2" error={errors.currentCity?.message} {...register("currentCity")} />
          <TextField label="Current profession" required error={errors.currentProfession?.message} {...register("currentProfession")} />
          <TextField label="Current company / business name" required autoComplete="organization" error={errors.companyName?.message} {...register("companyName")} />
          <TextField label="Total years of experience" required type="number" min={0} max={80} step={1} error={errors.totalExperienceYears?.message} {...register("totalExperienceYears", { valueAsNumber: true })} />
          <TextField label="Area of specialization" required error={errors.specialization?.message} {...register("specialization")} />
          <div className="zb-form-full">
            <TextAreaField label="Industry experience" required rows={3} error={errors.industryExperience?.message} {...register("industryExperience")} />
          </div>
          <TextField label="LinkedIn profile" type="url" placeholder="https://linkedin.com/in/..." hint="Optional." error={errors.linkedInUrl?.message} {...register("linkedInUrl")} />
          <TextField label="How would you like to contribute?" required placeholder="Business development, consulting, project execution..." error={errors.contributionPreference?.message} {...register("contributionPreference")} />
          <div className="zb-form-full">
            <TextAreaField label="Describe your expertise and professional experience" required rows={6} error={errors.expertiseDescription?.message} {...register("expertiseDescription")} />
          </div>
          <div className="zb-form-full">
            <TextAreaField label="Professional network / industry connections" rows={3} hint="Optional. Share relevant sectors, markets or professional networks without including confidential information." error={errors.professionalNetwork?.message} {...register("professionalNetwork")} />
          </div>
          <div className="zb-form-full">
            <TextField label="Preferred partnership area" required placeholder="Sales, recruitment, operations, technology, market expansion..." error={errors.preferredPartnershipArea?.message} {...register("preferredPartnershipArea")} />
          </div>
          <div className="zb-form-full zb-partner-file-field">
            <label htmlFor="partner-resume">Resume / profile upload <span>Optional</span></label>
            <div className="zb-partner-file-control">
              <Upload aria-hidden="true" />
              <div>
                <strong>{resume ? resume.name : "Attach your professional profile"}</strong>
                <p>PDF, DOC or DOCX. Maximum 2 MB.</p>
              </div>
              <input
                id="partner-resume"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => chooseResume(event.target.files?.[0])}
              />
            </div>
            {resume && (
              <p className="zb-partner-file-selected"><FileText aria-hidden="true" /> {resume.name}</p>
            )}
            {resumeError && <p className="zb-field-error" role="alert">{resumeError}</p>}
          </div>
        </div>
        <div className="zb-form-actions">
          <ActionButton type="submit" loading={busy} loadingLabel="Submitting application…">
            Apply to Become a Partner
          </ActionButton>
        </div>
      </fieldset>
    </form>
  );
}
