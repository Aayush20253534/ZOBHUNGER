import assert from "node:assert/strict";
import test from "node:test";
import { businessProfileSchema } from "../src/modules/business/business.schema.js";
import { requestRecoverySchema, resetPasswordSchema } from "../src/modules/auth/password-recovery.schema.js";

const profile = { companyName: " Test business ", contactPerson: "Test Owner", phone: "+91 98765 43210", industry: "Retail", city: "Delhi", state: "Delhi", website: "" };
test("company profile rejects ownership fields and unsafe website protocols", () => {
  assert.equal(businessProfileSchema.safeParse({ ...profile, userId: "another-owner" }).success, false);
  assert.equal(businessProfileSchema.safeParse({ ...profile, businessProfileId: "another-company" }).success, false);
  assert.equal(businessProfileSchema.safeParse({ ...profile, website: "javascript:alert(1)" }).success, false);
  assert.equal(businessProfileSchema.safeParse({ ...profile, website: "https://example.test" }).success, true);
  assert.equal(businessProfileSchema.parse(profile).companyName, "Test business");
  assert.equal(businessProfileSchema.parse(profile).website, null);
});
test("company setup requires all required contact and location fields", () => {
  for (const field of ["companyName", "contactPerson", "phone", "industry", "city", "state"]) {
    assert.equal(businessProfileSchema.safeParse({ ...profile, [field]: " " }).success, false, field);
  }
});
test("recovery normalizes email and rejects weak passwords, malformed tokens and extra fields", () => {
  assert.equal(requestRecoverySchema.parse({ email: " OWNER@EXAMPLE.TEST " }).email, "owner@example.test");
  assert.equal(resetPasswordSchema.safeParse({ token: "a".repeat(64), password: "StrongTest9" }).success, true);
  assert.equal(resetPasswordSchema.safeParse({ token: "short", password: "StrongTest9" }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ token: "a".repeat(64), password: "weak" }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ token: "a".repeat(64), password: "StrongTest9", userId: "spoofed" }).success, false);
});
