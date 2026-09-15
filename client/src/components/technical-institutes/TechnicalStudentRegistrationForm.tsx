"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  GraduationCap,
  LoaderCircle,
  MapPin,
  SearchCheck,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { ActionButton } from "@/components/common/ActionButton";
import { FeedbackMessage } from "@/components/common/FeedbackMessage";
import { SelectField, TextAreaField, TextField } from "@/components/forms/Fields";
import {
  technicalStudentRegistrationSchema,
  type TechnicalStudentRegistrationInput,
} from "@/schemas/technical-student-registration.schema";
import {
  registerTechnicalStudent,
  verifyTechnicalInstitutePartnership,
  type TechnicalInstitutePublicPartner,
} from "@/services/technical-students.service";

const opportunities = [
  ["jobs", "Jobs"],
  ["internships", "Internships"],
  ["apprenticeships", "Apprenticeships"],
  ["training", "Training"],
] as const;

const defaults: TechnicalStudentRegistrationInput = {
  partnershipCode: "",
  fullName: "",
  email: "",
  mobileNumber: "",
  enrollmentNumber: "",
  dateOfBirth: "",
  gender: "prefer-not-to-say",
  qualification: "iti",
  tradeBranch: "",
  passingYear: "",
  currentSemesterYear: "",
  academicScore: "",
  skills: "",
  certifications: "",
  currentCity: "",
  currentState: "",
  preferredLocations: "",
  preferredOpportunityTypes: [],
  consentAccepted: false,
};

type State =
  | { type: "idle" }
  | { type: "verifying" }
  | { type: "ready"; institute: TechnicalInstitutePublicPartner }
  | { type: "submitting"; institute: TechnicalInstitutePublicPartner }
  | { type: "success"; instituteName: string; reference: string }
  | { type: "error"; message: string; institute?: TechnicalInstitutePublicPartner };

