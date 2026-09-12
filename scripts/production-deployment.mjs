import { checkRelease, siteOrigin } from "./release-routes.mjs";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function canonicalAliasOrigin(origin) {
  const canonical = new URL(siteOrigin(origin));
  if (LOOPBACK.has(canonical.hostname)) throw new Error("Production deployment checks require a public HTTPS hostname.");
  if (canonical.protocol !== "https:") throw new Error("Production deployment checks require HTTPS.");
  const aliasHost = canonical.hostname.startsWith("www.")
    ? canonical.hostname.slice(4)
    : `www.${canonical.hostname}`;
  return `${canonical.protocol}//${aliasHost}${canonical.port ? `:${canonical.port}` : ""}`;
}

function requireHeader(response, name, expected) {
  const value = response.headers.get(name) ?? "";
  if (expected instanceof RegExp ? !expected.test(value) : !value.toLowerCase().includes(String(expected).toLowerCase())) {
    throw new Error(`Missing or invalid ${name} header on the canonical deployment.`);
  }
  return value;
}

async function get(fetcher, url, { redirect = "error", accept = "text/html" } = {}) {
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

export async function checkProductionDeployment(origin, {
  fetcher = fetch,
  expectedRevision,
  aliasOrigin,
} = {}) {
  const canonical = siteOrigin(origin);
  const canonicalUrl = new URL(canonical);
  if (canonicalUrl.protocol !== "https:" || LOOPBACK.has(canonicalUrl.hostname)) {
    throw new Error("Production deployment checks require a public HTTPS canonical origin.");
  }

  const alias = aliasOrigin ? siteOrigin(aliasOrigin) : canonicalAliasOrigin(canonical);
  if (alias === canonical) throw new Error("Canonical and alias origins must be different.");

  const release = await checkRelease(canonical, { fetcher, expectedRevision });

  const homepage = await get(fetcher, `${canonical}/`);
  if (homepage.status !== 200) throw new Error(`Canonical homepage returned ${homepage.status}.`);
  requireHeader(homepage, "strict-transport-security", /max-age=\d+/i);
  requireHeader(homepage, "content-security-policy", "upgrade-insecure-requests");
  requireHeader(homepage, "x-content-type-options", "nosniff");
  requireHeader(homepage, "referrer-policy", "strict-origin-when-cross-origin");
  requireHeader(homepage, "permissions-policy", "camera=()");
  requireHeader(homepage, "cross-origin-opener-policy", "same-origin");
  requireHeader(homepage, "x-dns-prefetch-control", "off");
  requireHeader(homepage, "x-permitted-cross-domain-policies", "none");

  const privatePage = await get(fetcher, `${canonical}/admin`);
  if (privatePage.status !== 200) throw new Error(`Admin access page returned ${privatePage.status}.`);
  requireHeader(privatePage, "cache-control", "no-store");
  requireHeader(privatePage, "x-robots-tag", "noindex");

  const frontendResponse = await get(fetcher, `${canonical}/api/release`, { accept: "application/json" });
  if (frontendResponse.status !== 200) throw new Error("Frontend release endpoint is unavailable.");
  const frontend = await frontendResponse.json();
  if (frontend.phase8ProductionDeployment !== true) throw new Error("Frontend is missing the Phase 8 production deployment marker.");
  if (frontend.canonicalOrigin !== canonical) throw new Error(`Frontend canonical origin is ${frontend.canonicalOrigin ?? "unset"}; expected ${canonical}.`);

  const apiResponse = await get(fetcher, `${canonical}/api/backend/health`, { accept: "application/json" });
  if (apiResponse.status !== 200) throw new Error("Frontend API proxy health endpoint is unavailable.");
  const api = await apiResponse.json();
  if (api.data?.features?.productionDeployment !== true) throw new Error("Backend is missing the Phase 8 production deployment marker.");
  if (api.data?.publicAppOrigin !== canonical) throw new Error(`Backend PUBLIC_APP_URL resolves to ${api.data?.publicAppOrigin ?? "unset"}; expected ${canonical}.`);

  const aliasResponse = await get(fetcher, `${alias}/`, { redirect: "manual" });
  if (![301, 308].includes(aliasResponse.status)) {
    throw new Error(`Alias ${alias} must permanently redirect to ${canonical}; received ${aliasResponse.status}.`);
  }
  const location = aliasResponse.headers.get("location");
  if (!location) throw new Error(`Alias ${alias} redirect is missing a Location header.`);
  const redirectTarget = new URL(location, alias);
  if (redirectTarget.origin !== canonical || redirectTarget.pathname !== "/") {
    throw new Error(`Alias ${alias} redirects to ${redirectTarget.href} instead of ${canonical}/.`);
  }

  return {
    status: "passed",
    scope: "Canonical HTTPS, alias redirect, security headers, private-route cache/index guards, frontend/backend origin alignment and release checks",
    canonicalOrigin: canonical,
    aliasOrigin: alias,
    checkedAt: new Date().toISOString(),
    release,
    transport: {
      https: true,
      hsts: true,
      canonicalRedirect: true,
      browserApiProxy: true,
    },
    notVerified: [
      "DNS propagation from every geographic resolver",
      "Authenticated production workflows",
      "Real-device rendering and browser extension interference",
      "Live provider email delivery to customer mailboxes",
    ],
  };
}
