import { validateKnowledgeBase } from "../../src/modules/chatbot/knowledge/index.js";

const result = await validateKnowledgeBase();

for (const issue of result.issues) {
  const marker = issue.severity === "error" ? "ERROR" : "WARN";
  const file = issue.file ? ` ${issue.file}` : "";
  console.log(`[${marker}]${file} ${issue.code}: ${issue.message}`);
}

console.log(
  `Knowledge validation: ${result.documents.length} document(s), ${result.errorCount} error(s), ${result.warningCount} warning(s).`,
);

if (!result.valid) process.exitCode = 1;
