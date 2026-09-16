import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "node_modules", "dist", "coverage", ".release-artifacts"]);
const ignoredFiles = new Set(["package-lock.json", "npm-shrinkwrap.json", "scripts/security/scan-secrets.mjs"]);
const textExtensions = new Set(["", ".cjs", ".css", ".env", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".prisma", ".sh", ".ts", ".tsx", ".txt", ".yaml", ".yml"]);

const secretPatterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/g],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["Slack token", /\bxox(?:b|p|a|r|s)-[A-Za-z0-9-]{20,}\b/g],
  ["Stripe live secret", /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/g],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ["provider-style secret", /\bsk-[A-Za-z0-9_-]{32,}\b/g],
];

const secretNames = "JWT_SECRET|MFA_ENCRYPTION_KEY|PII_ENCRYPTION_KEY|CASHFREE_SECRET_KEY|CLOUDINARY_API_SECRET|GROQ_API_KEY|GEMINI_API_KEY|RESEND_API_KEY|REDIS_URL|DATABASE_URL";
const envAssignment = new RegExp(`^\\s*(${secretNames})\\s*=\\s*["']?([^\\s"'#]+)`, "gim");
const yamlAssignment = new RegExp(`^\\s*(${secretNames})\\s*:\\s*["']?([^\\s"'#]+)`, "gim");
const codeAssignment = new RegExp("\\b(" + secretNames + ")\\s*=\\s*[\"'`]([^\"'`]{12,})[\"'`]", "gi");
const safeValue = /^(?:\$\{|process\.env\.|env\.|<|\[|\(|example|sample|test|dummy|changeme|replace|your[-_]|local_|redis:\/\/(?:127\.0\.0\.1|localhost)|postgresql:\/\/[^:]+:(?:local_ci_only|zobhunger_test)@)/i;

function recursivelyList(directory) {
  const output = [];
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const absolute = join(directory, entry);
    const rel = relative(root, absolute).replaceAll("\\", "/");
    const info = statSync(absolute);
    if (info.isDirectory()) output.push(...recursivelyList(absolute));
    else output.push(rel);
  }
  return output;
}

function trackedFiles() {
  try {
    const raw = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const files = raw.split("\0").filter(Boolean);
    if (files.length) return files;
  } catch {
    // ZIP/source snapshots do not necessarily include .git. Fall back to a bounded tree walk.
  }
  return recursivelyList(root);
}

function isTextCandidate(file) {
  if (ignoredFiles.has(file)) return false;
  return textExtensions.has(extname(file).toLowerCase());
}

const findings = [];
for (const file of trackedFiles()) {
  const name = basename(file);
  if (/^\.env(?:\.|$)/.test(name) && name !== ".env.example") {
    findings.push({ file, kind: "committed environment file", line: 1 });
  }
  if (!isTextCandidate(file)) continue;
  let text;
  try {
    text = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }

  for (const [kind, pattern] of secretPatterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const line = text.slice(0, match.index).split("\n").length;
      findings.push({ file, kind, line });
    }
  }

  const extension = extname(file).toLowerCase();
  const isEnvLike = /^\.env(?:\.|$)/.test(name);
  const assignmentPatterns = isEnvLike ? [envAssignment] : [".yml", ".yaml"].includes(extension) ? [yamlAssignment] : file.includes("/tests/") || file.startsWith("scripts/tests/") ? [] : [codeAssignment];
  for (const assignmentPattern of assignmentPatterns) {
    assignmentPattern.lastIndex = 0;
    for (const match of text.matchAll(assignmentPattern)) {
      const value = match[2]?.trim() ?? "";
      if (!value || safeValue.test(value) || value.length < 12) continue;
      const line = text.slice(0, match.index).split("\n").length;
      findings.push({ file, kind: `${match[1]} literal`, line });
    }
  }
}

if (findings.length) {
  console.error("Potential committed secrets detected:");
  for (const finding of findings) console.error(`- ${finding.file}:${finding.line} (${finding.kind})`);
  console.error("Move real credentials to repository/environment secrets and rotate any exposed value before retrying.");
  process.exit(1);
}

console.log("Secret scan passed: no high-confidence committed credentials detected.");
