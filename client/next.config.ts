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
  "img-src 'self' data: blob: https://www.google.com",
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
  ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
];

const revision = process.env.RELEASE_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "";
const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BUILD_REVISION: /^[a-f0-9]{40,64}$/i.test(revision) ? revision.toLowerCase() : "" },
  poweredByHeader: false,
  async rewrites() {
    // Keep browser authentication first-party even when Express is hosted separately.
    return [{ source: "/api/backend/:path*", destination: `${runtimeConfig.apiUrl}/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
