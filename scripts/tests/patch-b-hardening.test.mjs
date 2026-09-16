import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

function functionBlock(source, name) {
  const start = source.indexOf(`function ${name}`) >= 0 ? source.indexOf(`function ${name}`) : source.indexOf(` ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  const next = source.indexOf("\nexport ", start + 20);
  return source.slice(start, next === -1 ? source.length : next);
}

test("placement candidate listing is database paginated and returns pagination metadata", () => {
  const schema = read("server/src/modules/placement-cells/placement-candidates.schema.ts");
  const repository = read("server/src/modules/placement-cells/placement-candidates.repository.ts");
  const controller = read("server/src/modules/placement-cells/placement-candidates.controller.ts");
  assert.match(schema, /page:\s*z\.coerce\.number\(\).*default\(1\)/s);
  assert.match(schema, /pageSize:[\s\S]*?max\(100\)[\s\S]*?default\(25\)/);
  assert.match(repository, /skip:\s*\(query\.page - 1\) \* query\.pageSize|const skip = \(query\.page - 1\) \* query\.pageSize/);
  assert.match(repository, /take:\s*query\.pageSize/);
  assert.match(repository, /placementCandidate\.count\(\{ where \}\)/);
  assert.match(controller, /totalPages:\s*result\.totalPages/);
});

test("technical opportunity list no longer hydrates the entire institute roster", () => {
  const repository = read("server/src/modules/technical-institutes/technical-institute-portal.repository.ts");
  const start = repository.indexOf("technicalInstitutePortalOpportunityData");
  const end = repository.indexOf("listTechnicalInstitutePortalApplications", start);
  const block = repository.slice(start, end);
  assert.doesNotMatch(block, /technicalStudent\.findMany/);
  assert.match(block, /technicalOpportunityApplication\.groupBy/);
  assert.match(block, /take:\s*query\.pageSize/);
});

test("technical matching is on-demand and bounded", () => {
  const repository = read("server/src/modules/technical-institutes/technical-opportunities.repository.ts");
  const routes = read("server/src/modules/technical-institutes/technical-institutes.routes.ts");
  const portalClient = read("client/src/components/technical-institute-portal/TechnicalInstitutePortalOpportunities.tsx");
  assert.match(repository, /take:\s*env\.TECHNICAL_MATCH_SCAN_LIMIT \+ 1/);
  assert.match(repository, /rows\.slice\(0, env\.TECHNICAL_MATCH_SCAN_LIMIT\)/);
  assert.match(routes, /\/portal\/opportunities\/:opportunityId\/matches/);
  assert.match(portalClient, /getTechnicalInstitutePortalOpportunityMatches/);
});

test("technical and compliance exports reject oversized result sets before unbounded processing", () => {
  const technicalService = read("server/src/modules/technical-institutes/technical-institute-portal.service.ts");
  const compliance = read("server/src/modules/compliance/compliance.service.ts");
  assert.match(technicalService, /TECHNICAL_REPORT_EXPORT_MAX_ROWS \+ 1/);
  assert.match(technicalService, /TECHNICAL_REPORT_EXPORT_TOO_LARGE/);
  assert.match(compliance, /employeeJoining\.count\(\{ where \}\)/);
  assert.match(compliance, /COMPLIANCE_EXPORT_TOO_LARGE/);
  assert.equal((compliance.match(/take:\s*env\.COMPLIANCE_EXPORT_MAX_ROWS/g) ?? []).length, 2);
});

test("private uploads are malware-scanned before storage and fail closed per-upload when scanning is unavailable", () => {
  const env = read("server/src/config/env.ts");
  const storage = read("server/src/services/private-file-storage.ts");
  const scanner = read("server/src/services/malware-scan.service.ts");
  assert.doesNotMatch(env, /FILE_MALWARE_SCAN_PROVIDER must be clamav or http in production/);
  assert.match(scanner, /env\.NODE_ENV === "production"[\s\S]*?scannerUnavailable\(\)/);
  const scanIndex = storage.indexOf("await scanUploadedFile");
  const uploadIndex = storage.indexOf('storageProviderRequest(() => fetch(cloudinaryApi("raw", "upload")');
  assert.ok(scanIndex >= 0 && uploadIndex > scanIndex, "scan must run before Cloudinary upload");
  assert.match(scanner, /FILE_MALWARE_DETECTED/);
  assert.match(scanner, /FILE_SCAN_UNAVAILABLE/);
});

test("paid providers have usage safety budgets and failure circuit breakers", () => {
  const budget = read("server/src/operations/provider-budget.ts");
  const circuit = read("server/src/operations/provider-circuit.ts");
  const groq = read("server/src/modules/chatbot/groq.client.ts");
  const gemini = read("server/src/modules/chatbot/rag/embedding.client.ts");
  const resend = read("server/src/services/resend.client.ts");
  const storage = read("server/src/services/private-file-storage.ts");
  assert.match(budget, /INCRBY/);
  assert.match(budget, /ProviderBudgetExceededError/);
  assert.match(circuit, /provider\.circuit_open/);
  for (const source of [groq, gemini, resend, storage]) assert.match(source, /consumeProviderBudget|guardedProviderRequest/);
});

test("observability records slow requests, protected metrics and external error forwarding", () => {
  const requestContext = read("server/src/middlewares/request-context.middleware.ts");
  const adminRoutes = read("server/src/modules/admin/admin.routes.ts");
  const monitor = read("server/src/observability/error-monitor.ts");
  const health = read("server/src/controllers/health.controller.ts");
  assert.match(requestContext, /requestMetricStarted\(\)/);
  assert.match(requestContext, /request\.slow/);
  assert.match(adminRoutes, /\/system\/metrics/);
  assert.match(health, /httpMetricsSnapshot\(\)/);
  assert.match(monitor, /ERROR_MONITORING_WEBHOOK_URL/);
  assert.match(monitor, /sanitizeLogContext/);
});

test("client route errors are reported through a bounded telemetry endpoint", () => {
  const routes = read("server/src/routes/index.ts");
  const schema = read("server/src/modules/telemetry/telemetry.schema.ts");
  const client = read("client/src/lib/client-monitoring.ts");
  const businessError = read("client/src/app/business/error.tsx");
  assert.match(routes, /apiRouter\.use\("\/telemetry", telemetryRouter\)/);
  assert.match(schema, /message:[\s\S]*?max\(800\)/);
  assert.match(client, /timeoutMs:\s*5_000/);
  assert.match(businessError, /reportClientError/);
});
