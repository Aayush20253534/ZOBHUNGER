import assert from "node:assert/strict";
import test from "node:test";
import { createRequirementSchema } from "../src/modules/requirements/requirements.schema.js";

const validRequirement = {
  companyName: "Acme Retail",
  contactPerson: "Riya Sharma",
  businessEmail: "HIRING@ACME.COM",
  mobileNumber: "9876543210",
  industry: "Retail",
  serviceRequired: "Promoter Hiring",
  workforceCount: 25,
  locations: ["Noida", "Noida", "Delhi"],
  projectDuration: "3 months",
  details: "Need trained promoters for retail counters.",
};

test("requirement schema normalizes email and deduplicates locations", () => {
  const parsed = createRequirementSchema.parse(validRequirement);

  assert.equal(parsed.businessEmail, "hiring@acme.com");
  assert.equal(parsed.jobLocation, "Noida");
  assert.deepEqual(parsed.locations, ["Noida", "Delhi"]);
});

test("explicit jobLocation is included in locations", () => {
  const parsed = createRequirementSchema.parse({
    ...validRequirement,
    jobLocation: "Gurugram",
    locations: ["Delhi"],
  });

  assert.equal(parsed.jobLocation, "Gurugram");
  assert.deepEqual(parsed.locations, ["Gurugram", "Delhi"]);
});


test("blank optional start date is accepted and normalized away", () => {
  const parsed = createRequirementSchema.parse({
    ...validRequirement,
    expectedStartAt: "",
  });

  assert.equal(parsed.expectedStartAt, undefined);
});

test("provided start date is coerced to a Date", () => {
  const parsed = createRequirementSchema.parse({
    ...validRequirement,
    expectedStartAt: "2026-09-15",
  });

  assert.equal(parsed.expectedStartAt instanceof Date, true);
  assert.equal(
    parsed.expectedStartAt?.toISOString().startsWith("2026-09-15"),
    true,
  );
});

test("requirement schema requires at least one location", () => {
  const result = createRequirementSchema.safeParse({
    ...validRequirement,
    locations: [],
  });

  assert.equal(result.success, false);
});

test("absent start dates stay absent and invalid dates cannot become 1970 or roll into another month", () => {
  for (const expectedStartAt of [undefined, null, "", "   "]) {
    assert.equal(createRequirementSchema.parse({ ...validRequirement, expectedStartAt }).expectedStartAt, undefined);
  }
  for (const expectedStartAt of [0, true, "2026-02-30", "2026-02-30T12:00:00Z", "not-a-date"]) {
    assert.equal(createRequirementSchema.safeParse({ ...validRequirement, expectedStartAt }).success, false);
  }
  assert.equal(createRequirementSchema.parse({ ...validRequirement, expectedStartAt: "2028-02-29" }).expectedStartAt?.toISOString(), "2028-02-29T00:00:00.000Z");
});

test("blank legacy primary location uses the submitted location array", () => {
  assert.equal(createRequirementSchema.parse({ ...validRequirement, jobLocation: "" }).jobLocation, "Noida");
});

test("duration validation identifies the field and explains what to enter", () => {
  const parsed = createRequirementSchema.safeParse({ ...validRequirement, projectDuration: "1" });
  assert.equal(parsed.success, false);
  assert.match(parsed.error.flatten().fieldErrors.projectDuration[0], /1 day/);
  assert.equal(createRequirementSchema.safeParse({ ...validRequirement, projectDuration: "1 day" }).success, true);
});
