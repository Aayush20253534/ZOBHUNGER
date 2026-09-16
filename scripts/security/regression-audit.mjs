import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const failures = [];

function filesUnder(dir, predicate = () => true) {
  const result = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const info = statSync(full);
    if (info.isDirectory()) result.push(...filesUnder(full, predicate));
    else if (predicate(full)) result.push(full);
  }
  return result;
}

function source(path) { return readFileSync(path, "utf8"); }
function assert(condition, message) { if (!condition) failures.push(message); }

const clientSources = filesUnder(join(root, "client/src"), file => /\.(?:ts|tsx)$/.test(file));
for (const file of clientSources) {
  const rel = relative(root, file).replaceAll("\\", "/");
  if (rel === "client/src/lib/api.ts") continue;
  assert(!/\bfetch\s*\(/.test(source(file)), `${rel} bypasses the shared timeout/cancellation API client with raw fetch()`);
}

const requestContext = source(join(root, "server/src/middlewares/request-context.middleware.ts"));
assert(requestContext.includes("sanitizeRequestTarget(req.originalUrl)"), "request logging must sanitize credential-bearing URLs");

const adminPermission = source(join(root, "server/src/middlewares/admin-permission.middleware.ts"));
assert(adminPermission.includes('code: "ADMIN_ROUTE_UNMAPPED"'), "admin RBAC must fail closed for unmapped route families");
assert(!adminPermission.includes("if (!match) return next();"), "admin RBAC regressed to fail-open behavior");

const placementRepo = source(join(root, "server/src/modules/placement-cells/placement-candidates.repository.ts"));
assert(placementRepo.includes("skip,") && placementRepo.includes("take: query.pageSize"), "placement candidate listing is no longer database-paginated");

const placementOpportunityRepo = source(join(root, "server/src/modules/placement-cells/placement-opportunities.repository.ts"));
assert(placementOpportunityRepo.includes("take: query.pageSize"), "placement opportunity/application pagination regressed to a fixed or unbounded list");
assert(placementOpportunityRepo.includes("prisma.job.count"), "placement opportunity pagination count query is missing");
assert(placementOpportunityRepo.includes("prisma.jobApplication.count"), "placement application pagination count query is missing");
const placementOpportunityUi = source(join(root, "client/src/components/placement/PlacementOpportunities.tsx"));
assert(placementOpportunityUi.includes("candidateQuery"), "placement opportunity candidate picker must search beyond candidate page one");

const technicalPortal = source(join(root, "server/src/modules/technical-institutes/technical-institute-portal.repository.ts"));
const technicalPortalService = source(join(root, "server/src/modules/technical-institutes/technical-institute-portal.service.ts"));
assert(technicalPortalService.includes("getTechnicalInstitutePortalOpportunityMatches"), "technical opportunity matching must remain on-demand");
assert(!/listTechnicalInstitutePortalOpportunities[\s\S]{0,5000}verifiedStudents/.test(technicalPortal), "technical opportunity listing is hydrating the verified roster again");

const compliance = source(join(root, "server/src/modules/compliance/compliance.service.ts"));
assert(compliance.includes("COMPLIANCE_EXPORT_MAX_ROWS"), "PF/ESIC export safety cap is missing");

const app = source(join(root, "server/src/app.ts"));
assert(app.includes("responseCompression"), "HTTP response compression middleware is missing");
assert(app.includes('express.json({ limit: "64kb" })'), "normal JSON body limit must remain bounded");

if (failures.length) {
  console.error("Regression audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Regression audit passed: Patch A/B safety invariants remain intact.");
