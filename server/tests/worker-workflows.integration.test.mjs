import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { once } from 'node:events';
import { mock, test } from 'node:test';
if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to a dedicated migrated test database.');
Object.assign(process.env, { DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: 'test', REDIS_ENABLED: 'false', JWT_SECRET: 'workflow-test-only-not-a-production-secret', LOG_LEVEL: 'error', API_RATE_LIMIT_MAX: '5000', AUTH_RATE_LIMIT_MAX: '1000' });
mock.module(new URL('../dist/services/worker-email.service.js', import.meta.url).href, { namedExports: { workerEmailConfigured: () => false, sendWorkerAccessEmail: async () => false } });
mock.module(new URL('../dist/services/email.service.js', import.meta.url).href, { namedExports: { recoveryEmailConfigured: () => false, sendBusinessRecoveryEmail: async () => false, sendOperationalEmail: async () => false } });
const { app } = await import('../dist/app.js');
const { prisma } = await import('../dist/config/db.js');
const { signAccessToken } = await import('../dist/utils/jwt.js');
const { istToday, addDays, isoWeekday } = await import('../dist/modules/attendance/attendance.utils.js');
const prefix = `workflow-${randomUUID()}`, users = [], jobs = [], requirements = [];
let server, base, serial = 0;
async function request(path, { user, method = 'GET', body, csrf = true } = {}) {
  const response = await fetch(`${base}/api/v1${path}`, { method, headers: { ...(user ? { Cookie: `zobhunger_access=${signAccessToken({ sub: user.id, role: user.role, version: 0 })}` } : {}), ...(method !== 'GET' && csrf ? { 'X-Requested-With': 'XMLHttpRequest' } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text(); let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; } return { status: response.status, body: parsed, headers: response.headers };
}
function ok(result, status = 200) { assert.equal(result.status, status, JSON.stringify(result.body)); return result.body.data; }
test('P3.4 applications and P3.5 attendance connect trusted workers to operations', async t => {
  try {
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`;
    async function account(role = 'WORKER', verified = true) { const user = await prisma.user.create({ data: { email: `${prefix}-${++serial}@example.test`, passwordHash: 'unused-test-password-hash', role, emailVerifiedAt: verified ? new Date() : null, businessAccessApproved: role === 'BUSINESS' } }); users.push(user); return user; }
    const worker = await account(), other = await account(), unverified = await account('WORKER', false), admin = await account('ADMIN'), business = await account('BUSINESS'), foreignBusiness = await account('BUSINESS');
    const profile = await prisma.workerProfile.create({ data: { userId: worker.id, fullName: 'Asha Executive', phone: '9876543210', city: 'Delhi', state: 'Delhi', skills: ['Retail', 'Customer service'], experienceYears: 2, education: [], workExperience: [], consentAt: new Date() } });
    await prisma.workerProfile.create({ data: { userId: other.id, fullName: 'Other Executive', phone: '9876543211', city: 'Delhi', state: 'Delhi', education: [], workExperience: [] } });
    const cv = Buffer.from('%PDF-1.4\nsubmitted-resume-original\n%%EOF');
    await prisma.workerResume.create({ data: { profileId: profile.id, fileName: 'asha.pdf', mimeType: 'application/pdf', size: cv.length, sha256: createHash('sha256').update(cv).digest('hex'), data: cv } });
    async function job() { const row = await prisma.job.create({ data: { slug: `${prefix}-${++serial}`, title: 'Market Executive', location: 'Delhi', city: 'Delhi', category: 'Sales', engagementType: 'Contract', description: 'Work with local stores', status: 'OPEN', publishedAt: new Date(Date.now() - 1000), isDemo: false } }); jobs.push(row.id); return row; }
    const opening = await job();
    const input = { profileRevision: 0, resumeRevision: 0, includeResume: true, consent: true, message: 'Ready to join the field team', availableFrom: null };
    const apply = (jobId = opening.id, body = input, user = worker) => request(`/workers/jobs/${jobId}/applications`, { user, method: 'POST', body });
    const bp = await prisma.businessProfile.create({ data: { userId: business.id, companyName: 'Test Retail', contactPerson: 'Test Lead' } });
    const req = await prisma.workforceRequirement.create({ data: { businessProfileId: bp.id, submittedByUserId: business.id, companyName: 'Test Retail', contactPerson: 'Test Lead', businessEmail: business.email, mobileNumber: '9876543210', industry: 'Retail', serviceRequired: 'Workforce', workforceCount: 5, jobLocation: 'Delhi', projectDuration: '3 months', details: 'Ground operations', status: 'QUALIFIED' } }); requirements.push(req.id);
    const share = applicationId => request('/admin/candidate-management', { user: admin, method: 'POST', body: { applicationId, requirementId: req.id, summary: 'Suitable retail experience for the field role', skills: ['Retail'] } });
    let applicationId, candidateId, assignmentId;
    const today = istToday(), date = addDays(today, -3);
    const setup = { location: 'Delhi Central', supervisor: 'Field supervisor', startDate: addDays(today, -20), endDate: addDays(today, 20), shiftStart: '09:00', shiftEnd: '18:00', graceMinutes: 10, workingDays: [1, 2, 3, 4, 5, 6, 7] };
    const createAssignment = candidateId => request('/admin/attendance/assignments', { user: admin, method: 'POST', body: { ...setup, candidateId } });
    await t.test('all modules require correct verified account and write headers', async () => {
      for (const path of ['/workers/applications', '/workers/assignments', '/workers/attendance']) {
        assert.equal((await request(path)).status, 401); assert.equal((await request(path, { user: business })).status, 403); assert.equal((await request(path, { user: unverified })).status, 403);
      }
      assert.equal((await request('/admin/worker-applications', { user: worker })).status, 403);
      assert.equal((await request('/admin/worker-attendance', { user: business })).status, 403);
      assert.equal((await request(`/workers/jobs/${opening.id}/applications`, { user: worker, method: 'POST', body: input, csrf: false })).status, 403);
      assert.equal((await apply(opening.id, { ...input, workerUserId: other.id })).status, 400);
      assert.equal((await apply(opening.id, { ...input, profileRevision: 9 })).status, 409);
      assert.equal((await apply(opening.id, { ...input, consent: false })).status, 400);
    });
    await t.test('double submit makes one account-owned immutable application and CV snapshot', async () => {
      const responses = await Promise.all([apply(), apply()]); assert.deepEqual(responses.map(r => r.status).sort(), [200, 201]); applicationId = responses[0].body.data.id; assert.equal(responses[1].body.data.id, applicationId);
      const detail = ok(await request(`/workers/applications/${applicationId}`, { user: worker })); assert.equal(detail.application.stage, 'SUBMITTED'); assert.equal(detail.history.total, 1); assert.deepEqual(detail.profile.skills, ['Retail', 'Customer service']);
      await prisma.workerProfile.update({ where: { id: profile.id }, data: { fullName: 'Updated name', skills: ['Changed skill'], revision: { increment: 1 } } });
      await prisma.workerResume.delete({ where: { profileId: profile.id } });
      const download = await request(`/workers/applications/${applicationId}/resume`, { user: worker }); assert.equal(download.status, 200); assert.equal(download.body, cv.toString()); assert.equal(download.headers.get('cache-control'), 'no-store'); assert.match(download.headers.get('content-disposition'), /attachment/);
      assert.equal(ok(await request(`/workers/applications/${applicationId}`, { user: worker })).application.name, 'Asha Executive');
      for (const suffix of ['', '/resume']) assert.equal((await request(`/workers/applications/${applicationId}${suffix}`, { user: other })).status, 404);
      assert.equal(ok(await request('/workers/applications', { user: other })).total, 0);
      assert.equal(ok(await request(`/workers/jobs/${opening.slug}`, { user: worker })).applicationId, applicationId);
      await prisma.job.update({ where: { id: opening.id }, data: { status: 'CLOSED' } }); assert.equal(ok(await apply()).id, applicationId);
      assert.equal((await apply(opening.id, { ...input, includeResume: false }, other)).status, 404);
      await prisma.job.update({ where: { id: opening.id }, data: { status: 'OPEN' } });
    });
    await t.test('legacy email-only submissions do not grant account ownership', async () => {
      const old = await job(); await prisma.jobApplication.create({ data: { jobId: old.id, name: 'Legacy', email: worker.email, phone: '9876543210' } });
      assert.equal((await apply(old.id, { ...input, profileRevision: 1, includeResume: false })).status, 409);
      assert.equal(ok(await request('/workers/applications', { user: worker })).total, 1);
    });
    await t.test('operations and business reviews publish safe updates and protect submitted CVs', async () => {
      ok(await request(`/admin/worker-applications/${applicationId}/review`, { user: admin, method: 'POST', body: { revision: 0, status: 'REVIEWED', workerMessage: 'We are reviewing your profile.' } }));
      candidateId = ok(await share(applicationId), 201).id;
      const options = ok(await request('/admin/candidate-management/applications', { user: admin })).items.find(row => row.id === applicationId); assert.deepEqual(options.skills, ['Retail', 'Customer service']); assert.equal(options.hasPrivateResume, true);
      assert.equal((await request(`/business/candidates/${candidateId}/resume`, { user: business })).body, cv.toString()); assert.equal((await request(`/business/candidates/${candidateId}/resume`, { user: foreignBusiness })).status, 404);
      ok(await request(`/business/candidates/${candidateId}/reviews`, { user: business, method: 'POST', body: { action: 'INTERVIEW', revision: 0, note: 'PRIVATE business feedback', interviewAt: new Date(Date.now() + 3600000).toISOString(), interviewMode: 'PHONE', interviewDetails: 'PRIVATE coordination phone', workerMessage: 'Please keep your phone available.' } }));
      const detail = ok(await request(`/workers/applications/${applicationId}`, { user: worker })); assert.equal(detail.application.stage, 'INTERVIEW_REQUESTED'); assert.match(JSON.stringify(detail), /Please keep your phone available/); assert.doesNotMatch(JSON.stringify(detail), /PRIVATE/);
      ok(await request(`/business/candidates/${candidateId}/reviews`, { user: business, method: 'POST', body: { action: 'STATUS', revision: 1, status: 'SELECTED', note: 'PRIVATE selected decision', workerMessage: 'Selected; operations will confirm your shift.' } }));
      assert.equal(ok(await request(`/workers/applications?status=SELECTED`, { user: worker })).total, 1);
      assert.equal((await request(`/admin/applications/${applicationId}/status`, { user: admin, method: 'PATCH', body: { status: 'REJECTED' } })).status, 409);
      assignmentId = ok(await createAssignment(candidateId), 201).id;
      assert.equal(ok(await request(`/workers/applications/${applicationId}`, { user: worker })).application.stage, 'ASSIGNED');
      assert.equal((await request(`/workers/applications/${applicationId}/withdraw`, { user: worker, method: 'POST', body: { revision: 1, reason: 'Not available', confirm: true } })).status, 409);
    });
    await t.test('withdrawal revokes business access and blocks all further progression', async () => {
      const opening2 = await job(); const id = ok(await apply(opening2.id, { ...input, profileRevision: 1, includeResume: false }), 201).id; const shared = ok(await share(id), 201).id;
      ok(await request(`/workers/applications/${id}/withdraw`, { user: worker, method: 'POST', body: { revision: 0, reason: 'Taking another opportunity', confirm: true } }));
      assert.equal(ok(await request(`/workers/applications/${id}`, { user: worker })).application.stage, 'WITHDRAWN');
      assert.equal((await share(id)).status, 409); assert.equal((await createAssignment(shared)).status, 409);
      assert.equal((await request(`/admin/applications/${id}/status`, { user: admin, method: 'PATCH', body: { status: 'REVIEWED' } })).status, 409);
      assert.equal((await request(`/business/candidates/${shared}`, { user: business })).status, 404);
      assert.equal(ok(await apply(opening2.id, { ...input, profileRevision: 1, includeResume: false })).id, id);
    });
    const entry = { requestKey: randomUUID(), date, kind: 'SUBMISSION', assignmentRevision: 0, recordRevision: null, recordApprovalRevision: null, attendanceStatus: 'PRESENT', checkInAt: `${date}T09:05:00+05:30`, checkOutAt: `${date}T18:00:00+05:30`, breakMinutes: 30, reason: 'Completed assigned visits', confirm: true };
    const submit = (body = entry, user = worker, id = assignmentId) => request(`/workers/assignments/${id}/attendance`, { user, method: 'POST', body });
    const day = async () => ok(await request(`/workers/assignments/${assignmentId}?date=${date}`, { user: worker }));
    const decide = (id, decision = 'APPROVE', revision = 0) => request(`/admin/worker-attendance/${id}/review`, { user: admin, method: 'POST', body: { revision, decision, reviewNote: 'Checked with the field supervisor' } });
    let attendanceRequestId, recordId;
    await t.test('assignment schedule and attendance are isolated by worker ID, with bounded IST dates', async () => {
      assert.equal(ok(await request('/workers/assignments', { user: other })).total, 0);
      for (const suffix of ['', '/calendar']) assert.equal((await request(`/workers/assignments/${assignmentId}${suffix}`, { user: other })).status, 404);
      const result = await day(); assert.equal(result.assignment.schedule.length, 7); assert.equal(result.status, 'NOT_RECORDED'); assert.equal(result.record, null);
      const month = ok(await request(`/workers/assignments/${assignmentId}/calendar?month=2024-02`, { user: worker })); assert.equal(month.days.length, 29); assert.ok(month.days.every(item => item.status === 'NOT_ASSIGNED'));
      assert.equal((await submit(entry, other)).status, 404); assert.equal((await submit({ ...entry, workerUserId: other.id })).status, 400);
      for (const override of [{ assignmentRevision: 2 }, { date: addDays(today, 100) }]) assert.equal((await submit({ ...entry, ...override })).status, 409);
      assert.equal((await submit({ ...entry, date: addDays(today, 1) })).status, 400); assert.equal((await submit({ ...entry, checkOutAt: null })).status, 400);
    });
    await t.test('retry is idempotent, pending submission leaves official attendance unchanged', async () => {
      const responses = await Promise.all([submit(), submit()]); assert.deepEqual(responses.map(r => r.status).sort(), [200, 201]); attendanceRequestId = responses[0].body.data.id;
      assert.equal(await prisma.attendanceRecord.count({ where: { assignmentId } }), 0); assert.equal((await day()).pending.id, attendanceRequestId);
      assert.equal((await submit({ ...entry, reason: 'Changed retry payload' })).status, 409);
      assert.equal((await submit({ ...entry, requestKey: randomUUID() })).status, 409);
      assert.equal((await request(`/admin/attendance/assignments/${assignmentId}/cancel`, { user: admin, method: 'POST', body: { revision: 0, note: 'Do not erase pending history' } })).status, 409);
      assert.equal(ok(await request('/workers/attendance', { user: other })).total, 0);
      assert.equal(ok(await request('/admin/worker-attendance?status=PENDING', { user: admin })).items.some(row => row.id === attendanceRequestId), true);
    });
    await t.test('operations approves once and business approval remains a separate step', async () => {
      const pair = await Promise.all([decide(attendanceRequestId), decide(attendanceRequestId)]); assert.deepEqual(pair.map(r => r.status).sort(), [200, 409]);
      const result = await day(); assert.equal(result.pending, null); assert.equal(result.record.approvalStatus, 'PENDING'); assert.equal(result.record.workedMinutes, 505); recordId = result.record.id;
      const record = result.record;
      ok(await request(`/business/attendance-approvals/${recordId}/decision`, { user: business, method: 'POST', body: { revision: record.revision, approvalRevision: record.approvalRevision, action: 'APPROVED', note: 'Confirmed the completed shift' } }));
      assert.equal((await day()).record.approvalStatus, 'APPROVED'); assert.doesNotMatch(JSON.stringify(await day()), /Confirmed the completed shift/);
    });
    await t.test('corrections preserve approved record until reviewed; stale requests cannot overwrite', async () => {
      let record = (await day()).record;
      const correction = { ...entry, requestKey: randomUUID(), kind: 'CORRECTION', recordRevision: record.revision, recordApprovalRevision: record.approvalRevision, checkOutAt: `${date}T18:10:00+05:30`, reason: 'Final store visit ended ten minutes later' };
      const first = ok(await submit(correction), 201).id; assert.equal((await day()).record.approvalStatus, 'APPROVED');
      ok(await request(`/admin/attendance/assignments/${assignmentId}/records`, { user: admin, method: 'PUT', body: { date, revision: record.revision, status: 'PRESENT', checkInAt: entry.checkInAt, checkOutAt: entry.checkOutAt, breakMinutes: 30, note: 'PRIVATE admin corrected record' } }));
      assert.equal((await decide(first)).status, 409); ok(await decide(first, 'REJECT'));
      record = (await day()).record;
      const second = ok(await submit({ ...correction, requestKey: randomUUID(), recordRevision: record.revision, recordApprovalRevision: record.approvalRevision }), 201).id;
      ok(await decide(second)); const result = await day(); assert.equal(result.record.workedMinutes, 515); assert.equal(result.record.approvalStatus, 'PENDING'); assert.equal(result.history.total, 3); assert.doesNotMatch(JSON.stringify(result), /PRIVATE/);
    });
    await t.test('scheduled-off and overnight shifts have explicit time boundaries', async () => {
      const opening3 = await job(); const id = ok(await apply(opening3.id, { ...input, profileRevision: 1, includeResume: false }), 201).id;
      const candidate = ok(await share(id), 201).id;
      ok(await request(`/business/candidates/${candidate}/reviews`, { user: business, method: 'POST', body: { action: 'STATUS', revision: 0, status: 'SELECTED', note: 'Night team selection' } }));
      const night = ok(await request('/admin/attendance/assignments', { user: admin, method: 'POST', body: { ...setup, candidateId: candidate, shiftStart: '22:00', shiftEnd: '06:00', workingDays: [isoWeekday(date)] } }), 201).id;
      assert.equal((await submit({ ...entry, requestKey: randomUUID(), date: addDays(date, -1) }, worker, night)).status, 400);
      const nightRequest = ok(await submit({ ...entry, requestKey: randomUUID(), checkInAt: `${date}T22:00:00+05:30`, checkOutAt: `${addDays(date, 1)}T06:00:00+05:30` }, worker, night), 201).id;
      ok(await decide(nightRequest)); const result = ok(await request(`/workers/assignments/${night}?date=${date}`, { user: worker })); assert.equal(result.record.workedMinutes, 450);
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    const own = { requirementId: { in: requirements } };
    await prisma.workerAttendanceRequest.deleteMany({ where: { workerUserId: { in: users.map(u => u.id) } } });
    await prisma.attendanceCorrection.deleteMany({ where: { assignment: own } }); await prisma.attendanceRecord.deleteMany({ where: { assignment: own } }); await prisma.workforceAssignment.deleteMany({ where: own });
    await prisma.businessCandidate.deleteMany({ where: own }); await prisma.jobApplication.deleteMany({ where: { jobId: { in: jobs } } }); await prisma.job.deleteMany({ where: { id: { in: jobs } } });
    await prisma.workforceRequirement.deleteMany({ where: { id: { in: requirements } } }); await prisma.businessProfile.deleteMany({ where: { userId: { in: users.map(u => u.id) } } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: users.map(u => u.id) } } }); await prisma.user.deleteMany({ where: { id: { in: users.map(u => u.id) } } }); await prisma.$disconnect();
  }
});
