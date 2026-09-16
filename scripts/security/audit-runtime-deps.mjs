import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const severityRank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const minimumSeverity = severityRank.high;

function lockEntryForNode(lock, nodePath) {
  return lock?.packages?.[nodePath] ?? null;
}

function isRuntimeNode(lock, nodePath) {
  const entry = lockEntryForNode(lock, nodePath);
  // Unknown nodes fail closed: if the lockfile cannot prove the dependency is
  // development-only, treat it as part of the runtime exposure.
  if (!entry) return true;
  return entry.dev !== true && entry.devOptional !== true;
}

export function evaluateRuntimeAudit(audit, lock) {
  const blocking = [];
  const ignoredDevelopmentOnly = [];

  for (const [name, vulnerability] of Object.entries(audit?.vulnerabilities ?? {})) {
    const rank = severityRank[vulnerability?.severity] ?? minimumSeverity;
    if (rank < minimumSeverity) continue;

    const nodes = Array.isArray(vulnerability?.nodes) ? vulnerability.nodes : [];
    const runtimeNodes = nodes.length === 0 ? ["<unresolved>"] : nodes.filter(node => isRuntimeNode(lock, node));
    const record = {
      name,
      severity: vulnerability?.severity ?? "unknown",
      via: vulnerability?.via ?? [],
      nodes,
      runtimeNodes,
    };

    if (runtimeNodes.length > 0) blocking.push(record);
    else ignoredDevelopmentOnly.push(record);
  }

  return { blocking, ignoredDevelopmentOnly };
}

function selfTest() {
  const lock = {
    packages: {
      "node_modules/runtime-risk": { version: "1.0.0" },
      "node_modules/dev-risk": { version: "1.0.0", dev: true },
      "node_modules/dev-optional-risk": { version: "1.0.0", devOptional: true },
    },
  };
  const audit = {
    vulnerabilities: {
      runtime: { severity: "high", nodes: ["node_modules/runtime-risk"], via: [] },
      dev: { severity: "critical", nodes: ["node_modules/dev-risk"], via: [] },
      devOptional: { severity: "high", nodes: ["node_modules/dev-optional-risk"], via: [] },
      moderateRuntime: { severity: "moderate", nodes: ["node_modules/runtime-risk"], via: [] },
    },
  };
  const result = evaluateRuntimeAudit(audit, lock);
  assert.deepEqual(result.blocking.map(item => item.name), ["runtime"]);
  assert.deepEqual(result.ignoredDevelopmentOnly.map(item => item.name).sort(), ["dev", "devOptional"]);
  console.log("Runtime dependency audit self-test passed.");
}

function summarizeVia(via) {
  if (!Array.isArray(via)) return [];
  return via.slice(0, 6).map(item => typeof item === "string" ? item : item?.title ?? item?.name ?? "advisory");
}

function main() {
  const argument = process.argv[2];
  if (argument === "--self-test") {
    selfTest();
    return;
  }

  const workspace = argument || ".";
  const cwd = path.resolve(process.cwd(), workspace);
  const lock = JSON.parse(readFileSync(path.join(cwd, "package-lock.json"), "utf8"));
  const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
  const auditProcess = spawnSync(npmExecutable, ["audit", "--json"], {
    cwd,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });

  let audit;
  try {
    audit = JSON.parse(auditProcess.stdout || "{}");
  } catch {
    console.error(auditProcess.stderr || auditProcess.stdout || "npm audit did not return valid JSON.");
    process.exit(2);
  }

  if (audit?.error) {
    console.error(`npm audit failed for ${workspace}: ${audit.error.summary || audit.error.message || "registry error"}`);
    process.exit(2);
  }

  const result = evaluateRuntimeAudit(audit, lock);
  for (const item of result.ignoredDevelopmentOnly) {
    console.warn(`[dev-only advisory] ${item.severity} ${item.name}: ${summarizeVia(item.via).join("; ") || "see npm audit output"}`);
  }

  if (result.blocking.length > 0) {
    for (const item of result.blocking) {
      console.error(`[runtime advisory] ${item.severity} ${item.name}: ${item.runtimeNodes.join(", ")}`);
      for (const detail of summarizeVia(item.via)) console.error(`  - ${detail}`);
    }
    console.error(`Runtime dependency audit failed for ${workspace}: ${result.blocking.length} high/critical runtime finding(s).`);
    process.exit(1);
  }

  console.log(`Runtime dependency audit passed for ${workspace}. Ignored ${result.ignoredDevelopmentOnly.length} high/critical development-only finding(s).`);
}

main();
