import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveClientRuntimeConfig } from "./runtime-env.mjs";

const production = {
  NODE_ENV: "production",
  VERCEL_ENV: "production",
  NEXT_PUBLIC_DATA_MODE: "api",
  NEXT_PUBLIC_API_URL: "https://api.example.com/api/v1",
  NEXT_PUBLIC_SITE_URL: "https://example.com",
};

test("strict production client config accepts API mode and public HTTPS origins", () => {
  const resolved = resolveClientRuntimeConfig(production);
  assert.equal(resolved.strictProduction, true);
  assert.equal(resolved.dataMode, "api");
  assert.equal(resolved.apiUrl, "https://api.example.com/api/v1");
  assert.equal(resolved.siteUrl, "https://example.com");
});

test("strict production client config rejects mock, localhost and insecure endpoints", () => {
  assert.throws(() => resolveClientRuntimeConfig({ ...production, NEXT_PUBLIC_DATA_MODE: "mock" }), /must be 'api'/);
  assert.throws(() => resolveClientRuntimeConfig({ ...production, NEXT_PUBLIC_API_URL: "http://localhost:5000/api/v1" }), /HTTPS|localhost/);
  assert.throws(() => resolveClientRuntimeConfig({ ...production, NEXT_PUBLIC_SITE_URL: "http://example.com" }), /HTTPS/);
});

test("API base path and canonical site origin are validated", () => {
  assert.throws(() => resolveClientRuntimeConfig({ ...production, NEXT_PUBLIC_API_URL: "https://api.example.com" }), /api\/v1/);
  assert.throws(() => resolveClientRuntimeConfig({ ...production, NEXT_PUBLIC_SITE_URL: "https://example.com/app" }), /origin without a path/);
});

test("local preview remains possible without production-only restrictions", () => {
  const resolved = resolveClientRuntimeConfig({ NODE_ENV: "development" });
  assert.equal(resolved.strictProduction, false);
  assert.equal(resolved.dataMode, "mock");
  assert.equal(resolved.apiUrl, "http://localhost:5000/api/v1");
  assert.equal(resolved.siteUrl, "http://localhost:3000");
});
