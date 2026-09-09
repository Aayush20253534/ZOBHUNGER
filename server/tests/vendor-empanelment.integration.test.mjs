import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mock, test } from 'node:test';

if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to a dedicated, migrated test database.');
Object.assign(process.env, { DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: 'test', REDIS_ENABLED: 'false', JWT_SECRET: 'vendor-integration-secret-test-only-2026', LOG_LEVEL: 'error', CLIENT_ORIGIN: 'http://localhost:3000', PUBLIC_APP_URL: 'http://localhost:3000', API_RATE_LIMIT_MAX: '2000', AUTH_RATE_LIMIT_MAX: '2000', SUBMISSION_RATE_LIMIT_MAX: '2000' });
const messages = [];
mock.module(new URL('../dist/services/email.service.js', import.meta.url).href, { namedExports: {
  recoveryEmailConfigured: () => true,
  sendBusinessRecoveryEmail: async input => { messages.push(input); return true; },
  sendOperationalEmail: async input => { messages.push(input); return true; },
} });
const { app } = await import('../dist/app.js');
const { prisma } = await import('../dist/config/db.js');
const { signAccessToken } = await import('../dist/utils/jwt.js');
const prefix = `vendor-${randomUUID()}`;
const email = suffix => `${prefix}-${suffix}@example.test`;
const cookieFor = user => `zobhunger_access=${signAccessToken({ sub: user.id, role: user.role, version: user.sessionVersion ?? 0 })}`;
const profile = suffix => ({ requestKey: randomUUID(), companyName: `QA Vendor ${suffix}`, organizationType: 'MSME', establishedYear: 2021, registrationNumber: 'QA-REG-123', gstNumber: '', msmeNumber: 'QA-MSME-123', addressLine: '12 Market Road', city: 'Delhi', state: 'Delhi', postalCode: '110001', country: 'India', contactName: 'Vendor Contact', contactRole: 'Director', email: email(suffix), phone: '+91 9876543210', alternatePhone: '', website: 'https://example.test', serviceCategories: ['WORKFORCE', 'RECRUITMENT'], specializedServices: '', serviceDescription: 'Recruitment and field staffing for distributed retail projects.', yearsExperience: 5, teamSize: 30, coverage: ['Delhi', 'Lucknow'], industries: ['Retail'], projectExperience: 'Coordinated hiring and deployment of store teams across two cities.', notableClients: '', capacityNotes: 'Available for projects starting next month.', consent: true });
const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
const otherPdf = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Pages >>\nendobj\n%%EOF\n');
let server, base, admin, worker, business;
async function request(path, { method = 'GET', body, cookie, raw, csrf = true, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(csrf && method !== 'GET' ? { 'X-Requested-With': 'XMLHttpRequest' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: raw ?? (body ? JSON.stringify(body) : undefined) });
  const result = { status: response.status, headers: response.headers };
  if (response.headers.get('content-type')?.startsWith('application/pdf')) return { ...result, bytes: Buffer.from(await response.arrayBuffer()) };
  return { ...result, body: await response.json() };
}
async function start(input) {
  const response = await request('/vendor-applications', { method: 'POST', body: input });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  return response.body.data;
}
const upload = (receipt, kind = 'COMPANY_PROFILE', raw = pdf, headers = {}) => request(`/vendor-applications/${receipt.id}/documents/${kind}`, { method: 'PUT', raw, headers: { 'Content-Type': 'application/pdf', 'X-Upload-Token': receipt.uploadToken, 'X-File-Name': encodeURIComponent('Company profile.pdf'), ...headers } });
const submit = receipt => request(`/vendor-applications/${receipt.id}/submit`, { method: 'POST', headers: { 'X-Upload-Token': receipt.uploadToken } });
async function detail(id) {
  const response = await request(`/admin/vendors/${id}`, { cookie: cookieFor(admin) });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response.body.data;
}
async function review(id, status, notes = 'Company details and documents reviewed.', revision) {
  const currentRevision = revision ?? (await detail(id)).revision;
  return request(`/admin/vendors/${id}/review`, { method: 'POST', cookie: cookieFor(admin), body: { status, notes, expectedRevision: currentRevision } });
}
const recordInput = value => ({ contactName: value.contactName, contactRole: value.contactRole, email: value.email, phone: value.phone, alternatePhone: value.alternatePhone || '', website: value.website || '', teamSize: value.teamSize, coverage: value.coverage, capacityNotes: value.capacityNotes || '', accountManager: 'Operations coordinator', internalNotes: 'Confirm availability before sharing a brief.', expectedRevision: value.revision });
function privateMetadataOnly(value) {
  const text = JSON.stringify(value);
  for (const name of ['uploadToken', 'uploadTokenHash', 'submissionHash', 'submissionKey', 'sha256', '"data":{"type":"Buffer"']) assert.equal(text.includes(name), false, name);
}

test('vendor intake, private documents, review and vendor directory', async t => {
  let input, receipt, code, approvedAt;
  try {
    [admin, worker, business] = await Promise.all(['ADMIN', 'WORKER', 'BUSINESS'].map(role => prisma.user.create({ data: { email: email(role.toLowerCase()), role, passwordHash: 'unused-in-cookie-auth-test', businessAccessApproved: role === 'BUSINESS' } })));
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}/api/v1`;
    await t.test('intake validates company details, consent and service expertise without granting accounts', async () => {
      input = profile('main');
      for (const invalid of [{ consent: false }, { serviceCategories: [] }, { organizationType: 'unknown' }, { serviceCategories: ['SPECIALIZED'], specializedServices: '' }, { coverage: [] }, { teamSize: 0 }, { serviceDescription: 'short' }, { website: 'javascript:alert(1)' }, { status: 'APPROVED' }, { vendorCode: 'VND-INJECTED' }]) {
        assert.equal((await request('/vendor-applications', { method: 'POST', body: { ...input, ...invalid } })).status, 400, JSON.stringify(invalid));
      }
      receipt = await start(input);
      assert.equal(receipt.submitted, false); assert.equal(receipt.documents.length, 0); assert.match(receipt.uploadToken, /^[a-f0-9]{64}$/);
      const row = await prisma.vendorApplication.findUnique({ where: { id: receipt.id } });
      assert.equal(row.status, 'DRAFT'); assert.ok(row.consentAt); assert.equal(row.uploadTokenHash, createHash('sha256').update(receipt.uploadToken).digest('hex'));
      assert.equal(await prisma.user.count({ where: { email: input.email } }), 0);
      const retry = await start(input); assert.equal(retry.id, receipt.id); assert.equal(retry.uploadToken, receipt.uploadToken);
      assert.equal((await request('/vendor-applications', { method: 'POST', body: { ...input, companyName: 'Changed company' } })).status, 409);
    });
    await t.test('concurrent retries create only one draft and retain the same receipt', async () => {
      const payload = profile('concurrent-draft');
      const results = await Promise.all([start(payload), start(payload)]);
      assert.equal(results[0].id, results[1].id); assert.equal(results[0].uploadToken, results[1].uploadToken);
      assert.equal(await prisma.vendorApplication.count({ where: { submissionKey: payload.requestKey } }), 1);
    });
    await t.test('drafts are distinguishable, excluded from the inbox, and cannot be approved', async () => {
      const inbox = await request(`/admin/vendors?query=${input.email}`, { cookie: cookieFor(admin) });
      assert.equal(inbox.body.data.total, 0);
      const drafts = await request(`/admin/vendors?status=DRAFT&query=${input.email}`, { cookie: cookieFor(admin) });
      assert.equal(drafts.body.data.items[0].id, receipt.id); privateMetadataOnly(drafts.body.data);
      assert.equal((await review(receipt.id, 'APPROVED')).status, 409);
      assert.equal((await submit(receipt)).body.error.code, 'VENDOR_PROFILE_REQUIRED');
      const saved = await detail(receipt.id);
      assert.equal((await request(`/admin/vendors/${receipt.id}/record`, { method: 'PATCH', cookie: cookieFor(admin), body: recordInput(saved) })).status, 409);
    });
    await t.test('uploads validate type, size, category and receipt ownership', async () => {
      const another = await start(profile('other'));
      assert.equal((await upload(receipt, 'COMPANY_PROFILE', pdf, { 'X-Upload-Token': 'bad' })).status, 403);
      assert.equal((await upload(receipt, 'COMPANY_PROFILE', pdf, { 'X-Upload-Token': another.uploadToken })).status, 403);
      assert.equal((await upload(receipt, 'UNKNOWN')).status, 400);
      assert.equal((await upload(receipt, 'COMPANY_PROFILE', pdf, { 'Content-Type': 'text/plain' })).status, 415);
      assert.equal((await upload(receipt, 'COMPANY_PROFILE', Buffer.alloc(0))).status, 400);
      assert.equal((await upload(receipt, 'COMPANY_PROFILE', Buffer.from('<html>Not a PDF</html>'))).status, 415);
      assert.equal((await upload(receipt, 'COMPANY_PROFILE', Buffer.alloc(2 * 1024 * 1024 + 1))).status, 413);
      assert.equal((await request(`/vendor-applications/${receipt.id}/submit`, { method: 'POST', headers: { 'X-Upload-Token': another.uploadToken } })).status, 403);
      const saved = await upload(receipt); assert.equal(saved.status, 200); privateMetadataOnly(saved.body);
      const retry = await upload(receipt); assert.deepEqual(retry.body.data, saved.body.data);
      assert.equal((await upload(receipt, 'COMPANY_PROFILE', otherPdf)).status, 409);
      for (const kind of ['REGISTRATION', 'TAX', 'MSME', 'OTHER']) assert.equal((await upload(receipt, kind)).status, 200);
      assert.equal(await prisma.vendorDocument.count({ where: { applicationId: receipt.id } }), 5);
    });
    await t.test('final submission is atomic, repeatable and locks documents for review', async () => {
      const results = await Promise.all([submit(receipt), submit(receipt)]);
      assert.ok(results.every(result => result.status === 200));
      assert.equal(results[0].body.data.submittedAt, results[1].body.data.submittedAt);
      assert.equal(await prisma.auditLog.count({ where: { action: 'vendor.submitted', entityId: receipt.id } }), 1);
      assert.equal((await detail(receipt.id)).status, 'SUBMITTED');
      assert.equal((await upload(receipt)).status, 200);
      assert.equal((await upload(receipt, 'OTHER', otherPdf)).status, 409);
      const retry = await start(input); assert.equal(retry.submitted, true); assert.equal(retry.uploadToken, null); assert.equal(retry.documents.length, 5);
    });
    await t.test('racing an optional upload with submission cannot alter a finalized document set', async () => {
      const race = await start(profile('submit-race')); assert.equal((await upload(race)).status, 200);
      const [finished, optional] = await Promise.all([submit(race), upload(race, 'OTHER')]);
      assert.equal(finished.status, 200); assert.ok([200, 409].includes(optional.status));
      const count = await prisma.vendorDocument.count({ where: { applicationId: race.id } });
      assert.equal((await upload(race, 'REGISTRATION')).status, 409);
      assert.equal(await prisma.vendorDocument.count({ where: { applicationId: race.id } }), count);
    });
    await t.test('all admin routes require the admin role and writes require the portal header', async () => {
      const current = await detail(receipt.id);
      const routes = [
        ['/admin/vendors', {}], [`/admin/vendors/${receipt.id}`, {}],
        [`/admin/vendors/${receipt.id}/documents/${current.documents[0].id}`, {}],
        [`/admin/vendors/${receipt.id}/review`, { method: 'POST', body: { status: 'APPROVED', notes: '', expectedRevision: current.revision } }],
        [`/admin/vendors/${receipt.id}/record`, { method: 'PATCH', body: recordInput(current) }],
      ];
      for (const [path, options] of routes) {
        assert.equal((await request(path, options)).status, 401, path);
        for (const account of [worker, business]) assert.equal((await request(path, { ...options, cookie: cookieFor(account) })).status, 403, path);
      }
      for (const [path, options] of routes.filter(([, options]) => options.method)) assert.equal((await request(path, { ...options, csrf: false, cookie: cookieFor(admin) })).status, 403);
      privateMetadataOnly(current);
    });
    await t.test('private downloads are isolated to their application, audited and never cached', async () => {
      const current = await detail(receipt.id);
      const path = `/admin/vendors/${receipt.id}/documents/${current.documents[0].id}`;
      const download = await request(path, { cookie: cookieFor(admin) });
      assert.equal(download.status, 200); assert.deepEqual(download.bytes, pdf);
      assert.equal(download.headers.get('cache-control'), 'no-store'); assert.equal(download.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(download.headers.get('content-security-policy'), 'sandbox'); assert.match(download.headers.get('content-disposition'), /^attachment;/);
      const another = await start(profile('download-isolation'));
      assert.equal((await request(`/admin/vendors/${another.id}/documents/${current.documents[0].id}`, { cookie: cookieFor(admin) })).status, 404);
      assert.equal((await detail(receipt.id)).history.some(event => event.action === 'vendor.document_downloaded'), true);
    });
    await t.test('concurrent decisions use revision checks and approval creates one stable Vendor Code', async () => {
      assert.equal((await review(receipt.id, 'UNDER_REVIEW')).status, 200);
      const current = await detail(receipt.id);
      const results = await Promise.all([review(receipt.id, 'APPROVED', 'Approved after document review.', current.revision), review(receipt.id, 'REJECTED', 'Insufficient capacity for the project.', current.revision)]);
      assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
      let saved = await detail(receipt.id);
      if (saved.status === 'REJECTED') { assert.equal((await review(receipt.id, 'UNDER_REVIEW')).status, 200); assert.equal((await review(receipt.id, 'APPROVED')).status, 200); saved = await detail(receipt.id); }
      code = saved.vendorCode; approvedAt = saved.approvedAt;
      assert.match(code, /^VND-[A-F0-9]{12}$/); assert.ok(approvedAt);
      assert.equal(await prisma.user.count({ where: { email: input.email } }), 0);
      const updated = await review(receipt.id, 'APPROVED', 'Additional review note retained.');
      assert.equal(updated.body.data.application.vendorCode, code); assert.equal(updated.body.data.application.approvedAt, approvedAt);
      assert.equal((await review(receipt.id, 'REJECTED', 'Cannot reject an active vendor.')).status, 409);
    });
    await t.test('suspension requires a reason, preserves the directory record, and allows reactivation', async () => {
      assert.equal((await review(receipt.id, 'SUSPENDED', 'short')).status, 400);
      assert.equal((await review(receipt.id, 'SUSPENDED', 'Capacity temporarily unavailable.')).status, 200);
      const directory = await request(`/admin/vendors?view=directory&status=SUSPENDED&category=WORKFORCE&query=${code}`, { cookie: cookieFor(admin) });
      assert.equal(directory.body.data.total, 1); assert.equal(directory.body.data.items[0].vendorCode, code);
      assert.equal((await request(`/admin/vendors?view=directory&category=MARKETING&query=${code}`, { cookie: cookieFor(admin) })).body.data.total, 0);
      assert.equal((await review(receipt.id, 'APPROVED')).status, 200);
      const current = await detail(receipt.id); assert.equal(current.vendorCode, code); assert.equal(current.approvedAt, approvedAt);
    });
    await t.test('vendor record maintenance persists contacts, availability and notes with conflict protection', async () => {
      const before = await detail(receipt.id);
      const changed = { ...recordInput(before), contactName: 'Updated Contact', phone: '+91 9876543211', teamSize: 55, coverage: ['Delhi', 'Mumbai'], capacityNotes: 'New team ready to deploy.' };
      const path = `/admin/vendors/${receipt.id}/record`;
      assert.equal((await request(path, { method: 'PATCH', cookie: cookieFor(admin), body: { ...changed, coverage: [] } })).status, 400);
      const saved = await request(path, { method: 'PATCH', cookie: cookieFor(admin), body: changed });
      assert.equal(saved.status, 200); assert.equal(saved.body.data.application.teamSize, 55); assert.equal(saved.body.data.application.contactName, changed.contactName);
      assert.deepEqual(saved.body.data.application.coverage, changed.coverage); assert.equal(saved.body.data.application.vendorCode, code);
      assert.ok(saved.body.data.application.history.some(event => event.action === 'vendor.record_updated'));
      assert.equal((await request(path, { method: 'PATCH', cookie: cookieFor(admin), body: changed })).status, 409);
    });
    await t.test('rejected applications need a reason and must be reopened before approval', async () => {
      const rejected = await start(profile('rejected')); await upload(rejected); await submit(rejected);
      assert.equal((await review(rejected.id, 'REJECTED', '')).status, 400);
      assert.equal((await review(rejected.id, 'REJECTED', 'The submitted capabilities need clarification.')).status, 200);
      assert.equal((await review(rejected.id, 'APPROVED')).status, 409);
      assert.equal((await review(rejected.id, 'UNDER_REVIEW')).status, 200);
      assert.equal((await review(rejected.id, 'APPROVED')).status, 200);
      assert.notEqual((await detail(rejected.id)).vendorCode, code);
    });
    await t.test('expired receipts cannot upload or finalize applications', async () => {
      const expired = await start(profile('expired')); await upload(expired);
      await prisma.vendorApplication.update({ where: { id: expired.id }, data: { uploadExpiresAt: new Date(Date.now() - 1000) } });
      assert.equal((await upload(expired, 'OTHER')).status, 403); assert.equal((await submit(expired)).status, 403);
      assert.equal((await detail(expired.id)).status, 'DRAFT');
    });
    await t.test('directory pagination is bounded and filtered independently of global status counts', async () => {
      const original = await prisma.vendorApplication.findUnique({ where: { id: receipt.id } });
      await prisma.vendorApplication.createMany({ data: Array.from({ length: 13 }, (_, index) => ({ ...original, id: randomUUID(), email: email(`paging-${index}`), submissionKey: randomUUID(), uploadTokenHash: randomUUID(), vendorCode: `QA-${randomUUID()}` })) });
      const pages = await Promise.all([1, 2].map(page => request(`/admin/vendors?view=directory&query=${prefix}-paging-&page=${page}`, { cookie: cookieFor(admin) })));
      assert.equal(pages[0].body.data.total, 13); assert.equal(pages[0].body.data.totalPages, 2);
      assert.equal(pages[0].body.data.items.length, 12); assert.equal(pages[1].body.data.items.length, 1);
      assert.equal(new Set(pages.flatMap(page => page.body.data.items.map(item => item.id))).size, 13);
      assert.ok(pages[0].body.data.counts.APPROVED >= 14); privateMetadataOnly(pages[0].body.data);
      assert.equal(messages.length, 0, 'Vendor empanelment does not send email or credentials');
    });
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    const vendors = await prisma.vendorApplication.findMany({ where: { email: { startsWith: prefix } }, select: { id: true } });
    await prisma.auditLog.deleteMany({ where: { entityType: 'VendorApplication', entityId: { in: vendors.map(vendor => vendor.id) } } });
    await prisma.vendorApplication.deleteMany({ where: { id: { in: vendors.map(vendor => vendor.id) } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
    await prisma.$disconnect(); mock.restoreAll();
  }
});
