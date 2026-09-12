// This value is captured by next.config.ts at build time. Never read secrets or
// run Git from a public request handler.
function canonicalOrigin() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return null;
  try { return new URL(value).origin; } catch { return null; }
}

export function GET() {
  return Response.json({
    service: "zobhunger-web",
    phase2ReleaseChecks: true,
    phase8ProductionDeployment: true,
    canonicalOrigin: canonicalOrigin(),
    revision: process.env.NEXT_PUBLIC_BUILD_REVISION || null,
  }, { headers: { "Cache-Control": "no-store" } });
}
