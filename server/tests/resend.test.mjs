import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://test:test@localhost/test",
  JWT_SECRET: "resend-tests-only-not-production-secret",
  RESEND_API_KEY: "re_test-secret-key",
  RESEND_TIMEOUT_MS: "15000",
  MAIL_FROM_EMAIL: "mail@zobhungr.com",
  MAIL_FROM_NAME: "ZOBHUNGER",
  MAIL_REPLY_TO_EMAIL: "help@example.test",
  SALES_TEAM_EMAIL: "sales@example.test",
  LOG_LEVEL: "info",
});

const { env } = await import("../src/config/env.js");
const { resendDiagnostic, assertResendAccepted } = await import("../src/services/resend-errors.js");
const { checkResendConfiguration, postResendMessage } = await import("../src/services/resend.client.js");
const { sendBusinessRecoveryEmail, sendOperationalEmail } = await import("../src/services/email.service.js");

const accepted = { id: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794" };
const providerFailure = {
  statusCode: 403,
  body: {
    name: "validation_error",
    message: "The sender domain is not verified. PRIVATE_TOKEN sender@example.test",
  },
  private: "re_test-secret-key",
};

test("Resend diagnostics distinguish failures without exposing provider request data", () => {
  const result = resendDiagnostic(providerFailure);
  assert.equal(result.reason, "sender");
  assert.equal(result.errorCode, "validation_error");
  assert.equal(result.statusCode, 403);

  for (const secret of ["PRIVATE_TOKEN", "sender@example.test", "re_test-secret-key"]) {
    assert.equal(JSON.stringify(result).includes(secret), false);
  }

  for (const [error, reason] of [
    [{ statusCode: 401, body: { name: "invalid_api_key" } }, "credentials"],
    [{ statusCode: 403, body: { name: "restricted_api_key" } }, "permission"],
    [{ statusCode: 429, body: { name: "rate_limit_exceeded" } }, "rate_limit"],
    [{ statusCode: 503 }, "provider"],
    [{ name: "TimeoutError" }, "timeout"],
    [{ cause: { code: "ENOTFOUND" } }, "network"],
    [{ statusCode: 422, body: { name: "validation_error", message: "Invalid to field" } }, "payload"],
  ]) {
    assert.equal(resendDiagnostic(error).reason, reason);
  }
});

test("Resend success requires an accepted message id", () => {
  assert.deepEqual(assertResendAccepted(accepted), accepted);
  for (const result of [{}, { id: "" }, { id: null }]) assert.throws(() => assertResendAccepted(result));
});

test("Resend forwards offer attachments and an idempotency key", async (t) => {
  let request;
  t.mock.method(globalThis, "fetch", async (_input, init) => {
    request = { headers: init?.headers, body: JSON.parse(String(init?.body ?? "{}")) };
    return new Response(JSON.stringify(accepted), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  await postResendMessage({
    to: ["employee@example.test"],
    subject: "Offer",
    text: "Attached",
    attachments: [{ filename: "offer.pdf", content: "JVBERi0xLjQ=" }],
    idempotencyKey: "employee-offer-test-r4",
  });
  assert.equal(request.headers["Idempotency-Key"], "employee-offer-test-r4");
  assert.deepEqual(request.body.attachments, [{ filename: "offer.pdf", content: "JVBERi0xLjQ=" }]);
  assert.equal(request.body.reply_to, "help@example.test");
});

test("recovery and operational mail use Resend with protected logs", async (t) => {
  const calls = [];
  const logs = [];
  let mode = "success";

  t.mock.method(globalThis, "fetch", async (input, init) => {
    calls.push({ input: String(input), init, body: JSON.parse(String(init?.body ?? "{}")) });
    if (mode === "rejected") {
      return new Response(JSON.stringify(providerFailure.body), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (mode === "bad-success") {
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify(accepted), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  t.mock.method(console, "info", (value) => logs.push(String(value)));
  t.mock.method(console, "log", (value) => logs.push(String(value)));
  t.mock.method(console, "warn", (value) => logs.push(String(value)));

  const resetLink = "https://example.test/business/reset-password#token=PRIVATE_TOKEN";
  assert.equal(await sendBusinessRecoveryEmail("recipient@example.test", resetLink, "request-test"), true);

  assert.equal(calls[0].input, "https://api.resend.com/emails");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.Authorization, "Bearer re_test-secret-key");
  assert.equal(calls[0].body.from, "ZOBHUNGER <mail@zobhungr.com>");
  assert.deepEqual(calls[0].body.to, ["recipient@example.test"]);
  assert.equal(calls[0].body.reply_to, "help@example.test");
  assert.ok(calls[0].body.text.includes(resetLink));
  assert.ok(calls[0].body.html.includes(resetLink));
  assert.equal("TrackClicks" in calls[0].body, false);
  assert.ok(logs.some((value) => value.includes("business.recovery_email_accepted")));

  mode = "bad-success";
  assert.equal(await sendBusinessRecoveryEmail("recipient@example.test", resetLink, "request-test"), false);

  mode = "rejected";
  assert.equal(await sendOperationalEmail({ subject: "Private subject", text: "PRIVATE_TOKEN" }), false);
  assert.ok(logs.some((value) => value.includes('"provider":"resend"')));
  assert.ok(logs.some((value) => value.includes('"reason":"sender"')));
  for (const secret of ["PRIVATE_TOKEN", "recipient@example.test", "re_test-secret-key", "Private subject"]) {
    assert.equal(logs.join("\n").includes(secret), false);
  }

  mode = "success";
  const previousSales = env.SALES_TEAM_EMAIL;
  env.SALES_TEAM_EMAIL = undefined;
  try {
    assert.equal(await sendOperationalEmail({ to: "direct@example.test", subject: "Direct delivery", text: "Test" }), true);
    assert.equal(await sendOperationalEmail({ subject: "Missing recipient", text: "Test" }), false);
    assert.equal(await sendBusinessRecoveryEmail("recipient@example.test", resetLink), true);
  } finally {
    env.SALES_TEAM_EMAIL = previousSales;
  }
});

test("configuration check uses Resend's safe test recipient and reports missing settings", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (input, init) => {
    calls.push({ input: String(input), body: JSON.parse(String(init?.body ?? "{}")) });
    return new Response(JSON.stringify(accepted), { status: 200, headers: { "Content-Type": "application/json" } });
  });

  const result = await checkResendConfiguration();
  assert.equal(result.ready, true);
  assert.equal(result.provider, "resend");
  assert.deepEqual(calls[0].body.to, ["delivered+zobhunger-config@resend.dev"]);

  const key = env.RESEND_API_KEY;
  env.RESEND_API_KEY = undefined;
  try {
    assert.deepEqual((await checkResendConfiguration()).missing, ["RESEND_API_KEY"]);
    assert.equal(calls.length, 1);
  } finally {
    env.RESEND_API_KEY = key;
  }
});

test("Resend environment settings are canonical and blank-safe", () => {
  const child = spawnSync(process.execPath, [
    "--import", "tsx", "--input-type=module", "-e",
    'import {env} from "./src/config/env.ts"; console.log(JSON.stringify({key:env.RESEND_API_KEY,timeout:env.RESEND_TIMEOUT_MS}));',
  ], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    env: { ...process.env, RESEND_API_KEY: "re_child-key", RESEND_TIMEOUT_MS: "9000" },
  });
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout), { key: "re_child-key", timeout: 9000 });
});
