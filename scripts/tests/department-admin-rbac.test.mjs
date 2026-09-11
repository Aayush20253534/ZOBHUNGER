import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const text = (relative) => readFile(path.join(root, relative), "utf8");

test("department RBAC migration upgrades legacy admins without creating a lockout", async () => {
  const dirs = (await readdir(path.join(root, "server/prisma/migrations"))).filter((name) => /^\d+/.test(name)).sort();
  assert.ok(dirs.includes("20260914100000_department_admin_rbac"));
  const sql = await text("server/prisma/migrations/20260914100000_department_admin_rbac/migration.sql");
  assert.match(sql, /CREATE TYPE "AdminDepartment"/);
  assert.match(sql, /CREATE TYPE "AdminPermission"/);
  assert.match(sql, /"adminDepartment" = 'MAIN_ADMIN'/);
  assert.match(sql, /WHERE "role" = 'ADMIN'/);
  assert.match(sql, /'ADMIN_USERS_MANAGE'/);
  assert.match(sql, /CREATE TABLE "AdminInviteToken"/);
});

test("admin API applies MFA then deny-by-permission before every existing admin module", async () => {
  const routes = await text("server/src/modules/admin/admin.routes.ts");
  const middleware = await text("server/src/middlewares/admin-permission.middleware.ts");
  assert.ok(routes.indexOf("requireAdminMfa") < routes.indexOf("requireMappedAdminPermission"));
  assert.ok(routes.indexOf("requireMappedAdminPermission") < routes.indexOf('adminRouter.use("/access"'));
  for (const route of [
    "overview", "access", "enquiries", "partners", "partner-applications", "vendors", "careers",
    "employee-joining", "worker-applications", "candidate-management", "requirement-jobs", "requirements",
    "jobs", "applications", "deployments", "attendance", "worker-attendance", "attendance-approvals",
    "earnings", "reports", "placement-cell-applications",
  ]) assert.match(middleware, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(middleware, /ADMIN_USERS_MANAGE/);
});

test("department policy stays least-privilege and Main Administration is protected", async () => {
  const policy = await text("server/src/modules/admin-access/admin-access.policy.ts");
  const service = await text("server/src/modules/admin-access/admin-access.service.ts");
  assert.match(policy, /AdminDepartment\.HR/);
  assert.match(policy, /AdminDepartment\.TECHNICAL/);
  assert.match(policy, /AdminDepartment\.PLACEMENT_CELL/);
  assert.match(policy, /AdminDepartment\.LEGAL/);
  assert.match(service, /MAIN_ADMIN_PROTECTED/);
  assert.match(service, /ADMIN_SELF_DISABLE/);
  assert.match(service, /sessionVersion: \{ increment: 1 \}/);
  assert.match(service, /randomBytes\(32\)\.toString\("base64url"\)/);
  assert.match(service, /sha256/);
  assert.match(service, /48 \* 60 \* 60 \* 1000/);
});

test("invitation activation is one-time, rate-limited and does not leak the credential through query strings", async () => {
  const service = await text("server/src/modules/admin-access/admin-access.service.ts");
  const authRoutes = await text("server/src/modules/auth/auth.routes.ts");
  const activation = await text("client/src/components/admin/AdminAccessActivation.tsx");
  const page = await text("client/src/app/admin-access/activate/page.tsx");
  assert.match(service, /\/admin-access\/activate#token=/);
  assert.match(service, /FOR UPDATE/);
  assert.match(service, /adminInviteToken\.delete/);
  assert.match(authRoutes, /admin-access", authRateLimiter/);
  assert.match(activation, /window\.location\.hash/);
  assert.match(activation, /history\.replaceState/);
  assert.match(page, /index: false/);
  assert.match(page, /referrer: "no-referrer"/);
});

test("admin navigation and overview are permission-aware instead of cosmetic RBAC", async () => {
  const shell = await text("client/src/components/admin/AdminShell.tsx");
  const nav = await text("client/src/data/admin-navigation.ts");
  const dashboard = await text("client/src/components/admin/AdminDashboard.tsx");
  const serverOverview = await text("server/src/modules/admin/admin.service.ts");
  assert.match(shell, /granted\.has\(item\.permission\)/);
  assert.match(shell, /This workspace is outside your access/);
  assert.match(nav, /\/admin\/access/);
  assert.match(nav, /ADMIN_USERS_MANAGE/);
  assert.match(dashboard, /\/admin\/overview/);
  assert.match(serverOverview, /adminOverviewForPermissions/);
  assert.match(serverOverview, /granted\.has\(AdminPermission\./);
});

test("access-management and activation surfaces keep the secure corporate shell", async () => {
  const access = await text("client/src/components/admin/AdminAccessManagement.tsx");
  const siteFrame = await text("client/src/components/layout/SiteFrame.tsx");
  const css = await text("client/src/styles/admin-access.css");
  const activationCss = await text("client/src/styles/admin-access-activation.css");
  assert.match(access, /Department admin access, without separate portals/);
  assert.match(access, /Add administrator/);
  assert.match(access, /MFA required after activation/);
  assert.match(siteFrame, /zb-admin-activation-root/);
  assert.match(css, /zba-access-hero/);
  assert.match(activationCss, /zb-admin-activation-root/);
});
