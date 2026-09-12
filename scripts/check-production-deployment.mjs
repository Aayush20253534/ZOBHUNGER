import { mkdir, writeFile } from "node:fs/promises";
import { checkProductionDeployment } from "./production-deployment.mjs";

const output = new URL("../.release-artifacts/production-deployment-check.json", import.meta.url);
let report;
try {
  const origin = process.argv[2];
  const revision = process.argv[3];
  if (!origin || process.argv.length > 4) {
    throw new Error("Usage: npm run check:production -- https://zobhungr.com [full-git-commit]");
  }
  report = await checkProductionDeployment(origin, { expectedRevision: revision });
} catch (error) {
  report = {
    status: "failed",
    scope: "Phase 8 production deployment checks",
    checkedAt: new Date().toISOString(),
    message: error instanceof Error ? error.message : "Production deployment check failed",
  };
  process.exitCode = 1;
}

await mkdir(new URL("../.release-artifacts/", import.meta.url), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
