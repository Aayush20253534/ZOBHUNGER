// Read-only deployment smoke checks. No credentials, submissions or emails.
export const pages = [
  "/", "/solutions", "/industries", "/technology", "/for-business", "/for-workers",
  "/jobs", "/blogs", "/contact", "/careers", "/hire-workforce", "/become-a-partner",
  "/vendor-empanelment", "/employee-joining", "/login", "/admin", "/worker/login", "/placement-portal",
  "/business/login", "/business/forgot-password", "/business/change-password",
  "/business/dashboard", "/business/requirements", "/business/requirements/new",
  "/business/requirements/drafts", "/business/candidates", "/business/deployments",
  "/business/attendance", "/business/attendance-approvals", "/business/reports",
  "/business/company", "/business/account", "/business/vendors",
];
export const protectedRoutes = [
  "/business/workspace", "/business/dashboard", "/business/requirements",
  "/business/requirement-drafts", "/business/candidates", "/business/deployments",
  "/business/attendance", "/business/attendance-approvals", "/business/reports",
  "/business/reports/export", "/business/reports/print", "/business/operations-summary",
  "/admin/requirement-jobs", "/admin/attendance-approvals", "/admin/reports",
];

const noIndexPages = new Set([
  "/employee-joining", "/login", "/admin", "/worker/login", "/placement-portal",
  ...pages.filter(path => path.startsWith("/business/")),
]);
const features = ["businessPortal", "businessDashboard", "businessRequirements", "businessCandidates", "businessDeployments", "businessAttendance", "businessPhase2Complete", "productionFoundation"];

export function siteOrigin(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("Provide the frontend origin, for example https://your-site.example."); }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(loopback && url.protocol === "http:")) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Use an HTTPS frontend origin without credentials, a path, query or fragment. HTTP is allowed only on localhost.");
  }
  return url.origin;
}

export async function checkRelease(origin, { fetcher = fetch, expectedRevision } = {}) {
  const base = siteOrigin(origin);
  if (expectedRevision && !/^[a-f0-9]{40,64}$/i.test(expectedRevision)) throw new Error("Expected revision must be a full Git commit hash.");
  expectedRevision = expectedRevision?.toLowerCase();
  const results = [];
  async function read(path, status, kind) {
    const started = performance.now();
    let response;
    try {
      response = await fetcher(`${base}${path}`, { method: "GET", redirect: "error", cache: "no-store", credentials: "omit", headers: { Accept: kind }, signal: AbortSignal.timeout(15_000) });
    } catch { throw new Error(`GET ${path}: connection failed, timed out or redirected. Check the deployed origin and proxy.`); }
    if (response.status !== status) throw new Error(`GET ${path}: expected ${status}, received ${response.status}. Confirm both applications are deployed from the intended commit.`);
    if (!response.headers.get("content-type")?.includes(kind)) throw new Error(`GET ${path}: expected ${kind}; a proxy error or fallback page may have been returned.`);
    const body = kind === "application/json" ? await response.json() : await response.text();
    results.push({ path, status, durationMs: Math.round(performance.now() - started) });
    return body;
  }
  const health = await read("/api/backend/health", 200, "application/json");
  if (health.success !== true || health.data?.service !== "zobhunger-api" || features.some(feature => health.data?.features?.[feature] !== true)) {
    throw new Error("The frontend proxy does not reach the expected production API surface.");
  }
  const readiness = await read("/api/backend/health/ready", 200, "application/json");
  if (readiness.status !== "ready" || readiness.service !== "zobhunger-api" || readiness.checks?.database !== true) {
    throw new Error("The API readiness probe is not ready. Check database and required production configuration.");
  }
  const frontend = await read("/api/release", 200, "application/json");
  if (frontend.service !== "zobhunger-web" || frontend.phase2ReleaseChecks !== true) throw new Error("The frontend is missing the P2.8 release patch.");
  const webRevision = frontend.revision;
  const apiRevision = health.data.revision;
  if (webRevision && apiRevision && webRevision !== apiRevision) throw new Error("Frontend and backend revisions differ. Deploy the same commit to both services.");
  if (expectedRevision && (webRevision !== expectedRevision || apiRevision !== expectedRevision)) throw new Error("Both services must report the expected revision. Set RELEASE_SHA during build/deployment if your host does not provide a Git commit variable.");
  for (const path of protectedRoutes) {
    const body = await read(`/api/backend${path}`, 401, "application/json");
    if (body.success !== false || body.error?.code !== "UNAUTHENTICATED") throw new Error(`${path}: expected the unauthenticated API envelope.`);
  }
  for (const path of pages) {
    const html = await read(path, 200, "text/html");
    if (!/<html\b/i.test(html) || !/ZOBHUNGER/i.test(html)) throw new Error(`${path}: expected a ZOBHUNGER page.`);
    if (noIndexPages.has(path) && !/<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*noindex)[^>]*>/i.test(html)) {
      throw new Error(`${path}: private/access pages must carry noindex metadata.`);
    }
  }
  return {
    scope: "Read-only frontend pages, API liveness/readiness, authentication gates and deployment revisions",
    origin: base, status: "passed", checkedAt: new Date().toISOString(),
    revisionCheck: expectedRevision ? "expected_commit_verified" : webRevision && apiRevision ? "services_match" : "not_verified",
    results,
    notVerified: ["Authenticated production workflows", "Database migration currency/performance", "Real-device layout and print", "Live provider email delivery"],
  };
}
