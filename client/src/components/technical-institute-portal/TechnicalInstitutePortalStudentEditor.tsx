"use client";

import { useState } from "react";
import { CircleAlert, Save, X } from "lucide-react";
import {
  createTechnicalInstitutePortalStudent,
  updateTechnicalInstitutePortalStudent,
  type TechnicalPortalStudent,
  type TechnicalPortalStudentInput,
} from "@/services/technical-institute-portal.service";

const opportunityOptions = ["jobs", "internships", "apprenticeships", "training"] as const;

type Draft = Omit<TechnicalPortalStudentInput, "skills" | "certifications" | "preferredLocations"> & {
  skills: string;
  certifications: string;
  preferredLocations: string;
};

const blankDraft: Draft = {
  fullName: "",
  email: "",
  mobileNumber: "",
  enrollmentNumber: "",
  dateOfBirth: "",
  gender: undefined,
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
  preferredOpportunityTypes: ["jobs"],
};

function splitList(value: string) {
  return value.split(/[,;|\n]/).map((item) => item.trim()).filter(Boolean);
}

function toDraft(student: TechnicalPortalStudent): Draft {
  return {
    fullName: student.fullName,
    email: student.email,
    mobileNumber: student.mobileNumber,
    enrollmentNumber: student.enrollmentNumber ?? "",
    dateOfBirth: student.dateOfBirth?.slice(0, 10) ?? "",
    gender: student.gender ?? undefined,
    qualification: student.qualification,
    tradeBranch: student.tradeBranch,
    passingYear: student.passingYear,
    currentSemesterYear: student.currentSemesterYear ?? "",
    academicScore: student.academicScore ?? "",
    skills: student.skills.join(", "),
    certifications: student.certifications.join(", "),
    currentCity: student.currentCity,
    currentState: student.currentState,
    preferredLocations: student.preferredLocations.join(", "),
    preferredOpportunityTypes: student.preferredOpportunityTypes as Draft["preferredOpportunityTypes"],
  };
}

function toInput(draft: Draft): TechnicalPortalStudentInput {
  return {
    ...draft,
    enrollmentNumber: draft.enrollmentNumber?.trim() || undefined,
    dateOfBirth: draft.dateOfBirth || undefined,
    currentSemesterYear: draft.currentSemesterYear?.trim() || undefined,
    academicScore: draft.academicScore?.trim() || undefined,
    skills: splitList(draft.skills),
    certifications: splitList(draft.certifications),
    preferredLocations: splitList(draft.preferredLocations),
  };
}

