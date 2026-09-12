import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  checkFinalAcceptance,
  NOINDEX_ENTRY_ROUTES,
  PROTECTED_API_ROUTES,
  PUBLIC_FORM_ROUTES,
} from "../final-acceptance.mjs";

const canonical = "https://example.test";
const revision = "d".repeat(40);

const html = ({ noindex = false, body = "ZOBHUNGER", viewport = true, lang = true } = {}) => `<!doctype html><html${lang ? ' lang="en-IN"' : ""}><head>${viewport ? '<meta name="viewport" content="width=device-width, initial-scale=1">' : ""}${noindex ? '<meta name="robots" content="noindex, follow">' : ""}</head><body>${body}</body></html>`;

function fakeFetcher(overrides = {}) {
  return async (url) => {
    const parsed = new URL(url);
    const key = `${parsed.pathname}${parsed.search}`;
    if (overrides[key]) return overrides[key](parsed);

    if (parsed.pathname === "/api/release") return Response.json({
      service: "zobhunger-web",
      phase8ProductionDeployment: true,
      phase9SeoIndexing: true,
      phase10ProductionAcceptance: true,
      canonicalOrigin: canonical,
      revision,
    });
    if (parsed.pathname === "/api/backend/health") return Response.json({
      success: true,
      data: {
        service: "zobhunger-api",
        publicAppOrigin: canonical,
        features: { productionDeployment: true, chatbot: true },
      },
    });
    if (parsed.pathname === "/api/backend/health/ready") return Response.json({
      status: "ready",
      service: "zobhunger-api",
      checks: { database: true, privateFileStorage: true, email: true, publicApp: true, cache: "ready" },
    });
    if (parsed.pathname.startsWith("/api/backend/")) {
      return Response.json({ success: false, error: { code: "UNAUTHENTICATED" } }, { status: 401 });
    }
    if (parsed.pathname === "/manifest.webmanifest") {
      return new Response('{"name":"ZOBHUNGER"}', { status: 200, headers: { "Content-Type": "application/manifest+json" } });
    }
    if (parsed.pathname === "/opengraph-image") {
      return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "Content-Type": "image/png" } });
    }
    if (parsed.pathname === "/__phase10-final-acceptance-not-found__") {
      return new Response(html({ body: "ZOBHUNGER Page not found" }), { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    const noindex = NOINDEX_ENTRY_ROUTES.includes(parsed.pathname);
    return new Response(html({ noindex }), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  };
}

const productionCheck = async () => ({ status: "passed", scope: "production" });
const seoCheck = async () => ({ status: "passed", scope: "seo" });

test("final acceptance composes production, SEO, readiness, portal, form, asset and error-state checks", async () => {
  const report = await checkFinalAcceptance(canonical, {
    fetcher: fakeFetcher(),
    expectedRevision: revision,
    productionCheck,
    seoCheck,
  });
  assert.equal(report.status, "automated_passed");
  assert.equal(report.automated.productionDeployment, true);
  assert.equal(report.automated.seoIndexing, true);
  assert.equal(report.automated.backendReadiness, true);
  assert.equal(report.automated.redisReady, true);
  assert.equal(report.automated.publicForms.length, PUBLIC_FORM_ROUTES.length);
  assert.equal(report.automated.protectedApis.length, PROTECTED_API_ROUTES.length);
  assert.equal(report.automated.noIndexEntries.length, NOINDEX_ENTRY_ROUTES.length);
  assert.ok(report.manualAcceptanceRequired.length >= 8);
});

test("final acceptance fails closed when Redis is falling back instead of ready", async () => {
  await assert.rejects(checkFinalAcceptance(canonical, {
    fetcher: fakeFetcher({
      "/api/backend/health/ready": () => Response.json({
        status: "ready",
        service: "zobhunger-api",
        checks: { database: true, privateFileStorage: true, email: true, publicApp: true, cache: "postgresql_fallback" },
      }),
    }),
    productionCheck,
    seoCheck,
  }), /Redis\/cache readiness/);
});

test("final acceptance rejects indexable private and submission entry routes", async () => {
  await assert.rejects(checkFinalAcceptance(canonical, {
    fetcher: fakeFetcher({
      "/admin": () => new Response(html({ noindex: false }), { status: 200, headers: { "Content-Type": "text/html" } }),
    }),
    productionCheck,
    seoCheck,
  }), /indexable/);
});

test("final acceptance requires protected worker, business, Placement Cell and admin APIs to stay unauthenticated", async () => {
  await assert.rejects(checkFinalAcceptance(canonical, {
    fetcher: fakeFetcher({
      "/api/backend/workers/workspace": () => Response.json({ success: true, data: {} }, { status: 200 }),
    }),
    productionCheck,
    seoCheck,
  }), /expected 401/);
});

test("final acceptance catches broken responsive metadata and branded 404 behavior", async () => {
  await assert.rejects(checkFinalAcceptance(canonical, {
    fetcher: fakeFetcher({
      "/": () => new Response(html({ viewport: false }), { status: 200, headers: { "Content-Type": "text/html" } }),
    }),
    productionCheck,
    seoCheck,
  }), /viewport/);

  await assert.rejects(checkFinalAcceptance(canonical, {
    fetcher: fakeFetcher({
      "/__phase10-final-acceptance-not-found__": () => new Response(html({ body: "ZOBHUNGER generic response" }), { status: 404, headers: { "Content-Type": "text/html" } }),
    }),
    productionCheck,
    seoCheck,
  }), /page-not-found/);
});

test("repository final gate preserves secure cookies, error states and current chatbot release verification", async () => {
  const [auth, rootError, rootNotFound, packageJson, releaseRoute, checker] = await Promise.all([
    readFile(new URL("../../server/src/modules/auth/auth.controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/app/error.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/app/not-found.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../package.json", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/app/api/release/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../check-final-acceptance.mjs", import.meta.url), "utf8"),
  ]);

  for (const token of ["httpOnly: true", "secure: production", 'sameSite: "lax"']) {
    assert.ok(auth.includes(token), `auth cookie missing ${token}`);
  }
  assert.ok(rootError.includes("Try again"));
  assert.ok(rootNotFound.includes("Page not found"));
  assert.ok(packageJson.includes('"test:acceptance"'));
  assert.ok(packageJson.includes('"check:acceptance"'));
  assert.ok(packageJson.includes("npm run chatbot:release-check"));
  assert.ok(releaseRoute.includes("phase10ProductionAcceptance: true"));
  assert.ok(checker.includes("checkFinalAcceptance"));
});

test("the live acceptance runner remains read-only and does not submit production data", async () => {
  const source = await readFile(new URL("../final-acceptance.mjs", import.meta.url), "utf8");
  assert.ok(source.includes('method: "GET"'));
  assert.ok(!/method:\s*["']POST["']/.test(source));
  assert.ok(!/method:\s*["']PUT["']/.test(source));
  assert.ok(!/method:\s*["']DELETE["']/.test(source));
  for (const route of PUBLIC_FORM_ROUTES) assert.ok(source.includes(`"${route}"`));
  for (const route of PROTECTED_API_ROUTES) assert.ok(source.includes(`"${route}"`));
});
