import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mock, test } from "node:test";

if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to a dedicated migrated test database. This suite writes and removes temporary fixtures.");
Object.assign(process.env, { DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: "test", REDIS_ENABLED: "false",
  JWT_SECRET: "candidate-test-only-not-for-production-at-least-32", LOG_LEVEL: "error",
  CLIENT_ORIGIN: "http://localhost:3000", PUBLIC_APP_URL: "http://localhost:3000", API_RATE_LIMIT_MAX: "3000", AUTH_RATE_LIMIT_MAX: "1000" });
mock.module(new URL("../dist/services/email.service.js", import.meta.url).href, { namedExports: {
  recoveryEmailConfigured: () => false, sendBusinessRecoveryEmail: async () => false, sendOperationalEmail: async () => false,
} });
const { app } = await import("../dist/app.js");
const { prisma } = await import("../dist/config/db.js");
const { signAccessToken } = await import("../dist/utils/jwt.js");
const prefix = `p24-${randomUUID()}`;
const users = [], requirements = [], jobs = [], candidateIds = [];
const cookieFor = user => `zobhunger_access=${signAccessToken({ sub: user.id, role: user.role, version: 0 })}`;
let server, base;
async function request(path, { user, method = "GET", body, csrf = true } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: {
    ...(user ? { Cookie: cookieFor(user) } : {}), ...(body ? { "Content-Type": "application/json", ...(csrf ? { "X-Requested-With": "XMLHttpRequest" } : {}) } : {}),
  }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, body: await response.json(), headers: response.headers };
}

