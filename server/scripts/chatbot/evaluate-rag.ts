import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { evaluateRagRetriever } from "../../src/modules/chatbot/evaluation/index.js";
import { createKnowledgeRetriever } from "../../src/modules/chatbot/rag/index.js";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const output = new URL("../../../.release-artifacts/chatbot-rag-evaluation.json", import.meta.url);

const retriever = await createKnowledgeRetriever();
const report = evaluateRagRetriever(retriever);

await mkdir(new URL("../../../.release-artifacts/", import.meta.url), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);

console.log(`RAG evaluation: ${report.status.toUpperCase()}`);
console.log(`Knowledge: ${report.documentCount} documents, ${report.chunkCount} chunks, ${report.knowledgeFingerprint.slice(0, 12)}`);
console.log(`Cases: ${report.metrics.passedCases}/${report.metrics.cases} passed`);
console.log(`Top-1: ${(report.metrics.top1Accuracy * 100).toFixed(1)}% | Hit@3: ${(report.metrics.hitAt3 * 100).toFixed(1)}% | MRR: ${report.metrics.meanReciprocalRank.toFixed(3)} | No-match: ${(report.metrics.noMatchAccuracy * 100).toFixed(1)}%`);

if (report.failures.length) {
  console.log("\nFailed cases:");
  for (const failure of report.failures) {
    console.log(`- ${failure.id}: top=${failure.topDocumentId ?? "none"}; expectedRank=${failure.expectedRank ?? "none"}; returned=${failure.returnedDocumentIds.slice(0, 5).join(", ") || "none"}`);
  }
}

console.log(`\nReport: ${root}.release-artifacts/chatbot-rag-evaluation.json`);
if (report.status !== "passed") process.exitCode = 1;
