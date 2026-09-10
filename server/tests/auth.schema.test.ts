import assert from "node:assert/strict";
import test from "node:test";
import { loginSchema, registerSchema } from "../src/modules/auth/auth.schema.js";

test("legacy register payload schema normalizes email before account-approval policy", () => {
  const parsed = registerSchema.parse({
    email: "  Worker@Example.COM ",
    phone: "9876543210",
    password: "StrongPass1",
    role: "WORKER",
  });

  assert.equal(parsed.email, "worker@example.com");
  assert.equal(parsed.role, "WORKER");
});

test("register schema rejects public ADMIN registration", () => {
  const result = registerSchema.safeParse({
    email: "admin@example.com",
    password: "StrongPass1",
    role: "ADMIN",
  });

  assert.equal(result.success, false);
});

test("register schema rejects weak passwords", () => {
  const result = registerSchema.safeParse({
    email: "worker@example.com",
    password: "password",
    role: "WORKER",
  });

  assert.equal(result.success, false);
});

test("login schema lowercases email", () => {
  const parsed = loginSchema.parse({
    email: "ADMIN@ZOBHUNGER.COM",
    password: "anything",
  });

  assert.equal(parsed.email, "admin@zobhunger.com");
});
