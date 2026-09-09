import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mock, test } from "node:test";

if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to a dedicated migrated test database. This suite writes temporary fixtures.");
Object.assign(process.env, {
  DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: "test", REDIS_ENABLED: "false",
  JWT_SECRET: "requirement-integration-only-not-for-production", LOG_LEVEL: "error",
  CLIENT_ORIGIN: "http://localhost:3000", PUBLIC_APP_URL: "http://localhost:3000",
  API_RATE_LIMIT_MAX: "2000", AUTH_RATE_LIMIT_MAX: "1000", SUBMISSION_RATE_LIMIT_MAX: "1000",
});
const notifications = [];
mock.module(new URL("../dist/services/email.service.js", import.meta.url).href, { namedExports: {
  recoveryEmailConfigured: () => false, sendBusinessRecoveryEmail: async () => false,
  sendOperationalEmail: async message => { notifications.push(message); return true; },
} });
const { app } = await import("../dist/app.js");
const { prisma } = await import("../dist/config/db.js");
const { signAccessToken } = await import("../dist/utils/jwt.js");
const { updateRequirementStatusWithAudit } = await import("../dist/modules/admin/admin.repository.js");
const prefix = `p23-${randomUUID()}`;
const users = [], ids = [];
let server, base;
const cookieFor = user => `zobhunger_access=${signAccessToken({ sub: user.id, role: user.role, version: 0 })}`;
async function request(path, { cookie, method = "GET", body, csrf = true } = {}) {
  const response = await fetch(`${base}${path}`, { method,
    headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json", ...(csrf ? { "X-Requested-With": "XMLHttpRequest" } : {}) } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json(), headers: response.headers };
}

test("business requirement management: submissions, edits, withdrawal and isolation", async t => {
  try {
    server = app.listen(0, "127.0.0.1"); await once(server, "listening");
    base = `http://127.0.0.1:${server.address().port}/api/v1`;
    for (const [suffix, role] of [["a", "BUSINESS"], ["b", "BUSINESS"], ["worker", "WORKER"], ["admin", "ADMIN"], ["college", "PLACEMENT_CELL"]]) users.push(await prisma.user.create({ data: { email: `${prefix}-${suffix}@example.test`, role, businessAccessApproved: role === "BUSINESS", passwordHash: "unused" } }));
    const [a, b, worker, admin, college] = users;
    const cookie = cookieFor(a);
    const brief = { companyName: "Company A", contactPerson: "Owner A", businessEmail: a.email, mobileNumber: "+91 9876543210", industry: "Retail",
      serviceRequired: "Workforce", workforceCount: 25, locations: ["Delhi", "Mumbai Area"], projectDuration: "3 months", expectedStartAt: null, details: "Store execution across two markets." };
    const body = { ...brief, requestKey: randomUUID() };
    let firstId, workingBrief = brief, revision = 0;
    const seed = async (overrides = {}) => {
      const row = await prisma.workforceRequirement.create({ data: { ...brief, jobLocation: "Delhi", submittedByUserId: a.id, ...overrides } });
      ids.push(row.id); return row;
    };

    await t.test("every read/write route rejects guests, other roles and missing write headers", async () => {
      const writes = [
        ["POST", "/business/requirements", body],
        ["PUT", "/business/requirements/no-such-id", { ...brief, revision: 0 }],
        ["POST", "/business/requirements/no-such-id/withdraw", { revision: 0, reason: "Project postponed" }],
      ];
      assert.equal((await request("/business/requirements")).status, 401);
      for (const [method, path, payload] of writes) {
        assert.equal((await request(path, { method, body: payload })).status, 401);
        for (const user of [worker, admin, college]) assert.equal((await request(path, { method, body: payload, cookie: cookieFor(user) })).status, 403);
        assert.equal((await request(path, { method, body: payload, cookie, csrf: false })).status, 403);
      }
      assert.equal((await request("/business/requirements", { cookie: cookieFor(worker) })).status, 403);
      assert.equal((await request("/business/not-a-route")).status, 404);
    });
    await t.test("create/retry produces one real requirement and one notification without a company profile", async () => {
      const first = await request("/business/requirements", { method: "POST", cookie, body });
      assert.equal(first.status, 201); firstId = first.body.data.id; ids.push(firstId);
      assert.equal(first.body.data.revision, 0); assert.equal(first.body.data.status, "NEW");
      assert.deepEqual(Object.keys(first.body.data).sort(), ["id", "replayed", "revision", "status"]);
      const stored = await prisma.workforceRequirement.findUnique({ where: { id: firstId } });
      assert.equal(stored.submittedByUserId, a.id); assert.equal(stored.businessProfileId, null);
      const retry = await request("/business/requirements", { method: "POST", cookie, body });
      assert.equal(retry.status, 200); assert.equal(retry.body.data.id, firstId); assert.equal(retry.body.data.replayed, true);
      assert.equal(notifications.length, 1);
      assert.equal((await request("/business/requirements", { method: "POST", cookie, body: { ...body, workforceCount: 26 } })).status, 409);
      assert.equal(await prisma.workforceRequirement.count({ where: { submittedByUserId: a.id } }), 1);
      const dashboard = await request("/business/dashboard", { cookie });
      assert.equal(dashboard.body.data.summary.peopleRequested, 25);
    });
    await t.test("simultaneous retries share one submission and keys are scoped to their creator", async () => {
      const input = { ...body, requestKey: randomUUID() };
      const responses = await Promise.all([request("/business/requirements", { method: "POST", cookie, body: input }), request("/business/requirements", { method: "POST", cookie, body: input })]);
      assert.deepEqual(responses.map(row => row.status).sort(), [200, 201]);
      assert.equal(responses[0].body.data.id, responses[1].body.data.id); ids.push(responses[0].body.data.id);
      assert.equal(notifications.length, 2);
      const other = await request("/business/requirements", { method: "POST", cookie: cookieFor(b), body: input });
      assert.equal(other.status, 201); assert.notEqual(other.body.data.id, responses[0].body.data.id); ids.push(other.body.data.id);
    });
    await t.test("company setup attaches owned requests and never permits owner or status spoofing", async () => {
      const setup = { companyName: "Company A", contactPerson: "Owner A", phone: "+91 9876543210", industry: "Retail", city: "Delhi", state: "Delhi", website: "" };
      assert.equal((await request("/business/profile", { method: "PUT", cookie, body: setup })).status, 200);
      const profile = await prisma.businessProfile.findUnique({ where: { userId: a.id } });
      assert.equal((await prisma.workforceRequirement.findUnique({ where: { id: firstId } })).businessProfileId, profile.id);
      for (const extra of [{ submittedByUserId: b.id }, { businessProfileId: "other" }, { status: "QUALIFIED" }]) {
        assert.equal((await request("/business/requirements", { method: "POST", cookie, body: { ...body, requestKey: randomUUID(), ...extra } })).status, 400);
        assert.equal((await request(`/business/requirements/${firstId}`, { method: "PUT", cookie, body: { ...brief, revision: 0, ...extra } })).status, 400);
      }
    });
    await t.test("foreign, anonymous matching-email and conflicting company-owned requests cannot be edited or withdrawn", async () => {
      const profileB = await prisma.businessProfile.create({ data: { userId: b.id, companyName: "Company B", contactPerson: "Owner B" } });
      const privateRows = [await seed({ submittedByUserId: b.id, businessProfileId: profileB.id }), await seed({ submittedByUserId: null }), await seed({ submittedByUserId: a.id, businessProfileId: profileB.id })];
      for (const [method, suffix, payload] of [["PUT", "", { ...brief, revision: 0 }], ["POST", "/withdraw", { revision: 0, reason: "No longer needed" }]]) {
        const missing = await request(`/business/requirements/missing${suffix}`, { method, cookie, body: payload });
        assert.equal(missing.status, 404);
        for (const row of privateRows) {
          const denied = await request(`/business/requirements/${row.id}${suffix}`, { method, cookie, body: payload });
          assert.equal(denied.status, 404); assert.deepEqual(denied.body, missing.body);
          assert.equal((await prisma.workforceRequirement.findUnique({ where: { id: row.id } })).revision, 0);
        }
      }
      const list = await request("/business/requirements", { cookie });
      assert.equal(list.body.data.total, 2); assert.equal(list.headers.get("cache-control"), "no-store");
      for (const row of privateRows) assert.equal(list.body.data.items.some(item => item.id === row.id), false);
    });
    await t.test("editing a reviewed brief uses revisions, returns it to New and records only actual changed fields", async () => {
      await updateRequirementStatusWithAudit(firstId, "QUALIFIED", { actorUserId: admin.id });
      assert.equal((await request(`/business/requirements/${firstId}`, { method: "PUT", cookie, body: { ...brief, revision: 0 } })).status, 409);
      workingBrief = { ...brief, workforceCount: 30, details: "Updated store execution brief across two markets." };
      const saved = await request(`/business/requirements/${firstId}`, { method: "PUT", cookie, body: { ...workingBrief, revision: 1 } });
      assert.equal(saved.status, 200); assert.equal(saved.body.data.status, "NEW"); assert.equal(saved.body.data.revision, 2); revision = 2;
      const detail = (await request(`/business/requirements/${firstId}`, { cookie })).body.data;
      assert.equal(detail.requirement.workforceCount, 30);
      assert.deepEqual(detail.activity.find(event => event.kind === "updated").fields.sort(), ["details", "workforceCount"]);
      assert.ok(detail.history.some(event => event.from === "QUALIFIED" && event.to === "NEW"));
      const before = await prisma.auditLog.count({ where: { entityId: firstId } });
      const unchanged = await request(`/business/requirements/${firstId}`, { method: "PUT", cookie, body: { ...workingBrief, revision } });
      assert.equal(unchanged.status, 200); assert.equal(unchanged.body.data.changed, false); assert.equal(unchanged.body.data.revision, revision);
      assert.equal(await prisma.auditLog.count({ where: { entityId: firstId } }), before);
    });
    await t.test("two edits of the same revision cannot silently overwrite each other", async () => {
      const responses = await Promise.all([31, 32].map(workforceCount => request(`/business/requirements/${firstId}`, { method: "PUT", cookie, body: { ...workingBrief, workforceCount, revision } })));
      assert.deepEqual(responses.map(row => row.status).sort(), [200, 409]);
      const stored = await prisma.workforceRequirement.findUnique({ where: { id: firstId } });
      assert.equal(stored.revision, 3); assert.ok([31, 32].includes(stored.workforceCount));
      revision = stored.revision; workingBrief = { ...workingBrief, workforceCount: stored.workforceCount };
      assert.equal(responses.find(row => row.status === 409).body.error.code, "REQUIREMENT_CHANGED");
    });
    await t.test("search finds secondary locations, escapes wildcards, supports status/order/paging and rejects owner filters", async () => {
      for (let index = 0; index < 12; index++) await seed({ serviceRequired: "Fixture service", status: index === 0 ? "CONTACTED" : "NEW", createdAt: new Date(Date.now() - (index + 1) * 86400000) });
      const literal = await seed({ serviceRequired: "Special % Under_score" });
      const list = (await request("/business/requirements?query=fixture", { cookie })).body.data;
      assert.equal(list.total, 12); assert.equal(list.items.length, 9); assert.equal(list.totalPages, 2);
      const last = (await request("/business/requirements?query=fixture&page=10000", { cookie })).body.data;
      assert.equal(last.page, 2); assert.equal(last.items.length, 3);
      const oldest = (await request("/business/requirements?query=fixture&sort=oldest", { cookie })).body.data.items;
      assert.ok(new Date(oldest[0].createdAt) < new Date(oldest[1].createdAt));
      assert.equal((await request("/business/requirements?query=fixture&status=CONTACTED", { cookie })).body.data.total, 1);
      assert.ok((await request("/business/requirements?query=mUmBaI", { cookie })).body.data.items.length > 0);
      for (const query of ["%", "_"]) {
        const filtered = (await request(`/business/requirements?query=${encodeURIComponent(query)}`, { cookie })).body.data;
        assert.deepEqual(filtered.items.map(row => row.id), [literal.id]);
      }
      assert.equal((await request(`/business/requirements?query=${encodeURIComponent("' OR 1=1 --")}`, { cookie })).body.data.total, 0);
      assert.equal((await request(`/business/requirements?userId=${b.id}`, { cookie })).status, 400);
      const empty = (await request("/business/requirements?query=not-present-anywhere", { cookie })).body.data;
      assert.equal(empty.items.length, 0); assert.equal(empty.totalPages, 1);
    });
    await t.test("withdrawal retains the brief and reason, removes open headcount and locks further edits", async () => {
      const before = (await request("/business/dashboard", { cookie })).body.data.summary;
      assert.equal((await request(`/business/requirements/${firstId}/withdraw`, { method: "POST", cookie, body: { revision, reason: " " } })).status, 400);
      const result = await request(`/business/requirements/${firstId}/withdraw`, { method: "POST", cookie, body: { revision, reason: "Project postponed until next quarter" } });
      assert.equal(result.status, 200); assert.equal(result.body.data.status, "CLOSED");
      const detail = (await request(`/business/requirements/${firstId}`, { cookie })).body.data;
      assert.equal(detail.requirement.details, workingBrief.details);
      assert.equal(detail.activity.at(-1).kind, "withdrawn"); assert.equal(detail.activity.at(-1).reason, "Project postponed until next quarter");
      const after = (await request("/business/dashboard", { cookie })).body.data.summary;
      assert.equal(after.openRequirements, before.openRequirements - 1); assert.equal(after.peopleRequested, before.peopleRequested - workingBrief.workforceCount);
      assert.equal((await request(`/business/requirements/${firstId}`, { method: "PUT", cookie, body: { ...workingBrief, revision: revision + 1 } })).body.error.code, "REQUIREMENT_CLOSED");
      assert.equal((await request(`/business/requirements/${firstId}/withdraw`, { method: "POST", cookie, body: { revision: revision + 1, reason: "Another withdrawal" } })).status, 409);
      assert.equal(await prisma.auditLog.count({ where: { entityId: firstId, action: "WORKFORCE_REQUIREMENT_STATUS_CHANGED", metadata: { path: ["source"], equals: "BUSINESS_WITHDRAWAL" } } }), 1);
    });
    await t.test("activity strips internal metadata and private responses never expose submission keys", async () => {
      await prisma.auditLog.create({ data: { entityType: "WorkforceRequirement", entityId: firstId, action: "WORKFORCE_REQUIREMENT_UPDATED", metadata: { fields: ["details", "submissionHash", "private-field"], privateNote: "never-public" }, ipAddress: "192.0.2.1" } });
      const detail = (await request(`/business/requirements/${firstId}`, { cookie })).body.data;
      assert.deepEqual(detail.activity.at(-1).fields, ["details"]);
      for (const value of ["submissionKey", "submissionHash", "never-public", "192.0.2.1", "actorUserId"]) assert.equal(JSON.stringify(detail).includes(value), false);
      const stored = await prisma.workforceRequirement.findUnique({ where: { id: firstId } });
      assert.equal(stored.submittedByUserId, a.id);
    });
    await t.test("revoked sessions cannot list, submit, edit or withdraw requirements", async () => {
      await prisma.user.update({ where: { id: a.id }, data: { sessionVersion: { increment: 1 } } });
      for (const [method, path, payload] of [["GET", "/business/requirements", undefined], ["POST", "/business/requirements", { ...body, requestKey: randomUUID() }], ["PUT", `/business/requirements/${firstId}`, { ...workingBrief, revision }], ["POST", `/business/requirements/${firstId}/withdraw`, { revision, reason: "No longer needed" }]]) assert.equal((await request(path, { method, cookie, body: payload })).status, 401);
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    await prisma.auditLog.deleteMany({ where: { OR: [{ entityType: "WorkforceRequirement", entityId: { in: ids } }, { actorUserId: { in: users.map(user => user.id) } }] } });
    await prisma.workforceRequirement.deleteMany({ where: { id: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
    await prisma.$disconnect(); mock.restoreAll();
  }
});
