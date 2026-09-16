import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("security CI gates dependency audit, secret scanning and CodeQL", () => {
  const workflow = read(".github/workflows/security-ci.yml");
  assert.match(workflow, /audit-runtime-deps\.mjs \${{ matrix\.workspace }}/);
  const auditWrapper = read("scripts/security/audit-runtime-deps.mjs");
  assert.match(auditWrapper, /entry\.devOptional !== true/);
  assert.match(auditWrapper, /entry\.dev !== true/);
  assert.match(auditWrapper, /runtimeNodes/);
  assert.match(workflow, /npm run test:patch-a/);
  assert.match(workflow, /npm run test:patch-b/);
  assert.match(workflow, /npm run test:patch-c/);
  assert.match(workflow, /npm run security:secrets/);
  assert.match(workflow, /github\/codeql-action\/init@v3/);
  assert.match(workflow, /github\/codeql-action\/analyze@v3/);
  const dependabot = read(".github/dependabot.yml");
  assert.match(dependabot, /directory: "\/server"/);
  assert.match(dependabot, /directory: "\/client"/);
  assert.match(dependabot, /package-ecosystem: "github-actions"/);
});

test("k6 suite covers the agreed production-like read surfaces and opt-in expensive flows", () => {
  const suite = read("load-tests/k6/platform.js");
  for (const route of [
    "/business/dashboard",
    "/business/attendance",
    "/workers/dashboard",
    "/placement-cell-applications/portal/candidates",
    "/technical-institute-applications/portal/opportunities",
    "/admin/system/metrics",
    "/chatbot/messages",
    "/internship-payments/checkout/",
    "/workers/profile/resume",
  ]) assert.ok(suite.includes(route), `missing load-test coverage for ${route}`);
  assert.match(suite, /p\(95\)<800/);
  assert.match(suite, /LOAD_CONFIRM_PROVIDER_TRAFFIC/);
  assert.match(suite, /LOAD_MUTATION_ACK/);
});

test("placement portal opportunity and application lists are truly paginated", () => {
  const schema = read("server/src/modules/placement-cells/placement-opportunities.schema.ts");
  const repo = read("server/src/modules/placement-cells/placement-opportunities.repository.ts");
  const controller = read("server/src/modules/placement-cells/placement-opportunities.controller.ts");
  assert.match(schema, /pageSize/);
  assert.match(repo, /skip,/);
  assert.match(repo, /take: query\.pageSize/);
  assert.match(repo, /prisma\.job\.count/);
  assert.match(repo, /prisma\.jobApplication\.count/);
  assert.match(repo, /distinct: \["engagementType"\]/);
  assert.match(controller, /opportunityTypes: result\.opportunityTypes/);
  assert.match(controller, /totalPages/);
  assert.doesNotMatch(repo, /take: 200/);
});

test("opportunity matching searches the paginated candidate API instead of silently using page one", () => {
  const component = read("client/src/components/placement/PlacementOpportunities.tsx");
  assert.match(component, /candidateQuery/);
  assert.match(component, /listPlacementCandidates\(\{/);
  assert.match(component, /search: candidateQuery \|\| undefined/);
  assert.match(component, /Showing \$\{candidateResults\.length\} of \$\{candidateTotal\}/);
});

test("application tracking performs server-side filtered pagination", () => {
  const component = read("client/src/components/placement/PlacementApplications.tsx");
  const service = read("client/src/services/placement-opportunities.service.ts");
  assert.match(component, /listPlacementApplications\(\{/);
  assert.match(component, /pageSize: PAGE_SIZE/);
  assert.match(service, /query\.set\("page"/);
  assert.match(service, /query\.set\("pageSize"/);
});
