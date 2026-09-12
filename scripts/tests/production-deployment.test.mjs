import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { pages, protectedRoutes } from "../release-routes.mjs";
import { canonicalAliasOrigin, checkProductionDeployment } from "../production-deployment.mjs";

const revision = "c".repeat(40);
const canonical = "https://example.test";
const alias = "https://www.example.test";
const featureNames = [
  "businessPortal", "businessDashboard", "businessRequirements", "businessCandidates",
  "businessDeployments", "businessAttendance", "businessPhase2Complete",
  "productionFoundation", "productionDeployment",
];

const securityHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Strict-Transport-Security": "max-age=31536000",
  "Content-Security-Policy": "default-src 'self'; upgrade-insecure-requests",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "off",
  "X-Permitted-Cross-Domain-Policies": "none",
};

function html(path) {
  const privatePage = path === "/admin" || path.startsWith("/business/") || path === "/employee-joining" || path === "/login" || path === "/worker/login" || path === "/placement-portal";
  return new Response('<html><head><meta name="robots" content="noindex, nofollow"></head><body>ZOBHUNGER</body></html>', {
    status: 200,
    headers: {
      ...securityHeaders,
      ...(privatePage ? { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" } : {}),
    },
  });
}

function canonicalResponse(path) {
  if (path === "/api/release") return Response.json({
    service: "zobhunger-web",
    phase2ReleaseChecks: true,
    phase8ProductionDeployment: true,
    canonicalOrigin: canonical,
    revision,
  });
  if (path === "/api/backend/health/ready") return Response.json({
    status: "ready",
    service: "zobhunger-api",
    revision,
    checks: { database: true, privateFileStorage: true, email: true, publicApp: true, cache: "ready" },
  });
  if (path === "/api/backend/health") return Response.json({
    success: true,
    data: {
      service: "zobhunger-api",
      revision,
      publicAppOrigin: canonical,
      features: Object.fromEntries(featureNames.map(key => [key, true])),
    },
  });
  if (path.startsWith("/api/backend/")) return Response.json({ success: false, error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  return html(path);
}

function productionFetcher(overrides = {}) {
  return async (url, init) => {
    const parsed = new URL(url);
    if (parsed.origin === alias) {
      if (overrides.aliasResponse) return overrides.aliasResponse(parsed, init);
      return new Response(null, { status: 308, headers: { Location: `${canonical}${parsed.pathname}${parsed.search}` } });
    }
    if (overrides.canonicalResponse) {
      const response = overrides.canonicalResponse(parsed, init);
      if (response) return response;
    }
    return canonicalResponse(parsed.pathname);
  };
}

test("production deployment check verifies HTTPS, security headers, canonical origin alignment and www redirect", async () => {
  const report = await checkProductionDeployment(canonical, { fetcher: productionFetcher(), expectedRevision: revision });
  assert.equal(report.status, "passed");
  assert.equal(report.canonicalOrigin, canonical);
  assert.equal(report.aliasOrigin, alias);
  assert.equal(report.transport.https, true);
  assert.equal(report.transport.hsts, true);
  assert.equal(report.transport.canonicalRedirect, true);
});

test("canonical alias is derived deterministically in both directions", () => {
  assert.equal(canonicalAliasOrigin("https://example.test"), "https://www.example.test");
  assert.equal(canonicalAliasOrigin("https://www.example.test"), "https://example.test");
});

test("production deployment check rejects insecure or local canonical targets", async () => {
  await assert.rejects(checkProductionDeployment("http://example.test", { fetcher: productionFetcher() }), /HTTPS/);
  await assert.rejects(checkProductionDeployment("http://localhost:3000", { fetcher: productionFetcher() }), /public HTTPS/);
});

test("missing transport hardening fails the production gate", async () => {
  await assert.rejects(checkProductionDeployment(canonical, {
    fetcher: productionFetcher({ canonicalResponse(parsed) {
      if (parsed.pathname !== "/") return null;
      const response = html("/");
      const headers = new Headers(response.headers);
      headers.delete("Strict-Transport-Security");
      return new Response('<html><body>ZOBHUNGER</body></html>', { status: 200, headers });
    } }),
  }), /strict-transport-security/i);
});

test("non-permanent or misdirected www alias cannot pass", async () => {
  await assert.rejects(checkProductionDeployment(canonical, {
    fetcher: productionFetcher({ aliasResponse: () => new Response(null, { status: 302, headers: { Location: canonical } }) }),
  }), /permanently redirect/);
  await assert.rejects(checkProductionDeployment(canonical, {
    fetcher: productionFetcher({ aliasResponse: () => new Response(null, { status: 308, headers: { Location: "https://other.example/" } }) }),
  }), /instead of/);
});

test("production checker still exercises every read-only release page and protected route", async () => {
  const seen = new Set();
  await checkProductionDeployment(canonical, { fetcher: async (url, init) => {
    const parsed = new URL(url);
    seen.add(`${parsed.origin}${parsed.pathname}`);
    return productionFetcher()(url, init);
  } });
  for (const path of pages) assert.ok(seen.has(`${canonical}${path}`), `missing ${path}`);
  for (const path of protectedRoutes) assert.ok(seen.has(`${canonical}/api/backend${path}`), `missing protected ${path}`);
});


test("repository config enforces canonical host redirect and private-route transport guards", async () => {
  const [nextConfig, releaseRoute, healthController, serverApp] = await Promise.all([
    readFile(new URL("../../client/next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/app/api/release/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../../server/src/controllers/health.controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../../server/src/app.ts", import.meta.url), "utf8"),
  ]);
  for (const token of [
    'type: "host"', 'permanent: true', 'X-Robots-Tag', 'private, no-store',
    'Strict-Transport-Security', 'upgrade-insecure-requests', 'img-src \'self\' data: blob: https:',
  ]) assert.ok(nextConfig.includes(token), `next.config.ts missing ${token}`);
  assert.ok(releaseRoute.includes("phase8ProductionDeployment: true"));
  assert.ok(releaseRoute.includes("canonicalOrigin"));
  assert.ok(healthController.includes("productionDeployment: true"));
  assert.ok(healthController.includes("publicAppOrigin"));
  assert.ok(serverApp.includes("strictTransportSecurity"));
});
