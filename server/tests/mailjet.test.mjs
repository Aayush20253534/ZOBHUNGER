import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

Object.assign(process.env, { NODE_ENV: "test", DATABASE_URL: "postgresql://test:test@localhost/test",
  JWT_SECRET: "mail-tests-only-not-production-secret", MAILJET_API_KEY: "test-public-key", MAILJET_SECRET_KEY: "test-private-key",
  MAIL_FROM_EMAIL: "verified@example.test", SALES_TEAM_EMAIL: "sales@example.test", LOG_LEVEL: "info",
  MAILJET_API_HOST: "api.mailjet.com", MAILJET_TIMEOUT_MS: "15000" });
const { env } = await import("../src/config/env.js");
const { mailjetDiagnostic, assertMailjetAccepted } = await import("../src/services/mailjet-errors.js");
const { checkMailjetConfiguration } = await import("../src/services/mailjet.client.js");
const { sendBusinessRecoveryEmail, sendOperationalEmail } = await import("../src/services/email.service.js");
const Mailjet = createRequire(import.meta.url)("node-mailjet");
const success = { body: { Messages: [{ Status: "success", To: [{ MessageID: 123 }] }] } };
const providerFailure = { response: { status: 403, data: { Messages: [{ Status: "error", Errors: [{
  ErrorCode: "send-0008", StatusCode: 403, ErrorIdentifier: "f987008f-251a-4dff-8ffc-40f1583ad7bc",
  ErrorMessage: "PRIVATE_TOKEN sender@example.test test-private-key", ErrorRelatedTo: ["From", "PRIVATE_TOKEN"],
}] }] } }, config: { auth: { username: "test-public-key", password: "test-private-key" }, data: "PRIVATE_TOKEN" } };

test("Mailjet diagnostics distinguish failures without exposing provider request data", () => {
  const result = mailjetDiagnostic(providerFailure);
  assert.equal(result.reason, "sender"); assert.equal(result.errorCode, "send-0008"); assert.equal(result.statusCode, 403);
  assert.deepEqual(result.fields, ["From"]);
  for (const secret of ["PRIVATE_TOKEN", "sender@example.test", "test-private-key", "test-public-key"]) assert.equal(JSON.stringify(result).includes(secret), false);
  for (const [error, reason] of [[{ statusCode: 401 }, "credentials"], [{ statusCode: 403 }, "permission"],
    [{ statusCode: 429 }, "rate_limit"], [{ statusCode: 503 }, "provider"], [{ code: "ETIMEDOUT" }, "timeout"],
    [{ code: "ENOTFOUND" }, "network"], [{ body: { ErrorCode: "mj-0001", StatusCode: 401 } }, "suspended"]]) {
    assert.equal(mailjetDiagnostic(error).reason, reason);
  }
});

test("HTTP success is insufficient when the provider rejects the message", () => {
  assert.doesNotThrow(() => assertMailjetAccepted(success));
  for (const result of [{}, { body: { Messages: [] } }, { body: providerFailure.response.data },
    { body: { Messages: [{ Status: "success", Errors: [{}] }] } }]) assert.throws(() => assertMailjetAccepted(result));
});

test("recovery and operational mail use checked responses, protected logs and configurable delivery", async t => {
  const calls = [], logs = [];
  let result = success, failure;
  t.mock.method(Mailjet.prototype, "post", function(resource, config) {
    return { request: async body => { calls.push({ resource, config, body }); if (failure) throw failure; return result; } };
  });
  t.mock.method(console, "info", value => logs.push(String(value)));
  t.mock.method(console, "log", value => logs.push(String(value)));
  t.mock.method(console, "warn", value => logs.push(String(value)));
  const resetLink = "https://example.test/business/reset-password#token=PRIVATE_TOKEN";
  assert.equal(await sendBusinessRecoveryEmail("recipient@example.test", resetLink, "request-test"), true);
  assert.equal(calls[0].config.version, "v3.1"); assert.equal(calls[0].config.host, "api.mailjet.com");
  assert.equal(calls[0].body.SandboxMode, undefined);
  const message = calls[0].body.Messages[0];
  assert.equal(message.TrackClicks, "disabled"); assert.equal(message.TrackOpens, "disabled");
  assert.ok(message.TextPart.includes(resetLink)); assert.ok(message.HTMLPart.includes(resetLink));
  assert.ok(logs.some(value => value.includes("business.recovery_email_accepted")));
  result = { body: providerFailure.response.data };
  assert.equal(await sendBusinessRecoveryEmail("recipient@example.test", resetLink, "request-test"), false);
  failure = providerFailure;
  assert.equal(await sendOperationalEmail({ subject: "Private subject", text: "PRIVATE_TOKEN" }), false);
  assert.ok(logs.some(value => value.includes('"reason":"sender"')));
  for (const secret of ["PRIVATE_TOKEN", "recipient@example.test", "test-private-key", "test-public-key", "Private subject"]) assert.equal(logs.join("\n").includes(secret), false);
  failure = undefined; result = success;
  const previousSales = env.SALES_TEAM_EMAIL; env.SALES_TEAM_EMAIL = undefined;
  try {
    assert.equal(await sendOperationalEmail({ to: "direct@example.test", subject: "Direct delivery", text: "Test" }), true);
    assert.equal(await sendOperationalEmail({ subject: "Missing recipient", text: "Test" }), false);
    assert.equal(await sendBusinessRecoveryEmail("recipient@example.test", resetLink), true);
  } finally { env.SALES_TEAM_EMAIL = previousSales; }
});

test("configuration check always uses provider sandbox mode and reports missing settings", async t => {
  const calls = [];
  t.mock.method(Mailjet.prototype, "post", (_resource, config) => ({ request: async body => { calls.push({ config, body }); return success; } }));
  const host = env.MAILJET_API_HOST; env.MAILJET_API_HOST = "api.us.mailjet.com";
  try {
    assert.equal((await checkMailjetConfiguration()).ready, true);
    assert.equal(calls[0].body.SandboxMode, true); assert.equal(calls[0].config.host, "api.us.mailjet.com");
    const secret = env.MAILJET_SECRET_KEY; env.MAILJET_SECRET_KEY = undefined;
    try { assert.deepEqual((await checkMailjetConfiguration()).missing, ["MAILJET_SECRET_KEY"]); assert.equal(calls.length, 1); }
    finally { env.MAILJET_SECRET_KEY = secret; }
  } finally { env.MAILJET_API_HOST = host; }
});

test("Mailjet environment aliases work while canonical settings keep precedence", () => {
  for (const canonical of ["", "canonical-secret"]) {
    const child = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e",
      'import {env} from "./src/config/env.ts"; console.log(JSON.stringify({key:env.MAILJET_API_KEY,secret:env.MAILJET_SECRET_KEY,timeout:env.MAILJET_TIMEOUT_MS}));'], {
      cwd: new URL("..", import.meta.url), encoding: "utf8", env: { ...process.env, MAILJET_API_KEY: "", MJ_APIKEY_PUBLIC: "alias-public",
        MAILJET_SECRET_KEY: canonical, MAILJET_API_SECRET: "alias-secret", MJ_APIKEY_PRIVATE: "other-secret" },
    });
    assert.equal(child.status, 0, child.stderr);
    assert.deepEqual(JSON.parse(child.stdout), { key: "alias-public", secret: canonical || "alias-secret", timeout: 15000 });
  }
});
