import { mkdir, writeFile } from "node:fs/promises";
import { checkFinalAcceptance } from "./final-acceptance.mjs";

const output = new URL("../.release-artifacts/final-acceptance-check.json", import.meta.url);
let report;

try {
  const origin = process.argv[2];
  const expectedRevision = process.argv[3];
  if (!origin || process.argv.length > 4) {
    throw new Error("Usage: npm run check:acceptance -- https://zobhungr.com [full-git-commit]");
  }
  report = await checkFinalAcceptance(origin, { expectedRevision });
} catch (error) {
  report = {
    status: "failed",
    scope: "Phase 10 final production QA and acceptance",
    checkedAt: new Date().toISOString(),
    message: error instanceof Error ? error.message : "Final acceptance check failed",
  };
  process.exitCode = 1;
}

await mkdir(new URL("../.release-artifacts/", import.meta.url), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
