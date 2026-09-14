import { createHash } from "node:crypto";
import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/db.js";
import { logger } from "../../../utils/logger.js";
import type { ChatbotRetriever } from "../chatbot.types.js";
import type { KnowledgeSearchOptions, KnowledgeSearchResult } from "./rag.types.js";
import type { EmbeddingClient } from "./embedding.client.js";

export interface HybridVectorConfig {
  enabled: boolean;
  denseCandidates: number;
  rrfK: number;
  embeddingClient?: EmbeddingClient;
}

interface DenseRow { chunkId: string; similarity: number }
const syncByFingerprint = new Map<string, Promise<void>>();

function contentHash(chunk: NonNullable<ChatbotRetriever["index"]>["chunks"][number], client: EmbeddingClient) {
  return createHash("sha256").update(JSON.stringify({
    id: chunk.id, documentId: chunk.documentId, title: chunk.title, section: chunk.section,
    url: chunk.url, content: chunk.content, keywords: chunk.keywords, aliases: chunk.aliases,
    embeddingProvider: "gemini", embeddingModel: client.model, embeddingDimensions: client.dimensions,
  })).digest("hex");
}

function embeddingText(chunk: NonNullable<ChatbotRetriever["index"]>["chunks"][number]) {
  return [chunk.title, chunk.sectionPath.join(" > "), chunk.description ?? "", chunk.keywords.join(", "), chunk.aliases.join(", "), chunk.content]
    .filter(Boolean).join("\n").slice(0, 12_000);
}

function vectorLiteral(vector: number[]) { return `[${vector.join(",")}]`; }

async function syncVectorIndex(retriever: ChatbotRetriever, client: EmbeddingClient) {
  if (!retriever.index) throw new Error("Vector retrieval requires a knowledge index");
  const existing = await prisma.$queryRaw<Array<{ chunkId: string; contentHash: string }>>(Prisma.sql`
    SELECT "chunkId", "contentHash" FROM "ChatbotKnowledgeEmbedding"
  `);
  const hashes = new Map(existing.map((row) => [row.chunkId, row.contentHash]));
  const pending = retriever.index.chunks.filter((chunk) => hashes.get(chunk.id) !== contentHash(chunk, client));

  for (let offset = 0; offset < pending.length; offset += 32) {
    const batch = pending.slice(offset, offset + 32);
    const vectors = await client.embedDocuments(batch.map((chunk) => ({ text: embeddingText(chunk), title: chunk.title })));
    for (let index = 0; index < batch.length; index += 1) {
      const chunk = batch[index];
      const vector = vectors[index];
      if (!chunk || !vector) continue;
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO "ChatbotKnowledgeEmbedding" ("chunkId", "documentId", "contentHash", "knowledgeFingerprint", "embedding", "updatedAt")
        VALUES (${chunk.id}, ${chunk.documentId}, ${contentHash(chunk, client)}, ${retriever.fingerprint}, ${vectorLiteral(vector)}::vector, CURRENT_TIMESTAMP)
        ON CONFLICT ("chunkId") DO UPDATE SET
          "documentId" = EXCLUDED."documentId",
          "contentHash" = EXCLUDED."contentHash",
          "knowledgeFingerprint" = EXCLUDED."knowledgeFingerprint",
          "embedding" = EXCLUDED."embedding",
          "updatedAt" = CURRENT_TIMESTAMP
      `);
    }
  }

  const ids = retriever.index.chunks.map((chunk) => chunk.id);
  if (ids.length) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM "ChatbotKnowledgeEmbedding"
      WHERE "chunkId" NOT IN (${Prisma.join(ids)})
    `);
  }
}

async function ensureSynced(retriever: ChatbotRetriever, client: EmbeddingClient) {
  const syncKey = `${retriever.fingerprint}:${client.model}:${client.dimensions}`;
  let promise = syncByFingerprint.get(syncKey);
  if (!promise) {
    promise = syncVectorIndex(retriever, client).catch((error) => {
      syncByFingerprint.delete(syncKey);
      throw error;
    });
    syncByFingerprint.set(syncKey, promise);
  }
  await promise;
}

