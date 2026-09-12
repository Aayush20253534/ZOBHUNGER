import { loadKnowledgeBase } from "../../src/modules/chatbot/knowledge/index.js";

const result = await loadKnowledgeBase();

if (result.issues.length > 0) {
  for (const issue of result.issues) {
    console.error(`[ERROR] ${issue.file ?? "knowledge"}: ${issue.message}`);
  }
  process.exitCode = 1;
} else if (result.documents.length === 0) {
  console.log("No published chatbot knowledge documents yet. Phase 1 infrastructure is ready for Phase 2 content.");
} else {
  for (const document of result.documents) {
    console.log(`${document.metadata.id}\t${document.metadata.category}\t${document.metadata.url}`);
  }
  console.log(`Loaded ${result.documents.length} published knowledge document(s).`);
}
