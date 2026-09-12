import { evaluateKnowledgeCoverage, loadKnowledgeBase } from "../../src/modules/chatbot/knowledge/index.js";

const loaded = await loadKnowledgeBase();
if (loaded.issues.length) {
  console.error(JSON.stringify({
    status: "failed",
    issues: loaded.issues,
  }, null, 2));
  process.exitCode = 1;
} else {
  const coverage = await evaluateKnowledgeCoverage(loaded.documents);
  const status = coverage.missingRoutes.length ? "failed" : "passed";
  console.log(JSON.stringify({ status, ...coverage }, null, 2));
  if (status === "failed") process.exitCode = 1;
}
