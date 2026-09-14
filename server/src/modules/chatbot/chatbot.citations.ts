import type { KnowledgeSearchResult } from "./rag/rag.types.js";

const CITATION = /\[S(\d{1,2})\]/g;

export interface CitationValidation {
  valid: boolean;
  cited: number[];
  invalid: number[];
  missing: boolean;
}

export function validateAnswerCitations(answer: string, results: KnowledgeSearchResult[]): CitationValidation {
  const cited = [...answer.matchAll(CITATION)].map((match) => Number(match[1])).filter(Number.isFinite);
  const unique = [...new Set(cited)];
  const invalid = unique.filter((index) => index < 1 || index > results.length);
  return { valid: unique.length > 0 && invalid.length === 0, cited: unique, invalid, missing: unique.length === 0 };
}

export function citationRepairPrompt(answer: string, results: KnowledgeSearchResult[]) {
  const available = results.map((result, index) => `[S${index + 1}] ${result.chunk.title} > ${result.chunk.section}`).join("\n");
  return `Rewrite the draft answer so every ZOBHUNGER-specific factual sentence is supported by one or more citations in the exact form [S1], [S2], etc. Use only the listed source IDs. Do not add facts. If a factual claim is unsupported, remove it. Preserve the user's language, useful Markdown structure and valid links, and keep the answer concise. If the draft contains a Markdown table, keep it valid instead of flattening it into pipe-delimited prose.\n\nAVAILABLE SOURCE IDS\n${available}\n\nDRAFT ANSWER\n${answer}`;
}
