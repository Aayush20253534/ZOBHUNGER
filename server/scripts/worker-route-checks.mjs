import assert from "node:assert/strict";

// Only unauthenticated/invalid requests: safe in the build process without a DB.
export async function checkWorkerRoutes(apiBase) {
  const base = apiBase.replace(/\/$/, "");
  const origin = new URL(base).origin;
  for (const method of ["GET", "HEAD"]) {
    const result = await fetch(`${origin}/route`, { method });
    assert.equal(result.status, 200, `${method} /route must be mounted`);
    assert.equal(result.headers.get("cache-control"), "no-store");
    if (method === "GET") assert.equal((await result.json()).status, "ok");
  }
  for (const path of ["/workers/workspace", "/workers/dashboard", "/workers/profile", "/workers/profile/resume", "/workers/jobs", "/workers/jobs/facets", "/workers/jobs/example", "/workers/saved-jobs", "/workers/applications", "/workers/applications/example", "/workers/assignments", "/workers/assignments/example", "/workers/assignments/example/calendar", "/workers/attendance", "/workers/earnings", "/workers/earnings/example", "/admin/worker-applications", "/admin/worker-attendance", "/admin/earnings", "/admin/earnings/assignments", "/admin/earnings/example"]) {
    assert.equal((await fetch(`${base}${path}`)).status, 401, `${path} must be mounted and protected`);
  }
  for (const path of ["register", "login", "resend-verification", "forgot-password", "verify-email", "reset-password"]) {
    assert.equal((await fetch(`${base}/auth/worker/${path}`, { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" }, body: "{}" })).status, 400, `Worker ${path} must validate before accessing the database`);
  }
}