test("candidate sharing and business decisions preserve ownership, history and concurrency", async t => {
  try {
    server = app.listen(0, "127.0.0.1"); await once(server, "listening"); base = `http://127.0.0.1:${server.address().port}/api/v1`;
    for (const [suffix, role] of [["a", "BUSINESS"], ["b", "BUSINESS"], ["worker", "WORKER"], ["admin", "ADMIN"], ["college", "PLACEMENT_CELL"]]) {
      users.push(await prisma.user.create({ data: { email: `${prefix}-${suffix}@example.test`, role, businessAccessApproved: role === "BUSINESS", passwordHash: "unused" } }));
    }
    const [a, b, worker, admin, college] = users;
    const profileA = await prisma.businessProfile.create({ data: { userId: a.id, companyName: "A Retail", contactPerson: "Owner A" } });
    const profileB = await prisma.businessProfile.create({ data: { userId: b.id, companyName: "B Retail", contactPerson: "Owner B" } });
    const seedRequirement = async overrides => {
      const row = await prisma.workforceRequirement.create({ data: { companyName: "A Retail", contactPerson: "Owner A", businessEmail: a.email,
        mobileNumber: "9876543210", industry: "Retail", serviceRequired: "Workforce", workforceCount: 5, jobLocation: "Delhi", locations: ["Delhi"],
        projectDuration: "3 months", details: "Retail execution team", businessProfileId: profileA.id, submittedByUserId: a.id, ...overrides } });
      requirements.push(row.id); return row;
    };
    const reqA = await seedRequirement({}); const reqB = await seedRequirement({ companyName: "B Retail", businessProfileId: profileB.id, submittedByUserId: b.id });
    const anonymous = await seedRequirement({ businessProfileId: null, submittedByUserId: null });
    const legacy = await seedRequirement({ businessProfileId: null });
    const conflicting = await seedRequirement({ companyName: "B Retail", businessProfileId: profileB.id });
    const closed = await seedRequirement({ status: "CLOSED" });
    for (const isDemo of [false, true]) jobs.push(await prisma.job.create({ data: { slug: `${prefix}-${isDemo}`, title: "Retail Executive", location: "Delhi", city: "Delhi",
      category: "Sales", engagementType: "Contract", description: "Job fixture", isDemo, status: "OPEN" } }));
    const seedApplication = (suffix, overrides = {}) => prisma.jobApplication.create({ data: { jobId: jobs[0].id, name: `Candidate ${suffix}`, email: `${prefix}-${suffix}@example.test`,
      phone: "9876543210", city: "Delhi", experience: "Two years in retail sales", resumeUrl: "https://example.test/cv.pdf", message: "Private application message", ...overrides } });
    const application = await seedApplication("one");
    const rejected = await seedApplication("rejected", { status: "REJECTED" });
    const demo = await seedApplication("demo", { jobId: jobs[1].id });
    const unsafe = await seedApplication("unsafe", { resumeUrl: "javascript:alert(1)" });
    const shareInput = { requirementId: reqA.id, applicationId: application.id, summary: "Two years of relevant store execution experience.", skills: ["Retail", "Reporting", "retail"] };
    const share = async input => {
      const result = await request("/admin/candidate-management", { user: admin, method: "POST", body: { ...shareInput, ...input } });
      if (result.body.data?.id && !candidateIds.includes(result.body.data.id)) candidateIds.push(result.body.data.id);
      return result;
    };
    let id;
    await t.test("all business routes enforce sessions, roles and write headers", async () => {
      for (const path of ["/business/candidates", "/business/candidates/missing"]) {
        assert.equal((await request(path)).status, 401);
        for (const user of [worker, admin, college]) assert.equal((await request(path, { user })).status, 403);
      }
      const body = { action: "FEEDBACK", revision: 0, note: "Review test" };
      assert.equal((await request("/business/candidates/missing/reviews", { method: "POST", body })).status, 401);
      assert.equal((await request("/business/candidates/missing/reviews", { user: a, method: "POST", body, csrf: false })).status, 403);
      assert.equal((await request("/admin/candidate-management", { user: a })).status, 403);
      assert.equal((await request("/admin/candidate-management", { user: worker, method: "POST", body: shareInput })).status, 403);
      assert.equal((await request("/admin/candidate-management", { user: admin, method: "POST", body: shareInput, csrf: false })).status, 403);
      assert.equal((await request("/business/candidates/missing/reviews", { user: worker, method: "POST", body })).status, 403);
      assert.equal((await request("/business/candidates/missing/not-a-route")).status, 404);
    });
    await t.test("sharing is explicit, idempotent and limited to eligible real applications", async () => {
      assert.equal((await request("/business/candidates", { user: a })).body.data.total, 0);
      for (const requirementId of [anonymous.id, closed.id]) assert.equal((await share({ requirementId })).status, 409);
      for (const applicationId of [rejected.id, demo.id, "missing"]) assert.equal((await share({ applicationId })).status, 404);
      const pair = await Promise.all([share({}), share({})]);
      assert.deepEqual(pair.map(result => result.status).sort(), [200, 201]);
      id = pair[0].body.data.id; assert.equal(id, pair[1].body.data.id);
      assert.equal(await prisma.candidateEvent.count({ where: { candidateId: id } }), 1);
      assert.equal(await prisma.auditLog.count({ where: { entityId: id } }), 1);
      const detail = (await request(`/business/candidates/${id}`, { user: a })).body.data;
      assert.deepEqual(detail.candidate.skills, ["Retail", "Reporting"]);
      assert.equal(detail.candidate.resumeUrl, "https://example.test/cv.pdf");
      for (const secret of ["email", "phone", "applicationId", "workerUser", "message", "submittedByUserId"]) assert.equal(Object.hasOwn(detail.candidate, secret), false);
      assert.equal(detail.history.items[0].kind, "SHARED");
      assert.equal((await prisma.jobApplication.findUnique({ where: { id: application.id } })).status, "SUBMITTED");
    });
    await t.test("lookups are bounded and unsafe CV protocols never reach the review UI", async () => {
      const options = await request("/admin/candidate-management/requirements", { user: admin });
      assert.equal(options.headers.get("cache-control"), "no-store");
      assert.ok(!options.body.data.items.some(item => [anonymous.id, closed.id].includes(item.id)));
      const applications = (await request("/admin/candidate-management/applications", { user: admin })).body.data.items;
      assert.ok(!applications.some(item => [demo.id, rejected.id].includes(item.id)));
      assert.equal(applications.find(item => item.id === unsafe.id).resumeUrl, null);
      const shared = await share({ applicationId: unsafe.id });
      assert.equal((await request(`/business/candidates/${shared.body.data.id}`, { user: a })).body.data.candidate.resumeUrl, null);
    });
    await t.test("company ownership wins, matching emails grant no access, and foreign IDs use the same 404", async () => {
      const other = await share({ requirementId: reqB.id });
      const conflict = await share({ requirementId: conflicting.id });
      const legacyShare = await share({ requirementId: legacy.id });
      assert.equal((await request(`/business/candidates/${legacyShare.body.data.id}`, { user: a })).status, 200);
      const notFound = await request("/business/candidates/missing", { user: a });
      for (const foreignId of [other.body.data.id, conflict.body.data.id]) {
        const detail = await request(`/business/candidates/${foreignId}`, { user: a });
        assert.equal(detail.status, 404); assert.deepEqual(detail.body, notFound.body);
        assert.equal((await request(`/business/candidates/${foreignId}/reviews`, { user: a, method: "POST", body: { action: "FEEDBACK", revision: 0, note: "Unauthorized review" } })).status, 404);
      }
      assert.equal((await request(`/business/candidates/${id}`, { user: b })).status, 404);
      assert.equal((await request(`/business/candidates?requirementId=${reqB.id}`, { user: a })).status, 404);
      assert.equal((await request(`/business/candidates?requirementId=${anonymous.id}`, { user: a })).status, 404);
      const list = await request("/business/candidates", { user: a });
      assert.equal(list.headers.get("cache-control"), "no-store");
      assert.ok(!JSON.stringify(list.body).includes(other.body.data.id));
    });
    await t.test("feedback, interview proposals and selection retain a complete history without changing other businesses", async () => {
      const post = body => request(`/business/candidates/${id}/reviews`, { user: a, method: "POST", body });
      const feedback = await post({ action: "FEEDBACK", revision: 0, note: "Strong retail experience." });
      assert.equal(feedback.status, 200); assert.equal(feedback.body.data.candidate.revision, 1);
      assert.equal((await post({ action: "STATUS", status: "SHORTLISTED", revision: 1, note: "Relevant territory experience." })).status, 200);
      const interview = { action: "INTERVIEW", revision: 2, note: "Discuss market coverage.", interviewMode: "VIDEO", interviewDetails: "The account team will coordinate meeting details.", interviewAt: new Date(Date.now() + 86400000).toISOString() };
      assert.equal((await post({ ...interview, interviewAt: new Date(Date.now() - 60000).toISOString() })).status, 400);
      assert.equal((await post({ ...interview, interviewAt: new Date(Date.now() + 181 * 86400000).toISOString() })).status, 400);
      assert.equal((await post({ ...interview, interviewAt: "2026-09-10T10:00:00" })).status, 400);
      const requested = await post(interview); assert.equal(requested.status, 200);
      assert.equal(requested.body.data.candidate.status, "INTERVIEW_REQUESTED");
      assert.equal(requested.body.data.history.items[0].interviewAt, interview.interviewAt);
      const adminReview = await request(`/admin/candidate-management/${id}`, { user: admin });
      assert.equal(adminReview.body.data.history.items[0].interviewDetails, interview.interviewDetails);
      const rescheduled = await post({ ...interview, revision: 3, interviewAt: new Date(Date.now() + 2 * 86400000).toISOString() });
      assert.equal(rescheduled.status, 200);
      assert.equal((await post({ action: "STATUS", status: "SELECTED", revision: 4, note: "Approved following our review." })).status, 200);
      assert.equal((await post({ action: "STATUS", status: "REJECTED", revision: 5, note: "Trying to overwrite selection." })).status, 409);
      assert.equal((await post({ action: "STATUS", status: "SHARED", revision: 5, note: "Reopening to clarify availability." })).status, 200);
      assert.equal((await post({ action: "STATUS", status: "REJECTED", revision: 6, note: "Availability does not match." })).status, 200);
      const final = (await request(`/business/candidates/${id}`, { user: a })).body.data;
      assert.equal(final.history.total, 8); assert.equal(final.candidate.revision, 7);
      assert.equal((await prisma.jobApplication.findUnique({ where: { id: application.id } })).status, "SUBMITTED");
      assert.equal((await request(`/business/candidates?requirementId=${reqB.id}`, { user: b })).body.data.items[0].status, "SHARED");
    });
    await t.test("optimistic revisions prevent lost updates, including two simultaneous reviews", async () => {
      const payload = { action: "FEEDBACK", revision: 7, note: "Additional business feedback." };
      const responses = await Promise.all([request(`/business/candidates/${id}/reviews`, { user: a, method: "POST", body: payload }), request(`/business/candidates/${id}/reviews`, { user: a, method: "POST", body: payload })]);
      assert.deepEqual(responses.map(result => result.status).sort(), [200, 409]);
      assert.equal(await prisma.candidateEvent.count({ where: { candidateId: id } }), 9);
      const forged = await request(`/business/candidates/${id}/reviews`, { user: a, method: "POST", body: { ...payload, revision: 8, actorRole: "ADMIN", requirementId: reqB.id } });
      assert.equal(forged.status, 400);
    });
    await t.test("pagination and stage/search totals remain scoped and all history is reachable", async () => {
      for (let i = 0; i < 18; i++) {
        const extra = await seedApplication(`Page ${String(i).padStart(2, "0")}`);
        await share({ applicationId: extra.id });
      }
      const first = (await request("/business/candidates?query=Page", { user: a })).body.data;
      const second = (await request("/business/candidates?query=Page&page=2", { user: a })).body.data;
      assert.equal(first.total, 18); assert.equal(first.items.length, 15); assert.equal(second.items.length, 3);
      assert.equal(first.counts.SHARED, 18); assert.equal(new Set([...first.items, ...second.items].map(item => item.id)).size, 18);
      assert.equal((await request("/business/candidates?query=Page&status=SELECTED", { user: a })).body.data.total, 0);
      assert.equal((await request("/business/candidates?pageSize=999", { user: a })).status, 400);
      await prisma.candidateEvent.createMany({ data: Array.from({ length: 25 }, (_, i) => ({ candidateId: id, kind: "FEEDBACK", actorRole: "BUSINESS", note: `Older history fixture ${i}` })) });
      const history1 = (await request(`/business/candidates/${id}`, { user: a })).body.data.history;
      const history2 = (await request(`/business/candidates/${id}?historyPage=2`, { user: a })).body.data.history;
      assert.equal(history1.total, 34); assert.equal(history1.items.length, 20); assert.equal(history2.items.length, 14);
      assert.equal(new Set([...history1.items, ...history2.items].map(item => item.id)).size, 34);
    });
    await t.test("closing a requirement prevents new decisions, while revocation removes business access immediately", async () => {
      await prisma.workforceRequirement.update({ where: { id: reqA.id }, data: { status: "CLOSED", revision: { increment: 1 } } });
      const review = await request(`/business/candidates/${id}/reviews`, { user: a, method: "POST", body: { action: "FEEDBACK", revision: 8, note: "Should not be saved" } });
      assert.equal(review.status, 409); assert.equal(review.body.error.code, "REQUIREMENT_CLOSED");
      assert.equal((await request(`/business/candidates/${id}`, { user: a })).status, 200);
      assert.equal((await request(`/admin/candidate-management/${id}/revoke`, { user: a, method: "POST", body: { revision: 8, note: "Unauthorized" } })).status, 403);
      const revoke = await request(`/admin/candidate-management/${id}/revoke`, { user: admin, method: "POST", body: { revision: 8, note: "Candidate requested removal." } });
      assert.equal(revoke.status, 200); assert.ok(revoke.body.data.candidate.revokedAt);
      assert.equal((await request(`/business/candidates/${id}`, { user: a })).status, 404);
      assert.ok(!(await request("/business/candidates", { user: a })).body.data.items.some(item => item.id === id));
      assert.equal((await request(`/admin/candidate-management/${id}`, { user: admin })).body.data.history.items[0].kind, "ACCESS_REVOKED");
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    await prisma.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users.map(user => user.id) } }, { entityId: { in: candidateIds } }] } });
    await prisma.workforceRequirement.deleteMany({ where: { id: { in: requirements } } });
    await prisma.job.deleteMany({ where: { id: { in: jobs.map(job => job.id) } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
    await prisma.$disconnect();
  }
});
