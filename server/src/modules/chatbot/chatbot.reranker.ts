import { logger } from "../../utils/logger.js";
import type { ChatbotModelClient } from "./chatbot.types.js";
import type { KnowledgeSearchResult } from "./rag/rag.types.js";

function parseRanking(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return [] as Array<{ id: string; score: number }>;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { ranking?: unknown };
    if (!Array.isArray(parsed.ranking)) return [];
    return parsed.ranking.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const id = "id" in item ? (item as { id?: unknown }).id : undefined;
      const score = "score" in item ? (item as { score?: unknown }).score : undefined;
      if (typeof id !== "string" || typeof score !== "number" || !Number.isFinite(score)) return [];
      return [{ id, score: Math.max(0, Math.min(1, score)) }];
    });
  } catch {
    return [];
  }
}

export async function rerankKnowledgeResults(input: {
  modelClient: ChatbotModelClient;
  query: string;
  results: KnowledgeSearchResult[];
  topK: number;
}): Promise<KnowledgeSearchResult[]> {
  if (input.results.length <= 1) return input.results.slice(0, input.topK);
  const candidates = input.results.map((result) => ({
    id: result.chunk.id,
    title: result.chunk.title,
    section: result.chunk.section,
    description: result.chunk.description ?? "",
    content: result.chunk.content.slice(0, 1100),
  }));
  try {
    const response = await input.modelClient.generate({ input: [
      {
        role: "system",
        content: "You are a retrieval reranker. Rank only the supplied ZOBHUNGER knowledge chunks by how directly they answer the query. Do not answer the query. Return strict JSON only: {\"ranking\":[{\"id\":\"chunk-id\",\"score\":0.0}]}. Use only supplied ids and scores from 0 to 1.",
      },
      { role: "user", content: `Query:\n${input.query.slice(0, 1800)}\n\nCandidates:\n${JSON.stringify(candidates)}` },
    ] });
    const ranking = parseRanking(response.text);
    if (!ranking.length) return input.results.slice(0, input.topK);
    const scores = new Map(ranking.map((item) => [item.id, item.score]));
    const maxOriginal = Math.max(...input.results.map((item) => item.score), 1);
    return [...input.results]
      .map((result) => ({ result, blended: (result.score / maxOriginal) * 0.42 + (scores.get(result.chunk.id) ?? 0) * 0.58 }))
      .sort((a, b) => b.blended - a.blended)
      .slice(0, input.topK)
      .map(({ result, blended }) => ({ ...result, score: Number((blended * maxOriginal).toFixed(4)) }));
  } catch (error) {
    logger.warn("chatbot.rerank.failed", { error: error instanceof Error ? error.message.slice(0, 220) : "unknown" });
    return input.results.slice(0, input.topK);
  }
}
