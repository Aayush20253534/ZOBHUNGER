import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mock, test } from "node:test";

if (!process.env.TEST_DATABASE_URL) throw new Error("Use TEST_DATABASE_URL for a dedicated migrated test database. Temporary fixtures are created and removed.");
Object.assign(process.env, { DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: "test", REDIS_ENABLED: "false", LOG_LEVEL: "error", JWT_SECRET: "phase2-integration-only-secret-at-least-32-characters", CLIENT_ORIGIN: "http://localhost:3000", PUBLIC_APP_URL: "http://localhost:3000", API_RATE_LIMIT_MAX: "10000", SUBMISSION_RATE_LIMIT_MAX: "1000" });
mock.module(new URL("../dist/services/email.service.js", import.meta.url).href, { namedExports: { recoveryEmailConfigured: () => false, sendBusinessRecoveryEmail: async () => false, sendOperationalEmail: async () => false } });
const { app } = await import("../dist/app.js"), { prisma } = await import("../dist/config/db.js"), { signAccessToken } = await import("../dist/utils/jwt.js");
const { istToday, addDays } = await import("../dist/modules/attendance/attendance.utils.js");
const { csvCell } = await import("../dist/modules/phase2/reports.service.js");
const { createJobApplication } = await import("../dist/modules/jobs/jobs.repository.js");
const { createPlacementOpportunityApplication } = await import("../dist/modules/placement-cells/placement-opportunities.repository.js");
const prefix = `phase2-${randomUUID()}`, users = [], reqIds = [], jobIds = [];
let server, base;
async function request(path, user, method = "GET", body, csrf = true) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(user ? { Cookie: `zobhunger_access=${signAccessToken({ sub: user.id, role: user.role, version: 0 })}` } : {}), ...(body ? { "Content-Type": "application/json", ...(csrf ? { "X-Requested-With": "XMLHttpRequest" } : {}) } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const raw = await response.text(); return { status: response.status, body: response.headers.get("content-type")?.includes("json") ? JSON.parse(raw) : raw, headers: response.headers };
}
async function ok(path, user, method, body) { const result = await request(path, user, method, body); assert.ok(result.status >= 200 && result.status < 300, `${path}: ${result.status} ${JSON.stringify(result.body)}`); return result.body.data; }

