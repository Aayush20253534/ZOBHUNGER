import assert from "node:assert/strict";
import test from "node:test";
import { employeeJoiningSubmissionSchema, employeeOfferSchema } from "../src/modules/employee-joining/employee-joining.schema.js";
import { createEmployeeOfferPdf } from "../src/modules/employee-joining/offer-letter-pdf.js";

const validJoining = {
  requestKey: "11111111-1111-4111-8111-111111111111",
  projectCode: "retail-01",
  projectAssignment: "Retail field deployment",
  fullName: "Aarav Kumar",
  fatherGuardianName: "Rakesh Kumar",
  personalEmail: "AARAV@EXAMPLE.COM",
  phone: "+91 9876543210",
  alternatePhone: "",
  dateOfBirth: "2000-06-12",
  gender: "MALE",
  maritalStatus: "SINGLE",
  bloodGroup: "O+",
  shirtSize: "M",
  currentAddressLine1: "12 Market Road",
  currentAddressLine2: "",
  currentCity: "Ghazipur",
  currentState: "Uttar Pradesh",
  currentPostalCode: "233001",
  permanentSameAsCurrent: true,
  permanentAddressLine1: "12 Market Road",
  permanentAddressLine2: "",
  permanentCity: "Ghazipur",
  permanentState: "Uttar Pradesh",
  permanentPostalCode: "233001",
  emergencyContactName: "Rakesh Kumar",
  emergencyRelationship: "Father",
  emergencyPhone: "9876543211",
  aadhaarNumber: "1234 5678 9012",
  panNumber: "abcde1234f",
  bankAccountHolder: "Aarav Kumar",
  bankName: "Example Bank",
  bankAccountNumber: "1234 5678 9012",
  ifscCode: "abcd0123456",
  bankBranch: "Ghazipur Main",
  upiId: "",
  uanNumber: "1000 2000 3000",
  highestQualification: "B.Com",
  institution: "Example University",
  boardUniversity: "Example University",
  graduationYear: 2022,
  grade: "8.2 CGPA",
  previousEmployment: [],
  consent: true,
};

test("employee joining normalizes project, email and protected identifiers", () => {
  const parsed = employeeJoiningSubmissionSchema.parse(validJoining);
  assert.equal(parsed.projectCode, "RETAIL-01");
  assert.equal(parsed.personalEmail, "aarav@example.com");
  assert.equal(parsed.aadhaarNumber, "123456789012");
  assert.equal(parsed.panNumber, "ABCDE1234F");
  assert.equal(parsed.bankAccountNumber, "123456789012");
  assert.equal(parsed.uanNumber, "100020003000");
});

test("employee joining rejects invalid statutory identifiers", () => {
  const result = employeeJoiningSubmissionSchema.safeParse({ ...validJoining, panNumber: "INVALID" });
  assert.equal(result.success, false);
});

test("employee joining rejects impossible calendar dates", () => {
  const result = employeeJoiningSubmissionSchema.safeParse({ ...validJoining, dateOfBirth: "2000-02-31" });
  assert.equal(result.success, false);
});

test("employee offer input validates HR controlled offer terms", () => {
  const result = employeeOfferSchema.safeParse({
    designation: "Field Executive",
    department: "Operations",
    projectAssignment: "Retail field deployment",
    workLocation: "Ghazipur, Uttar Pradesh",
    joiningDate: "2026-10-01",
    employmentType: "FULL_TIME",
    monthlyGrossSalary: 25000,
    annualCtc: 300000,
    probationMonths: 3,
    noticePeriodDays: 30,
    additionalTerms: "",
    authorizedSignatoryName: "HR Manager",
    authorizedSignatoryTitle: "Authorized Signatory",
    expectedRevision: 0,
  });
  assert.equal(result.success, true);
});

test("offer letter generator returns a printable PDF document", () => {
  const pdf = createEmployeeOfferPdf(
    {
      employeeNumber: "ZBH-RETAIL-01-26-0001",
      fullName: "Aarav Kumar",
      currentAddressLine1: "12 Market Road",
      currentAddressLine2: null,
      currentCity: "Ghazipur",
      currentState: "Uttar Pradesh",
      currentPostalCode: "233001",
    },
    {
      status: "DRAFT",
      designation: "Field Executive",
      department: "Operations",
      projectAssignment: "Retail field deployment",
      workLocation: "Ghazipur, Uttar Pradesh",
      joiningDate: new Date("2026-10-01T00:00:00.000Z"),
      employmentType: "FULL_TIME",
      monthlyGrossSalary: 25000,
      annualCtc: 300000,
      probationMonths: 3,
      noticePeriodDays: 30,
      additionalTerms: null,
      authorizedSignatoryName: "HR Manager",
      authorizedSignatoryTitle: "Authorized Signatory",
      issuedAt: null,
    },
  );
  assert.equal(pdf.subarray(0, 8).toString("ascii"), "%PDF-1.4");
  assert.match(pdf.subarray(-64).toString("ascii"), /%%EOF/);
});

test("offer letter paginates long additional terms without corrupting the PDF", () => {
  const pdf = createEmployeeOfferPdf(
    {
      employeeNumber: "ZBH-RETAIL-01-26-0001",
      fullName: "Aarav Kumar",
      currentAddressLine1: "12 Market Road",
      currentAddressLine2: null,
      currentCity: "Ghazipur",
      currentState: "Uttar Pradesh",
      currentPostalCode: "233001",
    },
    {
      status: "DRAFT",
      designation: "Field Executive",
      department: "Operations",
      projectAssignment: "Retail field deployment",
      workLocation: "Ghazipur, Uttar Pradesh",
      joiningDate: new Date("2026-10-01T00:00:00.000Z"),
      employmentType: "FULL_TIME",
      monthlyGrossSalary: 25000,
      annualCtc: 300000,
      probationMonths: 3,
      noticePeriodDays: 30,
      additionalTerms: Array.from({ length: 120 }, (_, index) => `Term ${index + 1} requires the employee to follow documented project and company instructions.`).join(" "),
      authorizedSignatoryName: "HR Manager",
      authorizedSignatoryTitle: "Authorized Signatory",
      issuedAt: null,
    },
  );
  const body = pdf.toString("latin1");
  assert.match(body, /\/Type \/Pages \/Kids \[[^\]]+\] \/Count [2-9]/);
  assert.match(body, /Additional Terms & Conditions/);
  assert.match(body, /%%EOF/);
});