export function TechnicalInstitutePortalStudentEditor({
  student,
  onClose,
  onSaved,
}: {
  student?: TechnicalPortalStudent;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => student ? toDraft(student) : { ...blankDraft });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleOpportunity(value: typeof opportunityOptions[number]) {
    setDraft((current) => ({
      ...current,
      preferredOpportunityTypes: current.preferredOpportunityTypes.includes(value)
        ? current.preferredOpportunityTypes.filter((item) => item !== value)
        : [...current.preferredOpportunityTypes, value],
    }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!draft.fullName.trim() || !draft.email.trim() || !draft.mobileNumber.trim() || !draft.tradeBranch.trim() || !/^20\d{2}$/.test(draft.passingYear) || !draft.currentCity.trim() || !draft.currentState.trim() || draft.preferredOpportunityTypes.length === 0) {
      setError("Complete all required identity, qualification, location and opportunity fields.");
      return;
    }
    setSaving(true);
    try {
      if (student) await updateTechnicalInstitutePortalStudent(student.id, toInput(draft));
      else await createTechnicalInstitutePortalStudent(toInput(draft));
      onSaved(student ? "Student profile updated." : "Student added to the verified institute roster.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save the student profile.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="zti-portal-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <form className="zti-portal-editor" onSubmit={save}>
      <header><div><small>{student ? "Update roster profile" : "Manual student entry"}</small><h2>{student ? student.fullName : "Add technical student"}</h2></div><button type="button" onClick={onClose} disabled={saving} aria-label="Close student editor"><X /></button></header>
      {error && <div className="zti-portal-alert"><CircleAlert />{error}</div>}
      <div className="zti-portal-editor-scroll">
        <section><h3>Student identity</h3><div className="zti-portal-form-grid">
          <label><span>Full name *</span><input value={draft.fullName} onChange={(e) => field("fullName", e.target.value)} /></label>
          <label><span>Email *</span><input type="email" value={draft.email} onChange={(e) => field("email", e.target.value)} /></label>
          <label><span>Mobile *</span><input value={draft.mobileNumber} onChange={(e) => field("mobileNumber", e.target.value)} /></label>
          <label><span>Enrollment / roll no.</span><input value={draft.enrollmentNumber ?? ""} onChange={(e) => field("enrollmentNumber", e.target.value)} /></label>
          <label><span>Date of birth</span><input type="date" value={draft.dateOfBirth ?? ""} onChange={(e) => field("dateOfBirth", e.target.value)} /></label>
          <label><span>Gender</span><select value={draft.gender ?? ""} onChange={(e) => field("gender", (e.target.value || undefined) as Draft["gender"])}><option value="">Not specified</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer-not-to-say">Prefer not to say</option></select></label>
        </div></section>

        <section><h3>Technical education</h3><div className="zti-portal-form-grid">
          <label><span>Qualification *</span><select value={draft.qualification} onChange={(e) => field("qualification", e.target.value as Draft["qualification"])}><option value="iti">ITI</option><option value="diploma-polytechnic">Diploma / Polytechnic</option></select></label>
          <label><span>Trade / branch *</span><input value={draft.tradeBranch} onChange={(e) => field("tradeBranch", e.target.value)} /></label>
          <label><span>Passing year *</span><input inputMode="numeric" maxLength={4} placeholder="2026" value={draft.passingYear} onChange={(e) => field("passingYear", e.target.value)} /></label>
          <label><span>Semester / year</span><input value={draft.currentSemesterYear ?? ""} onChange={(e) => field("currentSemesterYear", e.target.value)} /></label>
          <label><span>Percentage / CGPA</span><input value={draft.academicScore ?? ""} onChange={(e) => field("academicScore", e.target.value)} /></label>
          <label><span>Skills</span><input value={draft.skills} onChange={(e) => field("skills", e.target.value)} placeholder="Wiring, PLC, AutoCAD" /></label>
          <label className="wide"><span>Certifications</span><input value={draft.certifications} onChange={(e) => field("certifications", e.target.value)} placeholder="Separate multiple certifications with commas" /></label>
        </div></section>

        <section><h3>Location & opportunity preferences</h3><div className="zti-portal-form-grid">
          <label><span>Current city *</span><input value={draft.currentCity} onChange={(e) => field("currentCity", e.target.value)} /></label>
          <label><span>Current state *</span><input value={draft.currentState} onChange={(e) => field("currentState", e.target.value)} /></label>
          <label className="wide"><span>Preferred locations</span><input value={draft.preferredLocations} onChange={(e) => field("preferredLocations", e.target.value)} placeholder="Noida, Delhi NCR, Lucknow" /></label>
        </div><div className="zti-portal-opportunity-checks"><span>Interested in *</span><div>{opportunityOptions.map((option) => <label key={option}><input type="checkbox" checked={draft.preferredOpportunityTypes.includes(option)} onChange={() => toggleOpportunity(option)} /><span>{option.replace(/^./, (char) => char.toUpperCase())}</span></label>)}</div></div></section>
      </div>
      <footer><button type="button" className="secondary" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" disabled={saving}><Save />{saving ? "Saving…" : student ? "Save changes" : "Add verified student"}</button></footer>
    </form>
  </div>;
}