test("Phase 2 complete business-to-operations workflow", async t => {
  try {
    server = app.listen(0, "127.0.0.1"); await once(server, "listening"); base = `http://127.0.0.1:${server.address().port}/api/v1`;
    for (const role of ["BUSINESS", "BUSINESS", "ADMIN", "WORKER"]) users.push(await prisma.user.create({ data: { email: `${prefix}-${users.length}@example.test`, role, passwordHash: "unused" } }));
    const [a, b, admin, worker] = users;
    const pa = await prisma.businessProfile.create({ data: { userId: a.id, companyName: "Alpha Retail", contactPerson: "Alpha Owner" } });
    const pb = await prisma.businessProfile.create({ data: { userId: b.id, companyName: "Other Private Company", contactPerson: "Other Owner" } });
    const today = istToday(), day = addDays(today, -2), draftId = randomUUID();
    const brief = { companyName: "Alpha Retail", contactPerson: "Alpha Owner", businessEmail: a.email, mobileNumber: "9876543210", industry: "Retail", serviceRequired: "Workforce", workforceCount: 2, locations: ["Delhi"], projectDuration: "Three months", expectedStartAt: null, details: "PRIVATE BUSINESS BRIEF: recruit market executives.", requestKey: randomUUID() };
    const foreign = await prisma.workforceRequirement.create({ data: { ...Object.fromEntries(Object.entries(brief).filter(([key]) => key !== "requestKey")), companyName: "Other Private Company", jobLocation: "Delhi", businessProfileId: pb.id, submittedByUserId: a.id } }); reqIds.push(foreign.id);
    let reqId, job, candidateId, assignmentId, recordId;
    const publicJob = { title: "Market Executive - Delhi", city: "Delhi", state: "Delhi", location: "Delhi Central", category: "Field sales", engagementType: "Contract", description: "Visit local retailers, explain approved services and record daily field outcomes.", compensation: "Discussed during interview", responsibilities: ["Visit assigned retailers"], requirements: ["Clear communication"] };
    await t.test("private endpoints enforce sessions, roles, write headers and strict filters", async () => {
      for (const path of ["/business/requirement-drafts", "/business/attendance-approvals", "/business/reports", "/business/reports/export", "/business/operations-summary", "/business/requirements/missing/jobs"]) {
        assert.equal((await request(path)).status, 401); assert.equal((await request(path, worker)).status, 403); assert.equal((await request(path, admin)).status, 403);
      }
      for (const path of ["/admin/requirement-jobs", "/admin/attendance-approvals", "/admin/reports"]) assert.equal((await request(path, a)).status, 403);
      assert.equal((await request(`/business/requirement-drafts/${draftId}`, a, "PUT", { revision: null, data: {} }, false)).status, 403);
      assert.equal((await request("/business/not-implemented")).status, 404);
      for (const filter of ["from=2026-02-30", "from=2001-01-01", `to=${addDays(today, 1)}`, "userId=other", "page=100001", "type=payroll"]) assert.equal((await request(`/business/reports?${filter}`, a)).status, 400);
    });
    await t.test("incomplete drafts save privately, reject stale edits and do not submit requirements", async () => {
      const saved = await ok(`/business/requirement-drafts/${draftId}`, a, "PUT", { revision: null, data: { companyName: "Alpha", workforceCount: null, businessEmail: "unfinished" } });
      assert.equal(saved.revision, 0); assert.equal(saved.data.workforceCount, null);
      assert.equal((await ok("/business/requirement-drafts", a)).total, 1); assert.equal((await ok("/business/requirement-drafts", b)).total, 0);
      assert.equal((await request(`/business/requirement-drafts/${draftId}`, b)).status, 404);
      assert.equal((await request(`/business/requirement-drafts/${draftId}`, b, "DELETE", { revision: 0 })).status, 404);
      assert.equal((await ok("/business/dashboard", a)).summary.totalRequirements, 0);
      assert.equal((await request(`/business/requirement-drafts/${draftId}/submit`, a, "POST", { revision: 0, brief: { requestKey: randomUUID() } })).status, 400);
      assert.equal((await ok(`/business/requirement-drafts/${draftId}`, a)).revision, 0);
      await ok(`/business/requirement-drafts/${draftId}`, a, "PUT", { revision: 0, data: { ...saved.data, details: "Draft resumed" } });
      assert.equal((await request(`/business/requirement-drafts/${draftId}`, a, "PUT", { revision: 0, data: saved.data })).status, 409);
      const extra = randomUUID(); await ok(`/business/requirement-drafts/${extra}`, a, "PUT", { revision: null, data: {} });
      await ok(`/business/requirement-drafts/${extra}`, a, "DELETE", { revision: 0 }); assert.equal((await request(`/business/requirement-drafts/${extra}`, a)).status, 404);
    });
    await t.test("draft submission retries create one owned requirement and a recoverable receipt", async () => {
      const results = await Promise.all([request(`/business/requirement-drafts/${draftId}/submit`, a, "POST", { revision: 1, brief }), request(`/business/requirement-drafts/${draftId}/submit`, a, "POST", { revision: 1, brief })]);
      assert.deepEqual(results.map(r => r.status).sort(), [200, 201]); reqId = results[0].body.data.id; reqIds.push(reqId);
      assert.equal(results[1].body.data.id, reqId); assert.equal((await ok("/business/requirement-drafts", a)).total, 0);
      assert.equal((await ok(`/business/requirement-drafts/${draftId}`, a)).submittedRequirementId, reqId);
      assert.equal((await request(`/business/requirement-drafts/${draftId}`, a, "PUT", { revision: 2, data: {} })).status, 409);
      assert.equal((await prisma.workforceRequirement.findUnique({ where: { id: reqId } })).businessProfileId, pa.id);
      assert.equal((await ok("/business/dashboard", a)).summary.totalRequirements, 1);
    });
    await t.test("only reviewed briefs create linked drafts; publishing is explicit and versioned", async () => {
      const create = { ...publicJob, requestKey: randomUUID(), requirementRevision: 0 };
      assert.equal((await request(`/admin/requirement-jobs/${reqId}/jobs`, admin, "POST", create)).status, 409);
      await ok(`/admin/requirement-jobs/${reqId}/qualify`, admin, "POST", { revision: 0 });
      assert.equal((await request(`/admin/requirement-jobs/${reqId}/qualify`, admin, "POST", { revision: 0 })).status, 409);
      create.requirementRevision = 1; const created = await ok(`/admin/requirement-jobs/${reqId}/jobs`, admin, "POST", create); jobIds.push(created.id);
      assert.equal((await ok(`/admin/requirement-jobs/${reqId}/jobs`, admin, "POST", create)).id, created.id);
      job = await prisma.job.findUnique({ where: { id: created.id } }); assert.equal(job.status, "DRAFT"); assert.equal(job.isDemo, false); assert.equal(job.requirementId, reqId);
      assert.equal((await request(`/jobs/${job.slug}`)).status, 404);
      await ok(`/admin/requirement-jobs/jobs/${job.id}/status`, admin, "POST", { revision: 0, status: "OPEN" });
      assert.equal((await request(`/admin/requirement-jobs/jobs/${job.id}/status`, admin, "POST", { revision: 0, status: "CLOSED" })).status, 409);
      const visible = await ok(`/jobs/${job.slug}`); assert.equal(visible.title, publicJob.title); assert.ok(!JSON.stringify(visible).includes("PRIVATE BUSINESS BRIEF")); assert.ok(!("requirementId" in visible));
      assert.equal((await request(`/business/requirements/${reqId}/jobs`, b)).status, 404); assert.equal((await request(`/business/requirements/${foreign.id}/jobs`, a)).status, 404);
    });
    await t.test("a public application stays linked through candidate selection and deployment", async () => {
      const applied = await ok(`/jobs/${job.id}/applications`, undefined, "POST", { fullName: "Field Executive", email: `${prefix}-candidate@example.test`, phone: "9876543210", currentLocation: "Delhi", experience: "Retail field sales" });
      const body = { requirementId: reqId, applicationId: applied.id, summary: "Reviewed field sales experience and communication skills", skills: ["Retail sales"] };
      assert.equal((await request("/admin/candidate-management", admin, "POST", { ...body, requirementId: foreign.id })).status, 409);
      assert.ok(!(await ok(`/admin/candidate-management/applications?requirementId=${foreign.id}`, admin)).items.some(item => item.id === applied.id));
      candidateId = (await ok("/admin/candidate-management", admin, "POST", body)).id;
      await ok(`/business/candidates/${candidateId}/reviews`, a, "POST", { action: "STATUS", status: "SELECTED", revision: 0, note: "Selected after reviewing the profile" });
      assignmentId = (await ok("/admin/deployments/assignments", admin, "POST", { candidateId, location: "Delhi Central", supervisor: "Site Lead", startDate: day, endDate: today, shiftStart: "09:00", shiftEnd: "18:00", graceMinutes: 10, workingDays: [1, 2, 3, 4, 5, 6, 7] })).id;
      recordId = (await ok(`/admin/attendance/assignments/${assignmentId}/records`, admin, "PUT", { date: day, revision: null, status: "PRESENT", checkInAt: `${day}T09:00:00+05:30`, checkOutAt: null, breakMinutes: 0, note: "Checked in at the site" })).id;
      const decision = { revision: 0, approvalRevision: 0, action: "APPROVED", note: "Business reviewed the shift" };
      assert.equal((await request(`/business/attendance-approvals/${recordId}/decision`, b, "POST", decision)).status, 404);
      assert.equal((await request(`/business/attendance-approvals/${recordId}/decision`, admin, "POST", decision)).status, 403);
      assert.equal((await request(`/business/attendance-approvals/${recordId}/decision`, a, "POST", decision)).body.error.code, "SHIFT_NOT_COMPLETE");
    });
    const values = () => ({ status: "PRESENT", checkInAt: `${day}T09:00:00+05:30`, checkOutAt: `${day}T18:00:00+05:30`, breakMinutes: 30, note: "Full shift verified against site register" });
    await t.test("changes requested create a correction and only the revised record can be approved", async () => {
      await ok(`/admin/attendance/assignments/${assignmentId}/records`, admin, "PUT", { date: day, revision: 0, ...values() });
      await ok(`/business/attendance-approvals/${recordId}/decision`, a, "POST", { revision: 1, approvalRevision: 0, action: "CHANGES_REQUESTED", note: "Please check the recorded break duration" });
      const detail = await ok(`/business/attendance-approvals/${recordId}`, a); assert.equal(detail.record.approvalStatus, "CHANGES_REQUESTED"); assert.ok(detail.correction.id);
      assert.equal(detail.history.items[0].snapshot.workedMinutes, 510);
      assert.equal((await request(`/business/attendance-approvals/${recordId}/decision`, a, "POST", { revision: 1, approvalRevision: 1, action: "APPROVED", note: "Must resolve the correction first" })).status, 409);
      await ok(`/admin/attendance/corrections/${detail.correction.id}/resolve`, admin, "POST", { action: "RESOLVE", resolution: "Break confirmed as one hour", attendance: { ...values(), breakMinutes: 60, revision: 1 } });
      const current = (await ok(`/business/attendance-approvals/${recordId}`, a)).record; assert.equal(current.approvalStatus, "PENDING"); assert.equal(current.workedMinutes, 480);
      const decision = { revision: current.revision, approvalRevision: current.approvalRevision, action: "APPROVED", note: "Reviewed the corrected full shift" };
      const results = await Promise.all([request(`/business/attendance-approvals/${recordId}/decision`, a, "POST", decision), request(`/business/attendance-approvals/${recordId}/decision`, a, "POST", decision)]); assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
      const approved = await ok(`/business/attendance-approvals/${recordId}`, a); assert.equal(approved.record.approvalStatus, "APPROVED"); assert.equal(approved.history.total, 3);
      assert.equal((await request(`/business/attendance-approvals/${recordId}`, b)).status, 404);
      assert.ok(!JSON.stringify(approved).includes('"actorUserId"')); assert.ok(!JSON.stringify(approved).includes('"applicationId"'));
    });
    await t.test("new corrections and edits invalidate approval without rewriting prior decisions", async () => {
      const correction = await ok(`/business/attendance/assignments/${assignmentId}/corrections`, a, "POST", { date: day, recordRevision: 2, reason: "Recheck the supervisor confirmation" });
      let detail = await ok(`/business/attendance-approvals/${recordId}`, a); assert.equal(detail.record.approvalStatus, "PENDING");
      assert.equal((await request(`/business/attendance-approvals/${recordId}/decision`, a, "POST", { revision: 2, approvalRevision: detail.record.approvalRevision, action: "APPROVED", note: "Cannot skip an open correction" })).body.error.code, "CORRECTION_ALREADY_OPEN");
      await ok(`/admin/attendance/corrections/${correction.id}/resolve`, admin, "POST", { action: "REJECT", resolution: "Supervisor confirmed the original entry" });
      await ok(`/business/attendance-approvals/${recordId}/decision`, a, "POST", { revision: 2, approvalRevision: detail.record.approvalRevision, action: "APPROVED", note: "Reviewed supervisor confirmation" });
      await ok(`/admin/attendance/assignments/${assignmentId}/records`, admin, "PUT", { date: day, ...values(), revision: 2, breakMinutes: 45 });
      detail = await ok(`/business/attendance-approvals/${recordId}`, a); assert.equal(detail.record.approvalStatus, "PENDING"); assert.equal(detail.record.workedMinutes, 495);
      assert.ok(detail.history.items.filter(x => x.action === "APPROVED").every(x => x.snapshot.workedMinutes === 480));
      const queue = await ok(`/business/attendance-approvals?from=${day}&to=${today}&location=Delhi`, a); assert.equal(queue.counts.PENDING, 1); assert.equal(queue.approvedMinutes, 0);
      await ok(`/business/attendance-approvals/${recordId}/decision`, a, "POST", { revision: detail.record.revision, approvalRevision: detail.record.approvalRevision, action: "APPROVED", note: "Approved the final corrected shift" });
    });
    await t.test("reports use owned data, correct dates, missing days and approved minutes", async () => {
      const filters = `from=${day}&to=${today}`;
      for (const type of ["requirements", "candidates", "deployments", "attendance"]) {
        const response = await request(`/business/reports?${filters}&type=${type}`, a); assert.equal(response.status, 200, JSON.stringify(response.body)); assert.equal(response.headers.get("cache-control"), "no-store");
        assert.equal(response.body.data.total, 1); assert.ok(!JSON.stringify(response.body).includes("Other Private Company"));
        assert.equal((await request(`/business/reports?${filters}&type=${type}&requirementId=${foreign.id}`, a)).status, 404);
      }
      const report = await ok(`/business/reports?${filters}&type=attendance`, a);
      assert.equal(report.rows[0].minutes, 495); assert.equal(report.rows[0].approval, "APPROVED"); assert.equal(report.rows[0].checkIn, `${day} 09:00`);
      assert.equal(report.charts.attendance[0].approvedMinutes, 495); assert.equal(report.charts.trend.reduce((n, d) => n + d.missing, 0), 2); assert.equal(report.charts.trend.reduce((n, d) => n + d.expected, 0), 3);
      assert.equal((await ok(`/business/reports?${filters}&type=attendance&location=other`, a)).total, 0);
      for (const location of ["%", "_", "' OR 1=1 --"]) assert.equal((await ok(`/business/reports?${filters}&type=attendance&location=${encodeURIComponent(location)}`, a)).total, 0);
      const summary = await ok("/business/operations-summary", a); assert.equal(summary.active, 1); assert.equal(summary.approvals, 0); assert.equal(summary.jobs, 1); assert.equal(summary.drafts, 0); assert.equal(summary.candidates[0].status, "SELECTED");
      assert.equal((await ok(`/admin/reports?${filters}`, admin)).total, 2);
    });
    await t.test("CSV and print include full filtered data and escape spreadsheet formulas", async () => {
      await prisma.workforceAssignment.update({ where: { id: assignmentId }, data: { supervisor: '=HYPERLINK("bad","link")' } });
      const csv = await request(`/business/reports/export?from=${day}&to=${today}&type=deployments`, a); assert.equal(csv.status, 200); assert.ok(csv.headers.get("content-disposition").includes("attachment"));
      assert.ok(csv.body.includes(`"'=HYPERLINK(""bad"",""link"")"`)); assert.ok(!csv.body.includes("Other Private Company"));
      for (const formula of ["=1+2", "+SUM(1)", "-1+2", "@SUM(1)", "\t =1"]) assert.ok(csvCell(formula).startsWith('"\''));
      assert.equal(csvCell('a,"b"'), '"a,""b"""'); assert.equal(csvCell(42), "42");
      for (let i = 0; i < 13; i++) { const r = await prisma.workforceRequirement.create({ data: { ...Object.fromEntries(Object.entries(brief).filter(([key]) => key !== "requestKey")), jobLocation: "Delhi", businessProfileId: pa.id } }); reqIds.push(r.id); }
      const one = await ok(`/business/reports?from=${day}&to=${today}`, a), two = await ok(`/business/reports?from=${day}&to=${today}&page=2`, a);
      assert.equal(one.rows.length, 12); assert.equal(two.rows.length, 2); assert.equal(new Set([...one.rows, ...two.rows].map(x => x.id)).size, 14);
      const print = await ok(`/business/reports/print?from=${day}&to=${today}&page=2`, a); assert.equal(print.rows.length, 14); assert.equal(print.page, 1);
      const all = await request(`/business/reports/export?from=${day}&to=${today}&page=2`, a); assert.equal(all.body.trim().split("\r\n").length, 15);
    });
    await t.test("large exports fail explicitly rather than silently dropping rows", async () => {
      const ids = Array.from({ length: 10001 }, (_, i) => `${prefix}-limit-${i}`); reqIds.push(...ids);
      const template = Object.fromEntries(Object.entries(brief).filter(([key]) => key !== "requestKey"));
      try {
        await prisma.workforceRequirement.createMany({ data: ids.map(id => ({ ...template, id, jobLocation: "Export Limit Site", locations: ["Export Limit Site"], businessProfileId: pa.id })) });
        for (const mode of ["print", "export"]) {
          const result = await request(`/business/reports/${mode}?location=Export%20Limit%20Site`, a);
          assert.equal(result.status, 413, JSON.stringify(result.body)); assert.equal(result.body.error.code, "REPORT_TOO_LARGE");
        }
        assert.equal((await ok("/business/reports?location=Export%20Limit%20Site", a)).rows.length, 12);
      } finally { await prisma.workforceRequirement.deleteMany({ where: { id: { in: ids } } }); }
    });
    await t.test("job editing resets publication; requirement edits close openings and reject applications", async () => {
      await ok(`/admin/requirement-jobs/jobs/${job.id}`, admin, "PUT", { ...publicJob, title: "Updated Field Executive", revision: 1 });
      assert.equal((await request(`/jobs/${job.slug}`)).status, 404);
      await ok(`/admin/requirement-jobs/jobs/${job.id}/status`, admin, "POST", { status: "OPEN", revision: 2 });
      const editBrief = Object.fromEntries(Object.entries(brief).filter(([key]) => key !== "requestKey"));
      await ok(`/business/requirements/${reqId}`, a, "PUT", { ...editBrief, details: "Changed work description for the next team", revision: 1 });
      const closed = await prisma.job.findUnique({ where: { id: job.id } }); assert.equal(closed.status, "CLOSED"); assert.equal(closed.revision, 4);
      assert.equal((await request(`/jobs/${job.slug}`)).status, 404);
      assert.equal((await request(`/admin/requirement-jobs/jobs/${job.id}/status`, admin, "POST", { status: "OPEN", revision: 4 })).status, 409);
      await assert.rejects(createJobApplication(job.id, { fullName: "Late applicant", email: `${prefix}-late@example.test`, phone: "9876543210", currentLocation: "Delhi" }), error => error.code === "JOB_NOT_FOUND");
      await assert.rejects(createPlacementOpportunityApplication({ jobId: job.id, placementCandidateId: "unused", placementCellApplicationId: "unused", name: "Late student", email: "late@example.test", phone: "9876543210", city: "Delhi" }), error => error.code === "JOB_NOT_FOUND");
      assert.equal((await ok("/business/operations-summary", a)).jobs, 0);
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    const assignment = { requirementId: { in: reqIds } }, ownerIds = users.map(u => u.id);
    await prisma.attendanceCorrection.deleteMany({ where: { assignment } }); await prisma.attendanceRecord.deleteMany({ where: { assignment } });
    await prisma.workforceAssignment.deleteMany({ where: assignment }); await prisma.businessCandidate.deleteMany({ where: assignment });
    await prisma.jobApplication.deleteMany({ where: { jobId: { in: jobIds } } }); await prisma.job.deleteMany({ where: { id: { in: jobIds } } });
    await prisma.requirementDraft.deleteMany({ where: { userId: { in: ownerIds } } }); await prisma.workforceRequirement.deleteMany({ where: { id: { in: reqIds } } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: ownerIds } } }); await prisma.businessProfile.deleteMany({ where: { userId: { in: ownerIds } } }); await prisma.user.deleteMany({ where: { id: { in: ownerIds } } }); await prisma.$disconnect();
  }
});
