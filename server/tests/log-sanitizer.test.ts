import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeLogContext, sanitizeRequestTarget } from "../src/utils/log-sanitizer.js";

test("request logging redacts payment path credentials and secret query values", () => {
  const sanitized = sanitizeRequestTarget("/api/v1/internship-payments/checkout/checkout-secret/order?token=receipt-secret&safe=visible");
  assert.equal(sanitized.includes("checkout-secret"), false);
  assert.equal(sanitized.includes("receipt-secret"), false);
  assert.match(sanitized, /checkout\/\[REDACTED\]/);
  assert.match(sanitized, /token=\[REDACTED\]/);
  assert.match(sanitized, /safe=visible/);
});

test("structured logging recursively redacts credentials and bearer values", () => {
  const sanitized = sanitizeLogContext({
    accessToken: "token-value",
    nested: { password: "secret-password", note: "Authorization: Bearer abc.def.ghi" },
    amount: 500,
  });
  assert.equal(sanitized.accessToken, "[REDACTED]");
  assert.deepEqual(sanitized.nested, { password: "[REDACTED]", note: "Authorization: Bearer [REDACTED]" });
  assert.equal(sanitized.amount, 500);
});
