import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { once } from "node:events";
import { test } from "node:test";

if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to a dedicated migrated test database. Temporary fixtures will be written.");
Object.assign(process.env, { NODE_ENV: "test", DATABASE_URL: process.env.TEST_DATABASE_URL,
  JWT_SECRET: "submission-recovery-tests-only-not-production", REDIS_ENABLED: "false", LOG_LEVEL: "info",
  RESEND_API_KEY: "re_dummy-secret", RESEND_TIMEOUT_MS: "15000", MAIL_FROM_EMAIL: "mail@zobhungr.com",
  MAIL_FROM_NAME: "ZOBHUNGER", SALES_TEAM_EMAIL: "sales@example.test", CLIENT_ORIGIN: "http://localhost:3000",
  PUBLIC_APP_URL: "https://frontend.example.test", API_RATE_LIMIT_MAX: "2000", SUBMISSION_RATE_LIMIT_MAX: "1000" });
const { app } = await import("../dist/app.js");
const { prisma } = await import("../dist/config/db.js");
const prefix = `resendfix-${randomUUID()}`, email = `${prefix}@example.test`;
const userIds = [], requirementIds = [], messages = [], logs = [];
let mode = "success", server, base;
const failedBody = { name: "validation_error", message: "The sender domain is not verified. Do not log re_dummy-secret or a reset token." };
async function waitUntil(condition) {
  for (let attempt = 0; attempt < 100; attempt++) { if (await condition()) return; await new Promise(resolve => setTimeout(resolve, 10)); }
  assert.fail("Background submission task did not complete");
}
async function request(path, { body, cookie } = {}) {
  const response = await fetch(`${base}${path}`, { method: body ? "POST" : "GET", headers: {
    ...(body ? { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
}

test("public requirement submissions and the real recovery service handle Resend failure correctly", async t => {
  const nativeFetch = globalThis.fetch.bind(globalThis);
  t.mock.method(globalThis, "fetch", async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url !== "https://api.resend.com/emails") return nativeFetch(input, init);
    const body = JSON.parse(String(init?.body ?? "{}"));
    messages.push(body);
    if (mode === "rejected") {
      return new Response(JSON.stringify(failedBody), { status: 403, headers: { "Content-Type": "application/json" } });
    }
    if (mode === "message-error") {
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ id: randomUUID() }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  t.mock.method(console, "log", value => logs.push(String(value)));
  t.mock.method(console, "warn", value => logs.push(String(value)));
  const brief = { companyName: "Example Company", contactPerson: "Owner", businessEmail: email, mobileNumber: "+91 9876543210",
    industry: "retail", serviceRequired: "workforce", workforceCount: 5, locations: ["Delhi", "Mumbai"], projectDuration: "1 day", details: "Field staffing for two sites." };
  try {
    server = app.listen(0, "127.0.0.1"); await once(server, "listening"); base = `http://127.0.0.1:${server.address().port}/api/v1`;
    const { hashPassword } = await import("../dist/utils/password.js");
    await prisma.user.create({ data: { email, passwordHash: await hashPassword("StartingTest9!"), role: "BUSINESS", businessAccessApproved: true } });
    const account = await request("/auth/business-login", { body: { email, password: "StartingTest9!" } });
    assert.equal(account.status, 200); const userId = account.data.data.user.id; userIds.push(userId);

    await t.test("400 explains the rejected field and a corrected brief persists to the signed-in dashboard", async () => {
      const invalid = await request("/requirements", { cookie: account.cookie, body: { ...brief, projectDuration: "1" } });
      assert.equal(invalid.status, 400); assert.match(invalid.data.error.details.fieldErrors.projectDuration[0], /1 day/);
      assert.equal(await prisma.workforceRequirement.count({ where: { submittedByUserId: userId } }), 0);
      const accepted = await request("/requirements", { cookie: account.cookie, body: { ...brief, expectedStartAt: null } });
      assert.equal(accepted.status, 201); requirementIds.push(accepted.data.data.id);
      const row = await prisma.workforceRequirement.findUnique({ where: { id: accepted.data.data.id } });
      assert.equal(row.expectedStartAt, null); assert.equal(row.jobLocation, "Delhi"); assert.deepEqual(row.locations, ["Delhi", "Mumbai"]);
      const dashboard = await request("/business/dashboard", { cookie: account.cookie });
      assert.equal(dashboard.data.data.summary.peopleRequested, 5);
      const validation = logs.find(value => value.includes('"message":"request.validation_failed"'));
      assert.ok(validation); assert.ok(validation.includes("projectDuration")); assert.equal(validation.includes(email), false);
    });

    await t.test("notification rejection does not undo a saved guest requirement", async () => {
      mode = "rejected";
      const accepted = await request("/requirements", { body: { ...brief, expectedStartAt: "" } });
      assert.equal(accepted.status, 201); requirementIds.push(accepted.data.data.id);
      assert.equal(accepted.data.data.submittedByUserId, null);
      await waitUntil(() => logs.some(value => value.includes('"message":"email.failed"')));
    });

    await t.test("provider rejection keeps recovery responses private and removes unusable tokens", async () => {
      const unknown = await request("/auth/business/forgot-password", { body: { email: `missing-${email}` } });
      const known = await request("/auth/business/forgot-password", { body: { email } });
      assert.equal(known.status, 202); assert.deepEqual(known.data, unknown.data);
      await waitUntil(() => logs.some(value => value.includes('"message":"business.recovery_delivery_failed"')));
      await waitUntil(async () => !(await prisma.passwordResetToken.findUnique({ where: { userId } })));
      const diagnostic = JSON.parse(logs.find(value => value.includes('"message":"business.recovery_delivery_failed"')));
      assert.equal(diagnostic.reason, "sender"); assert.equal(diagnostic.errorCode, "validation_error"); assert.ok(diagnostic.requestId);
    });

    await t.test("HTTP-success/message-error is rejected, then corrected delivery produces a usable single-use link", async () => {
      mode = "message-error"; const failures = logs.filter(value => value.includes('"message":"business.recovery_delivery_failed"')).length;
      assert.equal((await request("/auth/business/forgot-password", { body: { email } })).status, 202);
      await waitUntil(() => logs.filter(value => value.includes('"message":"business.recovery_delivery_failed"')).length > failures);
      await waitUntil(async () => !(await prisma.passwordResetToken.findUnique({ where: { userId } })));
      mode = "success";
      assert.equal((await request("/auth/business/forgot-password", { body: { email } })).status, 202);
      await waitUntil(() => logs.some(value => value.includes('"message":"business.recovery_email_accepted"')));
      const message = messages.at(-1), link = new URL(message.text.match(/https:\/\/\S+/)[0]);
      assert.equal(link.pathname, "/business/reset-password"); assert.equal(link.search, ""); assert.equal("TrackClicks" in message, false);
      const token = new URLSearchParams(link.hash.slice(1)).get("token");
      const row = await prisma.passwordResetToken.findUnique({ where: { userId } });
      assert.equal(row.tokenHash, createHash("sha256").update(token).digest("hex"));
      const body = { token, password: "ReplacementTest9!" };
      assert.equal((await request("/auth/business/reset-password", { body })).status, 200);
      assert.equal((await request("/auth/business/reset-password", { body })).status, 400);
      assert.equal((await request("/business/workspace", { cookie: account.cookie })).status, 401);
      assert.equal(logs.join("\n").includes(token), false); assert.equal(logs.join("\n").includes("re_dummy-secret"), false);
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
    await prisma.workforceRequirement.deleteMany({ where: { id: { in: requirementIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } }); await prisma.$disconnect();
  }
});
