import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const text = relative => readFile(path.join(root, relative), "utf8");

test("Patch A sanitizes request/log credentials before structured logging", async () => {
  const [requestContext, errorMiddleware, notFound, logger, sanitizer] = await Promise.all([
    text("server/src/middlewares/request-context.middleware.ts"),
    text("server/src/middlewares/error.middleware.ts"),
    text("server/src/middlewares/not-found.middleware.ts"),
    text("server/src/utils/logger.ts"),
    text("server/src/utils/log-sanitizer.ts"),
  ]);
  assert.match(requestContext, /sanitizeRequestTarget\(req\.originalUrl\)/);
  assert.match(errorMiddleware, /sanitizeRequestTarget\(req\.originalUrl\)/);
  assert.match(notFound, /sanitizeRequestTarget\(req\.originalUrl\)/);
  assert.match(logger, /sanitizeLogContext/);
  assert.match(logger, /redactSensitiveText/);
  assert.match(sanitizer, /checkout/);
  assert.match(sanitizer, /access_token/);
  assert.match(sanitizer, /authorization/);
});

test("Patch A makes production admin MFA mandatory and RBAC fail closed", async () => {
  const [mfa, mfaService, permission, authService] = await Promise.all([
    text("server/src/middlewares/admin-mfa.middleware.ts"),
    text("server/src/modules/auth/admin-mfa.service.ts"),
    text("server/src/middlewares/admin-permission.middleware.ts"),
    text("server/src/modules/auth/auth.service.ts"),
  ]);
  assert.match(mfa, /env\.NODE_ENV === "production"/);
  assert.match(mfa, /ADMIN_MFA_ENROLLMENT_REQUIRED/);
  assert.match(mfaService, /ADMIN_MFA_REQUIRED_IN_PRODUCTION/);
  assert.match(authService, /adminMfaEnrollmentRequired/);
  assert.match(permission, /ADMIN_ROUTE_UNMAPPED/);
  assert.doesNotMatch(permission, /if \(!match\) return next\(\)/);
});

test("Patch A expires receipt access tokens and keeps anonymous health minimal", async () => {
  const [payment, env, health, routes] = await Promise.all([
    text("server/src/modules/internship-payments/internship-payments.service.ts"),
    text("server/src/config/env.ts"),
    text("server/src/controllers/health.controller.ts"),
    text("server/src/modules/admin/admin.routes.ts"),
  ]);
  assert.match(env, /PAYMENT_RECEIPT_TOKEN_TTL_SECONDS/);
  assert.match(payment, /expiresAtSeconds/);
  assert.match(payment, /internship-document-receipt:v2/);
  assert.match(payment, /expiresAtSeconds <= Math\.floor\(now \/ 1000\)/);
  assert.match(health, /getDetailedHealth/);
  assert.match(routes, /\/system\/health/);
  const publicHealthBody = health.slice(health.indexOf("export const getHealth"), health.indexOf("export const getReadiness"));
  assert.doesNotMatch(publicHealthBody, /features|publicAppOrigin|chatbotOperationalStatus/);
});

test("Patch A applies browser request timeouts to JSON and raw API transport", async () => {
  const api = await text("client/src/lib/api.ts");
  assert.match(api, /DEFAULT_API_TIMEOUT_MS = 25_000/);
  assert.match(api, /UPLOAD_API_TIMEOUT_MS = 60_000/);
  assert.match(api, /EXPORT_API_TIMEOUT_MS = 90_000/);
  assert.match(api, /REQUEST_TIMEOUT/);
  assert.match(api, /apiRawFetch/);
  assert.match(api, /responseWithControlledBody/);

  const clientSource = await Promise.all([
    text("client/src/components/hr/AdminEmployeeJoining.tsx"),
    text("client/src/components/worker/WorkflowUI.tsx"),
    text("client/src/components/worker/WorkerEarnings.tsx"),
    text("client/src/services/admin-compliance.service.ts"),
    text("client/src/services/phase2.service.ts"),
    text("client/src/services/technical-institute-portal.service.ts"),
    text("client/src/services/worker.service.ts"),
    text("client/src/lib/chatbot.ts"),
  ]);
  for (const source of clientSource) assert.doesNotMatch(source, /fetch\(["'`]\/api\/backend/);
});

test("Patch A installs buffered response compression and key route boundaries", async () => {
  const [app, compression] = await Promise.all([
    text("server/src/app.ts"),
    text("server/src/middlewares/response-compression.middleware.ts"),
  ]);
  assert.match(app, /app\.use\(responseCompression\)/);
  assert.match(compression, /brotliCompressSync/);
  assert.match(compression, /gzipSync/);
  for (const relative of [
    "client/src/app/business/loading.tsx",
    "client/src/app/business/error.tsx",
    "client/src/app/worker/loading.tsx",
    "client/src/app/placement-portal/loading.tsx",
    "client/src/app/placement-portal/error.tsx",
    "client/src/app/technical-institute-portal/loading.tsx",
    "client/src/app/technical-institute-portal/error.tsx",
  ]) {
    assert.ok((await stat(path.join(root, relative))).size > 0, `${relative} is empty`);
  }
});
