import assert from "node:assert/strict";
import test from "node:test";
import {
  technicalOpportunityBodySchema,
  technicalOpportunityMatchQuerySchema,
} from "../src/modules/technical-institutes/technical-opportunities.schema.js";

test("technical opportunity schema accepts qualification-led matching rules", () => {
  const parsed = technicalOpportunityBodySchema.parse({
    title: "Electrical Maintenance Technician",
    employerName: "Example Manufacturing",
    opportunityType: "JOB",
    status: "OPEN",
    description: "Maintain electrical systems and support preventive maintenance activities.",
    location: "Noida, Uttar Pradesh",
    city: "Noida",
    state: "Uttar Pradesh",
    workMode: "On-site",
    eligibleQualifications: ["iti", "diploma-polytechnic"],
    eligibleTradesBranches: ["Electrician", "Electrical Engineering"],
    eligiblePassingYears: ["2026", "2027"],
    requiredSkills: ["Industrial wiring"],
    preferredSkills: ["PLC basics"],
    eligibleStates: ["Uttar Pradesh"],
    vacancies: 40,
    compensation: "₹18,000 / month",
  });

  assert.equal(parsed.opportunityType, "JOB");
  assert.deepEqual(parsed.eligibleQualifications, ["iti", "diploma-polytechnic"]);
  assert.deepEqual(parsed.eligiblePassingYears, ["2026", "2027"]);
});

test("technical opportunity schema rejects malformed passing years", () => {
  const result = technicalOpportunityBodySchema.safeParse({
    title: "Technician",
    employerName: "Example Manufacturing",
    opportunityType: "APPRENTICESHIP",
    description: "Structured apprenticeship for eligible technical students and recent graduates.",
    location: "Lucknow",
    eligiblePassingYears: ["26"],
  });
  assert.equal(result.success, false);
});

test("technical opportunity matching query supports score and institute filters", () => {
  const parsed = technicalOpportunityMatchQuerySchema.parse({ minScore: "75", instituteId: "institute-1", limit: "50" });
  assert.equal(parsed.minScore, 75);
  assert.equal(parsed.limit, 50);
  assert.equal(parsed.instituteId, "institute-1");
});
