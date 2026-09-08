const checks = [
  { method: "GET", path: "/health", status: 200 },
  { method: "GET", path: "/business/workspace", status: 401, code: "UNAUTHENTICATED" },
  { method: "GET", path: "/business/profile", status: 401, code: "UNAUTHENTICATED" },
  { method: "POST", path: "/auth/business-login", status: 400, code: "VALIDATION_ERROR" },
  { method: "POST", path: "/auth/business/forgot-password", status: 400, code: "VALIDATION_ERROR" },
  { method: "POST", path: "/auth/business/reset-password", status: 400, code: "VALIDATION_ERROR" },
];

export async function checkBusinessRoutes(baseUrl) {
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("Use an http(s) API base URL without credentials, query parameters or fragments.");
  }
  const base = url.toString().replace(/\/+$/, "");
  const results = [];
  for (const check of checks) {
    // Requests have no credentials. Empty POST bodies fail validation before
    // login, database changes or recovery emails can run.
    const response = await fetch(`${base}${check.path}`, {
      method: check.method,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/json", ...(check.method === "POST" ? { "Content-Type": "application/json" } : {}) },
      ...(check.method === "POST" ? { body: "{}" } : {}),
    });
    if (response.status !== check.status) {
      throw new Error(`${check.method} ${check.path}: expected ${check.status}, received ${response.status}. Rebuild and redeploy the backend; confirm the frontend API URL points to that service.`);
    }
    let body;
    try { body = await response.json(); }
    catch { throw new Error(`${check.path} did not return the ZOBHUNGER JSON API response.`); }
    if (check.code && (body.success !== false || body.error?.code !== check.code)) {
      throw new Error(`${check.path} did not reach the expected authentication or validation handler.`);
    }
    if (check.path === "/health" && (body.success !== true || body.data?.features?.businessPortal !== true)) {
      throw new Error("This API does not report the business portal deployment fix. Deploy the latest backend commit and check NEXT_PUBLIC_API_URL.");
    }
    results.push({ method: check.method, path: check.path, status: response.status });
  }
  return results;
}