function rrfFuse(
  lexicalSets: KnowledgeSearchResult[][],
  denseSets: KnowledgeSearchResult[][],
  topK: number,
  k: number,
): KnowledgeSearchResult[] {
  const score = new Map<string, number>();
  const item = new Map<string, KnowledgeSearchResult>();
  const add = (sets: KnowledgeSearchResult[][], weight: number) => {
    for (const set of sets) {
      set.forEach((entry, index) => {
        item.set(entry.chunk.id, entry);
        score.set(entry.chunk.id, (score.get(entry.chunk.id) ?? 0) + weight / (k + index + 1));
      });
    }
  };
  add(lexicalSets, 1);
  add(denseSets, 1.15);
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, fused]) => {
      const original = item.get(id)!;
      return { ...original, score: Number(Math.max(original.score, fused * 10).toFixed(4)) };
    });
}

async function denseSearch(retriever: ChatbotRetriever, query: string, client: EmbeddingClient, topK: number): Promise<KnowledgeSearchResult[]> {
  if (!retriever.index) return [];
  await ensureSynced(retriever, client);
  const [vector] = await client.embedQueries([query]);
  if (!vector) return [];
  const currentIds = retriever.index.chunks.map((chunk) => chunk.id);
  if (!currentIds.length) return [];
  const rows = await prisma.$queryRaw<DenseRow[]>(Prisma.sql`
    SELECT "chunkId", (1 - ("embedding" <=> ${vectorLiteral(vector)}::vector))::float8 AS similarity
    FROM "ChatbotKnowledgeEmbedding"
    WHERE "chunkId" IN (${Prisma.join(currentIds)})
    ORDER BY "embedding" <=> ${vectorLiteral(vector)}::vector
    LIMIT ${topK}
  `);
  const byId = new Map(retriever.index.chunks.map((chunk) => [chunk.id, chunk]));
  return rows.flatMap((row) => {
    const chunk = byId.get(row.chunkId);
    if (!chunk || !Number.isFinite(row.similarity)) return [];
    return [{
      chunk: {
        id: chunk.id, documentId: chunk.documentId, title: chunk.title, category: chunk.category, url: chunk.url,
        description: chunk.description, keywords: [...chunk.keywords], aliases: [...chunk.aliases], section: chunk.section,
        sectionPath: [...chunk.sectionPath], content: chunk.content, sourcePath: chunk.sourcePath,
        estimatedTokens: chunk.estimatedTokens, ordinal: chunk.ordinal,
      },
      score: Math.max(0, row.similarity) * 100,
    } satisfies KnowledgeSearchResult];
  });
}

export async function hybridRetrieve(
  retriever: ChatbotRetriever,
  queries: string[],
  options: KnowledgeSearchOptions,
  config: HybridVectorConfig,
): Promise<{ results: KnowledgeSearchResult[]; vectorUsed: boolean }> {
  const topK = Math.max(1, options.topK ?? 6);
  const lexicalSets = queries.map((query) => retriever.search(query, { ...options, topK: Math.max(topK * 2, config.denseCandidates) }).results);
  if (!config.enabled || !config.embeddingClient) {
    return { results: rrfFuse(lexicalSets, [], topK, config.rrfK), vectorUsed: false };
  }
  try {
    const denseSets = await Promise.all(queries.map((query) => denseSearch(retriever, query, config.embeddingClient!, config.denseCandidates)));
    return { results: rrfFuse(lexicalSets, denseSets, topK, config.rrfK), vectorUsed: true };
  } catch (error) {
    logger.warn("chatbot.vector.fallback", { error: error instanceof Error ? error.message.slice(0, 260) : "unknown" });
    return { results: rrfFuse(lexicalSets, [], topK, config.rrfK), vectorUsed: false };
  }
}

export function resetVectorSyncForTests() { syncByFingerprint.clear(); }
