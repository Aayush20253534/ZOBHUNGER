import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mock, test } from 'node:test';
if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to a dedicated migrated test database.');
Object.assign(process.env, { DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: 'test', REDIS_ENABLED: 'false', JWT_SECRET: 'worker-finance-tests-only-not-a-production-secret', LOG_LEVEL: 'error', API_RATE_LIMIT_MAX: '5000', AUTH_RATE_LIMIT_MAX: '1000' });
mock.module(new URL('../dist/services/worker-email.service.js', import.meta.url).href, { namedExports: { workerEmailConfigured: () => false, sendWorkerAccessEmail: async () => false } });
mock.module(new URL('../dist/services/email.service.js', import.meta.url).href, { namedExports: { recoveryEmailConfigured: () => false, sendBusinessRecoveryEmail: async () => false, sendOperationalEmail: async () => false } });
const { app } = await import('../dist/app.js');
const { prisma } = await import('../dist/config/db.js');
const { signAccessToken } = await import('../dist/utils/jwt.js');
const { addDays, dateValue, istToday } = await import('../dist/modules/attendance/attendance.utils.js');
const prefix = `worker-finance-${randomUUID()}`;
const users = [], jobs = [], requirements = [], assignments = [];
let server, base, serial = 0;
async function request(path, { user, method = 'GET', body, csrf = true } = {}) {
  const response = await fetch(`${base}/api/v1${path}`, { method, headers: { ...(user ? { Cookie: `zobhunger_access=${signAccessToken({ sub: user.id, role: user.role, version: 0 })}` } : {}), ...(method !== 'GET' && csrf ? { 'X-Requested-With': 'XMLHttpRequest' } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text(); let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: response.status, body: parsed, headers: response.headers };
}
function ok(result, status = 200) { assert.equal(result.status, status, JSON.stringify(result.body)); return result.body.data; }

test('P3.6 earnings ledger and P3.7 dashboard preserve worker ownership and financial history', async t => {
  try {
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`;
    async function account(role = 'WORKER', verified = true) {
      const user = await prisma.user.create({ data: { email: `${prefix}-${++serial}@example.test`, passwordHash: 'unused-test-password-hash', role, emailVerifiedAt: verified ? new Date() : null, businessAccessApproved: role === 'BUSINESS' } }); users.push(user); return user;
    }
    const worker = await account(), other = await account(), unverified = await account('WORKER', false), admin = await account('ADMIN'), business = await account('BUSINESS');
    await prisma.workerProfile.create({ data: { userId: worker.id, fullName: 'Finance Worker', phone: `98${String(serial).padStart(8, '0')}`, city: 'Delhi', state: 'Delhi', skills: ['Retail'], preferredLocations: ['Delhi'], preferredCategories: ['Sales'], preferredEngagements: ['Contract'], availability: 'Immediate', education: [], workExperience: [], consentAt: new Date() } });
    await prisma.workerProfile.create({ data: { userId: other.id, fullName: 'Other Worker', phone: `97${String(serial).padStart(8, '0')}`, city: 'Delhi', state: 'Delhi', education: [], workExperience: [] } });
    const bp = await prisma.businessProfile.create({ data: { userId: business.id, companyName: 'Finance Test Retail', contactPerson: 'Business Approver' } });
    const req = await prisma.workforceRequirement.create({ data: { businessProfileId: bp.id, submittedByUserId: business.id, companyName: 'Finance Test Retail', contactPerson: 'Business Approver', businessEmail: business.email, mobileNumber: '9876543210', industry: 'Retail', serviceRequired: 'Workforce', workforceCount: 2, jobLocation: 'Delhi', projectDuration: '1 month', details: 'Finance integration fixture', status: 'QUALIFIED' } }); requirements.push(req.id);
    const job = await prisma.job.create({ data: { slug: `${prefix}-${++serial}`, title: 'Retail Promoter', location: 'Delhi Central', city: 'Delhi', category: 'Sales', engagementType: 'Contract', description: 'Finance fixture role', status: 'OPEN', publishedAt: new Date(), requirementId: req.id } }); jobs.push(job.id);
    const application = await prisma.jobApplication.create({ data: { jobId: job.id, workerUserId: worker.id, name: 'Finance Worker', email: worker.email, phone: '9876543210', city: 'Delhi', status: 'SHORTLISTED', consentAt: new Date(), jobSnapshot: { title: job.title, location: job.location, category: job.category, engagementType: job.engagementType } } });
    const candidate = await prisma.businessCandidate.create({ data: { requirementId: req.id, applicationId: application.id, name: 'Finance Worker', city: 'Delhi', skills: ['Retail'], summary: 'Selected worker', jobTitle: job.title, status: 'SELECTED' } });
    const today = istToday(), approvedDay = addDays(today, -2), emptyDay = addDays(today, -5);
    const assignment = await prisma.workforceAssignment.create({ data: { candidateId: candidate.id, requirementId: req.id, name: 'Finance Worker', role: job.title, location: 'Delhi Central', supervisor: 'Field Supervisor', startDate: dateValue(addDays(today, -10)), endDate: dateValue(addDays(today, 10)), shiftStart: 9 * 60, shiftEnd: 18 * 60, graceMinutes: 10, workingDays: [1, 2, 3, 4, 5, 6, 7] } }); assignments.push(assignment.id);
    await prisma.attendanceRecord.create({ data: { assignmentId: assignment.id, date: dateValue(approvedDay), status: 'PRESENT', checkInAt: new Date(`${approvedDay}T09:00:00+05:30`), checkOutAt: new Date(`${approvedDay}T18:00:00+05:30`), breakMinutes: 30, workedMinutes: 510, note: 'Approved fixture attendance', approvalStatus: 'APPROVED', approvalRevision: 1 } });

    await t.test('financial routes require the right active verified role and do not expose drafts', async () => {
      for (const path of ['/workers/dashboard', '/workers/earnings']) {
        assert.equal((await request(path)).status, 401); assert.equal((await request(path, { user: business })).status, 403); assert.equal((await request(path, { user: unverified })).status, 403);
      }
      assert.equal((await request('/admin/earnings', { user: worker })).status, 403);
      assert.equal(ok(await request('/workers/earnings', { user: worker })).total, 0);
      assert.equal(ok(await request('/workers/earnings', { user: other })).total, 0);
    });

    const lines = [
      { type: 'AGREED_EARNINGS', label: 'Agreed earnings', amountPaise: 100000, reason: 'Agreed amount for approved work' },
      { type: 'ALLOWANCE', label: 'Travel allowance', amountPaise: 10000, reason: 'Approved local travel' },
      { type: 'REIMBURSEMENT', label: 'Materials reimbursement', amountPaise: 5000, reason: 'Approved work materials' },
      { type: 'DEDUCTION', label: 'Uniform recovery', amountPaise: 2000, reason: 'Documented uniform recovery' },
    ];
    const createKey = randomUUID(); let statementId;
    await t.test('draft creation is idempotent, period-safe and requires deduction reasons', async () => {
      const missingReason = await request('/admin/earnings', { user: admin, method: 'POST', body: { assignmentId: assignment.id, requestKey: randomUUID(), periodStart: approvedDay, periodEnd: approvedDay, lines: lines.map(line => line.type === 'DEDUCTION' ? { ...line, reason: '' } : line) } });
      assert.equal(missingReason.status, 400);
      const payload = { assignmentId: assignment.id, requestKey: createKey, periodStart: approvedDay, periodEnd: approvedDay, lines };
      const first = ok(await request('/admin/earnings', { user: admin, method: 'POST', body: payload }), 201); statementId = first.statement.id; assert.equal(first.statement.totals.netPayablePaise, 113000);
      const retry = ok(await request('/admin/earnings', { user: admin, method: 'POST', body: payload })); assert.equal(retry.statement.id, statementId); assert.equal(retry.created, false);
      assert.equal((await request('/admin/earnings', { user: admin, method: 'POST', body: { ...payload, lines: [{ ...lines[0], amountPaise: 90000 }] } })).status, 409);
      assert.equal(ok(await request('/workers/earnings', { user: worker })).total, 0);
      assert.equal((await request(`/workers/earnings/${statementId}`, { user: worker })).status, 404);
      assert.equal((await request('/admin/earnings', { user: admin, method: 'POST', body: { ...payload, requestKey: randomUUID(), periodStart: approvedDay, periodEnd: approvedDay } })).status, 409);
    });

    await t.test('business-approved attendance is a hard approval boundary and stale draft revisions fail', async () => {
      const empty = ok(await request('/admin/earnings', { user: admin, method: 'POST', body: { assignmentId: assignment.id, requestKey: randomUUID(), periodStart: emptyDay, periodEnd: emptyDay, lines: [lines[0]] } }), 201).statement;
      assert.equal((await request(`/admin/earnings/${empty.id}/approve`, { user: admin, method: 'POST', body: { revision: empty.revision, approvalNote: 'Should not approve without evidence' } })).status, 409);
      const revised = ok(await request(`/admin/earnings/${statementId}/draft`, { user: admin, method: 'PUT', body: { revision: 0, periodStart: approvedDay, periodEnd: approvedDay, lines } })); assert.equal(revised.revision, 1);
      assert.equal((await request(`/admin/earnings/${statementId}/approve`, { user: admin, method: 'POST', body: { revision: 0, approvalNote: 'Stale approval' } })).status, 409);
      const approved = ok(await request(`/admin/earnings/${statementId}/approve`, { user: admin, method: 'POST', body: { revision: 1, approvalNote: 'Attendance and business approval checked' } }));
      assert.equal(approved.status, 'APPROVED'); assert.equal(approved.revision, 2); assert.equal(approved.approvalAttendanceSnapshot.approvedDays, 1);
      assert.equal((await request(`/admin/earnings/${statementId}/draft`, { user: admin, method: 'PUT', body: { revision: 2, periodStart: approvedDay, periodEnd: approvedDay, lines } })).status, 409);
    });

    await t.test('approved worker statements are private, printable data has a secure CSV, and filters are bounded', async () => {
      const list = ok(await request(`/workers/earnings?assignmentId=${assignment.id}&from=${approvedDay}&to=${approvedDay}`, { user: worker }));
      assert.equal(list.total, 1); assert.equal(list.summary.approvedPaise, 113000); assert.equal(list.summary.paidPaise, 0); assert.equal(list.summary.outstandingPaise, 113000);
      const detail = ok(await request(`/workers/earnings/${statementId}`, { user: worker })); assert.equal(detail.lines.length, 4); assert.equal(detail.totals.paymentStatus, 'UNPAID');
      assert.equal((await request(`/workers/earnings/${statementId}`, { user: other })).status, 404);
      assert.equal((await request(`/workers/earnings/${statementId}/csv`, { user: other })).status, 404);
      const csv = await request(`/workers/earnings/${statementId}/csv`, { user: worker }); assert.equal(csv.status, 200); assert.equal(csv.headers.get('cache-control'), 'private, no-store'); assert.match(csv.headers.get('content-disposition'), /attachment/); assert.match(csv.body, /1130\.00/); assert.match(csv.body, /Uniform recovery/);
    });

    let statementRevision = 2, partialPaymentId, partialPaymentRevision;
    await t.test('partial payment retries are idempotent, overpayment is blocked and concurrent stale adjustments cannot both win', async () => {
      const payKey = randomUUID(), paymentPayload = { revision: statementRevision, requestKey: payKey, amountPaise: 30000, paidAt: new Date(`${approvedDay}T20:00:00+05:30`).toISOString(), method: 'UPI', reference: 'UTR-PARTIAL', note: 'First partial payment' };
      let detail = ok(await request(`/admin/earnings/${statementId}/payments`, { user: admin, method: 'POST', body: paymentPayload }), 201); statementRevision = detail.revision; assert.equal(detail.totals.paidPaise, 30000); assert.equal(detail.totals.outstandingPaise, 83000); partialPaymentId = detail.payments.find(item => item.reference === 'UTR-PARTIAL').id; partialPaymentRevision = detail.payments.find(item => item.id === partialPaymentId).revision;
      detail = ok(await request(`/admin/earnings/${statementId}/payments`, { user: admin, method: 'POST', body: paymentPayload }), 201); assert.equal(detail.revision, statementRevision); assert.equal(detail.payments.filter(item => item.reference === 'UTR-PARTIAL').length, 1);
      assert.equal((await request(`/admin/earnings/${statementId}/payments`, { user: admin, method: 'POST', body: { ...paymentPayload, requestKey: randomUUID(), revision: statementRevision, amountPaise: 83001 } })).status, 409);
      const adjustmentBase = statementRevision;
      const pair = await Promise.all([
        request(`/admin/earnings/${statementId}/adjustments`, { user: admin, method: 'POST', body: { revision: adjustmentBase, requestKey: randomUUID(), type: 'CREDIT', amountPaise: 5000, reason: 'Approved performance correction' } }),
        request(`/admin/earnings/${statementId}/adjustments`, { user: admin, method: 'POST', body: { revision: adjustmentBase, requestKey: randomUUID(), type: 'CREDIT', amountPaise: 7000, reason: 'Competing stale correction' } }),
      ]);
      assert.deepEqual(pair.map(result => result.status).sort(), [201, 409]);
      detail = ok(pair.find(result => result.status === 201), 201); statementRevision = detail.revision; assert.equal(detail.adjustments.length, 1);
      assert.equal((await request(`/admin/earnings/${statementId}/adjustments`, { user: admin, method: 'POST', body: { revision: statementRevision, requestKey: randomUUID(), type: 'DEBIT', amountPaise: detail.totals.netPayablePaise, reason: 'Would erase payable history' } })).status, 409);
    });

    await t.test('completed payment, audited void and replacement payment derive totals from valid records only', async () => {
      let detail = ok(await request(`/admin/earnings/${statementId}`, { user: admin }));
      detail = ok(await request(`/admin/earnings/${statementId}/payments`, { user: admin, method: 'POST', body: { revision: detail.revision, requestKey: randomUUID(), amountPaise: detail.totals.outstandingPaise, paidAt: new Date(`${approvedDay}T21:00:00+05:30`).toISOString(), method: 'Bank transfer', reference: 'UTR-COMPLETE', note: 'Balance payment' } }), 201); assert.equal(detail.totals.outstandingPaise, 0); assert.equal(detail.totals.paymentStatus, 'PAID');
      detail = ok(await request(`/admin/earnings/${statementId}/payments/${partialPaymentId}/void`, { user: admin, method: 'POST', body: { statementRevision: detail.revision, paymentRevision: partialPaymentRevision, reason: 'Duplicate bank confirmation discovered during reconciliation' } })); assert.equal(detail.totals.paidPaise, detail.totals.netPayablePaise - 30000); assert.equal(detail.totals.outstandingPaise, 30000); assert.equal(detail.payments.find(item => item.id === partialPaymentId).status, 'VOIDED');
      detail = ok(await request(`/admin/earnings/${statementId}/payments`, { user: admin, method: 'POST', body: { revision: detail.revision, requestKey: randomUUID(), amountPaise: 30000, paidAt: new Date(`${approvedDay}T22:00:00+05:30`).toISOString(), method: 'Bank transfer', reference: 'UTR-REPLACEMENT', note: 'Reconciled replacement entry' } }), 201); assert.equal(detail.totals.outstandingPaise, 0); assert.equal(detail.totals.paidPaise, detail.totals.netPayablePaise);
      const actions = await prisma.auditLog.findMany({ where: { entityType: 'EarningsStatement', entityId: statementId }, select: { action: true } });
      for (const action of ['EARNINGS_DRAFT_CREATED', 'EARNINGS_DRAFT_REVISED', 'EARNINGS_APPROVED', 'EARNINGS_ADJUSTED', 'EARNINGS_PAYMENT_RECORDED', 'EARNINGS_PAYMENT_VOIDED']) assert.ok(actions.some(item => item.action === action), `missing ${action}`);
    });

    await t.test('dashboard totals reconcile to approved ledger records and expose real next work only to the owner', async () => {
      const detail = ok(await request(`/workers/earnings/${statementId}`, { user: worker }));
      const dashboard = ok(await request('/workers/dashboard', { user: worker })); assert.equal(dashboard.earnings.approvedPaise, detail.totals.netPayablePaise); assert.equal(dashboard.earnings.paidPaise, detail.totals.paidPaise); assert.equal(dashboard.earnings.outstandingPaise, detail.totals.outstandingPaise); assert.equal(dashboard.assignments.currentTotal, 1); assert.ok(dashboard.assignments.nextShift); assert.equal(dashboard.assignments.nextShift.supervisor, 'Field Supervisor'); assert.ok(dashboard.activity.some(item => item.kind === 'EARNINGS')); assert.ok(dashboard.activity.some(item => item.kind === 'PAYMENT'));
      const foreign = ok(await request('/workers/dashboard', { user: other })); assert.equal(foreign.earnings.approvedPaise, 0); assert.equal(foreign.assignments.currentTotal, 0); assert.equal(foreign.applications.total, 0);
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    await prisma.paymentRecord.deleteMany({ where: { statement: { assignmentId: { in: assignments } } } });
    await prisma.earningsAdjustment.deleteMany({ where: { statement: { assignmentId: { in: assignments } } } });
    await prisma.earningsLine.deleteMany({ where: { statement: { assignmentId: { in: assignments } } } });
    await prisma.earningsStatement.deleteMany({ where: { assignmentId: { in: assignments } } });
    await prisma.attendanceRecord.deleteMany({ where: { assignmentId: { in: assignments } } });
    await prisma.workforceAssignment.deleteMany({ where: { id: { in: assignments } } });
    await prisma.businessCandidate.deleteMany({ where: { requirementId: { in: requirements } } });
    await prisma.jobApplication.deleteMany({ where: { jobId: { in: jobs } } }); await prisma.job.deleteMany({ where: { id: { in: jobs } } });
    await prisma.workforceRequirement.deleteMany({ where: { id: { in: requirements } } }); await prisma.businessProfile.deleteMany({ where: { userId: { in: users.map(user => user.id) } } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: users.map(user => user.id) } } }); await prisma.workerProfile.deleteMany({ where: { userId: { in: users.map(user => user.id) } } }); await prisma.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } }); await prisma.$disconnect();
  }
});
