import { searchKnowledge } from "../../src/modules/chatbot/rag/index.js";

const args = process.argv.slice(2);
let currentPage: string | undefined;
let topK: number | undefined;
const queryParts: string[] = [];

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index] ?? "";
  if (argument === "--page") {
    currentPage = args[index + 1];
    index += 1;
    continue;
  }
  if (argument === "--top") {
    const parsed = Number(args[index + 1]);
    if (Number.isInteger(parsed) && parsed > 0) topK = parsed;
    index += 1;
    continue;
  }
  queryParts.push(argument);
}

const query = queryParts.join(" ").trim();
if (!query) {
  console.error('Usage: npm run chatbot:rag:search -- "your question" [--page /current-page] [--top 6]');
  process.exit(1);
}

const response = await searchKnowledge(query, {
  currentPage,
  topK,
  includeDebug: true,
});

console.log(`Query: ${response.query}`);
console.log(`Searched ${response.searchedChunks} chunk(s).`);

if (response.results.length === 0) {
  console.log("No knowledge chunks passed the relevance threshold.");
  process.exit(0);
}

for (const [index, result] of response.results.entries()) {
  console.log(`\n${index + 1}. ${result.chunk.title} > ${result.chunk.section}`);
  console.log(`   ${result.chunk.category} | ${result.chunk.url} | score=${result.score}`);
  if (result.debug) {
    console.log(`   terms=${result.debug.matchedTerms.join(", ") || "-"}`);
    console.log(`   reasons=${result.debug.reasons.join("; ") || "-"}`);
  }
  const preview = result.chunk.content.replace(/\s+/g, " ").slice(0, 240);
  console.log(`   ${preview}${result.chunk.content.length > 240 ? "…" : ""}`);
}
