import { checkProductionDeployment } from "./production-deployment.mjs";
import { checkSeoIndexing } from "./seo-indexing.mjs";
import { siteOrigin } from "./release-routes.mjs";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const PUBLIC_FORM_ROUTES = [
  "/contact",
  "/hire-workforce",
  "/careers/apply",
  "/vendor-empanelment",
  "/become-a-partner",
  "/placement-cell-partnership/apply",
];

export const NOINDEX_ENTRY_ROUTES = [
  "/admin",
  "/worker/login",
  "/business/login",
  "/placement-cell-login",
  "/placement-portal",
  "/careers/apply",
  "/placement-cell-partnership/apply",
];

export const PROTECTED_API_ROUTES = [
  "/business/dashboard",
  "/workers/workspace",
  "/placement-cell-applications/portal/profile",
  "/admin/reports",
];

const NOT_FOUND_PATH = "/__phase10-final-acceptance-not-found__";

async function request(fetcher, url, { accept = "text/html", redirect = "error" } = {}) {
  try {
    return await fetcher(url, {
      method: "GET",
      redirect,
      cache: "no-store",
      credentials: "omit",
      headers: { Accept: accept },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error(`GET ${url}: connection failed, timed out or redirected unexpectedly.`);
  }
}

function requireContentType(response, expected, label) {
  const value = response.headers.get("content-type") ?? "";
  if (!value.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`${label} returned ${value || "no Content-Type"}; expected ${expected}.`);
  }
  return value;
}

function robotsFromHtml(html) {
  const match = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["'][^>]*>/i);
  return (match?.[1] ?? "").toLowerCase();
}

function hasNoIndex(response, html) {
  const header = (response.headers.get("x-robots-tag") ?? "").toLowerCase();
  return header.includes("noindex") || robotsFromHtml(html).includes("noindex");
}

function assertBrandedHtml(html, label) {
  if (!/<html\b/i.test(html) || !/ZOBHUNGER/i.test(html)) {
    throw new Error(`${label} did not return a ZOBHUNGER HTML document.`);
  }
}

function assertViewport(html) {
  const viewport = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']viewport["'][^>]*>/i);
  if (!viewport?.[1]?.toLowerCase().includes("width=device-width")) {
    throw new Error("Homepage is missing a responsive width=device-width viewport declaration.");
  }
}

function requireUnauthenticatedEnvelope(body, route) {
  if (body?.success !== false || body?.error?.code !== "UNAUTHENTICATED") {
    throw new Error(`${route}: protected API did not return the standard UNAUTHENTICATED envelope.`);
  }
}

function requireReadiness(readiness, { requireRedisReady }) {
  if (readiness?.status !== "ready" || readiness?.service !== "zobhunger-api") {
    throw new Error("Backend readiness is not ready.");
  }
  for (const check of ["database", "privateFileStorage", "email", "publicApp"]) {
    if (readiness.checks?.[check] !== true) {
      throw new Error(`Backend readiness check ${check} is not ready.`);
    }
  }
  const cache = readiness.checks?.cache;
  if (requireRedisReady && cache !== "ready") {
    throw new Error(`Redis/cache readiness is ${cache ?? "unknown"}; final production acceptance requires ready.`);
  }
  if (!requireRedisReady && !["ready", "postgresql_fallback", "disabled"].includes(cache)) {
    throw new Error(`Backend cache readiness value is invalid: ${cache ?? "unknown"}.`);
  }
}

