import assert from "node:assert/strict";
import test from "node:test";
import { createJobApplicationSchema, listJobsQuerySchema } from "../src/modules/jobs/jobs.schema.js";

test("job filters preserve frontend compatibility aliases", () => {
  const parsed = listJobsQuerySchema.parse({
    location: "Lucknow",
    jobType: "Full-time",
    page: "2",
    pageSize: "12",
  });

  assert.equal(parsed.city, "Lucknow");
  assert.equal(parsed.engagementType, "Full-time");
  assert.equal(parsed.page, 2);
  assert.equal(parsed.pageSize, 12);
});

test("job application normalizes email and parses available date", () => {
  const parsed = createJobApplicationSchema.parse({
    fullName: "Aman Singh",
    email: "AMAN@EXAMPLE.COM",
    phone: "9876543210",
    currentLocation: "Prayagraj",
    availableFrom: "2026-09-20",
  });

  assert.equal(parsed.email, "aman@example.com");
  assert.equal(parsed.availableFrom?.toISOString(), "2026-09-20T00:00:00.000Z");
});

test("job application rejects invalid resume URLs", () => {
  const result = createJobApplicationSchema.safeParse({
    fullName: "Aman Singh",
    email: "aman@example.com",
    phone: "9876543210",
    currentLocation: "Prayagraj",
    resumeUrl: "not-a-url",
  });

  assert.equal(result.success, false);
});
