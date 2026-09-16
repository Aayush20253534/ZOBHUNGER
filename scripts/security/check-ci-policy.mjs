import { existsSync, readFileSync } from "node:fs";

function requireFile(path) {
  if (!existsSync(path)) throw new Error(`Missing required security automation file: ${path}`);
  return readFileSync(path, "utf8");
}

function requireAll(path, content, needles) {
  for (const needle of needles) {
    if (!content.includes(needle)) throw new Error(`${path} is missing required security control: ${needle}`);
  }
}

const workflowPath = ".github/workflows/security-ci.yml";
const workflow = requireFile(workflowPath);
requireAll(workflowPath, workflow, [
  "npm audit --omit=dev --audit-level=high",
  "npm run security:secrets",
  "github/codeql-action/init@v3",
  "github/codeql-action/analyze@v3",
  "security-events: write",
]);

const dependabotPath = ".github/dependabot.yml";
const dependabot = requireFile(dependabotPath);
for (const directory of ['directory: "/"', 'directory: "/server"', 'directory: "/client"']) {
  if (!dependabot.includes(directory)) throw new Error(`${dependabotPath} does not cover ${directory.slice(11)}`);
}
if (!dependabot.includes('package-ecosystem: "github-actions"')) throw new Error(`${dependabotPath} does not monitor GitHub Actions`);

console.log("CI security policy check passed.");
