import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const text = relative => readFile(path.join(root, relative), "utf8");

async function adminPageRoutes(dir = path.join(root, "client/src/app/admin"), segments = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  const routes = [];
  for (const entry of entries) {
    if (entry.isDirectory()) routes.push(...await adminPageRoutes(path.join(dir, entry.name), [...segments, entry.name]));
    if (entry.isFile() && entry.name === "page.tsx") routes.push(`/admin${segments.length ? `/${segments.join("/")}` : ""}`);
  }
  return routes;
}

function normalizeDynamic(route) {
  return route.replace(/\/\[[^/]+\]/g, "");
}

test("all existing admin pages remain registered in the permission-aware navigation surface", async () => {
  const nav = await text("client/src/data/admin-navigation.ts");
  const hrefs = [...nav.matchAll(/href:\s*"(\/admin[^"]*)"/g)].map(match => match[1]);
  const pages = await adminPageRoutes();
  const uncovered = pages
    .filter(route => route !== "/admin/security")
    .filter(route => {
      const normalized = normalizeDynamic(route);
      return hrefs.some(href => href === "/admin" ? normalized === href : normalized === href || normalized.startsWith(`${href}/`));
    })
    .length;
  assert.equal(uncovered, pages.filter(route => route !== "/admin/security").length);
});

test("admin shell fails closed for department routes and persists the collapsible navigation preference", async () => {
  const shell = await text("client/src/components/admin/AdminShell.tsx");
  const nav = await text("client/src/data/admin-navigation.ts");
  assert.match(shell, /routeRegistered/);
  assert.match(shell, /isMainAdministration/);
  assert.match(shell, /granted\.has\(matchedItem\.permission\)/);
  assert.match(shell, /localStorage\.getItem\(SIDEBAR_STORAGE_KEY\)/);
  assert.match(shell, /localStorage\.setItem\(SIDEBAR_STORAGE_KEY/);
  assert.match(nav, /return items\.find/);
  assert.doesNotMatch(nav, /\?\? items\[0\]/);
});

test("department overview is genuinely adaptive instead of rendering a partially empty main-admin dashboard", async () => {
  const experience = await text("client/src/data/admin-experience.ts");
  const dashboard = await text("client/src/components/admin/AdminDashboard.tsx");
  for (const department of ["MAIN_ADMIN", "HR", "TECHNICAL", "PLACEMENT_CELL", "LEGAL"]) assert.match(experience, new RegExp(`${department}:`));
  assert.match(dashboard, /adminDepartmentProfile/);
  assert.match(dashboard, /profile\.headline/);
  assert.match(dashboard, /zbo-dashboard-scope/);
  assert.match(dashboard, /zbo-dashboard-empty-state/);
  assert.match(dashboard, /Least-privilege workspace/);
  assert.match(dashboard, /workspaceLinks\.length \+ 1/);
  assert.match(dashboard, /\/admin#latest-jobs/);
  assert.match(dashboard, /\/admin#recent-applications/);
  assert.match(dashboard, /data\.placementCellApplications && data\.placementCellApplications\.total > 0 && <QueueItem/);
});

test("admin route loading, error and not-found states are branded and stay inside the secure shell", async () => {
  const loading = await text("client/src/app/admin/loading.tsx");
  const error = await text("client/src/app/admin/error.tsx");
  const notFound = await text("client/src/app/admin/not-found.tsx");
  const state = await text("client/src/components/admin/AdminRouteState.tsx");
  assert.match(loading, /Loading secure workspace/);
  assert.match(error, /This desk could not be loaded/);
  assert.match(notFound, /AdminRouteState/);
  assert.match(state, /zbo-admin-route-state/);
});

test("sidebar wordmark keeps ZOBHUNGER at one size and uses the footer red recipe", async () => {
  const shell = await text("client/src/components/admin/AdminShell.tsx");
  const css = await text("client/src/styles/admin-portal.css");
  const footer = await text("client/src/styles/footer-business.css");
  assert.match(shell, /<strong aria-hidden="true"><span>ZOB<\/span><span>HUNGER<\/span><\/strong>/);
  assert.match(css, /\.zbo-admin-wordmark strong span[\s\S]*font:\s*inherit/);
  for (const token of ["#f42642", "#e21d36", "#c91530"]) {
    assert.match(css, new RegExp(token));
    assert.match(footer, new RegExp(token));
  }
});
