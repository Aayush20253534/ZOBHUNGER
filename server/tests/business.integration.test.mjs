import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { once } from "node:events";
import { mock, test } from "node:test";

// This suite writes temporary test users. Never silently fall back to DATABASE_URL.
if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to a dedicated, migrated test database before running this suite.");
Object.assign(process.env, {
  DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: "test", REDIS_ENABLED: "false",
  JWT_SECRET: "p21-integration-only-secret-not-for-production", LOG_LEVEL: "error",
  CLIENT_ORIGIN: "http://localhost:3000", PUBLIC_APP_URL: "http://localhost:3000",
  API_RATE_LIMIT_MAX: "1000", AUTH_RATE_LIMIT_MAX: "1000", SUBMISSION_RATE_LIMIT_MAX: "1000",
});
const delivered = [];
let mailConfigured = true;
mock.module(new URL("../dist/services/email.service.js", import.meta.url).href, { namedExports: {
  recoveryEmailConfigured: () => mailConfigured,
  sendBusinessRecoveryEmail: async (email, link) => { delivered.push({ email, link }); return true; },
  sendOperationalEmail: async () => false,
} });
const { app } = await import("../dist/app.js");
const { prisma } = await import("../dist/config/db.js");
const { signAccessToken } = await import("../dist/utils/jwt.js");
const { hashPassword } = await import("../dist/utils/password.js");
const { markLogin } = await import("../dist/modules/auth/auth.repository.js");
const prefix = `p21-${randomUUID()}`;
const emailA = `${prefix}-a@example.test`, emailB = `${prefix}-b@example.test`;
const password = "InitialTest9!", replacement = "ReplacementTest8!";
const company = { companyName: "Company A", contactPerson: "Test Owner", phone: "+91 98765 43210", industry: "Retail", city: "Delhi", state: "Delhi", website: "https://example.test" };
const requirement = { companyName: company.companyName, contactPerson: company.contactPerson, businessEmail: emailA, mobileNumber: company.phone, industry: "Retail", serviceRequired: "Workforce", workforceCount: 3, locations: ["Delhi"], projectDuration: "3 months", details: "Integration test requirement" };
const users = [];
const requirements = [];
let server;
let base;
async function request(path, { cookie, method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(body ? { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0], headers: response.headers };
}
async function waitForMail(count) {
  for (let attempt = 0; attempt < 100 && delivered.length < count; attempt++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(delivered.length, count, "Recovery email was issued through the test mailer");
}

test("business foundation: access, ownership and recovery", async (t) => {
  try {
    server = app.listen(0, "127.0.0.1"); await once(server, "listening");
    base = `http://127.0.0.1:${server.address().port}/api/v1`;
    let a, b, legacyCookie;
    await t.test("business self-registration is blocked and approved accounts retain private access", async () => {
      assert.equal((await request("/business/workspace")).status, 401);
      assert.equal((await request("/auth/register", { method: "POST", body: { email: emailA, password, role: "ADMIN" } })).status, 400);
      assert.equal((await request("/auth/register", { method: "POST", body: { email: emailA, password, role: "BUSINESS" } })).status, 403);
      for (const email of [emailA, emailB]) await prisma.user.create({ data: { email, passwordHash: await hashPassword(password), role: "BUSINESS", businessAccessApproved: true } });
      a = await request("/auth/business-login", { method: "POST", body: { email: emailA, password } });
      b = await request("/auth/business-login", { method: "POST", body: { email: emailB, password } });
      assert.equal(a.status, 200); assert.equal(b.status, 200);
      users.push(a.data.data.user.id, b.data.data.user.id);
      assert.equal("passwordHash" in a.data.data.user, false);
      legacyCookie = `zobhunger_access=${signAccessToken({ sub: users[0], role: "BUSINESS" })}`;
      assert.equal((await request("/business/workspace", { cookie: legacyCookie })).status, 200);
      assert.equal((await request("/auth/register", { method: "POST", body: { email: emailA, password, role: "BUSINESS" } })).status, 403);
      for (const role of ["WORKER", "ADMIN", "PLACEMENT_CELL"]) {
        const user = await prisma.user.create({ data: { email: `${prefix}-${role}@example.test`, passwordHash: "unused", role } }); users.push(user.id);
        const cookie = `zobhunger_access=${signAccessToken({ sub: user.id, role, version: 0 })}`;
        assert.equal((await request("/business/workspace", { cookie })).status, 403);
        assert.equal((await request("/business/profile", { cookie, method: "PUT", body: company })).status, 403);
      }
      const workspace = await request("/business/workspace", { cookie: a.cookie });
      assert.equal(workspace.data.data.profile, null); assert.equal(workspace.headers.get("cache-control"), "no-store");
    });
    await t.test("setup persists only to the signed-in company and rejects ownership spoofing", async () => {
      const guest = await request("/requirements", { method: "POST", body: requirement });
      const owned = await request("/requirements", { method: "POST", cookie: a.cookie, body: { ...requirement, submittedByUserId: users[1], businessProfileId: "spoofed" } });
      assert.equal(guest.status, 201); assert.equal(owned.status, 201); requirements.push(guest.data.data.id, owned.data.data.id);
      assert.equal(owned.data.data.submittedByUserId, users[0]); assert.equal(owned.data.data.businessProfileId, null);
      assert.equal((await request("/business/profile", { method: "PUT", cookie: a.cookie, body: { ...company, userId: users[1] } })).status, 400);
      assert.equal((await request("/business/profile", { method: "PUT", cookie: a.cookie, body: company, headers: { "X-Requested-With": "" } })).status, 403);
      const saved = await request("/business/profile", { method: "PUT", cookie: a.cookie, body: company });
      assert.equal(saved.status, 200); const profile = saved.data.data.profile;
      assert.equal(profile.userId, users[0]); assert.ok(profile.onboardedAt);
      assert.equal((await prisma.workforceRequirement.findUnique({ where: { id: requirements[0] } })).businessProfileId, null, "Never claim anonymous requests by email");
      assert.equal((await prisma.workforceRequirement.findUnique({ where: { id: requirements[1] } })).businessProfileId, profile.id);
      const scoped = await request(`/business/profile?userId=${users[0]}`, { cookie: b.cookie });
      assert.equal(scoped.data.data.profile, null, "Query-string owner cannot select another company");
      const other = await request("/business/profile", { method: "PUT", cookie: b.cookie, body: { ...company, companyName: "Company B" } });
      assert.notEqual(other.data.data.profile.id, profile.id);
      const changed = await request("/business/profile", { method: "PUT", cookie: a.cookie, body: { ...company, city: "Mumbai", state: "Maharashtra" } });
      assert.equal(changed.data.data.profile.id, profile.id); assert.equal(changed.data.data.profile.onboardedAt, profile.onboardedAt);
      assert.equal((await request("/business/profile", { cookie: b.cookie })).data.data.profile.city, "Delhi");
      const next = await request("/requirements", { method: "POST", cookie: a.cookie, body: { ...requirement, businessProfileId: other.data.data.profile.id } });
      assert.equal(next.status, 201); requirements.push(next.data.data.id); assert.equal(next.data.data.businessProfileId, profile.id);
    });
    await t.test("recovery hides account existence, stores hashes and enforces a cooldown", async () => {
      const unknown = await request("/auth/business/forgot-password", { method: "POST", body: { email: `${prefix}-missing@example.test` } });
      const known = await request("/auth/business/forgot-password", { method: "POST", body: { email: emailA } });
      assert.equal(known.status, 202); assert.deepEqual(known.data, unknown.data);
      await waitForMail(1);
      const link = new URL(delivered[0].link); assert.equal(link.pathname, "/business/reset-password"); assert.equal(link.search, "");
      const token = new URLSearchParams(link.hash.slice(1)).get("token");
      const stored = await prisma.passwordResetToken.findUnique({ where: { userId: users[0] } });
      assert.notEqual(stored.tokenHash, token); assert.equal(stored.tokenHash, createHash("sha256").update(token).digest("hex"));
      await request("/auth/business/forgot-password", { method: "POST", body: { email: emailA } });
      await new Promise(resolve => setTimeout(resolve, 50)); assert.equal(delivered.length, 1);
    });
    await t.test("reset links are single-use and invalidate old passwords and sessions", async () => {
      const token = new URLSearchParams(new URL(delivered[0].link).hash.slice(1)).get("token");
      const reset = await request("/auth/business/reset-password", { method: "POST", body: { token, password: replacement } }); assert.equal(reset.status, 200);
      assert.equal((await request("/auth/business/reset-password", { method: "POST", body: { token, password: replacement } })).status, 400);
      assert.equal((await request("/business/workspace", { cookie: a.cookie })).status, 401);
      assert.equal((await request("/business/workspace", { cookie: legacyCookie })).status, 401);
      assert.equal((await request("/auth/business-login", { method: "POST", body: { email: emailA, password } })).status, 401);
      const login = await request("/auth/business-login", { method: "POST", body: { email: emailA, password: replacement } }); assert.equal(login.status, 200);
      assert.equal((await request("/business/workspace", { cookie: login.cookie })).status, 200);
      await assert.rejects(markLogin(users[0], 0), error => error.statusCode === 401, "A concurrent reset cannot create a new session for the old password");
      const logout = await request("/auth/logout", { method: "POST", cookie: login.cookie, headers: { "X-Requested-With": "XMLHttpRequest" } }); assert.equal(logout.status, 200); assert.match(logout.headers.get("set-cookie"), /Expires=Thu, 01 Jan 1970/);
    });
    await t.test("expired links fail; delivery configuration failure is explicit", async () => {
      const token = "b".repeat(64);
      await prisma.passwordResetToken.create({ data: { userId: users[1], tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() - 60_000) } });
      assert.equal((await request("/auth/business/reset-password", { method: "POST", body: { token, password: replacement } })).status, 400);
      const user = await prisma.user.findUnique({ where: { id: users[1] } }); assert.equal(user.sessionVersion, 0);
      mailConfigured = false;
      assert.equal((await request("/auth/business/forgot-password", { method: "POST", body: { email: emailB } })).status, 503);
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: users } } });
    await prisma.workforceRequirement.deleteMany({ where: { id: { in: requirements } } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
    mock.restoreAll();
  }
});
