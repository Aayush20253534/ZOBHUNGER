import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const includeWorkers = process.argv.includes("--workers");
const output = new URL("../.release-artifacts/phase2-code-checks.json", import.meta.url);
const node = process.execPath;
const npm = process.env.npm_execpath;
const suite = [
  "business", "business-dashboard", "business-requirements", "business-candidates",
  "business-deployments", "business-attendance", "phase2", "submission-recovery",
  "partner-hr", "vendor-empanelment", ...(includeWorkers ? ["workers", "worker-workflows", "worker-finance"] : []),
];
const steps = [
  { name: "Release-check regression tests", cwd: root, args: ["--test", "scripts/tests/release-routes.test.mjs"] },
  { name: "Server unit tests", folder: "server", script: "test" },
  { name: "Server build and route registration", folder: "server", script: "build" },
  { name: "Migrate dedicated test database", folder: "server", script: "db:deploy" },
  { name: "Database schema matches migrations", cwd: `${root}server`, args: ["node_modules/prisma/build/index.js", "migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--exit-code"] },
  { name: "Requirement and Mailjet contract tests (mocked delivery)", cwd: `${root}server`, args: ["--import", "tsx", "--experimental-test-module-mocks", "--test", "tests/mailjet.test.mjs", "tests/public-requirement-contract.test.mjs"] },
  ...suite.map(name => ({ name: `${name} database integration`, cwd: `${root}server`, args: ["--experimental-test-module-mocks", "--test", `tests/${name}.integration.test.mjs`] })),
  { name: "Client portal regression tests", folder: "client", script: "test:business" },
  { name: "Client lint", folder: "client", script: "lint" },
  { name: "Client production build and TypeScript", folder: "client", script: "build" },
];
const revision = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
const changes = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
const report = {
  scope: `Automated Phase 2${includeWorkers ? " and worker P3.1–P3.7" : ""} code and dedicated-database checks; not production signoff`,
  status: "running", startedAt: new Date().toISOString(), node: process.version,
  databaseKind: process.env.TEST_DATABASE_KIND || "postgresql (operator-provided test database)",
  revision: revision.status === 0 ? revision.stdout.trim() : null,
  workingTreeHasChanges: changes.status === 0 ? Boolean(changes.stdout.trim()) : null,
  steps: steps.map(({ name }) => ({ name, status: "not_run" })),
  notVerified: ["Deployed frontend/backend commit and proxy", "Hosted database and production performance", "Real-device mobile, keyboard and print review", "Live email delivery"],
};
await mkdir(new URL("../.release-artifacts/", import.meta.url), { recursive: true });
const save = () => writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
await save();

let active;
let cancelled = false;
function stop() {
  if (!active?.pid) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(active.pid), "/T", "/F"], { stdio: "ignore" });
  else { try { process.kill(-active.pid, "SIGTERM"); } catch { active.kill("SIGTERM"); } }
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { cancelled = true; stop(); });

try {
  if (!npm) throw new Error("Run this check using npm run verify:phase2 from the repository root.");
  let database;
  try { database = new URL(process.env.TEST_DATABASE_URL || ""); } catch { throw new Error("Set TEST_DATABASE_URL to a dedicated test PostgreSQL database. This command runs migrations and writes temporary fixtures; it never falls back to DATABASE_URL."); }
  if (!["postgres:", "postgresql:"].includes(database.protocol) || !database.pathname.slice(1)) throw new Error("TEST_DATABASE_URL must identify a dedicated PostgreSQL test database.");
  // Explicit empty mail settings also prevent dotenv from importing real keys.
  const env = {
    ...process.env, NODE_ENV: "test", DATABASE_URL: process.env.TEST_DATABASE_URL,
    REDIS_ENABLED: "false", JWT_SECRET: "phase2-release-tests-only-not-a-production-secret",
    MAILJET_API_KEY: "", MAILJET_SECRET_KEY: "", MAILJET_API_SECRET: "",
    MJ_APIKEY_PUBLIC: "", MJ_APIKEY_PRIVATE: "", MAIL_FROM_EMAIL: "", SALES_TEAM_EMAIL: "",
    NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_API_URL: "http://127.0.0.1:5000/api/v1",
  };
  for (let index = 0; index < steps.length; index++) {
    if (cancelled) throw new Error("Release checks interrupted.");
    const step = steps[index]; const result = report.steps[index];
    result.status = "running"; await save();
    console.log(`\n[${index + 1}/${steps.length}] ${step.name}`);
    const started = performance.now();
    try {
      await new Promise((resolve, reject) => {
        const args = step.script ? [npm, "--prefix", step.folder, "run", step.script] : step.args;
        // npm's JS entry point works on Windows without shell quoting or .cmd.
        // A Next production build must not inherit NODE_ENV=test.
        const stepEnv = { ...env, NODE_ENV: step.folder === "client" && step.script === "build" ? "production" : "test" };
        active = spawn(node, args, { cwd: step.cwd || root, env: stepEnv, stdio: "inherit", shell: false, detached: process.platform !== "win32" });
        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; stop(); }, 10 * 60_000);
        active.once("error", error => { clearTimeout(timer); reject(error); });
        active.once("close", (code, signal) => {
          clearTimeout(timer); active = undefined;
          if (code === 0 && !timedOut && !cancelled) resolve();
          else reject(new Error(timedOut ? "Timed out after 10 minutes." : `Check failed (exit ${code ?? signal}).`));
        });
      });
      result.status = "passed";
    } catch (error) { result.status = "failed"; result.message = error.message; throw error; }
    finally { result.durationMs = Math.round(performance.now() - started); await save(); }
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed"; report.message = error.message; process.exitCode = 1;
  console.error(error.message);
} finally {
  report.finishedAt = new Date().toISOString(); await save();
  console.log(`\nCode checks: ${report.status}. Report: .release-artifacts/phase2-code-checks.json`);
  console.log("Production deployment, live email and real-device review require separate evidence.");
}
