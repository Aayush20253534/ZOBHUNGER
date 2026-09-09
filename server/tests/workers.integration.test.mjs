import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { mock, test } from "node:test";

if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to a dedicated migrated test database. This suite writes and removes temporary fixtures.");
Object.assign(process.env, { DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: "test", REDIS_ENABLED: "false", JWT_SECRET: "worker-test-only-not-a-production-secret", LOG_LEVEL: "error", CLIENT_ORIGIN: "http://localhost:3000", PUBLIC_APP_URL: "http://localhost:3000", API_RATE_LIMIT_MAX: "5000", AUTH_RATE_LIMIT_MAX: "1000" });
let configured = true, deliver = true, mailThrows = false;
const deliveries = [];
mock.module(new URL("../dist/services/worker-email.service.js", import.meta.url).href, { namedExports: {
  workerEmailConfigured: () => configured,
  sendWorkerAccessEmail: async (email, link, purpose) => { if (mailThrows) throw new Error("Mock provider unavailable"); deliveries.push({ email, link, purpose }); return deliver; },
} });
mock.module(new URL("../dist/services/email.service.js", import.meta.url).href, { namedExports: { recoveryEmailConfigured: () => false, sendBusinessRecoveryEmail: async () => false, sendOperationalEmail: async () => false } });
const { app } = await import("../dist/app.js");
const { prisma } = await import("../dist/config/db.js");
const { signAccessToken } = await import("../dist/utils/jwt.js");
const { hashPassword } = await import("../dist/utils/password.js");
const { requestWorkerEmail } = await import("../dist/modules/workers/worker-access.service.js");
const prefix = `worker-${randomUUID()}`, password = "WorkerReady123!";
const users = [], jobs = [], requirements = [];
let server, origin, serial = 0;
const cookieFor = user => `zobhunger_access=${signAccessToken({ sub: user.id, role: user.role, version: user.sessionVersion ?? 0 })}`;
const rawToken = link => new URLSearchParams(new URL(link).hash.slice(1)).get("token");
async function request(path, { user, cookie, method = "GET", body, raw, headers = {}, csrf = true } = {}) {
  const response = await fetch(`${origin}${path.startsWith("/route") ? "" : "/api/v1"}${path}`, { method, headers: {
    ...(cookie || user ? { Cookie: cookie || cookieFor(user) } : {}), ...(csrf && method !== "GET" && method !== "HEAD" ? { "X-Requested-With": "XMLHttpRequest" } : {}),
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers,
  }, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, body: data, headers: response.headers };
}
async function tokenFor(user, purpose, overrides = {}) {
  const token = randomBytes(32).toString("hex");
  await prisma.workerAccessToken.upsert({ where: { userId_purpose: { userId: user.id, purpose } },
    create: { userId: user.id, purpose, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 60_000), sessionVersion: user.sessionVersion ?? 0, ...overrides },
    update: { tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 60_000), sessionVersion: user.sessionVersion ?? 0, ...overrides } });
  return token;
}
test("worker access, profiles, private resumes and real job discovery", async t => {
  try {
    server = app.listen(0, "127.0.0.1"); await once(server, "listening"); origin = `http://127.0.0.1:${server.address().port}`;
    const passwordHash = await hashPassword(password);
    async function account(role = "WORKER", overrides = {}) {
      const user = await prisma.user.create({ data: { email: `${prefix}-${++serial}@example.test`, phone: `980${String(serial).padStart(7, "0")}`, role, passwordHash, emailVerifiedAt: new Date(), businessAccessApproved: role === "BUSINESS", ...overrides } }); users.push(user); return user;
    }
    const other = await account(), business = await account("BUSINESS"), admin = await account("ADMIN"), institution = await account("PLACEMENT_CELL"), legacy = await account("WORKER", { emailVerifiedAt: null });
    let worker, cookie, verification, completeProfile;
    const registration = { fullName: "Asha Field Executive", email: `${prefix}-new@example.test`, phone: "+91 9899900100", password, consent: true, next: "/jobs/field-executive" };

    await t.test("GET and HEAD /route are public no-store liveness probes without database dependencies", async () => {
      const live = await request("/route"); assert.equal(live.status, 200); assert.equal(live.body.status, "ok"); assert.equal(live.headers.get("cache-control"), "no-store");
      assert.deepEqual(Object.keys(live.body).sort(), ["service", "status", "timestamp", "uptimeSeconds"]);
      const head = await request("/route", { method: "HEAD" }); assert.equal(head.status, 200); assert.equal(head.body, "");
      const health = await request("/health"); assert.equal(health.body.data.features.workerAccess, true); assert.equal(health.body.data.features.workerProfiles, true); assert.equal(health.body.data.features.workerJobDiscovery, true);
    });
    await t.test("registration validates consent, password and role before creating an account", async () => {
      for (const override of [{ consent: false }, { password: "weak" }, { role: "ADMIN" }, { phone: "12" }]) assert.equal((await request("/auth/worker/register", { method: "POST", body: { ...registration, ...override } })).status, 400);
      assert.equal((await request("/auth/worker/register", { method: "POST", body: registration, csrf: false })).status, 403);
      assert.equal(await prisma.user.count({ where: { email: registration.email } }), 0);
      const result = await request("/auth/worker/register", { method: "POST", body: registration });
      assert.equal(result.status, 201); assert.equal(result.body.data.user.role, "WORKER"); assert.equal(result.body.data.user.emailVerifiedAt, null); assert.equal(result.body.data.emailSent, true);
      worker = await prisma.user.findUniqueOrThrow({ where: { email: registration.email } }); users.push(worker);
      cookie = result.headers.get("set-cookie").split(";")[0]; assert.match(result.headers.get("set-cookie"), /HttpOnly/i);
      assert.ok(!JSON.stringify(result.body).includes("passwordHash")); assert.equal(result.body.data.user.phone, "+919899900100");
      assert.equal((await request("/auth/worker/register", { method: "POST", body: registration })).status, 409);
      verification = deliveries.find(item => item.email === worker.email);
      const url = new URL(verification.link); assert.equal(url.origin, "http://localhost:3000"); assert.equal(url.pathname, "/worker/verify"); assert.equal(url.searchParams.get("next"), "/worker/jobs/field-executive"); assert.equal(url.searchParams.has("token"), false);
      const stored = await prisma.workerAccessToken.findUniqueOrThrow({ where: { userId_purpose: { userId: worker.id, purpose: "EMAIL_VERIFICATION" } } });
      assert.notEqual(stored.tokenHash, rawToken(verification.link)); assert.equal(stored.tokenHash, createHash("sha256").update(rawToken(verification.link)).digest("hex"));
    });
    await t.test("unverified accounts get a limited workspace; every private module checks auth, role and verification", async () => {
      assert.equal((await request("/workers/workspace", { cookie })).status, 200);
      assert.equal((await request("/workers/workspace", { cookie })).body.data.profile, null);
      for (const path of ["/workers/workspace", "/workers/profile", "/workers/profile/resume", "/workers/jobs", "/workers/saved-jobs"]) {
        assert.equal((await request(path)).status, 401);
        for (const user of [business, admin, institution]) assert.equal((await request(path, { user })).status, 403);
      }
      for (const path of ["/workers/profile", "/workers/profile/resume", "/workers/jobs", "/workers/saved-jobs"]) assert.equal((await request(path, { cookie })).status, 403);
      assert.equal((await request("/workers/profile", { cookie, method: "PUT", body: {} })).status, 403);
      assert.equal((await request("/workers/saved-jobs/any", { cookie, method: "PUT" })).status, 403);
    });
    await t.test("verification is explicit, purpose-bound and single-use; an old session gains only verified worker access", async () => {
      const token = rawToken(verification.link);
      assert.equal((await request("/auth/worker/reset-password", { method: "POST", body: { token, password: "ChangedWorker123!" } })).status, 400);
      const attempts = await Promise.all([1, 2].map(() => request("/auth/worker/verify-email", { method: "POST", body: { token } })));
      assert.deepEqual(attempts.map(item => item.status).sort(), [200, 400]);
      const workspace = await request("/workers/workspace", { cookie }); assert.ok(workspace.body.data.user.emailVerifiedAt); assert.equal(workspace.body.data.profile.fullName, registration.fullName);
      assert.equal(workspace.body.data.completion.percent, 0);
      assert.equal((await request("/auth/worker/login", { method: "POST", body: { email: worker.email, password } })).status, 200);
      for (const user of [business, admin, institution]) assert.equal((await request("/auth/worker/login", { method: "POST", body: { email: user.email, password } })).status, 401);
    });
    await t.test("legacy workers can verify without importing career profiles or granting other roles access", async () => {
      assert.equal((await request("/workers/profile", { user: legacy })).status, 403);
      await requestWorkerEmail(legacy.email, "EMAIL_VERIFICATION", "//evil.example/path");
      const link = deliveries.find(item => item.email === legacy.email).link;
      assert.equal(new URL(link).searchParams.get("next"), "/worker/profile");
      assert.equal((await request("/auth/worker/verify-email", { method: "POST", body: { token: rawToken(link) } })).status, 200);
      assert.equal((await request("/workers/profile", { user: legacy })).body.data.profile, null);
      assert.equal(await requestWorkerEmail(business.email, "PASSWORD_RESET"), false);
      const expired = await tokenFor(other, "PASSWORD_RESET", { expiresAt: new Date(Date.now() - 1000) });
      assert.equal((await request("/auth/worker/reset-password", { method: "POST", body: { token: expired, password } })).status, 400);
    });
    await t.test("recovery responses do not disclose account existence and mail outages do not undo registration", async () => {
      configured = false;
      for (const email of [worker.email, `${prefix}-missing@example.test`]) assert.equal((await request("/auth/worker/forgot-password", { method: "POST", body: { email } })).status, 503);
      configured = true;
      const known = await request("/auth/worker/resend-verification", { method: "POST", body: { email: worker.email } });
      const unknown = await request("/auth/worker/resend-verification", { method: "POST", body: { email: `${prefix}-missing@example.test` } });
      assert.equal(known.status, 202); assert.equal(unknown.status, 202); assert.deepEqual(known.body, unknown.body);
      for (const shouldThrow of [false, true]) {
        deliver = false; mailThrows = shouldThrow;
        const details = { ...registration, email: `${prefix}-failed-${shouldThrow}@example.test`, phone: shouldThrow ? "9899900102" : "9899900101" };
        const result = await request("/auth/worker/register", { method: "POST", body: details });
        assert.equal(result.status, 201); assert.equal(result.body.data.emailSent, false);
        const saved = await prisma.user.findUniqueOrThrow({ where: { email: details.email } }); users.push(saved);
        if (!shouldThrow) assert.equal(await prisma.workerAccessToken.count({ where: { userId: saved.id } }), 0);
      }
      mailThrows = false; deliver = true;
    });
    await t.test("password reset is one-use, clears worker tokens and invalidates all old cookies", async () => {
      assert.equal(await requestWorkerEmail(worker.email, "PASSWORD_RESET", "/worker/saved-jobs"), true);
      const count = deliveries.length; assert.equal(await requestWorkerEmail(worker.email, "PASSWORD_RESET"), false); assert.equal(deliveries.length, count);
      const recovery = deliveries.findLast(item => item.email === worker.email && item.purpose === "PASSWORD_RESET");
      const token = rawToken(recovery.link); const newPassword = "NextWorkerPassword234!";
      assert.equal((await request("/auth/worker/verify-email", { method: "POST", body: { token } })).status, 400);
      assert.equal((await request("/auth/worker/reset-password", { method: "POST", body: { token, password: newPassword } })).status, 200);
      assert.equal((await request("/auth/worker/reset-password", { method: "POST", body: { token, password: newPassword } })).status, 400);
      assert.equal((await request("/workers/workspace", { cookie })).status, 401);
      assert.equal(await prisma.workerAccessToken.count({ where: { userId: worker.id } }), 0);
      assert.equal((await request("/auth/worker/login", { method: "POST", body: { email: worker.email, password } })).status, 401);
      const login = await request("/auth/worker/login", { method: "POST", body: { email: worker.email, password: newPassword } }); assert.equal(login.status, 200); cookie = login.headers.get("set-cookie").split(";")[0];
      assert.equal((await request("/workers/workspace", { user: other })).status, 200);
    });
    await t.test("profile education, experience, skills and preferences persist with validation and ownership", async () => {
      completeProfile = { revision: 0, fullName: "Asha Sharma", phone: "+919899900100", headline: "Field sales executive", about: "Retail outreach and customer service", city: "Delhi", state: "Delhi", postalCode: "110001", skills: ["Sales", "Survey", "Sales"], languages: ["Hindi", "English"], experienceYears: 2,
        education: [{ qualification: "Bachelor of Arts", institution: "Test College", year: 2020 }], workExperience: [{ company: "Retail Test Co", role: "Field executive", startMonth: "2021-01", endMonth: "2023-01", current: false, description: "Customer outreach" }], preferredLocations: ["Delhi"], preferredCategories: ["Sales"], preferredEngagements: ["Contract"], availability: "Immediately", isAvailable: true, consent: true };
      assert.equal((await request("/workers/profile", { cookie, method: "PUT", body: completeProfile, csrf: false })).status, 403);
      for (const change of [{ consent: false }, { userId: other.id }, { postalCode: "123" }, { workExperience: [{ ...completeProfile.workExperience[0], endMonth: "2020-01" }] }, { skills: Array(21).fill("Skill") }]) assert.equal((await request("/workers/profile", { cookie, method: "PUT", body: { ...completeProfile, ...change } })).status, 400);
      const saved = await request("/workers/profile", { cookie, method: "PUT", body: completeProfile }); assert.equal(saved.status, 200);
      assert.equal(saved.body.data.profile.revision, 1); assert.deepEqual(saved.body.data.profile.skills, ["Sales", "Survey"]); assert.equal(saved.body.data.completion.percent, 83);
      assert.deepEqual(saved.body.data.profile.education, completeProfile.education); assert.deepEqual(saved.body.data.profile.workExperience, completeProfile.workExperience);
      assert.equal((await request("/workers/profile", { user: other })).body.data.profile, null);
      const profile = (await request(`/workers/profile?userId=${other.id}`, { cookie })).body.data.profile; assert.equal(profile.fullName, "Asha Sharma"); assert.ok(!("resumeUrl" in profile));
      const concurrent = await Promise.all([1, 2].map(() => request("/workers/profile", { cookie, method: "PUT", body: { ...completeProfile, revision: 1 } })));
      assert.deepEqual(concurrent.map(value => value.status).sort(), [200, 409]);
      assert.equal((await request("/workers/profile", { cookie, method: "PUT", body: { ...completeProfile, revision: 2, phone: other.phone } })).status, 409);
      assert.equal((await request("/workers/profile", { cookie })).body.data.profile.phone, completeProfile.phone);
    });
    await t.test("PDF resumes stay private, enforce size/type and have monotonic versions across deletion", async () => {
      const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n");
      const upload = (revision, raw = pdf, extra = {}) => request("/workers/profile/resume", { cookie, method: "PUT", raw, headers: { "Content-Type": "application/pdf", "X-File-Name": encodeURIComponent("Asha Resume.pdf"), "X-Resume-Revision": String(revision), ...extra } });
      assert.equal((await upload(0, Buffer.from("not a pdf"))).status, 415);
      assert.equal((await upload(0, pdf, { "Content-Type": "image/png" })).status, 400);
      assert.equal((await upload(0, Buffer.alloc(2 * 1024 * 1024 + 1))).status, 413);
      const created = await upload(0); assert.equal(created.status, 200); assert.equal(created.body.data.profile.resume.revision, 1); assert.equal(created.body.data.completion.percent, 100);
      assert.equal(created.body.data.profile.resume.fileName, "Asha Resume.pdf"); assert.equal(created.body.data.profile.resume.size, pdf.length);
      assert.ok(!JSON.stringify(created.body.data).includes('"sha256"')); assert.ok(!JSON.stringify(created.body.data).includes('"data"'));
      const downloaded = await request("/workers/profile/resume", { cookie }); assert.equal(downloaded.status, 200); assert.equal(downloaded.body, pdf.toString()); assert.equal(downloaded.headers.get("cache-control"), "no-store"); assert.match(downloaded.headers.get("content-disposition"), /^attachment/); assert.equal(downloaded.headers.get("content-security-policy"), "sandbox");
      assert.equal((await request(`/workers/profile/resume?userId=${worker.id}`, { user: other })).status, 404);
      assert.equal((await upload(0)).status, 409); assert.equal((await upload(1)).status, 200);
      assert.equal((await request("/workers/profile/resume", { cookie, method: "DELETE", body: { revision: 1 } })).status, 409);
      const removed = await request("/workers/profile/resume", { cookie, method: "DELETE", body: { revision: 2 } }); assert.equal(removed.status, 200); assert.equal(removed.body.data.profile.resume, null); assert.equal(removed.body.data.profile.resumeRevision, 3);
      assert.equal((await upload(0)).status, 409); assert.equal((await upload(3)).body.data.profile.resume.revision, 4);
      assert.equal((await request("/workers/profile/resume", { cookie, method: "DELETE", body: { revision: 2 } })).status, 409);
      assert.equal((await request("/workers/profile", { cookie, method: "PUT", body: { ...completeProfile, revision: 2, experienceYears: 0, workExperience: [] } })).body.data.completion.percent, 100);
    });
    async function opening(overrides = {}) {
      const job = await prisma.job.create({ data: { slug: `${prefix}-job-${++serial}`, title: "Field Sales Executive", location: "Delhi", city: "Delhi", category: prefix, engagementType: "Contract", description: "Retail outlet surveys and sales", responsibilities: ["Visit outlets"], requirements: ["Customer communication"], status: "OPEN", isDemo: false, publishedAt: new Date(Date.now() - 60_000), ...overrides } }); jobs.push(job); return job;
    }
    let open, blocked, draft;
    await t.test("discovery excludes demo, draft, closed, scheduled and unapproved-business openings", async () => {
      open = await opening(); draft = await opening({ status: "DRAFT" });
      await opening({ isDemo: true }); await opening({ status: "CLOSED" }); await opening({ publishedAt: null }); await opening({ publishedAt: new Date(Date.now() + 60_000) });
      await prisma.user.update({ where: { id: business.id }, data: { businessAccessApproved: false } });
      const requirement = await prisma.workforceRequirement.create({ data: { companyName: "Test business", contactPerson: "Test Owner", businessEmail: business.email, mobileNumber: "9876543210", industry: "Retail", serviceRequired: "Workforce", workforceCount: 2, jobLocation: "Delhi", projectDuration: "3 months", details: "Test requirement", submittedByUserId: business.id, status: "QUALIFIED" } }); requirements.push(requirement.id);
      blocked = await opening({ requirementId: requirement.id });
      let list = (await request(`/workers/jobs?category=${prefix}`, { cookie })).body.data; assert.equal(list.total, 1); assert.equal(list.items[0].id, open.id);
      for (const job of jobs.filter(job => job.id !== open.id)) assert.equal((await request(`/workers/jobs/${job.slug}`, { cookie })).status, 404);
      assert.equal((await request(`/workers/saved-jobs/${blocked.id}`, { cookie, method: "PUT" })).status, 404);
      await prisma.user.update({ where: { id: business.id }, data: { businessAccessApproved: true } });
      list = (await request(`/workers/jobs?category=${prefix}`, { cookie })).body.data; assert.equal(list.total, 2);
      await prisma.workforceRequirement.update({ where: { id: requirement.id }, data: { status: "CLOSED" } });
      assert.equal((await request(`/workers/jobs/${blocked.slug}`, { cookie })).status, 404);
    });
    await t.test("search filters combine, wildcard searches are literal, and pagination is stable", async () => {
      for (let i = 0; i < 11; i++) await opening({ title: `Field Executive ${i}`, city: i % 2 ? "Mumbai" : "Delhi", location: i % 2 ? "Mumbai" : "Delhi", publishedAt: open.publishedAt });
      const first = (await request(`/workers/jobs?category=${prefix}`, { cookie })).body.data;
      const second = (await request(`/workers/jobs?category=${prefix}&page=2`, { cookie })).body.data;
      assert.equal(first.total, 12); assert.equal(first.items.length, 9); assert.equal(second.items.length, 3); assert.equal(new Set([...first.items, ...second.items].map(job => job.id)).size, 12);
      const filtered = (await request(`/workers/jobs?category=${prefix}&query=retail&city=delhi&engagementType=contract`, { cookie })).body.data;
      assert.equal(filtered.total, 7);
      for (const query of ["%", "_", "' OR 1=1 --"]) assert.equal((await request(`/workers/jobs?category=${prefix}&query=${encodeURIComponent(query)}`, { cookie })).body.data.total, 0);
      for (const query of ["page=0", "page=1.5", "page=999999", "ownerId=other"]) assert.equal((await request(`/workers/jobs?${query}`, { cookie })).status, 400);
      const facets = (await request("/workers/jobs/facets", { cookie })).body.data; assert.ok(facets.categories.includes(prefix)); assert.ok(facets.cities.includes("Mumbai"));
      assert.equal((await request(`/workers/jobs?category=${prefix}&page=100`, { cookie })).body.data.items.length, 0);
    });
    await t.test("saved jobs are idempotent, account-scoped and preserve only the formerly public snapshot", async () => {
      const save = () => request(`/workers/saved-jobs/${open.id}`, { cookie, method: "PUT", body: { userId: other.id } });
      assert.equal((await save()).status, 200); assert.equal((await save()).status, 200);
      assert.equal(await prisma.workerSavedJob.count({ where: { userId: worker.id, jobId: open.id } }), 1); assert.equal(await prisma.workerSavedJob.count({ where: { userId: other.id } }), 0);
      assert.equal((await request(`/workers/jobs/${open.slug}`, { cookie })).body.data.saved, true); assert.equal((await request(`/workers/jobs/${open.slug}`, { user: other })).body.data.saved, false);
      assert.equal((await request(`/workers/saved-jobs/${open.id}`, { user: other, method: "DELETE" })).status, 200);
      assert.equal((await request("/workers/saved-jobs", { cookie })).body.data.total, 1);
      assert.equal((await request(`/workers/saved-jobs/${draft.id}`, { cookie, method: "PUT" })).status, 404);
      await prisma.job.update({ where: { id: open.id }, data: { status: "DRAFT", title: "PRIVATE upcoming revised title", description: "PRIVATE internal draft description", compensation: "PRIVATE offer" } });
      const saved = (await request("/workers/saved-jobs", { cookie })).body.data.items[0];
      assert.equal(saved.available, false); assert.equal(saved.slug, null); assert.equal(saved.title, open.title); assert.ok(!JSON.stringify(saved).includes("PRIVATE"));
      assert.equal((await request(`/workers/jobs/${open.slug}`, { cookie })).status, 404);
      assert.equal((await request(`/workers/saved-jobs/${open.id}`, { cookie, method: "DELETE", csrf: false })).status, 403);
      assert.equal((await request(`/workers/saved-jobs/${open.id}`, { cookie, method: "DELETE" })).status, 200); assert.equal((await request("/workers/saved-jobs", { cookie })).body.data.total, 0);
    });
    await t.test("deactivation and changed token versions revoke access without exposing saved profile data", async () => {
      const old = await tokenFor(other, "PASSWORD_RESET", { sessionVersion: -1 });
      assert.equal((await request("/auth/worker/reset-password", { method: "POST", body: { token: old, password } })).status, 400);
      await prisma.user.update({ where: { id: worker.id }, data: { isActive: false } });
      for (const path of ["/workers/workspace", "/workers/profile", "/workers/profile/resume", "/workers/saved-jobs"]) assert.equal((await request(path, { cookie })).status, 401);
      const events = await prisma.auditLog.findMany({ where: { actorUserId: worker.id } }); assert.ok(events.some(event => event.action === "worker.resume_uploaded"));
      for (const secret of [password, registration.email, rawToken(verification.link)]) assert.ok(!JSON.stringify(events).includes(secret));
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    const ids = users.map(user => user.id);
    await prisma.workerSavedJob.deleteMany({ where: { userId: { in: ids } } });
    await prisma.job.deleteMany({ where: { id: { in: jobs.map(job => job.id) } } });
    await prisma.workforceRequirement.deleteMany({ where: { id: { in: requirements } } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
});
