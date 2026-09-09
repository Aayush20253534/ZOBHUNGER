import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mock, test } from "node:test";

if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to a dedicated migrated test database. This suite creates and removes temporary fixtures.");
Object.assign(process.env, { DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: "test", REDIS_ENABLED: "false", JWT_SECRET: "deployment-test-only-not-for-production-32-characters",
  LOG_LEVEL: "error", CLIENT_ORIGIN: "http://localhost:3000", PUBLIC_APP_URL: "http://localhost:3000", API_RATE_LIMIT_MAX: "5000", AUTH_RATE_LIMIT_MAX: "1000" });
mock.module(new URL("../dist/services/email.service.js", import.meta.url).href, { namedExports: {
  recoveryEmailConfigured: () => false, sendBusinessRecoveryEmail: async () => false, sendOperationalEmail: async () => false,
} });
const { app } = await import("../dist/app.js"); const { prisma } = await import("../dist/config/db.js"); const { signAccessToken } = await import("../dist/utils/jwt.js");
const { addDays, istToday } = await import("../dist/modules/attendance/attendance.utils.js");
const { weekDates } = await import("../dist/modules/deployments/deployments.utils.js");
const prefix = `roster-${randomUUID()}`, users = [], requirements = []; let server, base, job;
async function request(path, { user, method = "GET", body, csrf = true } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(user ? { Cookie: `zobhunger_access=${signAccessToken({ sub: user.id, role: user.role, version: 0 })}` } : {}),
    ...(body ? { "Content-Type": "application/json", ...(csrf ? { "X-Requested-With": "XMLHttpRequest" } : {}) } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, body: await response.json(), headers: response.headers };
}
test("deployment views share assignments while preserving ownership, schedules and progress", async t => {
  try {
    server = app.listen(0, "127.0.0.1"); await once(server, "listening"); base = `http://127.0.0.1:${server.address().port}/api/v1`;
    for (const role of ["BUSINESS", "BUSINESS", "ADMIN", "WORKER"]) users.push(await prisma.user.create({ data: { email: `${prefix}-${users.length}@example.test`, role, businessAccessApproved: role === "BUSINESS", passwordHash: "unused" } }));
    const [a, b, admin, worker] = users;
    const profileA = await prisma.businessProfile.create({ data: { userId: a.id, companyName: "A Retail", contactPerson: "A Owner" } });
    const profileB = await prisma.businessProfile.create({ data: { userId: b.id, companyName: "B Retail", contactPerson: "B Owner" } });
    async function requirement(overrides = {}) {
      const row = await prisma.workforceRequirement.create({ data: { companyName: "A Retail", contactPerson: "A Owner", businessEmail: a.email, mobileNumber: "9876543210", industry: "Retail",
        serviceRequired: "Workforce", workforceCount: 2, jobLocation: "Delhi", locations: ["Delhi", "Noida"], projectDuration: "3 months", details: "Temporary deployment fixture", businessProfileId: profileA.id, submittedByUserId: a.id, ...overrides } });
      requirements.push(row.id); return row;
    }
    const reqA = await requirement(), reqB = await requirement({ companyName: "B Retail", businessProfileId: profileB.id });
    const legacy = await requirement({ businessProfileId: null }), anonymous = await requirement({ businessProfileId: null, submittedByUserId: null });
    const closed = await requirement({ status: "CLOSED" });
    job = await prisma.job.create({ data: { slug: prefix, title: "Market Executive", location: "Delhi", city: "Delhi", category: "Sales", engagementType: "Contract", description: "Temporary fixture", status: "OPEN", isDemo: false } });
    let serial = 0;
    async function candidate(requirementId = reqA.id, status = "SELECTED") {
      const name = `Executive ${String(++serial).padStart(2, "0")}`;
      const application = await prisma.jobApplication.create({ data: { jobId: job.id, name, email: `${prefix}-${serial}@example.test`, phone: "9876543210", message: "Private application" } });
      return prisma.businessCandidate.create({ data: { requirementId, applicationId: application.id, name, summary: "Relevant field experience", skills: ["Retail sales"], jobTitle: job.title, status } });
    }
    const monday = weekDates(addDays(istToday(), -7))[0], date = addDays(monday, 2);
    const setup = { location: "Delhi Central", supervisor: "Site lead", startDate: monday, endDate: addDays(monday, 14), shiftStart: "22:00", shiftEnd: "06:00", graceMinutes: 10, workingDays: [1, 2, 3, 4, 5] };
    async function create(person, values = {}, namespace = "deployments") {
      const result = await request(`/admin/${namespace}/assignments`, { user: admin, method: "POST", body: { ...setup, candidateId: person.id, ...values } });
      assert.ok([200, 201].includes(result.status), JSON.stringify(result.body)); return result.body.data.id;
    }
    const selected = await candidate(), upcomingPerson = await candidate(), endedPerson = await candidate(), cancelledPerson = await candidate();
    await candidate(); // one selected person still awaiting assignment
    const shared = await candidate(reqA.id, "SHARED"), unowned = await candidate(anonymous.id), closedPerson = await candidate(closed.id);
    let id, upcoming, ended, cancelled, foreign, legacyId;
    await t.test("session, role, CSRF and validation guards protect the new routes", async () => {
      for (const path of ["/business/deployments", "/business/deployments/progress", "/business/deployments/assignments/missing"]) {
        assert.equal((await request(path)).status, 401);
        for (const user of [admin, worker]) assert.equal((await request(path, { user })).status, 403);
      }
      assert.equal((await request("/admin/deployments", { user: a })).status, 403);
      assert.equal((await request("/admin/deployments/assignments", { user: admin, method: "POST", body: { ...setup, candidateId: selected.id }, csrf: false })).status, 403);
      assert.equal((await request("/business/deployments/unknown")).status, 404);
      assert.equal((await request("/business/deployments/assignments", { user: a, method: "POST", body: {} })).status, 404);
      for (const query of ["date=2026-02-30", "page=100001", "userId=other", "status=PRESENT", "view=invalid"]) assert.equal((await request(`/business/deployments?${query}`, { user: a })).status, 400);
    });
    await t.test("only valid selections become assignments, with the same ID through both modules", async () => {
      for (const person of [shared, unowned, closedPerson]) assert.equal((await request("/admin/deployments/assignments", { user: admin, method: "POST", body: { ...setup, candidateId: person.id } })).status, 409);
      id = await create(selected);
      assert.equal(await create(selected, { supervisor: "Must not overwrite" }, "attendance"), id);
      assert.equal((await prisma.workforceAssignment.findUnique({ where: { id } })).supervisor, "Site lead");
      upcoming = await create(upcomingPerson, { startDate: addDays(monday, 4) });
      ended = await create(endedPerson, { startDate: addDays(monday, -14), endDate: addDays(monday, -1) });
      cancelled = await create(cancelledPerson);
      assert.equal((await request(`/admin/deployments/assignments/${cancelled}/cancel`, { user: admin, method: "POST", body: { revision: 0, note: "Internal operations note" } })).status, 200);
      foreign = await create(await candidate(reqB.id)); legacyId = await create(await candidate(legacy.id), {}, "attendance");
      assert.equal((await request(`/business/deployments/assignments/${legacyId}?date=${date}`, { user: a })).status, 200);
      const options = (await request("/admin/deployments/selected-candidates", { user: admin })).body.data.items;
      assert.ok(!options.some(item => [selected.id, shared.id, unowned.id, closedPerson.id].includes(item.id)));
      assert.equal(await prisma.attendanceRecord.count({ where: { assignmentId: id } }), 0);
    });
    await t.test("business-profile ownership overrides submitted-by and email matches", async () => {
      const own = await request(`/business/deployments?date=${date}`, { user: a });
      assert.equal(own.status, 200); assert.equal(own.headers.get("cache-control"), "no-store");
      assert.ok(!own.body.data.items.some(item => item.id === foreign));
      assert.equal((await request(`/business/deployments?date=${date}`, { user: b })).body.data.total, 1);
      for (const path of ["/business/deployments", "/business/deployments/progress"]) {
        for (const requirementId of [reqB.id, anonymous.id, "missing"]) assert.equal((await request(`${path}?requirementId=${requirementId}`, { user: a })).status, 404);
      }
      const missing = await request("/business/deployments/assignments/missing", { user: a });
      const other = await request(`/business/deployments/assignments/${foreign}`, { user: a });
      assert.equal(other.status, 404); assert.deepEqual(other.body, missing.body);
      for (const field of ["applicationId", "businessEmail", "mobileNumber", "passwordHash", "submittedByUserId"]) assert.ok(!JSON.stringify(own.body).includes(`"${field}"`));
    });
    await t.test("roster states and coverage distinguish active, upcoming, ended and cancelled", async () => {
      const data = (await request(`/business/deployments?requirementId=${reqA.id}&date=${date}`, { user: a })).body.data;
      assert.deepEqual(data.counts, { ACTIVE: 1, UPCOMING: 1, ENDED: 1, CANCELLED: 1 });
      assert.equal(data.activeSites, 1); assert.equal(data.workingOnDate, 1); assert.equal(data.endingSoon, 0);
      const filtered = (await request(`/business/deployments?requirementId=${reqA.id}&date=${date}&status=UPCOMING`, { user: a })).body.data;
      assert.equal(filtered.total, 1); assert.equal(filtered.items[0].id, upcoming); assert.deepEqual(filtered.counts, data.counts);
      const progress = (await request(`/business/deployments/progress?requirementId=${reqA.id}&date=${date}`, { user: a })).body.data.items[0];
      assert.deepEqual({ active: progress.active, upcoming: progress.upcoming, ended: progress.ended, cancelled: progress.cancelled, coverage: progress.coverage, remaining: progress.remaining, selected: progress.selected, waiting: progress.awaitingAssignment },
        { active: 1, upcoming: 1, ended: 1, cancelled: 1, coverage: 50, remaining: 1, selected: 5, waiting: 1 });
      const later = (await request(`/business/deployments/progress?requirementId=${reqA.id}&date=${addDays(monday, 4)}`, { user: a })).body.data.items[0];
      assert.equal(later.active, 2); assert.equal(later.coverage, 100); assert.equal(later.upcoming, 0);
      assert.equal((await request(`/business/deployments/progress?scope=CLOSED`, { user: a })).body.data.items[0].requirement.id, closed.id);
    });
    await t.test("weekly plans show rest days, partial weeks and correct IST overnight endpoints", async () => {
      const week = (await request(`/business/deployments?requirementId=${reqA.id}&date=${date}&view=schedule`, { user: a })).body.data;
      assert.deepEqual(week.dates, weekDates(date)); assert.equal(week.total, 2);
      assert.ok(!week.items.some(item => [cancelled, ended].includes(item.id)));
      const active = week.items.find(item => item.id === id), later = week.items.find(item => item.id === upcoming);
      assert.deepEqual(active.schedule.map(day => day.state), ["WORKING", "WORKING", "WORKING", "WORKING", "WORKING", "OFF", "OFF"]);
      assert.equal(active.schedule[2].startAt, new Date(`${date}T22:00:00+05:30`).toISOString());
      assert.equal(active.schedule[2].endAt, new Date(`${addDays(date, 1)}T06:00:00+05:30`).toISOString());
      assert.equal(later.schedule[3].state, "OUTSIDE"); assert.equal(later.schedule[4].state, "WORKING");
      const outside = (await request(`/business/deployments?requirementId=${reqA.id}&date=${addDays(monday, 70)}&view=schedule`, { user: a })).body.data;
      assert.equal(outside.total, 0);
    });
    await t.test("assignment detail exposes safe milestones, while internal notes remain admin-only", async () => {
      const business = (await request(`/business/deployments/assignments/${cancelled}?date=${date}`, { user: a })).body.data;
      const operations = (await request(`/admin/deployments/assignments/${cancelled}?date=${date}`, { user: admin })).body.data;
      assert.equal(business.history.total, 2); assert.ok(business.history.items.every(event => event.note === null));
      assert.ok(operations.history.items.some(event => event.note === "Internal operations note"));
      for (const field of ["actorUserId", "metadata", "ipAddress", "applicationId"]) assert.ok(!JSON.stringify(business).includes(`"${field}"`));
      await prisma.businessCandidate.update({ where: { id: endedPerson.id }, data: { revokedAt: new Date() } });
      const revoked = (await request(`/business/deployments/assignments/${ended}`, { user: a })).body.data;
      assert.equal(revoked.candidateVisible, false); assert.deepEqual(revoked.skills, []);
    });
    await t.test("attendance added to a roster assignment locks schedule rewrites across both routes", async () => {
      const recorded = await request(`/admin/attendance/assignments/${id}/records`, { user: admin, method: "PUT", body: { date, revision: null, status: "PRESENT", checkInAt: `${date}T22:00:00+05:30`, checkOutAt: `${addDays(date, 1)}T06:00:00+05:30`, breakMinutes: 30, note: "Supervisor verified" } });
      assert.equal(recorded.status, 200);
      assert.equal((await request(`/business/deployments/assignments/${id}`, { user: a })).body.data.settingsLocked, true);
      const attendance = (await request(`/business/attendance/assignments/${id}/day?date=${date}`, { user: a })).body.data;
      assert.equal(attendance.record.workedMinutes, 450);
      const edit = { ...setup, revision: 0, note: "Change shift" };
      assert.equal((await request(`/admin/deployments/assignments/${id}`, { user: admin, method: "PUT", body: edit })).status, 409);
      assert.equal((await request(`/admin/deployments/assignments/${id}/cancel`, { user: admin, method: "POST", body: { revision: 0, note: "Do not erase history" } })).status, 409);
      assert.equal((await request(`/admin/deployments/assignments/${id}/end`, { user: admin, method: "POST", body: { revision: 0, endDate: addDays(date, -1), note: "Would exclude attendance" } })).status, 409);
      assert.equal((await request(`/admin/deployments/assignments/${id}/end`, { user: admin, method: "POST", body: { revision: 0, endDate: date, note: "Last working date confirmed" } })).status, 200);
      assert.equal((await request(`/business/deployments?requirementId=${reqA.id}&date=${addDays(date, 1)}&status=ENDED`, { user: a })).body.data.total, 2);
      const history = (await request(`/business/deployments/assignments/${id}`, { user: a })).body.data.history.items;
      assert.ok(history.some(event => event.endDate === date && event.label === "Last working date updated"));
    });
    await t.test("location pagination is stable, filters treat wildcards literally, and progress can exceed the target", async () => {
      for (let i = 0; i < 14; i++) await create(await candidate(legacy.id), { location: i % 2 ? "Noida East" : "delhi central" });
      const path = `/business/deployments?requirementId=${legacy.id}&date=${date}&view=locations`;
      const first = (await request(path, { user: a })).body.data, second = (await request(`${path}&page=2`, { user: a })).body.data;
      assert.equal(first.total, 15); assert.equal(first.items.length, 12); assert.equal(second.items.length, 3);
      assert.equal(new Set([...first.items, ...second.items].map(item => item.id)).size, 15); assert.equal(first.activeSites, 2);
      const site = (await request(`${path}&location=DELHI`, { user: a })).body.data;
      assert.equal(site.total, 8); assert.equal(site.activeSites, 1);
      for (const endpoint of ["/business/deployments", "/business/deployments/progress"]) for (const query of ["%25", "_", "' OR 1=1 --"]) {
        assert.equal((await request(`${endpoint}?query=${encodeURIComponent(decodeURIComponent(query))}`, { user: a })).body.data.total, 0);
      }
      const progress = (await request(`/business/deployments/progress?requirementId=${legacy.id}&date=${date}`, { user: a })).body.data.items[0];
      assert.equal(progress.active, 15); assert.equal(progress.coverage, 750); assert.equal(progress.overTarget, 13); assert.equal(progress.remaining, 0);
      const last = (await request(`${path}&page=999`, { user: a })).body.data; assert.equal(last.page, 2);
    });
    await t.test("progress paginates requirements without duplicating them or leaking another business", async () => {
      for (let i = 0; i < 8; i++) await requirement();
      const one = (await request("/business/deployments/progress?scope=ALL", { user: a })).body.data;
      const two = (await request("/business/deployments/progress?scope=ALL&page=2", { user: a })).body.data;
      assert.equal(one.total, 11); assert.equal(one.items.length, 9); assert.equal(two.items.length, 2);
      assert.equal(new Set([...one.items, ...two.items].map(item => item.requirement.id)).size, 11);
      assert.ok(![...one.items, ...two.items].some(item => [reqB.id, anonymous.id].includes(item.requirement.id)));
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    const where = { requirementId: { in: requirements } };
    await prisma.attendanceCorrection.deleteMany({ where: { assignment: where } }); await prisma.attendanceRecord.deleteMany({ where: { assignment: where } });
    await prisma.workforceAssignment.deleteMany({ where }); await prisma.businessCandidate.deleteMany({ where });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: users.map(user => user.id) } } });
    if (job) { await prisma.jobApplication.deleteMany({ where: { jobId: job.id } }); await prisma.job.delete({ where: { id: job.id } }); }
    await prisma.workforceRequirement.deleteMany({ where: { id: { in: requirements } } });
    await prisma.businessProfile.deleteMany({ where: { userId: { in: users.map(user => user.id) } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } }); await prisma.$disconnect();
  }
});
