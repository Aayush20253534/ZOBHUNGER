import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const smokeIndex = args.indexOf("--smoke");
const smoke = smokeIndex >= 0;
if (smoke) args.splice(smokeIndex, 1);

const version = spawnSync("k6", ["version"], { stdio: "ignore", shell: process.platform === "win32" });
if (version.error || version.status !== 0) {
  console.error("k6 is required for load testing. Install k6 and ensure the `k6` command is available on PATH.");
  process.exit(1);
}

if (!process.env.LOAD_BASE_URL) {
  console.error("LOAD_BASE_URL is required, for example https://api.example.com");
  process.exit(1);
}

const env = { ...process.env, ...(smoke ? { LOAD_PROFILE: "smoke" } : {}) };
const result = spawnSync("k6", ["run", ...args, "load-tests/k6/platform.js"], {
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
