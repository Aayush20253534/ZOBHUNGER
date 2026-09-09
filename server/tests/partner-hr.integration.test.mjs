import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { once } from 'node:events';
import { mock, test } from 'node:test';

if (!process.env.TEST_DATABASE_URL) throw new Error('Use TEST_DATABASE_URL pointing to a dedicated, migrated test database.');
Object.assign(process.env, { DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: 'test', REDIS_ENABLED: 'false', JWT_SECRET: 'partner-hr-integration-secret-test-only-2026', LOG_LEVEL: 'error', CLIENT_ORIGIN: 'http://localhost:3000', PUBLIC_APP_URL: 'http://localhost:3000', API_RATE_LIMIT_MAX: '2000', AUTH_RATE_LIMIT_MAX: '2000', SUBMISSION_RATE_LIMIT_MAX: '2000' });
let acceptEmail = true;
const messages = [];
mock.module(new URL('../dist/services/email.service.js', import.meta.url).href, { namedExports: {
  recoveryEmailConfigured: () => true,
  sendBusinessRecoveryEmail: async () => true,
  sendOperationalEmail: async input => { messages.push(input); return acceptEmail; },
} });
const { app } = await import('../dist/app.js');
const { prisma } = await import('../dist/config/db.js');
const { signAccessToken } = await import('../dist/utils/jwt.js');
const { hashPassword, verifyPassword } = await import('../dist/utils/password.js');
const prefix = `phr-${randomUUID()}`;
const email = suffix => `${prefix}-${suffix}@example.test`;
const cookieFor = user => `zobhunger_access=${signAccessToken({ sub: user.id, role: user.role, version: user.sessionVersion ?? 0 })}`;
const partner = suffix => ({ fullName: 'Test Applicant', email: email(suffix), mobileNumber: '+91 9876543210', currentCity: 'Delhi', currentProfession: 'Business owner', companyName: 'Test Partnership Company', totalExperienceYears: 4, specialization: 'Retail operations', industryExperience: 'Field sales and retail execution', contributionPreference: 'Business execution', expertiseDescription: 'Four years of field execution and team coordination experience.', preferredPartnershipArea: 'Workforce and sales' });
const profile = () => ({ requestKey: randomUUID(), fullName: 'Test Candidate', email: email('candidate'), phone: '+91 9876543210', city: 'Delhi', state: 'Delhi', preferredRole: 'Field Executive', experienceYears: 0, education: [{ qualification: 'Diploma', institution: 'Test Institute', fieldOfStudy: 'Business', graduationYear: 2025 }], workExperience: [], skills: ['Field sales', 'Excel'], preferredLocations: ['Delhi'], availability: 'Immediately', portfolioUrl: '', coverNote: 'Ready for field opportunities', consent: true });
const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
let server, base, admin, worker;
async function request(path, { method = 'GET', body, cookie, raw, csrf = true, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(csrf && method !== 'GET' ? { 'X-Requested-With': 'XMLHttpRequest' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: raw ?? (body ? JSON.stringify(body) : undefined) });
  const result = { status: response.status, headers: response.headers, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  if (response.headers.get('content-type')?.startsWith('application/pdf')) return { ...result, bytes: Buffer.from(await response.arrayBuffer()) };
  return { ...result, body: await response.json() };
}
async function submitPartner(suffix) {
  const response = await request('/partner-applications', { method: 'POST', body: partner(suffix) });
  assert.equal(response.status, 201);
  return response.body.data.id;
}
async function readPartner(id) { return (await request(`/admin/partners/${id}`, { cookie: cookieFor(admin) })).body.data; }
async function approve(id) {
  const detail = await readPartner(id);
  return request(`/admin/partners/${id}/review`, { method: 'POST', cookie: cookieFor(admin), body: { status: 'APPROVED', notes: 'Company and applicant details reviewed.', expectedUpdatedAt: detail.updatedAt } });
}

test('partner approval, first-login enforcement and HR career intake', async t => {
  let partnerId, credentials, temporaryCookie, permanentCookie, careerReceipt;
  try {
    admin = await prisma.user.create({ data: { email: email('admin'), role: 'ADMIN', passwordHash: await hashPassword('AdminTest9!') } });
    worker = await prisma.user.create({ data: { email: email('worker'), role: 'WORKER', passwordHash: await hashPassword('WorkerTest9!') } });
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}/api/v1`;
    await t.test('public business registration is blocked; application submission creates no account', async () => {
      const blocked = await request('/auth/register', { method: 'POST', body: { email: email('self'), password: 'RegistrationTest9!', role: 'BUSINESS' } });
      assert.equal(blocked.status, 403); assert.equal(blocked.body.error.code, 'BUSINESS_APPROVAL_REQUIRED');
      assert.equal(await prisma.user.count({ where: { email: email('self') } }), 0);
      partnerId = await submitPartner('approved');
      assert.equal(await prisma.user.count({ where: { email: email('approved') } }), 0);
      assert.equal((await readPartner(partnerId)).status, 'SUBMITTED');
    });
    await t.test('review APIs reject guests, workers and cross-site form requests', async () => {
      for (const path of ['/admin/partners', `/admin/partners/${partnerId}`, '/admin/careers']) {
        assert.equal((await request(path)).status, 401);
        assert.equal((await request(path, { cookie: cookieFor(worker) })).status, 403);
      }
      const detail = await readPartner(partnerId);
      assert.equal((await request(`/admin/partners/${partnerId}/review`, { method: 'POST', cookie: cookieFor(admin), csrf: false, body: { status: 'APPROVED', expectedUpdatedAt: detail.updatedAt } })).status, 403);
      assert.equal(await prisma.user.count({ where: { email: email('approved') } }), 0);
    });
    await t.test('admin approval creates one unique Partner ID, hashed password and company profile', async () => {
      const result = await approve(partnerId);
      assert.equal(result.status, 200, JSON.stringify(result.body));
      credentials = result.body.data.credentials;
      assert.match(credentials.partnerCode, /^ZB-[A-F0-9]{16}$/);
      assert.equal(credentials.emailAccepted, true);
      assert.equal(result.headers.get('cache-control'), 'no-store');
      const user = await prisma.user.findUnique({ where: { email: email('approved') }, include: { businessProfile: true } });
      assert.equal(user.businessAccessApproved, true); assert.equal(user.mustChangePassword, true);
      assert.notEqual(user.passwordHash, credentials.temporaryPassword);
      assert.equal(await verifyPassword(user.passwordHash, credentials.temporaryPassword), true);
      assert.equal(user.businessProfile.companyName, partner('approved').companyName);
      const again = await approve(partnerId);
      assert.equal(again.status, 200); assert.equal(again.body.data.credentials, null);
      assert.equal(await prisma.user.count({ where: { email: email('approved') } }), 1);
      const list = await request('/admin/partners?status=APPROVED', { cookie: cookieFor(admin) });
      assert.ok(list.body.data.counts.APPROVED >= 1);
      assert.equal(JSON.stringify(list.body).includes(credentials.temporaryPassword), false);
      assert.equal(JSON.stringify(await readPartner(partnerId)).includes('passwordHash'), false);
      assert.equal((await request(`/admin/partner-applications/${partnerId}/status`, { method: 'PATCH', cookie: cookieFor(admin), body: { status: 'SUBMITTED' } })).status, 409);
    });
    await t.test('temporary sign-in is restricted on every portal API and cannot be bypassed through generic login', async () => {
      const login = await request('/auth/business-login', { method: 'POST', body: { identifier: credentials.partnerCode.toLowerCase(), password: credentials.temporaryPassword } });
      assert.equal(login.status, 200); assert.equal(login.body.data.user.mustChangePassword, true); temporaryCookie = login.cookie;
      for (const path of ['/business/workspace', '/business/requirements', '/business/candidates', '/business/attendance', '/business/reports']) {
        const response = await request(path, { cookie: temporaryCookie });
        assert.equal(response.status, 403, path); assert.equal(response.body.error.code, 'PASSWORD_CHANGE_REQUIRED', path);
      }
      assert.equal((await request('/auth/me', { cookie: temporaryCookie })).status, 200);
      const generic = await request('/auth/login', { method: 'POST', body: { email: email('approved'), password: credentials.temporaryPassword } });
      assert.equal(generic.status, 200);
      assert.equal((await request('/business/workspace', { cookie: generic.cookie })).status, 403);
    });
    await t.test('first password change rejects weak, reused and wrong passwords, then invalidates the temporary session', async () => {
      const change = (currentPassword, password, csrf = true) => request('/auth/business/change-password', { method: 'POST', cookie: temporaryCookie, csrf, body: { currentPassword, password } });
      assert.equal((await change(credentials.temporaryPassword, 'short')).status, 400);
      assert.equal((await change('WrongTest9!', 'PermanentTest9!')).status, 400);
      assert.equal((await change(credentials.temporaryPassword, credentials.temporaryPassword)).status, 400);
      assert.equal((await change(credentials.temporaryPassword, 'PermanentTest9!', false)).status, 403);
      const saved = await change(credentials.temporaryPassword, 'PermanentTest9!');
      assert.equal(saved.status, 200); assert.equal(saved.body.data.user.mustChangePassword, false); permanentCookie = saved.cookie;
      assert.equal((await request('/business/workspace', { cookie: permanentCookie })).status, 200);
      assert.equal((await request('/business/workspace', { cookie: temporaryCookie })).status, 401);
      assert.equal((await request('/auth/business-login', { method: 'POST', body: { identifier: credentials.partnerCode, password: credentials.temporaryPassword } })).status, 401);
      const detail = await readPartner(partnerId);
      assert.equal((await request(`/admin/partners/${partnerId}/credentials`, { method: 'POST', cookie: cookieFor(admin), body: { expectedUpdatedAt: detail.updatedAt } })).status, 409);
    });
    await t.test('pending legacy businesses require review; approval retains existing business records', async () => {
      const legacy = await prisma.user.create({ data: { email: email('legacy'), role: 'BUSINESS', passwordHash: await hashPassword('LegacyTest9!') } });
      const prior = await prisma.businessProfile.create({ data: { userId: legacy.id, companyName: 'Preserved Company', contactPerson: 'Existing Owner' } });
      assert.equal((await request('/auth/business-login', { method: 'POST', body: { identifier: legacy.email, password: 'LegacyTest9!' } })).status, 403);
      assert.equal((await request('/business/workspace', { cookie: cookieFor(legacy) })).status, 403);
      const id = await submitPartner('legacy'); const result = await approve(id); assert.equal(result.status, 200);
      assert.equal((await prisma.businessProfile.findUnique({ where: { userId: legacy.id } })).id, prior.id);
      assert.equal((await prisma.businessProfile.findUnique({ where: { userId: legacy.id } })).companyName, 'Preserved Company');
      assert.notEqual(result.body.data.credentials.partnerCode, credentials.partnerCode);
      const duplicate = await submitPartner('legacy'); assert.equal((await approve(duplicate)).status, 409);
      const workerApplication = await submitPartner('worker'); assert.equal((await approve(workerApplication)).status, 409);
      assert.equal((await readPartner(workerApplication)).status, 'SUBMITTED');
    });
    await t.test('failed email does not undo approval; expired credentials can be reissued before activation', async () => {
      acceptEmail = false; const id = await submitPartner('reissue'); const approval = await approve(id);
      assert.equal(approval.status, 200); const old = approval.body.data.credentials;
      assert.equal(old.emailAccepted, false); assert.equal((await readPartner(id)).credentialsEmailStatus, 'FAILED');
      const user = await prisma.user.findUnique({ where: { email: email('reissue') } });
      await prisma.user.update({ where: { id: user.id }, data: { temporaryPasswordExpiresAt: new Date(Date.now() - 1000) } });
      const expired = await request('/auth/business-login', { method: 'POST', body: { identifier: old.partnerCode, password: old.temporaryPassword } });
      assert.equal(expired.body.error.code, 'TEMPORARY_PASSWORD_EXPIRED');
      acceptEmail = true; const detail = await readPartner(id);
      const reissue = await request(`/admin/partners/${id}/credentials`, { method: 'POST', cookie: cookieFor(admin), body: { expectedUpdatedAt: detail.updatedAt } });
      assert.equal(reissue.status, 200); const fresh = reissue.body.data.credentials;
      assert.equal(fresh.partnerCode, old.partnerCode); assert.notEqual(fresh.temporaryPassword, old.temporaryPassword);
      assert.equal((await request('/auth/business-login', { method: 'POST', body: { identifier: old.partnerCode, password: old.temporaryPassword } })).status, 401);
      assert.equal((await request('/auth/business-login', { method: 'POST', body: { identifier: fresh.partnerCode, password: fresh.temporaryPassword } })).status, 200);
    });
    await t.test('concurrent approvals are idempotent and conflicting application emails cannot create duplicate accounts', async () => {
      const id = await submitPartner('concurrent');
      const detail = await readPartner(id);
      const attempt = () => request(`/admin/partners/${id}/review`, { method: 'POST', cookie: cookieFor(admin), body: { status: 'APPROVED', expectedUpdatedAt: detail.updatedAt } });
      const results = await Promise.all([attempt(), attempt()]);
      assert.ok(results.every(result => result.status === 200), JSON.stringify(results.map(result => result.body)));
      assert.equal(results.filter(result => result.body.data.credentials).length, 1);
      assert.equal(await prisma.user.count({ where: { email: email('concurrent') } }), 1);
    });
    await t.test('approved account recovery replaces an expired temporary password without preserving it', async () => {
      const id = await submitPartner('recovery');
      const approval = await approve(id); assert.equal(approval.status, 200);
      const credentials = approval.body.data.credentials;
      const user = await prisma.user.findUnique({ where: { email: email('recovery') } });
      const token = 'ab'.repeat(32);
      await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 60000) } });
      assert.equal((await request('/auth/business/reset-password', { method: 'POST', body: { token, password: credentials.temporaryPassword } })).status, 400);
      assert.equal((await request('/auth/business/reset-password', { method: 'POST', body: { token, password: 'RecoveredTest9!' } })).status, 200);
      const login = await request('/auth/business-login', { method: 'POST', body: { identifier: credentials.partnerCode, password: 'RecoveredTest9!' } });
      assert.equal(login.status, 200); assert.equal(login.body.data.user.mustChangePassword, false);
      assert.equal((await request('/business/workspace', { cookie: login.cookie })).status, 200);
    });
    await t.test('career forms validate consent, qualifications, skills and employment dates', async () => {
      const data = profile();
      for (const invalid of [{ consent: false }, { education: [] }, { skills: [] }, { portfolioUrl: 'javascript:alert(1)' }, { experienceYears: 2, workExperience: [] }, { workExperience: [{ company: 'Test Company', title: 'Executive', startMonth: '2025-06', endMonth: '2024-01', current: false }] }]) {
        assert.equal((await request('/career-applications', { method: 'POST', body: { ...data, ...invalid } })).status, 400);
      }
      const response = await request('/career-applications', { method: 'POST', body: data });
      assert.equal(response.status, 201); careerReceipt = response.body.data;
      assert.equal(careerReceipt.resumeUploaded, false); assert.match(careerReceipt.resumeUploadToken, /^[a-f0-9]{64}$/);
      assert.equal(await prisma.user.count({ where: { email: data.email } }), 0);
      const retry = await request('/career-applications', { method: 'POST', body: data });
      assert.equal(retry.body.data.id, careerReceipt.id); assert.equal(retry.body.data.resumeUploadToken, careerReceipt.resumeUploadToken);
      assert.equal(await prisma.careerApplication.count({ where: { submissionKey: data.requestKey } }), 1);
      assert.equal((await request('/career-applications', { method: 'POST', body: { ...data, fullName: 'Changed Candidate' } })).status, 409);
    });
    await t.test('resume upload is bounded, capability-protected and cannot overwrite an existing file', async () => {
      const upload = (raw, token = careerReceipt.resumeUploadToken, contentType = 'application/pdf') => request(`/career-applications/${careerReceipt.id}/resume`, { method: 'PUT', raw, headers: { 'Content-Type': contentType, 'X-Upload-Token': token, 'X-File-Name': encodeURIComponent('Candidate CV.pdf') } });
      assert.equal((await upload(pdf, 'f'.repeat(64))).status, 403);
      assert.equal((await upload(Buffer.from('<html>bad upload</html>'))).status, 415);
      assert.equal((await upload(Buffer.alloc(2 * 1024 * 1024 + 1, 65))).status, 413);
      const saved = await upload(pdf); assert.equal(saved.status, 200);
      assert.equal((await upload(pdf)).status, 200, 'A network retry of the same upload is safe');
      assert.equal((await upload(Buffer.from('%PDF-1.7\ndifferent content\n%%EOF\n'))).status, 409);
      const row = await prisma.careerApplication.findUnique({ where: { id: careerReceipt.id } });
      assert.equal(row.resumeUploadTokenHash, createHash('sha256').update(careerReceipt.resumeUploadToken).digest('hex'));
      assert.deepEqual(Buffer.from(row.resumeData), pdf);
    });
    await t.test('only HR/admin can read profiles and download CVs; review, filtering and history persist', async () => {
      const path = `/admin/careers/${careerReceipt.id}`;
      assert.equal((await request(path)).status, 401);
      assert.equal((await request(path, { cookie: cookieFor(worker) })).status, 403);
      assert.equal((await request(`${path}/resume`, { cookie: permanentCookie })).status, 403);
      const downloaded = await request(`${path}/resume`, { cookie: cookieFor(admin) });
      assert.equal(downloaded.status, 200); assert.deepEqual(downloaded.bytes, pdf);
      assert.equal(downloaded.headers.get('cache-control'), 'no-store');
      assert.match(downloaded.headers.get('content-disposition'), /^attachment;/);
      const detail = (await request(path, { cookie: cookieFor(admin) })).body.data;
      assert.equal('resumeData' in detail, false); assert.equal('resumeUploadTokenHash' in detail, false);
      assert.equal(detail.education[0].qualification, 'Diploma');
      const reviewBody = { status: 'SHORTLISTED', notes: 'Suitable for a field role; call to discuss availability.', expectedUpdatedAt: detail.updatedAt };
      const reviewed = await request(`${path}/review`, { method: 'POST', cookie: cookieFor(admin), body: reviewBody });
      assert.equal(reviewed.status, 200); assert.equal(reviewed.body.data.application.status, 'SHORTLISTED');
      assert.equal(reviewed.body.data.application.history.some(item => item.metadata?.notes === reviewBody.notes), true);
      assert.equal((await request(`${path}/review`, { method: 'POST', cookie: cookieFor(admin), body: reviewBody })).status, 409, 'Stale reviews cannot overwrite a newer review');
      const list = await request(`/admin/careers?status=SHORTLISTED&query=${encodeURIComponent(email('candidate'))}`, { cookie: cookieFor(admin) });
      assert.equal(list.body.data.total, 1); assert.equal(list.body.data.items[0].id, careerReceipt.id);
      assert.ok(list.body.data.counts.SHORTLISTED >= 1);
    });
    await t.test('expired upload receipts cannot attach files to saved profiles', async () => {
      const data = { ...profile(), email: email('expired-upload') };
      const response = await request('/career-applications', { method: 'POST', body: data });
      const receipt = response.body.data;
      await prisma.careerApplication.update({ where: { id: receipt.id }, data: { resumeUploadExpiresAt: new Date(Date.now() - 1000) } });
      assert.equal((await request(`/career-applications/${receipt.id}/resume`, { method: 'PUT', raw: pdf, headers: { 'Content-Type': 'application/pdf', 'X-Upload-Token': receipt.resumeUploadToken } })).status, 403);
      assert.equal((await prisma.careerApplication.findUnique({ where: { id: receipt.id } })).resumeData, null);
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    const users = await prisma.user.findMany({ where: { email: { startsWith: prefix } }, select: { id: true } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: users.map(user => user.id) } } });
    await prisma.partnerApplication.deleteMany({ where: { email: { startsWith: prefix } } });
    await prisma.careerApplication.deleteMany({ where: { email: { startsWith: prefix } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
    await prisma.$disconnect(); mock.restoreAll();
  }
});
