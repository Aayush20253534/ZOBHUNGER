import assert from "node:assert/strict";
import test from "node:test";
import { createBusinessRequirementSchema, updateBusinessRequirementSchema, withdrawBusinessRequirementSchema, listBusinessRequirementsSchema } from "../src/modules/business/business-requirements.schema.js";

const brief = {
  companyName: "Company", contactPerson: "Owner", businessEmail: "OWNER@EXAMPLE.TEST", mobileNumber: "+91 9876543210",
  industry: "Retail", serviceRequired: "Workforce", workforceCount: 25, locations: [" Delhi ", "DELHI", "New   Delhi"],
  projectDuration: "3 months", expectedStartAt: "2028-02-29", details: "Retail staffing for a new market.",
};
const requestKey = "77777777-7777-4777-8777-777777777777";
test("business brief normalizes contact, duplicate locations and calendar dates", () => {
  const result = createBusinessRequirementSchema.parse({ ...brief, requestKey });
  assert.deepEqual(result.locations, ["Delhi", "New Delhi"]); assert.equal(result.jobLocation, "Delhi");
  assert.equal(result.businessEmail, "owner@example.test"); assert.equal(result.expectedStartAt?.toISOString(), "2028-02-29T00:00:00.000Z");
  assert.equal(updateBusinessRequirementSchema.parse({ ...brief, revision: 0, expectedStartAt: null }).expectedStartAt, null);
});
test("business writes reject ownership/status spoofing and malformed or excessive inputs", () => {
  for (const override of [{ userId: "other" }, { businessProfileId: "other" }, { submittedByUserId: "other" }, { status: "QUALIFIED" },
    { submissionHash: "forged" }, { revision: 5 }, { requestKey: "bad-key" }, { workforceCount: 0 }, { workforceCount: 1.5 },
    { workforceCount: "25" }, { workforceCount: 1000001 }, { locations: [] }, { locations: Array(51).fill("Delhi") },
    { expectedStartAt: "2027-02-29" }, { expectedStartAt: "2026-13-01" }, { expectedStartAt: "2026-09-10T12:00:00Z" },
    { mobileNumber: "not a number" }, { details: "x".repeat(6001) }]) {
    assert.equal(createBusinessRequirementSchema.safeParse({ ...brief, requestKey, ...override }).success, false, JSON.stringify(override).slice(0, 80));
  }
  assert.equal(updateBusinessRequirementSchema.safeParse(brief).success, false);
  assert.equal(updateBusinessRequirementSchema.safeParse({ ...brief, revision: -1 }).success, false);
});
test("withdrawal requires a revision and a meaningful bounded reason", () => {
  assert.deepEqual(withdrawBusinessRequirementSchema.parse({ revision: 3, reason: "  Project postponed  " }), { revision: 3, reason: "Project postponed" });
  for (const value of [{ revision: 0, reason: " " }, { reason: "No longer needed" }, { revision: 0, reason: "x".repeat(601) }, { revision: 0, reason: "Cancelled project", status: "NEW" }]) assert.equal(withdrawBusinessRequirementSchema.safeParse(value).success, false);
});
test("requirement list has bounded search, status, sort and pagination", () => {
  assert.deepEqual(listBusinessRequirementsSchema.parse({}), { query: "", status: "ALL", sort: "newest", page: 1 });
  for (const input of [{ query: "x".repeat(121) }, { query: ["x", "y"] }, { userId: "other" }, { status: "DRAFT" }, { sort: "sql" }, { page: "0" }, { page: "10001" }]) assert.equal(listBusinessRequirementsSchema.safeParse(input).success, false);
});
