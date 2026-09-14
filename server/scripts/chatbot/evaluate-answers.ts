import { mkdir, writeFile } from "node:fs/promises";
import { env } from "../../src/config/env.js";
import { getChatbotService } from "../../src/modules/chatbot/chatbot.runtime.js";
import {
  answerEvaluationCases,
  buildAnswerEvaluationReport,
  evaluateChatbotAnswer,
} from "../../src/modules/chatbot/evaluation/index.js";

if (!env.CHATBOT_ENABLED) {
  throw new Error("CHATBOT_ENABLED=true is required for live answer evaluation");
}
if (!env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is required for live answer evaluation");
}

const output = new URL("../../../.release-artifacts/chatbot-answer-evaluation.json", import.meta.url);
const service = await getChatbotService();
const results = [];

for (const testCase of answerEvaluationCases) {
  const reply = await service.reply(
    { message: testCase.question, history: [] },
    { requestId: `answer-eval-${testCase.id}`, clientFingerprint: `answer-eval-${testCase.id}` },
  );
  const evaluated = evaluateChatbotAnswer(testCase, reply);
  results.push(evaluated);
  console.log(`${evaluated.passed ? "PASS" : "FAIL"} ${testCase.id}${evaluated.failures.length ? `: ${evaluated.failures.join("; ")}` : ""}`);
}

const report = buildAnswerEvaluationReport(results);
await mkdir(new URL("../../../.release-artifacts/", import.meta.url), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`\nAnswer evaluation: ${report.status.toUpperCase()} (${report.metrics.passed}/${report.metrics.cases})`);
console.log(`Citations ${(report.metrics.citationAccuracy * 100).toFixed(1)}% | Sources ${(report.metrics.sourceHitRate * 100).toFixed(1)}% | Refusals ${(report.metrics.refusalAccuracy * 100).toFixed(1)}% | Safety ${(report.metrics.forbiddenClaimSafety * 100).toFixed(1)}%`);
console.log("Report: .release-artifacts/chatbot-answer-evaluation.json");
if (report.status !== "passed") process.exitCode = 1;
