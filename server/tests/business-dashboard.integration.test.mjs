import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mock, test } from "node:test";

// These fixtures must only be written to a dedicated, migrated test database.
if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to a dedicated, migrated test database.");
Object.assign(process.env, {
  DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: "test", REDIS_ENABLED: "false",
  JWT_SECRET: "dashboard-integration-only-not-for-production", LOG_LEVEL: "error",
  CLIENT_ORIGIN: "http://localhost:3000", PUBLIC_APP_URL: "http://localhost:3000",
  API_RATE_LIMIT_MAX: "1000", AUTH_RATE_LIMIT_MAX: "1000", SUBMISSION_RATE_LIMIT_MAX: "1000",
});
mock.module(new URL("../dist/services/email.service.js", import.meta.url).href, { namedExports: {
  recoveryEmailConfigured: () => false, sendBusinessRecoveryEmail: async () => false, sendOperationalEmail: async () => false,
} });
const { app } = await import("../dist/app.js");
const { prisma } = await import("../dist/config/db.js");
const { signAccessToken } = await import("../dist/utils/jwt.js");
const { getBusinessDashboard } = await import("../dist/modules/business/business-dashboard.service.js");
const { dashboardPeriod } = await import("../dist/modules/business/business-dashboard.utils.js");
const { updateRequirementStatusWithAudit } = await import("../dist/modules/admin/admin.repository.js");
const prefix = `p22-${randomUUID()}`;
const users = [], ids = [];
const now = new Date(), DAY = 86400000;
let server, base;
const cookieFor = user => `zobhunger_access=${signAccessToken({ sub: user.id, role: user.role, version: 0 })}`;
async function request(path, cookie) {
  const response = await fetch(`${base}${path}`, { headers: cookie ? { Cookie: cookie } : {} });
  return { status: response.status, body: await response.json(), headers: response.headers };
}