export function TechnicalStudentRegistrationForm({ initialCode = "" }: { initialCode?: string }) {
  const [state, setState] = React.useState<State>({ type: "idle" });
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<TechnicalStudentRegistrationInput>({
    resolver: zodResolver(technicalStudentRegistrationSchema),
    defaultValues: { ...defaults, partnershipCode: initialCode.trim().toUpperCase() },
    mode: "onBlur",
  });

  const institute = state.type === "ready" || state.type === "submitting" ? state.institute : state.type === "error" ? state.institute : undefined;
  const busy = state.type === "verifying" || state.type === "submitting";

  async function verify() {
    const code = getValues("partnershipCode").trim().toUpperCase();
    if (code.length < 6) {
      setState({ type: "error", message: "Enter the partnership code shared by your ITI or Polytechnic." });
      return;
    }
    setValue("partnershipCode", code, { shouldValidate: true });
    setState({ type: "verifying" });
    try {
      const response = await verifyTechnicalInstitutePartnership(code);
      setState({ type: "ready", institute: response.data });
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "Unable to verify the institute partnership code." });
    }
  }

  React.useEffect(() => {
    if (initialCode.trim().length >= 6) void verify();
    // The initial partnership code is intentionally verified once on first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(values: TechnicalStudentRegistrationInput) {
    if (!institute || values.partnershipCode.trim().toUpperCase() !== institute.partnershipCode) {
      setState({ type: "error", message: "Verify your institute partnership code before submitting the student profile." });
      return;
    }
    setState({ type: "submitting", institute });
    try {
      const response = await registerTechnicalStudent(values);
      setState({ type: "success", instituteName: response.data.institute.institutionName, reference: response.data.student.id });
    } catch (error) {
      setState({ type: "error", institute, message: error instanceof Error ? error.message : "Unable to register the student profile." });
    }
  }

  if (state.type === "success") {
    return <div className="zb-tech-student-success" role="status">
      <span><CheckCircle2 aria-hidden="true" /></span>
      <div>
        <small>Student profile received</small>
        <h2>You're now in the technical talent verification queue.</h2>
        <p>Your profile is linked to <strong>{state.instituteName}</strong>. ZOBHUNGER or the institute team can verify it before eligible jobs, internships, apprenticeships or training opportunities are matched.</p>
        <code>{state.reference}</code>
      </div>
    </div>;
  }

  return <form className="zb-tech-student-form" noValidate onSubmit={handleSubmit(submit)} aria-busy={busy}>
    <section className="zb-tech-code-step">
      <div className="zb-tech-code-copy"><span><Building2 aria-hidden="true" /></span><div><small>Step 01</small><h2>Verify your partner institute</h2><p>Use the partnership code provided by your ITI, Polytechnic or technical institute.</p></div></div>
      <div className="zb-tech-code-control">
        <TextField label="Institute Partnership Code" required disabled={busy} placeholder="Example: ITI-UP-2026-XXXXXX" error={errors.partnershipCode?.message} {...register("partnershipCode", { onChange: () => setState({ type: "idle" }) })} />
        <button type="button" onClick={() => void verify()} disabled={busy}>{state.type === "verifying" ? <LoaderCircle className="zb-spin" aria-hidden="true" /> : <SearchCheck aria-hidden="true" />}{state.type === "verifying" ? "Verifying…" : "Verify institute"}</button>
      </div>
      {institute && <div className="zb-tech-verified-institute"><BadgeCheck aria-hidden="true" /><div><strong>{institute.institutionName}</strong><span><MapPin aria-hidden="true" />{institute.city}, {institute.state} · {institute.partnershipCode}</span></div></div>}
    </section>

    {state.type === "error" && <FeedbackMessage tone="error" title="Student onboarding needs attention">{state.message}</FeedbackMessage>}

    <fieldset disabled={busy || !institute} className="zb-form-fieldset zb-tech-student-fieldset">
      <legend className="sr-only">Technical student registration</legend>

      <fieldset className="zb-form-group">
        <legend><span>02</span> Student identity</legend>
        <div className="zb-form-grid zb-tech-form-grid">
          <TextField label="Full Name" required autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
          <TextField label="Email Address" required type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <TextField label="Mobile Number" required type="tel" autoComplete="tel" error={errors.mobileNumber?.message} {...register("mobileNumber")} />
          <TextField label="Enrollment / Roll Number" hint="Optional, but useful for institute verification." error={errors.enrollmentNumber?.message} {...register("enrollmentNumber")} />
          <TextField label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
          <Controller name="gender" control={control} render={({ field }) => <SelectField label="Gender" name={field.name} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} inputRef={field.ref} disabled={busy || !institute} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }, { value: "prefer-not-to-say", label: "Prefer not to say" }]} error={errors.gender?.message} />} />
        </div>
      </fieldset>

      <fieldset className="zb-form-group">
        <legend><span>03</span> Technical education</legend>
        <div className="zb-form-grid zb-tech-form-grid">
          <Controller name="qualification" control={control} render={({ field }) => <SelectField label="Qualification" required name={field.name} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} inputRef={field.ref} disabled={busy || !institute} options={[{ value: "iti", label: "ITI" }, { value: "diploma-polytechnic", label: "Diploma / Polytechnic" }]} error={errors.qualification?.message} />} />
          <TextField label="Trade / Branch" required placeholder="Electrician, Fitter, Mechanical, Civil..." error={errors.tradeBranch?.message} {...register("tradeBranch")} />
          <TextField label="Passing Year" required inputMode="numeric" maxLength={4} placeholder="2026" error={errors.passingYear?.message} {...register("passingYear")} />
          <TextField label="Current Semester / Year" placeholder="Final year / Semester 6" error={errors.currentSemesterYear?.message} {...register("currentSemesterYear")} />
          <TextField label="Percentage / CGPA" placeholder="78% or 8.1 CGPA" error={errors.academicScore?.message} {...register("academicScore")} />
          <TextField label="Current City" required error={errors.currentCity?.message} {...register("currentCity")} />
          <TextField label="Current State" required error={errors.currentState?.message} {...register("currentState")} />
        </div>
      </fieldset>

      <fieldset className="zb-form-group">
        <legend><span>04</span> Skills & preferences</legend>
        <div className="zb-form-grid zb-tech-form-grid">
          <div className="zb-form-full"><TextAreaField label="Technical Skills" rows={3} placeholder="Industrial wiring, CNC, AutoCAD, welding, PLC..." hint="Separate multiple skills with commas." error={errors.skills?.message} {...register("skills")} /></div>
          <div className="zb-form-full"><TextAreaField label="Certifications" rows={2} placeholder="NCVT certificate, AutoCAD certification..." hint="Optional. Separate multiple certifications with commas." error={errors.certifications?.message} {...register("certifications")} /></div>
          <div className="zb-form-full"><TextAreaField label="Preferred Job Locations" rows={2} placeholder="Noida, Gurugram, Pune, Bengaluru..." hint="Optional. Separate multiple locations with commas." error={errors.preferredLocations?.message} {...register("preferredLocations")} /></div>
        </div>
        <div className="zb-tech-checkbox-field zb-tech-student-opportunities">
          <span className="zb-tech-checkbox-label">Interested In <b>*</b></span>
          <div className="zb-tech-checkbox-grid">{opportunities.map(([value, label]) => <label key={value}><input type="checkbox" value={value} {...register("preferredOpportunityTypes")} /><span>{label}</span></label>)}</div>
          {errors.preferredOpportunityTypes?.message && <p className="zb-field-error" role="alert">{errors.preferredOpportunityTypes.message}</p>}
        </div>
      </fieldset>

      <label className="zb-tech-student-consent">
        <input type="checkbox" {...register("consentAccepted")} />
        <span><ShieldCheck aria-hidden="true" /><span><strong>I confirm these details are accurate.</strong><small>I consent to the profile being used by ZOBHUNGER and the associated institute for eligibility checks and relevant job, internship, apprenticeship and training opportunities.</small></span></span>
      </label>
      {errors.consentAccepted?.message && <p className="zb-field-error" role="alert">{errors.consentAccepted.message}</p>}

      <div className="zb-tech-student-submit"><div><GraduationCap aria-hidden="true" /><span><strong>Eligibility first.</strong><small>Registration does not guarantee selection. Opportunities depend on active requirements and employer criteria.</small></span></div><ActionButton type="submit" disabled={busy || !institute}>{state.type === "submitting" ? "Registering profile…" : "Register Student Profile"}</ActionButton></div>
    </fieldset>
  </form>;
}
