import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = new URL("../", import.meta.url);
const rootPath = root.pathname;

async function walk(directory, predicate) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(target, predicate));
    else if (predicate(target)) output.push(target);
  }
  return output;
}

function appRoute(file) {
  const raw = relative(join(rootPath, "client/src/app"), file).replaceAll("\\", "/").replace(/(^|\/)page\.tsx$/, "");
  const parts = raw.split("/").filter(part => part && !(part.startsWith("(") && part.endsWith(")")));
  return `/${parts.join("/")}`.replace(/\/$/, "") || "/";
}

function requireIncludes(source, values, label) {
  const missing = values.filter(value => !source.includes(value));
  if (missing.length) throw new Error(`${label} is missing: ${missing.join(", ")}`);
}

const clientPages = (await walk(join(rootPath, "client/src/app"), file => file.endsWith("/page.tsx"))).map(appRoute).sort();
const serverRouteFiles = await walk(join(rootPath, "server/src"), file => file.endsWith(".routes.ts"));
const migrations = (await readdir(join(rootPath, "server/prisma/migrations"), { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
const routeIndex = await readFile(join(rootPath, "server/src/routes/index.ts"), "utf8");
const serverApp = await readFile(join(rootPath, "server/src/app.ts"), "utf8");
const clientEnv = await readFile(join(rootPath, "client/.env.example"), "utf8");
const serverEnv = await readFile(join(rootPath, "server/.env.example"), "utf8");
const adminLayout = await readFile(join(rootPath, "client/src/app/admin/layout.tsx"), "utf8");

requireIncludes(routeIndex, [
  '"/auth"', '"/business"', '"/workers"', '"/articles"', '"/admin"', '"/jobs"',
  '"/contact"', '"/requirements"', '"/partner-applications"', '"/placement-cell-applications"',
  '"/career-applications"', '"/vendor-applications"', '"/employee-joining"',
], "API router");
requireIncludes(serverApp, ['"/api/v1/health"', '"/api/v1/health/ready"'], "API health surface");
requireIncludes(clientEnv, ["NEXT_PUBLIC_DATA_MODE", "NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_SITE_URL"], "client/.env.example");
requireIncludes(serverEnv, [
  "CLIENT_ORIGIN", "PUBLIC_APP_URL", "DATABASE_URL", "JWT_SECRET", "MFA_ENCRYPTION_KEY", "HR_PII_ENCRYPTION_KEY",
  "REDIS_ENABLED", "RESEND_API_KEY", "MAIL_FROM_EMAIL", "SALES_TEAM_EMAIL", "CLOUDINARY_CLOUD_NAME",
], "server/.env.example");
if (!adminLayout.includes("robots") || !adminLayout.includes("index: false")) throw new Error("Admin layout must apply noindex metadata to the complete admin route family.");
if (migrations.length < 1) throw new Error("No committed Prisma migrations were found.");

console.log(JSON.stringify({
  status: "passed",
  scope: "Phase 3 Part 1 production foundation",
  inventory: {
    frontendPageRoutes: clientPages.length,
    backendRouteModules: serverRouteFiles.length,
    prismaMigrations: migrations.length,
  },
  checks: {
    apiFamiliesMounted: true,
    environmentContractsPresent: true,
    adminRoutesNoIndex: true,
    prismaMigrationHistoryPresent: true,
  },
}, null, 2));
