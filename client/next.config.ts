import type { NextConfig } from "next";
import { resolveClientRuntimeConfig } from "./config/runtime-env.mjs";

const production = process.env.NODE_ENV === "production";
const runtimeConfig = resolveClientRuntimeConfig(process.env);
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  // Next emits bootstrap/JSON scripts inline. Keep the allowance narrow to the
  // site's own scripts instead of permitting arbitrary remote script origins.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(production ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
];

const privateRouteHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const noIndexRouteHeaders = [
  { key: "X-Robots-Tag", value: "noindex, follow" },
];

function canonicalAliasHost() {
  const canonical = new URL(runtimeConfig.siteUrl);
  if (!production || ["localhost", "127.0.0.1", "[::1]"].includes(canonical.hostname)) return null;
  return canonical.hostname.startsWith("www.")
    ? canonical.hostname.slice(4)
    : `www.${canonical.hostname}`;
}

const revision = process.env.RELEASE_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "";
const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BUILD_REVISION: /^[a-f0-9]{40,64}$/i.test(revision) ? revision.toLowerCase() : "" },
  poweredByHeader: false,
  async redirects() {
    const aliasHost = canonicalAliasHost();
    if (!aliasHost) return [];
    return [{
      source: "/:path*",
      has: [{ type: "host", value: aliasHost }],
      destination: `${runtimeConfig.siteUrl}/:path*`,
      permanent: true,
    }];
  },
  async rewrites() {
    // Keep browser authentication first-party even when Express is hosted separately.
    return [{ source: "/api/backend/:path*", destination: `${runtimeConfig.apiUrl}/:path*` }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/backend/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/admin/:path*", headers: privateRouteHeaders },
      { source: "/admin-access/:path*", headers: privateRouteHeaders },
      { source: "/business/:path*", headers: privateRouteHeaders },
      { source: "/worker/:path*", headers: privateRouteHeaders },
      { source: "/placement-portal/:path*", headers: privateRouteHeaders },
      { source: "/employee-joining", headers: privateRouteHeaders },
      { source: "/login", headers: privateRouteHeaders },
      { source: "/placement-cell-login", headers: privateRouteHeaders },
      { source: "/placement-cell-partnership/apply", headers: noIndexRouteHeaders },
      { source: "/design-system", headers: noIndexRouteHeaders },
      { source: "/careers/apply", headers: noIndexRouteHeaders },
    ];
  },
};

export default nextConfig;
