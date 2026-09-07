import assert from "node:assert/strict";
import test from "node:test";
import { createPartnerApplicationSchema } from "../src/modules/partners/partners.schema.js";
import {
  listPartnerApplicationsQuerySchema,
  updatePartnerApplicationStatusSchema,
} from "../src/modules/admin/admin.schema.js";

const validPartnerApplication = {
  fullName: "Ananya Sharma",
  mobileNumber: "+919876543210",
  email: "ANANYA@EXAMPLE.COM",
  currentCity: "Gurugram",
  currentProfession: "Sales Consultant",
  companyName: "Independent Consulting",
  totalExperienceYears: "8",
  specialization: "B2B Sales & Market Expansion",
  industryExperience: "Eight years across fintech and retail acquisition programs.",
  linkedInUrl: "https://www.linkedin.com/in/ananya-example",
  contributionPreference: "Business opportunities and market development",
  expertiseDescription:
    "I have led enterprise sales, partner development and field execution programs across multiple North India markets.",
  professionalNetwork: "Fintech, retail and distribution decision-makers.",
  preferredPartnershipArea: "North India market expansion",
};

test("partner application normalizes email and coerces experience", () => {
  const parsed = createPartnerApplicationSchema.parse(validPartnerApplication);
  assert.equal(parsed.email, "ananya@example.com");
  assert.equal(parsed.totalExperienceYears, 8);
});

test("partner application requires a meaningful expertise description", () => {
  const result = createPartnerApplicationSchema.safeParse({
    ...validPartnerApplication,
    expertiseDescription: "Too short",
  });
  assert.equal(result.success, false);
});

test("partner admin filters and status validation accept supported values", () => {
  const parsed = listPartnerApplicationsQuerySchema.parse({
    page: "2",
    status: "CONTACTED",
  });
  assert.equal(parsed.page, 2);
  assert.equal(parsed.status, "CONTACTED");
  assert.equal(
    updatePartnerApplicationStatusSchema.safeParse({ status: "HIRED" }).success,
    false,
  );
});
