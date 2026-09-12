import { mkdir, writeFile } from "node:fs/promises";
import { checkSeoIndexing } from "./seo-indexing.mjs";

const output = new URL("../.release-artifacts/seo-indexing-check.json", import.meta.url);
let report;

try {
  const origin = process.argv[2];
  const verification = process.argv[3];
  if (!origin || process.argv.length > 4) {
    throw new Error("Usage: npm run check:seo -- https://zobhungr.com [google-site-verification-token]");
  }
  report = await checkSeoIndexing(origin, { expectedGoogleVerification: verification });
} catch (error) {
  report = {
    status: "failed",
    scope: "Phase 9 SEO/indexing checks",
    checkedAt: new Date().toISOString(),
    message: error instanceof Error ? error.message : "SEO/indexing check failed",
  };
  process.exitCode = 1;
}

await mkdir(new URL("../.release-artifacts/", import.meta.url), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
