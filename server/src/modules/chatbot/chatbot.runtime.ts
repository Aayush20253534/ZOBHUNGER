import { env } from "../../config/env.js";
import { redisStatus, redisTransport } from "../../config/redis.js";
import { createChatbotResponseCache } from "./chatbot.cache.js";
import { ChatbotMetrics } from "./chatbot.metrics.js";
import { getDefaultKnowledgeRetriever, invalidateDefaultKnowledgeRetriever } from "./rag/index.js";
import { createChatbotService, type ChatbotService } from "./chatbot.service.js";
import { createGroqClient } from "./groq.client.js";
import { createGeminiEmbeddingClient } from "./rag/embedding.client.js";

let servicePromise: Promise<ChatbotService> | null = null;
const metrics = new ChatbotMetrics();
let runtimeKnowledge: { fingerprint: string; documents: number; chunks: number } | null = null;

function modelSignature(): string {
  return JSON.stringify({
    model: env.GROQ_MODEL,
    fallbackModel: env.GROQ_FALLBACK_MODEL ?? null,
    maxCompletionTokens: env.GROQ_MAX_COMPLETION_TOKENS,
    temperature: env.GROQ_TEMPERATURE,
    reasoningEffort: env.GROQ_REASONING_EFFORT ?? null,
    promptVersion: 3,
    rerank: env.CHATBOT_RERANK_ENABLED,
    vector: env.CHATBOT_VECTOR_ENABLED,
    embeddingProvider: env.CHATBOT_VECTOR_ENABLED ? "gemini" : null,
    embeddingModel: env.CHATBOT_VECTOR_ENABLED ? env.GEMINI_EMBEDDING_MODEL : null,
    decomposition: env.CHATBOT_DECOMPOSITION_ENABLED,
    tools: env.CHATBOT_TOOLS_ENABLED,
    multilingual: env.CHATBOT_MULTILINGUAL_ENABLED,
  });
}

export function getChatbotService(): Promise<ChatbotService> {
  if (!servicePromise) {
    const config = {
      enabled: env.CHATBOT_ENABLED,
      maxHistoryMessages: env.CHATBOT_MAX_HISTORY_MESSAGES,
      ragTopK: env.CHATBOT_RAG_TOP_K,
      contextMaxCharacters: env.CHATBOT_CONTEXT_MAX_CHARACTERS,
      rerankEnabled: env.CHATBOT_RERANK_ENABLED,
      rerankCandidates: env.CHATBOT_RERANK_CANDIDATES,
      minGroundingScore: env.CHATBOT_MIN_GROUNDING_SCORE,
      memoryEnabled: env.CHATBOT_MEMORY_ENABLED,
      memoryMaxMessages: env.CHATBOT_MEMORY_MAX_MESSAGES,
      cacheEnabled: env.CHATBOT_CACHE_ENABLED,
      modelSignature: modelSignature(),
      vectorEnabled: env.CHATBOT_VECTOR_ENABLED,
      vectorCandidates: env.CHATBOT_VECTOR_CANDIDATES,
      rrfK: env.CHATBOT_RRF_K,
      decompositionEnabled: env.CHATBOT_DECOMPOSITION_ENABLED,
      toolsEnabled: env.CHATBOT_TOOLS_ENABLED,
      multilingualEnabled: env.CHATBOT_MULTILINGUAL_ENABLED,
    };
    const modelClient = createGroqClient({
      apiKey: env.GROQ_API_KEY ?? "",
      baseUrl: env.GROQ_API_BASE_URL,
      model: env.GROQ_MODEL,
      ...(env.GROQ_FALLBACK_MODEL ? { fallbackModel: env.GROQ_FALLBACK_MODEL } : {}),
      timeoutMs: env.GROQ_API_TIMEOUT_MS,
      maxCompletionTokens: env.GROQ_MAX_COMPLETION_TOKENS,
      temperature: env.GROQ_TEMPERATURE,
      ...(env.GROQ_REASONING_EFFORT ? { reasoningEffort: env.GROQ_REASONING_EFFORT } : {}),
    });
    const embeddingClient = env.CHATBOT_VECTOR_ENABLED && env.GEMINI_API_KEY
      ? createGeminiEmbeddingClient({
          apiKey: env.GEMINI_API_KEY,
          baseUrl: env.GEMINI_EMBEDDING_API_BASE_URL,
          model: env.GEMINI_EMBEDDING_MODEL,
          timeoutMs: env.GEMINI_EMBEDDING_TIMEOUT_MS,
        })
      : undefined;
    const responseCache = createChatbotResponseCache({
      enabled: env.CHATBOT_CACHE_ENABLED,
      prefix: env.REDIS_KEY_PREFIX,
      ttlSeconds: env.CHATBOT_CACHE_TTL_SECONDS,
      transport: redisTransport,
    });

    if (!env.CHATBOT_ENABLED) {
      servicePromise = Promise.resolve(createChatbotService({
        config,
        modelClient,
        responseCache,
        metrics,
        retriever: { fingerprint: "disabled", search: () => ({ results: [] }) },
      }));
    } else {
      servicePromise = getDefaultKnowledgeRetriever().then((retriever) => {
        runtimeKnowledge = {
          fingerprint: retriever.fingerprint,
          documents: retriever.index.documentCount,
          chunks: retriever.index.chunkCount,
        };
        return createChatbotService({ config, retriever, modelClient, embeddingClient, responseCache, metrics });
      });
    }
  }
  return servicePromise;
}