test("dashboard: real data, private ownership, filters, detail and session guards", async t => {
  try {
    server = app.listen(0, "127.0.0.1"); await once(server, "listening");
    base = `http://127.0.0.1:${server.address().port}/api/v1`;
    for (const [suffix, role] of [["a", "BUSINESS"], ["b", "BUSINESS"], ["empty", "BUSINESS"], ["worker", "WORKER"], ["admin", "ADMIN"], ["college", "PLACEMENT_CELL"]]) {
      users.push(await prisma.user.create({ data: { email: `${prefix}-${suffix}@example.test`, passwordHash: "test-only", role } }));
    }
    const [a, b, empty, worker, admin, college] = users;
    const profileA = await prisma.businessProfile.create({ data: { userId: a.id, companyName: "Company A", contactPerson: "Owner A" } });
    const profileB = await prisma.businessProfile.create({ data: { userId: b.id, companyName: "Company B", contactPerson: "Owner B" } });
    const cookie = cookieFor(a);
    const seed = async (overrides = {}) => {
      const row = await prisma.workforceRequirement.create({ data: {
        companyName: "Company A", contactPerson: "Owner A", businessEmail: a.email, mobileNumber: "9876543210", industry: "Retail",
        serviceRequired: "Field sales", workforceCount: 1, jobLocation: "Delhi", locations: ["Delhi"], projectDuration: "3 months",
        details: "Dedicated test requirement", submittedByUserId: a.id, businessProfileId: profileA.id,
        createdAt: new Date(now.getTime() - 60000), ...overrides,
      } }); ids.push(row.id); return row;
    };
    await t.test("guests and other account types cannot access dashboard or brief; unknown routes stay 404", async () => {
      for (const path of ["/business/dashboard", "/business/requirements/not-found"]) {
        assert.equal((await request(path)).status, 401);
        for (const user of [worker, admin, college]) assert.equal((await request(path, cookieFor(user))).status, 403);
      }
      assert.equal((await request("/business/not-a-route")).status, 404);
      const result = await request("/business/dashboard", cookieFor(empty));
      assert.equal(result.status, 200); assert.equal(result.headers.get("cache-control"), "no-store");
      assert.deepEqual(result.body.data.summary, { totalRequirements: 0, openRequirements: 0, peopleRequested: 0, newRequirements: 0, requestedLocations: 0 });
      assert.equal(result.body.data.activity.length, 30);
      assert.ok(result.body.data.activity.every(day => day.requirements === 0));
      assert.equal(result.body.data.requirements.totalPages, 1);
    });
    const first = await seed({ workforceCount: 5, locations: [" Delhi ", "DELHI", "Mumbai", "  "], submittedByUserId: b.id });
    const contacted = await seed({ workforceCount: 3, status: "CONTACTED", jobLocation: " mumbai ", locations: ["Mumbai"], submittedByUserId: null });
    await seed({ workforceCount: 4, status: "QUALIFIED", jobLocation: "Bengaluru", locations: ["Bengaluru"], createdAt: new Date(now.getTime() - 10 * DAY) });
    await seed({ workforceCount: 20, status: "CLOSED", jobLocation: "Closed-only place", locations: [], createdAt: new Date(now.getTime() - DAY) });
    await seed({ workforceCount: 2, jobLocation: "Kolkata", locations: ["Kolkata"], createdAt: new Date(now.getTime() - 40 * DAY) });
    const legacy = await seed({ businessProfileId: null, jobLocation: "Pune", locations: [], createdAt: new Date(now.getTime() - 2 * DAY) });
    for (const place of ["Hyderabad", "Lucknow", "Jaipur", "Surat"]) await seed({ jobLocation: place, locations: [place], createdAt: new Date(now.getTime() - 3 * DAY) });
    const foreign = await seed({ businessProfileId: profileB.id, submittedByUserId: b.id, workforceCount: 999 });
    const guest = await seed({ businessProfileId: null, submittedByUserId: null, workforceCount: 999 });
    const mismatched = await seed({ businessProfileId: profileB.id, submittedByUserId: a.id, workforceCount: 999 });
    await seed({ workforceCount: 999, createdAt: new Date(now.getTime() + DAY) });

    await t.test("aggregates exclude other companies, email-matched guests, future dates and closed headcount", async () => {
      const result = await request("/business/dashboard?range=7", cookie);
      assert.equal(result.status, 200);
      const data = result.body.data;
      assert.deepEqual(data.summary, { totalRequirements: 10, openRequirements: 9, peopleRequested: 19, newRequirements: 8, requestedLocations: 9 });
      assert.deepEqual(data.statuses.map(row => [row.status, row.count]), [["NEW", 7], ["CONTACTED", 1], ["QUALIFIED", 1], ["CLOSED", 1]]);
      assert.equal(data.locations.length, 5); assert.deepEqual(data.locations[0], { name: "mumbai", requirements: 2 });
      assert.ok(data.activity.some(day => day.requirements === 0));
      assert.equal(data.activity.reduce((sum, day) => sum + day.requirements, 0), 8);
      assert.equal(data.requirements.items.length, 6); assert.equal(data.requirements.totalPages, 2);
      assert.equal(JSON.stringify(data).includes("businessEmail"), false);
      for (const [range, count] of [[7, 8], [30, 9], [90, 10]]) {
        const snapshot = await getBusinessDashboard(a.id, { range, status: "ALL", page: 1 }, now);
        assert.equal(snapshot.activity.length, range); assert.equal(snapshot.summary.newRequirements, count);
      }
    });
    await t.test("strict filters paginate only owned requests and clamp out-of-range pages", async () => {
      const result = (await request("/business/dashboard?status=NEW&page=2", cookie)).body.data.requirements;
      assert.equal(result.total, 7); assert.equal(result.items.length, 1); assert.ok(result.items.every(item => item.status === "NEW"));
      assert.equal((await request("/business/dashboard?page=10000", cookie)).body.data.requirements.page, 2);
      assert.deepEqual((await request("/business/dashboard?status=NEW&page=2", cookie)).body.data.requirements.items, result.items);
      for (const query of [`userId=${b.id}`, `businessProfileId=${profileB.id}`, "range=365", "page=-1", "status=DEPLOYED"]) assert.equal((await request(`/business/dashboard?${query}`, cookie)).status, 400);
    });
    await t.test("detail supports explicitly owned legacy records and denies unowned records without leakage", async () => {
      assert.equal((await request(`/business/requirements/${legacy.id}`, cookie)).status, 200);
      assert.equal((await request(`/business/requirements/${first.id}`, cookie)).status, 200);
      const missing = await request("/business/requirements/not-found", cookie);
      assert.equal(missing.status, 404); assert.equal(missing.body.error.code, "REQUIREMENT_NOT_FOUND");
      for (const row of [foreign, guest, mismatched]) {
        const denied = await request(`/business/requirements/${row.id}`, cookie);
        assert.equal(denied.status, 404); assert.deepEqual(denied.body, missing.body);
      }
    });
    await t.test("history exposes only valid status transitions, excluding internal metadata", async () => {
      await prisma.auditLog.createMany({ data: [
        { actorUserId: admin.id, action: "WORKFORCE_REQUIREMENT_STATUS_CHANGED", entityType: "WorkforceRequirement", entityId: contacted.id, metadata: { from: "NEW", to: "CONTACTED", internalNote: "private" }, ipAddress: "192.0.2.1", userAgent: "private" },
        { action: "WORKFORCE_REQUIREMENT_STATUS_CHANGED", entityType: "WorkforceRequirement", entityId: contacted.id, metadata: { from: "NEW", to: "DEPLOYED" } },
        { action: "PRIVATE_ACTION", entityType: "WorkforceRequirement", entityId: contacted.id, metadata: { from: "NEW", to: "CLOSED" } },
        { action: "WORKFORCE_REQUIREMENT_STATUS_CHANGED", entityType: "WorkforceRequirement", entityId: foreign.id, metadata: { from: "NEW", to: "CLOSED" } },
      ] });
      const detail = (await request(`/business/requirements/${contacted.id}`, cookie)).body.data;
      assert.equal(detail.history.length, 1); assert.equal(detail.history[0].to, "CONTACTED");
      assert.deepEqual(Object.keys(detail.history[0]).sort(), ["createdAt", "from", "id", "to"]);
      assert.equal(JSON.stringify(detail).includes("private"), false);
      assert.equal(detail.requirement.businessEmail, a.email);
    });
    await t.test("an administrative status change is reflected in refreshed totals and its real timeline", async () => {
      await updateRequirementStatusWithAudit(first.id, "CLOSED", { actorUserId: admin.id });
      const updated = (await request("/business/dashboard", cookie)).body.data;
      assert.equal(updated.summary.openRequirements, 8); assert.equal(updated.summary.peopleRequested, 14);
      const detail = (await request(`/business/requirements/${first.id}`, cookie)).body.data;
      assert.equal(detail.requirement.status, "CLOSED");
      assert.deepEqual(detail.history.map(row => [row.from, row.to]), [["NEW", "CLOSED"]]);
    });
    await t.test("IST midnight boundaries and session revocation are enforced", async () => {
      const period = dashboardPeriod(7, now);
      await seed({ businessProfileId: null, submittedByUserId: empty.id, createdAt: new Date(period.start.getTime() - 1) });
      await seed({ businessProfileId: null, submittedByUserId: empty.id, createdAt: period.start });
      const snapshot = await getBusinessDashboard(empty.id, { range: 7, status: "ALL", page: 1 }, now);
      assert.equal(snapshot.summary.newRequirements, 1); assert.equal(snapshot.activity[0].requirements, 1);
      await prisma.user.update({ where: { id: a.id }, data: { sessionVersion: { increment: 1 } } });
      assert.equal((await request("/business/dashboard", cookie)).status, 401);
      assert.equal((await request(`/business/requirements/${first.id}`, cookie)).status, 401);
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    await prisma.auditLog.deleteMany({ where: { entityType: "WorkforceRequirement", entityId: { in: ids } } });
    await prisma.workforceRequirement.deleteMany({ where: { id: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
    await prisma.$disconnect(); mock.restoreAll();
  }
});
