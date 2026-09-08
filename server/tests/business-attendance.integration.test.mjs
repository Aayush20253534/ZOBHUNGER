import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mock, test } from "node:test";

if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to a dedicated migrated test database. This suite creates and removes temporary fixtures.");
Object.assign(process.env, { DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: "test", REDIS_ENABLED: "false", JWT_SECRET: "attendance-test-only-not-for-production-32-characters",
  LOG_LEVEL: "error", CLIENT_ORIGIN: "http://localhost:3000", PUBLIC_APP_URL: "http://localhost:3000", API_RATE_LIMIT_MAX: "5000", AUTH_RATE_LIMIT_MAX: "1000" });
mock.module(new URL("../dist/services/email.service.js", import.meta.url).href, { namedExports: {
  recoveryEmailConfigured: () => false, sendBusinessRecoveryEmail: async () => false, sendOperationalEmail: async () => false,
} });
const { app } = await import("../dist/app.js"); const { prisma } = await import("../dist/config/db.js"); const { signAccessToken } = await import("../dist/utils/jwt.js");
const { addDays, dateValue, istToday, isoWeekday } = await import("../dist/modules/attendance/attendance.utils.js");
const prefix = `p25-${randomUUID()}`; const users = [], requirements = []; let job, server, base;
async function request(path, { user, method = "GET", body, csrf = true } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(user ? { Cookie: `zobhunger_access=${signAccessToken({ sub: user.id, role: user.role, version: 0 })}` } : {}),
    ...(body ? { "Content-Type": "application/json", ...(csrf ? { "X-Requested-With": "XMLHttpRequest" } : {}) } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, body: await response.json(), headers: response.headers };
}
test("assignment and attendance workflows preserve business ownership, dates and history", async t => {
  try {
    server = app.listen(0, "127.0.0.1"); await once(server, "listening"); base = `http://127.0.0.1:${server.address().port}/api/v1`;
    for (const role of ["BUSINESS", "BUSINESS", "ADMIN", "WORKER"]) users.push(await prisma.user.create({ data: { email: `${prefix}-${users.length}@example.test`, role, passwordHash: "unused" } }));
    const [a, b, admin, worker] = users;
    const profileA = await prisma.businessProfile.create({ data: { userId: a.id, companyName: "A Retail", contactPerson: "A Owner" } });
    const profileB = await prisma.businessProfile.create({ data: { userId: b.id, companyName: "B Retail", contactPerson: "B Owner" } });
    async function seedRequirement(overrides = {}) {
      const row = await prisma.workforceRequirement.create({ data: { companyName: "A Retail", contactPerson: "A Owner", businessEmail: a.email, mobileNumber: "9876543210", industry: "Retail",
        serviceRequired: "Workforce", workforceCount: 30, jobLocation: "Delhi", projectDuration: "3 months", details: "Test workforce requirement", businessProfileId: profileA.id, submittedByUserId: a.id, ...overrides } });
      requirements.push(row.id); return row;
    }
    const reqA = await seedRequirement(); const reqB = await seedRequirement({ companyName: "B Retail", businessProfileId: profileB.id });
    const legacy = await seedRequirement({ businessProfileId: null }); const anonymous = await seedRequirement({ businessProfileId: null, submittedByUserId: null });
    job = await prisma.job.create({ data: { slug: prefix, title: "Market Executive", location: "Delhi", city: "Delhi", category: "Sales", engagementType: "Contract", description: "Test vacancy", status: "OPEN", isDemo: false } });
    let serial = 0;
    async function candidate(requirementId = reqA.id, status = "SELECTED") {
      const name = `Executive ${String(++serial).padStart(2, "0")}`;
      const application = await prisma.jobApplication.create({ data: { jobId: job.id, name, email: `${prefix}-${serial}@example.test`, phone: "9876543210", message: "Private application details" } });
      return prisma.businessCandidate.create({ data: { requirementId, applicationId: application.id, name, city: "Delhi", skills: [], summary: "Relevant retail experience", jobTitle: "Market Executive", status } });
    }
    const selected = await candidate(); const other = await candidate(reqB.id); const legacyCandidate = await candidate(legacy.id); const unowned = await candidate(anonymous.id); const shared = await candidate(reqA.id, "SHARED");
    const today = istToday(), date = addDays(today, -2), startDate = addDays(today, -20), endDate = addDays(today, 20);
    const setup = { candidateId: selected.id, location: "Delhi Central", supervisor: "Team lead", startDate, endDate, shiftStart: "09:00", shiftEnd: "18:00", graceMinutes: 10, workingDays: [1, 2, 3, 4, 5, 6, 7] };
    const create = (body = setup) => request("/admin/attendance/assignments", { user: admin, method: "POST", body });
    const businessBase = "/business/attendance", adminBase = "/admin/attendance";
    let id, otherId;
    await t.test("sessions, role boundaries, unknown paths and CSRF header are enforced", async () => {
      for (const path of [businessBase, `${businessBase}/corrections`, `${businessBase}/assignments/missing`, `${businessBase}/assignments/missing/day`]) {
        assert.equal((await request(path)).status, 401); assert.equal((await request(path, { user: worker })).status, 403); assert.equal((await request(path, { user: admin })).status, 403);
      }
      assert.equal((await request(adminBase, { user: a })).status, 403);
      assert.equal((await request(`${adminBase}/assignments`, { user: admin, method: "POST", body: setup, csrf: false })).status, 403);
      assert.equal((await request(`${businessBase}/assignments/missing/corrections`, { user: a, method: "POST", body: {}, csrf: false })).status, 403);
      assert.equal((await request(`${businessBase}/not-a-real-route`)).status, 404);
      assert.equal((await request(`${businessBase}/assignments/missing/records`, { user: a, method: "PUT", body: {} })).status, 404);
    });
    await t.test("assignment setup is explicit, selected-only and idempotent", async () => {
      assert.equal((await request(`${businessBase}?date=${date}`, { user: a })).body.data.total, 0);
      for (const candidateId of [shared.id, unowned.id]) assert.equal((await create({ ...setup, candidateId })).status, 409);
      const pair = await Promise.all([create(), create()]); assert.deepEqual(pair.map(r => r.status).sort(), [200, 201]);
      id = pair[0].body.data.id; assert.equal(id, pair[1].body.data.id);
      otherId = (await create({ ...setup, candidateId: other.id })).body.data.id;
      const legacyId = (await create({ ...setup, candidateId: legacyCandidate.id })).body.data.id;
      assert.equal((await request(`${businessBase}/assignments/${legacyId}`, { user: a })).status, 200);
      assert.equal(await prisma.attendanceRecord.count({ where: { assignmentId: id } }), 0);
      assert.equal(await prisma.auditLog.count({ where: { entityId: id } }), 1);
      const options = (await request(`${adminBase}/selected-candidates`, { user: admin })).body.data.items;
      assert.ok(!options.some(item => [selected.id, shared.id, unowned.id].includes(item.id)));
    });
    await t.test("profile ownership wins over submitted-by or matching email; foreign reads and writes return 404", async () => {
      const missing = await request(`${businessBase}/assignments/missing`, { user: a });
      const foreign = await request(`${businessBase}/assignments/${otherId}`, { user: a });
      assert.equal(foreign.status, 404); assert.deepEqual(foreign.body, missing.body);
      assert.equal((await request(`${businessBase}/assignments/${otherId}/day?date=${date}`, { user: a })).status, 404);
      assert.equal((await request(`${businessBase}/assignments/${otherId}/corrections`, { user: a, method: "POST", body: { date, recordRevision: null, reason: "Unauthorized" } })).status, 404);
      assert.equal((await request(`${businessBase}?requirementId=${reqB.id}`, { user: a })).status, 404);
      assert.equal((await request(`${businessBase}?requirementId=${anonymous.id}`, { user: a })).status, 404);
      const owned = await request(`${businessBase}?date=${date}`, { user: a });
      assert.equal(owned.headers.get("cache-control"), "no-store"); assert.ok(!JSON.stringify(owned.body).includes(otherId));
      for (const field of ["businessEmail", "mobileNumber", "applicationId", "passwordHash", "submittedByUserId"]) assert.ok(!JSON.stringify(owned.body).includes(`"${field}"`));
    });
    const entry = { date, revision: null, status: "PRESENT", checkInAt: `${date}T09:25:00+05:30`, checkOutAt: `${date}T18:00:00+05:30`, breakMinutes: 30, note: "Confirmed site attendance" };
    const record = body => request(`${adminBase}/assignments/${id}/records`, { user: admin, method: "PUT", body });
    await t.test("missing, upcoming and scheduled-off statuses are distinct from absence", async () => {
      const overview = (await request(`${businessBase}?date=${date}`, { user: a })).body.data;
      assert.equal(overview.totals.counts.ABSENT, 0); assert.equal(overview.totals.counts.NOT_RECORDED, 2); assert.equal(overview.trend.length, 7);
      assert.equal((await request(`${businessBase}?date=${addDays(today, 1)}`, { user: a })).body.data.totals.counts.UPCOMING, 2);
      assert.equal((await record({ ...entry, date: addDays(today, 1) })).status, 400);
      assert.equal((await record({ ...entry, date: addDays(startDate, -1) })).status, 409);
      assert.equal((await record({ ...entry, status: "ABSENT" })).status, 400);
      assert.equal((await request(`${businessBase}?date=2026-02-30`, { user: a })).status, 400);
    });
    await t.test("concurrent first entries create one record and preserve history; stale updates cannot overwrite", async () => {
      const pair = await Promise.all([record(entry), record({ ...entry, note: "Other editor" })]); assert.deepEqual(pair.map(r => r.status).sort(), [200, 409]);
      const day = (await request(`${businessBase}/assignments/${id}/day?date=${date}`, { user: a })).body.data;
      assert.equal(day.record.workedMinutes, 485); assert.equal(day.record.lateMinutes, 15); assert.equal(day.history.total, 1);
      assert.equal((await record(entry)).status, 409);
      const overview = (await request(`${businessBase}?date=${date}`, { user: a })).body.data;
      assert.equal(overview.totals.counts.PRESENT, 1); assert.equal(overview.totals.minutes, 485); assert.equal(overview.totals.completion, 50);
      assert.equal((await request(`${businessBase}?date=${date}&status=PRESENT`, { user: a })).body.data.total, 1);
    });
    let correctionId;
    await t.test("correction submission is scoped, deduplicated and tied to the observed revision", async () => {
      const path = `${businessBase}/assignments/${id}/corrections`; const input = { date, recordRevision: 0, reason: "Check-out was 18:15 after the final shop visit" };
      assert.equal((await request(path, { user: a, method: "POST", body: { ...input, recordRevision: 3 } })).status, 409);
      const pair = await Promise.all([request(path, { user: a, method: "POST", body: input }), request(path, { user: a, method: "POST", body: input })]);
      assert.deepEqual(pair.map(r => r.status).sort(), [200, 201]); correctionId = pair[0].body.data.id;
      assert.equal(pair[1].body.data.id, correctionId);
      assert.equal((await request(path, { user: a, method: "POST", body: { ...input, reason: "Another request" } })).status, 409);
      assert.equal((await request(`${businessBase}/corrections`, { user: b })).body.data.total, 0);
      assert.equal((await request(`${businessBase}/corrections`, { user: a })).body.data.total, 1);
      assert.equal((await request(`${businessBase}/corrections?requirementId=${reqA.id}`, { user: a })).body.data.total, 1);
      assert.equal((await request(`${businessBase}/corrections?requirementId=${legacy.id}`, { user: a })).body.data.total, 0);
      assert.equal((await request(`${businessBase}/corrections?requirementId=${reqB.id}`, { user: a })).status, 404);
      assert.equal((await request(`${adminBase}/corrections/${correctionId}/resolve`, { user: a, method: "POST", body: { action: "REJECT", resolution: "Unauthorized" } })).status, 403);
    });
    await t.test("resolution and corrected attendance are atomic; rejection keeps attendance unchanged", async () => {
      const { date: unusedDate, ...values } = entry;
      const resolve = body => request(`${adminBase}/corrections/${correctionId}/resolve`, { user: admin, method: "POST", body });
      assert.equal((await resolve({ action: "RESOLVE", resolution: "Confirmed", attendance: { ...values, revision: 99 } })).status, 409);
      assert.equal((await prisma.attendanceCorrection.findUnique({ where: { id: correctionId } })).status, "OPEN");
      const body = { action: "RESOLVE", resolution: "Checked with the supervisor", attendance: { ...values, revision: 0, checkOutAt: `${date}T18:15:00+05:30`, note: "Extended final visit confirmed" } };
      const pair = await Promise.all([resolve(body), resolve(body)]); assert.deepEqual(pair.map(r => r.status).sort(), [200, 409]);
      const day = (await request(`${businessBase}/assignments/${id}/day?date=${date}`, { user: a })).body.data;
      assert.equal(day.record.workedMinutes, 500); assert.equal(day.record.revision, 1); assert.equal(day.history.total, 2); assert.equal(day.history.items[0].source, "CORRECTION_RESOLVED"); assert.equal(day.correction, null);
      const reopened = await request(`${businessBase}/assignments/${id}/corrections`, { user: a, method: "POST", body: { date, recordRevision: 1, reason: "Please recheck travel time" } }); correctionId = reopened.body.data.id;
      assert.equal((await resolve({ action: "REJECT", resolution: "Travel was outside the agreed shift" })).status, 200);
      assert.equal((await prisma.attendanceRecord.findUnique({ where: { assignmentId_date: { assignmentId: id, date: dateValue(date) } } })).revision, 1);
      const closed = (await request(`${businessBase}/corrections?status=ALL`, { user: a })).body.data.items;
      assert.equal(closed.length, 2); assert.ok(closed.every(item => item.resolution));
    });
    await t.test("assignment history locks settings, selection and requirement closure until future roster dates end", async () => {
      const { candidateId, ...values } = setup;
      assert.equal((await request(`${adminBase}/assignments/${id}`, { user: admin, method: "PUT", body: { ...values, revision: 0, note: "Trying a schedule rewrite" } })).status, 409);
      assert.equal((await request(`${adminBase}/assignments/${id}/cancel`, { user: admin, method: "POST", body: { revision: 0, note: "Trying to cancel history" } })).status, 409);
      assert.equal((await request(`/business/candidates/${selected.id}/reviews`, { user: a, method: "POST", body: { revision: 0, action: "STATUS", status: "SHARED", note: "Reopen selected profile" } })).status, 409);
      assert.equal((await request(`/admin/candidate-management/${selected.id}/revoke`, { user: admin, method: "POST", body: { revision: 0, note: "Revoke assigned person" } })).status, 409);
      assert.equal((await request(`/business/requirements/${reqA.id}/withdraw`, { user: a, method: "POST", body: { revision: 0, reason: "Closing this requirement" } })).status, 409);
      assert.equal((await request(`/admin/requirements/${reqA.id}/status`, { user: admin, method: "PATCH", body: { status: "CLOSED" } })).status, 409);
      assert.equal((await request(`${adminBase}/assignments/${id}/end`, { user: admin, method: "POST", body: { revision: 0, endDate: addDays(date, -1), note: "Exclude old records" } })).status, 409);
      assert.equal((await request(`${adminBase}/assignments/${id}/end`, { user: admin, method: "POST", body: { revision: 0, endDate: date, note: "Assignment finished" } })).status, 200);
      assert.equal((await request(`/business/requirements/${reqA.id}/withdraw`, { user: a, method: "POST", body: { revision: 0, reason: "Work has now finished" } })).status, 200);
      assert.equal((await record({ ...entry, revision: 1, note: "Historical verification after closure" })).status, 200);
      assert.equal((await request(`${businessBase}/assignments/${id}?month=${date.slice(0, 7)}`, { user: a })).body.data.settingsLocked, true);
    });
    await t.test("overnight shifts, scheduled off days and assignment cancellation are represented correctly", async () => {
      const night = await candidate(legacy.id); const nightResult = await create({ ...setup, candidateId: night.id, shiftStart: "22:00", shiftEnd: "06:00", workingDays: [isoWeekday(date)] });
      const nightId = nightResult.body.data.id;
      const saved = await request(`${adminBase}/assignments/${nightId}/records`, { user: admin, method: "PUT", body: { ...entry, checkInAt: `${date}T22:25:00+05:30`, checkOutAt: `${addDays(date, 1)}T06:00:00+05:30` } });
      assert.equal(saved.status, 200);
      const day = (await request(`${businessBase}/assignments/${nightId}/day?date=${date}`, { user: a })).body.data;
      assert.equal(day.record.workedMinutes, 425); assert.equal(day.record.lateMinutes, 15);
      const offDate = addDays(date, -1);
      assert.equal((await request(`${businessBase}/assignments/${nightId}/day?date=${offDate}`, { user: a })).body.data.status, "SCHEDULED_OFF");
      const spare = await candidate(legacy.id); const spareId = (await create({ ...setup, candidateId: spare.id })).body.data.id;
      assert.equal((await request(`${adminBase}/assignments/${spareId}/cancel`, { user: admin, method: "POST", body: { revision: 0, note: "Assignment not required" } })).status, 200);
      assert.equal((await request(`${businessBase}/assignments/${spareId}/day?date=${date}`, { user: a })).body.data.status, "NOT_ASSIGNED");
      assert.equal((await request(`${adminBase}/assignments/${spareId}/records`, { user: admin, method: "PUT", body: entry })).status, 409);
    });
    await t.test("register and calendar pagination are bounded with no duplicates", async () => {
      for (let i = 0; i < 16; i++) { const row = await candidate(legacy.id); assert.equal((await create({ ...setup, candidateId: row.id })).status, 201); }
      const first = (await request(`${businessBase}?date=${date}&requirementId=${legacy.id}`, { user: a })).body.data;
      const second = (await request(`${businessBase}?date=${date}&requirementId=${legacy.id}&page=2`, { user: a })).body.data;
      assert.equal(first.items.length, 15); assert.ok(second.items.length > 0);
      assert.equal(new Set([...first.items, ...second.items].map(item => item.assignment.id)).size, first.total);
      assert.equal((await request(`${businessBase}?date=${date}&query=%25`, { user: a })).body.data.total, 0);
      const calendar = (await request(`${businessBase}/assignments/${id}?month=2024-02`, { user: a })).body.data;
      assert.equal(calendar.days.length, 29); assert.ok(calendar.days.every(day => day.status === "NOT_ASSIGNED"));
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    const assignmentWhere = { requirementId: { in: requirements } };
    await prisma.attendanceCorrection.deleteMany({ where: { assignment: assignmentWhere } });
    await prisma.attendanceRecord.deleteMany({ where: { assignment: assignmentWhere } });
    await prisma.workforceAssignment.deleteMany({ where: assignmentWhere });
    await prisma.businessCandidate.deleteMany({ where: { requirementId: { in: requirements } } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: users.map(user => user.id) } } });
    if (job) { await prisma.jobApplication.deleteMany({ where: { jobId: job.id } }); await prisma.job.delete({ where: { id: job.id } }); }
    await prisma.workforceRequirement.deleteMany({ where: { id: { in: requirements } } });
    await prisma.businessProfile.deleteMany({ where: { userId: { in: users.map(user => user.id) } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } }); await prisma.$disconnect();
  }
});
