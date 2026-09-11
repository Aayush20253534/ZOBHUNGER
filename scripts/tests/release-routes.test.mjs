import assert from "node:assert/strict";
import { test } from "node:test";
import { checkRelease, pages, protectedRoutes, siteOrigin } from "../release-routes.mjs";

const revision = "a".repeat(40);
function response(path) {
  if (path === "/api/release") return Response.json({ service: "zobhunger-web", phase2ReleaseChecks: true, revision });
  if (path === "/api/backend/health/ready") return Response.json({ status: "ready", service: "zobhunger-api", revision, checks: { database: true, privateFileStorage: true, email: true, publicApp: true, cache: "ready" } });
  if (path === "/api/backend/health") return Response.json({ success: true, data: { service: "zobhunger-api", revision, features: Object.fromEntries(["businessPortal", "businessDashboard", "businessRequirements", "businessCandidates", "businessDeployments", "businessAttendance", "businessPhase2Complete", "productionFoundation"].map(key => [key, true])) } });
  if (path.startsWith("/api/backend/")) return Response.json({ success: false, error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  return new Response('<html><head><meta name="robots" content="noindex, nofollow"></head><body>ZOBHUNGER</body></html>', { headers: { "Content-Type": "text/html" } });
}
const fetcher = async url => response(new URL(url).pathname);
test("release checks are read-only and cover every listed route through the frontend", async () => {
  const requests = [];
  const report = await checkRelease("https://example.test", { expectedRevision: revision, fetcher: async (url, init) => {
    requests.push(new URL(url).pathname);
    assert.equal(init.method, "GET"); assert.equal(init.credentials, "omit"); assert.equal(init.redirect, "error");
    assert.equal(init.body, undefined); assert.equal(init.headers.Cookie, undefined);
    return fetcher(url);
  } });
  assert.equal(report.status, "passed"); assert.equal(report.revisionCheck, "expected_commit_verified");
  assert.equal(requests.length, pages.length + protectedRoutes.length + 3);
  assert.ok(report.notVerified.includes("Live provider email delivery"));
});
test("unknown revisions are never reported as a matched deployment", async () => {
  const missing = async url => {
    const res = await fetcher(url);
    if (!url.endsWith("/api/release")) return res;
    return Response.json({ ...await res.json(), revision: null });
  };
  assert.equal((await checkRelease("http://localhost:3000", { fetcher: missing })).revisionCheck, "not_verified");
  await assert.rejects(checkRelease("https://example.test", { fetcher: missing, expectedRevision: revision }), /expected revision/);
});
test("mismatched frontend and API commits fail", async () => {
  await assert.rejects(checkRelease("https://example.test", { fetcher: async url => url.endsWith("/api/release") ? Response.json({ service: "zobhunger-web", phase2ReleaseChecks: true, revision: "b".repeat(40) }) : fetcher(url) }), /revisions differ/);
});
test("HTML error pages and missing backend modules cannot pass as a healthy API", async () => {
  for (const bad of [new Response("Gateway failure", { status: 502 }), new Response("<html>404</html>", { headers: { "Content-Type": "text/html" } }), Response.json({ success: true, data: { service: "zobhunger-api", features: {} } })]) {
    await assert.rejects(checkRelease("https://example.test", { fetcher: async () => bad }));
  }
});
test("incorrect auth gates, missing noindex metadata and redirects fail", async () => {
  for (const [target, bad] of [
    ["/api/backend/business/workspace", Response.json({ success: true }, { status: 200 })],
    ["/api/backend/business/reports", Response.json({ success: false, error: { code: "NOT_FOUND" } }, { status: 401 })],
    ["/business/login", new Response("<html>ZOBHUNGER</html>", { headers: { "Content-Type": "text/html" } })],
  ]) await assert.rejects(checkRelease("https://example.test", { fetcher: async url => new URL(url).pathname === target ? bad : fetcher(url) }));
  await assert.rejects(checkRelease("https://example.test", { fetcher: async () => { throw new Error("Redirect"); } }), /redirected/);
});
test("rejects unsafe or ambiguous target input before making requests", () => {
  for (const value of ["http://example.test", "https://user:secret@example.test", "https://example.test/api/v1", "https://example.test/?token=x", "ftp://example.test", "invalid"]) assert.throws(() => siteOrigin(value));
  assert.equal(siteOrigin("https://example.test/"), "https://example.test");
});