export function chatbotOperationalStatus() {
  const redis = redisStatus();
  return {
    enabled: env.CHATBOT_ENABLED,
    initialized: Boolean(servicePromise),
    provider: "groq",
    model: env.GROQ_MODEL,
    fallbackModel: env.GROQ_FALLBACK_MODEL ?? null,
    cache: !env.CHATBOT_CACHE_ENABLED ? "disabled" : redis.ready ? "ready" : "bypass",
    retrieval: {
      hybrid: true,
      rerank: env.CHATBOT_RERANK_ENABLED,
      rerankCandidates: env.CHATBOT_RERANK_CANDIDATES,
      groundingThreshold: env.CHATBOT_MIN_GROUNDING_SCORE,
      vector: env.CHATBOT_VECTOR_ENABLED,
      embeddingProvider: env.CHATBOT_VECTOR_ENABLED ? "gemini" : null,
      embeddingModel: env.CHATBOT_VECTOR_ENABLED ? env.GEMINI_EMBEDDING_MODEL : null,
      decomposition: env.CHATBOT_DECOMPOSITION_ENABLED,
    },
    tools: { enabled: env.CHATBOT_TOOLS_ENABLED },
    multilingual: { enabled: env.CHATBOT_MULTILINGUAL_ENABLED },
    memory: { enabled: env.CHATBOT_MEMORY_ENABLED, maxMessages: env.CHATBOT_MEMORY_MAX_MESSAGES },
    knowledge: runtimeKnowledge
      ? { loaded: true, documents: runtimeKnowledge.documents, chunks: runtimeKnowledge.chunks, fingerprint: runtimeKnowledge.fingerprint.slice(0, 12) }
      : { loaded: false },
    metrics: (() => {
      const snapshot = metrics.snapshot();
      return {
        requests: snapshot.requests,
        errors: snapshot.errors,
        cacheHitRate: Math.round(snapshot.cache.hitRate * 10_000) / 10_000,
        averageLatencyMs: Math.round(snapshot.latency.averageMs * 100) / 100,
        totalTokens: snapshot.tokens.total,
      };
    })(),
  };
}

export function chatbotMetricsSnapshot() {
  return metrics.snapshot();
}

export function refreshChatbotRuntime() {
  servicePromise = null;
  runtimeKnowledge = null;
  invalidateDefaultKnowledgeRetriever();
}

export function resetChatbotServiceForTests() {
  refreshChatbotRuntime();
  metrics.reset();
}
