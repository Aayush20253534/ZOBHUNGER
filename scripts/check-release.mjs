import { mkdir, writeFile } from "node:fs/promises";
import { checkRelease } from "./release-routes.mjs";

const output = new URL("../.release-artifacts/deployment-check.json", import.meta.url);
let report;
try {
  if (!process.argv[2] || process.argv.length > 4) throw new Error("Usage: npm run check:release -- https://your-frontend.example [full-git-commit]");
  report = await checkRelease(process.argv[2], { expectedRevision: process.argv[3] });
} catch (error) {
  report = { status: "failed", scope: "Read-only deployment checks", checkedAt: new Date().toISOString(), message: error.message };
  process.exitCode = 1;
}
await mkdir(new URL("../.release-artifacts/", import.meta.url), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