export async function checkFinalAcceptance(origin, {
  fetcher = fetch,
  expectedRevision,
  requireRedisReady = true,
  productionCheck = checkProductionDeployment,
  seoCheck = checkSeoIndexing,
} = {}) {
  const canonical = siteOrigin(origin);
  const canonicalUrl = new URL(canonical);
  if (canonicalUrl.protocol !== "https:" || LOOPBACK.has(canonicalUrl.hostname)) {
    throw new Error("Final production acceptance requires a public HTTPS canonical origin.");
  }

  const production = await productionCheck(canonical, { fetcher, expectedRevision });
  const seo = await seoCheck(canonical, { fetcher });

  const [releaseResponse, healthResponse, readinessResponse, homepageResponse] = await Promise.all([
    request(fetcher, `${canonical}/api/release`, { accept: "application/json" }),
    request(fetcher, `${canonical}/api/backend/health`, { accept: "application/json" }),
    request(fetcher, `${canonical}/api/backend/health/ready`, { accept: "application/json" }),
    request(fetcher, `${canonical}/`),
  ]);

  for (const [response, label] of [
    [releaseResponse, "Frontend release endpoint"],
    [healthResponse, "Backend health endpoint"],
    [readinessResponse, "Backend readiness endpoint"],
    [homepageResponse, "Homepage"],
  ]) {
    if (response.status !== 200) throw new Error(`${label} returned ${response.status}.`);
  }

  requireContentType(releaseResponse, "application/json", "Frontend release endpoint");
  requireContentType(healthResponse, "application/json", "Backend health endpoint");
  requireContentType(readinessResponse, "application/json", "Backend readiness endpoint");
  requireContentType(homepageResponse, "text/html", "Homepage");

  const [release, health, readiness, homepageHtml] = await Promise.all([
    releaseResponse.json(),
    healthResponse.json(),
    readinessResponse.json(),
    homepageResponse.text(),
  ]);

  if (release.service !== "zobhunger-web" || release.phase8ProductionDeployment !== true || release.phase9SeoIndexing !== true || release.phase10ProductionAcceptance !== true) {
    throw new Error("Frontend is missing one or more final production release markers.");
  }
  if (release.canonicalOrigin !== canonical) {
    throw new Error(`Frontend canonical origin is ${release.canonicalOrigin ?? "unset"}; expected ${canonical}.`);
  }
  if (expectedRevision && release.revision !== expectedRevision.toLowerCase()) {
    throw new Error("Frontend release revision does not match the requested acceptance revision.");
  }

  if (health?.success !== true || health?.data?.service !== "zobhunger-api") {
    throw new Error("Backend health response is not the expected ZOBHUNGER API envelope.");
  }
  if (health.data?.features?.productionDeployment !== true || health.data?.publicAppOrigin !== canonical) {
    throw new Error("Backend production deployment marker or PUBLIC_APP_URL alignment is invalid.");
  }
  requireReadiness(readiness, { requireRedisReady });

  assertBrandedHtml(homepageHtml, "Homepage");
  assertViewport(homepageHtml);
  if (!/<html[^>]+lang=["']en-IN["']/i.test(homepageHtml)) {
    throw new Error("Homepage is missing the expected en-IN document language.");
  }

  const publicForms = [];
  for (const route of PUBLIC_FORM_ROUTES) {
    const response = await request(fetcher, `${canonical}${route}`);
    if (response.status !== 200) throw new Error(`${route}: public submission page returned ${response.status}.`);
    requireContentType(response, "text/html", route);
    const html = await response.text();
    assertBrandedHtml(html, route);
    publicForms.push({ route, status: response.status });
  }

  const noIndexEntries = [];
  for (const route of NOINDEX_ENTRY_ROUTES) {
    const response = await request(fetcher, `${canonical}${route}`);
    if (response.status !== 200) throw new Error(`${route}: entry page returned ${response.status}.`);
    requireContentType(response, "text/html", route);
    const html = await response.text();
    assertBrandedHtml(html, route);
    if (!hasNoIndex(response, html)) throw new Error(`${route}: private/submission entry page is indexable.`);
    noIndexEntries.push({ route, noindex: true });
  }

  const protectedApis = [];
  for (const route of PROTECTED_API_ROUTES) {
    const response = await request(fetcher, `${canonical}/api/backend${route}`, { accept: "application/json" });
    if (response.status !== 401) throw new Error(`${route}: expected 401 without credentials, received ${response.status}.`);
    requireContentType(response, "application/json", route);
    const body = await response.json();
    requireUnauthenticatedEnvelope(body, route);
    protectedApis.push({ route, protected: true });
  }

  const notFoundResponse = await request(fetcher, `${canonical}${NOT_FOUND_PATH}`);
  if (notFoundResponse.status !== 404) throw new Error(`Unknown page returned ${notFoundResponse.status}; expected 404.`);
  requireContentType(notFoundResponse, "text/html", "404 page");
  const notFoundHtml = await notFoundResponse.text();
  assertBrandedHtml(notFoundHtml, "404 page");
  if (!/page not found/i.test(notFoundHtml)) throw new Error("404 response does not render the branded page-not-found state.");

  const [manifestResponse, socialImageResponse] = await Promise.all([
    request(fetcher, `${canonical}/manifest.webmanifest`, { accept: "application/manifest+json,application/json" }),
    request(fetcher, `${canonical}/opengraph-image`, { accept: "image/*" }),
  ]);
  if (manifestResponse.status !== 200) throw new Error(`Web manifest returned ${manifestResponse.status}.`);
  requireContentType(manifestResponse, "manifest", "Web manifest");
  if (socialImageResponse.status !== 200) throw new Error(`Open Graph image returned ${socialImageResponse.status}.`);
  requireContentType(socialImageResponse, "image/", "Open Graph image");

  const manualAcceptance = [
    "Main Admin login, MFA challenge and permission-aware navigation",
    "HR, Technical, Placement Cell and Legal restricted admin accounts",
    "Worker registration, email verification, job application, attendance and earnings",
    "Business first login/password change, requirements, candidates, deployments, attendance and reports",
    "Placement Cell activation, candidate management and opportunity application",
    "Employee joining submission, protected documents and generated offer-letter delivery",
    "Real Resend inbox delivery for acknowledgement, status-update and credential emails",
    "Chatbot production smoke using the approved public RAG knowledge base",
    "Responsive review on representative phone, tablet and desktop browsers",
    "Google Search Console ownership verification and sitemap submission",
  ];

  return {
    status: "automated_passed",
    scope: "Phase 10 final production QA and acceptance",
    canonicalOrigin: canonical,
    checkedAt: new Date().toISOString(),
    revision: release.revision ?? null,
    automated: {
      productionDeployment: production.status === "passed",
      seoIndexing: seo.status === "passed",
      backendReadiness: true,
      redisReady: readiness.checks?.cache === "ready",
      publicForms,
      noIndexEntries,
      protectedApis,
      branded404: true,
      responsiveViewport: true,
      webManifest: true,
      openGraphImage: true,
    },
    providers: {
      database: readiness.checks?.database === true,
      privateFileStorage: readiness.checks?.privateFileStorage === true,
      emailConfiguration: readiness.checks?.email === true,
      cache: readiness.checks?.cache ?? "unknown",
      chatbotEnabled: health.data?.features?.chatbot === true,
    },
    nestedReports: { production, seo },
    manualAcceptanceRequired: manualAcceptance,
  };
}
