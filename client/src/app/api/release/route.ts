// This value is captured by next.config.ts at build time. Never read secrets or
// run Git from a public request handler.
export function GET() {
  return Response.json({
    service: "zobhunger-web",
    phase2ReleaseChecks: true,
    revision: process.env.NEXT_PUBLIC_BUILD_REVISION || null,
  }, { headers: { "Cache-Control": "no-store" } });
}
