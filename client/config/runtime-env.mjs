const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function parseHttpUrl(name, raw, { required = true, rootOnly = false } = {}) {
  const value = raw?.trim();
  if (!value) {
    if (required) throw new Error(`${name} is required.`);
    return null;
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid http(s) URL.`);
  }

  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error(`${name} must be an http(s) URL without embedded credentials.`);
  }
  if (rootOnly && (url.pathname !== "/" || url.search || url.hash)) {
    throw new Error(`${name} must be an origin without a path, query or fragment.`);
  }
  return url;
}

function assertProductionUrl(name, url) {
  if (url.protocol !== "https:") throw new Error(`${name} must use HTTPS in production.`);
  if (LOOPBACK_HOSTS.has(url.hostname)) throw new Error(`${name} cannot point to localhost in production.`);
}

/**
 * Validates the public client configuration without exposing any server secret.
 * `strictProduction` is enabled automatically on Vercel production deployments
 * and can be forced on any host with ZOBHUNGER_STRICT_PRODUCTION_CONFIG=true.
 */
export function resolveClientRuntimeConfig(environment = process.env, { strictProduction } = {}) {
  const strict = strictProduction ?? (
    environment.VERCEL_ENV === "production" ||
    environment.ZOBHUNGER_STRICT_PRODUCTION_CONFIG === "true"
  );

  const mode = (environment.NEXT_PUBLIC_DATA_MODE ?? (strict || environment.NODE_ENV === "production" ? "api" : "mock")).trim();
  if (!new Set(["mock", "api"]).has(mode)) {
    throw new Error("NEXT_PUBLIC_DATA_MODE must be 'mock' or 'api'.");
  }
  if (strict && mode !== "api") {
    throw new Error("NEXT_PUBLIC_DATA_MODE must be 'api' for a production deployment.");
  }

  const apiUrl = parseHttpUrl(
    "NEXT_PUBLIC_API_URL",
    environment.NEXT_PUBLIC_API_URL ?? (strict ? undefined : "http://localhost:5000/api/v1"),
  );
  if (!apiUrl.pathname.replace(/\/+$/, "").endsWith("/api/v1")) {
    throw new Error("NEXT_PUBLIC_API_URL must end with /api/v1.");
  }

  const siteUrl = parseHttpUrl(
    "NEXT_PUBLIC_SITE_URL",
    environment.NEXT_PUBLIC_SITE_URL ?? (strict ? undefined : "http://localhost:3000"),
    { rootOnly: true },
  );

  const googlePlayUrl = parseHttpUrl("NEXT_PUBLIC_GOOGLE_PLAY_URL", environment.NEXT_PUBLIC_GOOGLE_PLAY_URL, { required: false });
  const appStoreUrl = parseHttpUrl("NEXT_PUBLIC_APP_STORE_URL", environment.NEXT_PUBLIC_APP_STORE_URL, { required: false });

  if (strict) {
    assertProductionUrl("NEXT_PUBLIC_API_URL", apiUrl);
    assertProductionUrl("NEXT_PUBLIC_SITE_URL", siteUrl);
    if (googlePlayUrl) assertProductionUrl("NEXT_PUBLIC_GOOGLE_PLAY_URL", googlePlayUrl);
    if (appStoreUrl) assertProductionUrl("NEXT_PUBLIC_APP_STORE_URL", appStoreUrl);
  }

  return {
    strictProduction: strict,
    dataMode: mode,
    apiUrl: apiUrl.toString().replace(/\/+$/, ""),
    siteUrl: siteUrl.origin,
    googlePlayUrl: googlePlayUrl?.toString() ?? null,
    appStoreUrl: appStoreUrl?.toString() ?? null,
  };
}
