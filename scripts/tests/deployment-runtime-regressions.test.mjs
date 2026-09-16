import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("CMS article detail is request-time rendered and cannot make Vercel build depend on the API", () => {
  const article = read("client/src/app/blog/[slug]/page.tsx");
  assert.match(article, /export const dynamic = "force-dynamic"/);
  assert.doesNotMatch(article, /generateStaticParams/);
});

test("production can boot without a malware provider but protected uploads still fail closed", () => {
  const env = read("server/src/config/env.ts");
  const scanner = read("server/src/services/malware-scan.service.ts");
  assert.doesNotMatch(env, /FILE_MALWARE_SCAN_PROVIDER must be clamav or http in production/);
  assert.match(env, /CLAMAV_HOST is required when FILE_MALWARE_SCAN_PROVIDER=clamav/);
  assert.match(env, /FILE_MALWARE_SCAN_HTTP_URL is required when FILE_MALWARE_SCAN_PROVIDER=http/);
  assert.match(scanner, /FILE_MALWARE_SCAN_PROVIDER === "disabled"[\s\S]*?NODE_ENV === "production"[\s\S]*?scannerUnavailable\(\)/);
  assert.match(scanner, /FILE_SCAN_UNAVAILABLE/);
});

test("anonymous process liveness omits deployment revision while release health retains it", () => {
  const health = read("server/src/controllers/health.controller.ts");
  assert.match(health, /publicStatus\("ok", false\)/);
  assert.match(health, /apiSuccessResponse\("API is healthy", publicStatus\("ok"\)\)/);
  assert.match(health, /revision: releaseRevision\(\)/);
});
