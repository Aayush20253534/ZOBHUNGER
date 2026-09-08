import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";
import { checkBusinessRoutes } from "../scripts/business-route-checks.mjs";

async function withApi(override, run) {
  const seen = [];
  const server = createServer(async (req, res) => {
    let text = "";
    for await (const chunk of req) text += chunk;
    seen.push({ method: req.method, path: req.url, body: text, cookie: req.headers.cookie });
    const path = req.url.replace(/^\/api\/v1/, "");
    const custom = override(path, req.method);
    const protectedRoute = path.startsWith("/business/");
    const status = custom?.status ?? (path === "/health" ? 200 : protectedRoute ? 401 : 400);
    const body = custom?.body ?? (path === "/health"
      ? { success: true, data: { features: { businessPortal: true, businessDashboard: true, businessRequirements: true, businessCandidates: true, businessAttendance: true } } }
      : { success: false, error: { code: protectedRoute ? "UNAUTHENTICATED" : "VALIDATION_ERROR" } });
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  try { await run(`http://127.0.0.1:${server.address().port}/api/v1`, seen); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

test("deployment check probes real route methods without login data or cookies", async () => {
  await withApi(() => undefined, async (base, seen) => {
    const results = await checkBusinessRoutes(base);
    assert.equal(results.length, 20);
    assert.ok(seen.some(request => request.path.endsWith("/auth/business-login") && request.method === "POST"));
    assert.ok(seen.every(request => !request.cookie));
    assert.ok(seen.filter(request => request.method !== "GET").every(request => request.body === "{}"));
  });
});
test("a healthy old API is rejected when it lacks the business deployment marker", async () => {
  await withApi(path => path === "/health" ? { body: { success: true, data: { status: "ok" } } } : undefined,
    base => assert.rejects(checkBusinessRoutes(base), /latest backend commit/));
});
for (const missing of ["/business/attendance", "/business/attendance/corrections", "/business/attendance/assignments/deployment-check", "/business/attendance/assignments/deployment-check/day", "/business/attendance/assignments/deployment-check/corrections", "/business/workspace", "/business/profile", "/business/dashboard", "/business/requirements/deployment-check", "/auth/business-login", "/auth/business/forgot-password", "/auth/business/reset-password"]) {
  test(`deployment check rejects missing ${missing}`, async () => {
    await withApi(path => path === missing ? { status: 404 } : undefined,
      base => assert.rejects(checkBusinessRoutes(base), error => error.message.includes(missing) && error.message.includes("404")));
  });
}
test("a route accidentally made public cannot satisfy the protected workspace check", async () => {
  await withApi(path => path === "/business/workspace" ? { status: 200 } : undefined,
    base => assert.rejects(checkBusinessRoutes(base), /expected 401, received 200/));
});
for (const [method, path] of [["GET", "/business/candidates"], ["GET", "/business/candidates/deployment-check"], ["POST", "/business/candidates/deployment-check/reviews"], ["GET", "/business/requirements"], ["POST", "/business/requirements"], ["PUT", "/business/requirements/deployment-check"], ["POST", "/business/requirements/deployment-check/withdraw"]]) {
  test(`deployment check rejects missing ${method} ${path}`, async () => {
    await withApi((actualPath, actualMethod) => actualPath === path && actualMethod === method ? { status: 404 } : undefined,
      base => assert.rejects(checkBusinessRoutes(base), /received 404/));
  });
}
