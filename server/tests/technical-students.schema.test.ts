import assert from "node:assert/strict";
import test from "node:test";
import {
  publicTechnicalStudentRegistrationSchema,
  technicalStudentCoreSchema,
} from "../src/modules/technical-institutes/technical-students.schema.js";
import { parseTechnicalStudentSpreadsheet } from "../src/modules/technical-institutes/technical-student-import.js";

const validStudent = {
  fullName: "Aman Kumar",
  email: "AMAN@EXAMPLE.COM",
  mobileNumber: "9876543210",
  enrollmentNumber: "ITI2026001",
  dateOfBirth: "2006-03-14",
  gender: "male" as const,
  qualification: "iti" as const,
  tradeBranch: "Electrician",
  passingYear: "2026",
  currentSemesterYear: "Final Year",
  academicScore: "78%",
  skills: ["Industrial wiring", "PLC basics"],
  certifications: ["NCVT"],
  currentCity: "Prayagraj",
  currentState: "Uttar Pradesh",
  preferredLocations: ["Noida", "Gurugram"],
  preferredOpportunityTypes: ["jobs", "apprenticeships"] as const,
};

test("technical student schema normalizes email and keeps eligibility fields", () => {
  const parsed = technicalStudentCoreSchema.parse(validStudent);
  assert.equal(parsed.email, "aman@example.com");
  assert.equal(parsed.qualification, "iti");
  assert.deepEqual(parsed.preferredOpportunityTypes, ["jobs", "apprenticeships"]);
});

test("public technical student registration requires institute code and consent", () => {
  const result = publicTechnicalStudentRegistrationSchema.safeParse({
    ...validStudent,
    partnershipCode: "iti-up-2026-abc123",
    consentAccepted: true,
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.partnershipCode, "ITI-UP-2026-ABC123");

  const missingConsent = publicTechnicalStudentRegistrationSchema.safeParse({
    ...validStudent,
    partnershipCode: "ITI-UP-2026-ABC123",
    consentAccepted: false,
  });
  assert.equal(missingConsent.success, false);
});

test("technical student CSV import maps spreadsheet headings and reports duplicate rows", () => {
  const csv = [
    "Full Name,Email,Mobile Number,Enrollment Number,Date of Birth,Gender,Qualification,Trade / Branch,Passing Year,Current Semester / Year,Percentage / CGPA,Skills,Certifications,Current City,Current State,Preferred Locations,Interested In",
    'Aman Kumar,aman@example.com,9876543210,ITI2026001,14/03/2006,Male,ITI,Electrician,2026,Final Year,78%,"Industrial wiring; PLC basics",NCVT,Prayagraj,Uttar Pradesh,"Noida; Gurugram","Jobs; Apprenticeships"',
    "Duplicate Aman,aman@example.com,9999999999,ITI2026002,14/03/2006,Male,ITI,Fitter,2026,Final Year,75%,Welding,NCVT,Prayagraj,Uttar Pradesh,Noida,Jobs",
  ].join("\r\n");

  const parsed = parseTechnicalStudentSpreadsheet({
    buffer: Buffer.from(csv, "utf8"),
    mimeType: "text/csv",
    fileName: "students.csv",
  });

  assert.equal(parsed.totalRows, 2);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].tradeBranch, "Electrician");
  assert.deepEqual(parsed.rows[0].skills, ["Industrial wiring", "PLC basics"]);
  assert.deepEqual(parsed.rows[0].preferredOpportunityTypes, ["jobs", "apprenticeships"]);
  assert.equal(parsed.errors.length, 1);
  assert.equal(parsed.errors[0].field, "email");
});
