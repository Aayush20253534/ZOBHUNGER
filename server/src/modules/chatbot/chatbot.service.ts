import { performance } from "node:perf_hooks";
import { ChatbotAudience } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { logger } from "../../utils/logger.js";
import { audienceActions, inferChatbotAudience } from "./chatbot.audience.js";
import { buildChatbotSystemPrompt, buildRetrievalQuery } from "./chatbot.prompt.js";
import type { ChatbotResponseCache } from "./chatbot.cache.js";
import { loadConversationMemory, persistConversationTurn } from "./chatbot.memory.js";
import { ChatbotMetrics, type ChatbotCacheStatus } from "./chatbot.metrics.js";
import { rerankKnowledgeResults } from "./chatbot.reranker.js";
import type {
  ChatbotMessageInput,
  ChatbotMessageResult,
  ChatbotModelClient,
  ChatbotModelResponse,
  ChatbotRequestContext,
  ChatbotRetriever,
  ChatbotServiceConfig,
  ChatbotSource,
} from "./chatbot.types.js";
import { GroqApiError } from "./groq.client.js";

export interface CreateChatbotServiceOptions {
  config: ChatbotServiceConfig;
  retriever: ChatbotRetriever;
  modelClient: ChatbotModelClient;
  responseCache?: ChatbotResponseCache;
  metrics?: ChatbotMetrics;
}

const SOCIAL_MESSAGE = /^(?:hi|hello|hey|good\s+(?:morning|afternoon|evening)|thanks|thank\s+you|what can you do|help)\s*[!.?]*$/i;
const UNCERTAINTY_SIGNAL = /\b(?:i do not have|i don't have|not enough verified information|cannot confirm|unable to confirm)\b/i;

function uniqueSources(results: ReturnType<ChatbotRetriever["search"]>["results"]): ChatbotSource[] {
  const seen = new Set<string>();
  const sources: ChatbotSource[] = [];
  for (const result of results) {
    const key = `${result.chunk.documentId}:${result.chunk.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push({ title: result.chunk.title, url: result.chunk.url, category: result.chunk.category });
  }
  return sources;
}

function mapGroqError(error: GroqApiError): HttpError {
  const providerSignal = `${error.code ?? ""} ${error.message}`.toLowerCase();
  if ([400, 403, 404, 410, 422].includes(error.status ?? 0)
    && /(model|deprecat|decommission|retir|permission|not found|does not exist|unsupported)/.test(providerSignal)) {
    return new HttpError(503, "The chatbot model is temporarily unavailable. Please try again shortly.", { code: "CHATBOT_MODEL_UNAVAILABLE" });
  }
  if (error.status === 429) {
    return new HttpError(503, "The chatbot is temporarily busy. Please try again shortly.", {
      code: "CHATBOT_UPSTREAM_RATE_LIMITED",
      ...(error.retryAfterSeconds !== undefined ? { details: { retryAfterSeconds: error.retryAfterSeconds } } : {}),
    });
  }
  if (error.status === 401 || error.status === 403) return new HttpError(503, "The chatbot is temporarily unavailable.", { code: "CHATBOT_CONFIGURATION_ERROR" });
  if (error.code === "GROQ_TIMEOUT") return new HttpError(504, "The chatbot took too long to respond. Please try again.", { code: "CHATBOT_TIMEOUT" });
  return new HttpError(502, "The chatbot could not generate a response. Please try again.", { code: "CHATBOT_UPSTREAM_ERROR" });
}

function logContext(input: ChatbotMessageInput, request: ChatbotRequestContext, extra: Record<string, unknown>) {
  return {
    requestId: request.requestId,
    messageCharacters: input.message.length,
    historyMessages: input.history.length,
    currentPage: input.currentPage ?? null,
    conversation: input.conversationId ? "present" : "absent",
    ...extra,
  };
}

function confidenceFor(score: number, threshold: number) {
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.round(Math.min(1, score / Math.max(1, threshold * 3)) * 100) / 100;
}

function unansweredResult(input: ChatbotMessageInput, audience: ChatbotAudience, confidence = 0): ChatbotMessageResult {
  return {
    answer: "I don’t have enough verified ZOBHUNGER information to answer that confidently. I can help you reach the right team or point you to the relevant official form instead.",
    sources: [],
    grounded: false,
    unanswered: true,
    confidence,
    audience,
    actions: audienceActions(audience, true),
    handoverRecommended: true,
    ...(input.conversationId ? { conversationId: input.conversationId } : {}),
  };
}

function socialResult(input: ChatbotMessageInput, audience: ChatbotAudience): ChatbotMessageResult {
  return {
    answer: "Hello. I’m the ZOBHUNGER AI Assistant. I can help with verified information about services, workforce requirements, jobs, vendors and partnerships, and I can connect you with the right team when needed.",
    sources: [],
    grounded: true,
    unanswered: false,
    confidence: 1,
    audience,
    actions: audienceActions(audience, false),
    handoverRecommended: false,
    ...(input.conversationId ? { conversationId: input.conversationId } : {}),
  };
}

export function createChatbotService(options: CreateChatbotServiceOptions) {
  const metrics = options.metrics ?? new ChatbotMetrics();

  async function generate(
    input: ChatbotMessageInput,
    history: ChatbotMessageInput["history"],
    audience: ChatbotAudience,
    request: ChatbotRequestContext,
    onDelta?: (text: string) => void | Promise<void>,
  ): Promise<{ result: ChatbotMessageResult; provider: Record<string, number | string | undefined>; retrievalScore: number }> {
    if (SOCIAL_MESSAGE.test(input.message.trim())) {
      const result = socialResult(input, audience);
      if (onDelta) await onDelta(result.answer);
      return { result, provider: { retrievedChunks: 0 }, retrievalScore: 0 };
    }

    const retrievalQuery = buildRetrievalQuery(input.message, history);
    const candidateCount = options.config.rerankEnabled
      ? Math.max(options.config.ragTopK, options.config.rerankCandidates ?? 12)
      : options.config.ragTopK;
    const search = options.retriever.search(retrievalQuery, {
      topK: candidateCount,
      ...(input.currentPage ? { currentPage: input.currentPage } : {}),
    });
    const threshold = options.config.minGroundingScore ?? 4;
    const initialTopScore = search.results[0]?.score ?? 0;
    if (!search.results.length || initialTopScore < threshold) {
      const result = unansweredResult(input, audience, confidenceFor(initialTopScore, threshold));
      if (onDelta) await onDelta(result.answer);
      return { result, provider: { retrievedChunks: search.results.length }, retrievalScore: initialTopScore };
    }

    const results = options.config.rerankEnabled
      ? await rerankKnowledgeResults({ modelClient: options.modelClient, query: retrievalQuery, results: search.results, topK: options.config.ragTopK })
      : search.results.slice(0, options.config.ragTopK);
    const topScore = results[0]?.score ?? initialTopScore;
    const confidence = confidenceFor(topScore, threshold);
    const systemPrompt = buildChatbotSystemPrompt(results, input.currentPage, options.config.contextMaxCharacters);
    const modelRequest = {
      input: [
        { role: "system" as const, content: systemPrompt },
        ...history,
        { role: "user" as const, content: input.message },
      ],
      ...(request.clientFingerprint ? { user: request.clientFingerprint } : {}),
      ...(request.signal ? { signal: request.signal } : {}),
    };

    const providerStarted = performance.now();
    let response: ChatbotModelResponse;
    if (onDelta && options.modelClient.stream) response = await options.modelClient.stream(modelRequest, onDelta);
    else {
      response = await options.modelClient.generate(modelRequest);
      if (onDelta) await onDelta(response.text);
    }
    const providerDurationMs = response.usage?.providerDurationMs ?? (performance.now() - providerStarted);
    const modelUncertain = UNCERTAINTY_SIGNAL.test(response.text);
    const result: ChatbotMessageResult = {
      answer: response.text,
      sources: uniqueSources(results),
      grounded: !modelUncertain && results.length > 0,
      unanswered: modelUncertain,
      confidence: modelUncertain ? Math.min(confidence, 0.35) : confidence,
      audience,
      actions: audienceActions(audience, modelUncertain),
      handoverRecommended: modelUncertain,
      ...(input.conversationId ? { conversationId: input.conversationId } : {}),
    };

    return {
      result,
      retrievalScore: topScore,
      provider: {
        providerDurationMs,
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens,
        totalTokens: response.usage?.totalTokens,
        cachedPromptTokens: response.usage?.cachedPromptTokens,
        providerQueueMs: response.usage?.queueDurationMs,
        providerResponseId: response.responseId,
        providerModel: response.model,
        retrievedChunks: results.length,
        reranked: options.config.rerankEnabled ? "yes" : "no",
      },
    };
  }

  async function execute(input: ChatbotMessageInput, request: ChatbotRequestContext, onDelta?: (text: string) => void | Promise<void>): Promise<ChatbotMessageResult> {
    if (!options.config.enabled) throw new HttpError(503, "The chatbot is currently unavailable.", { code: "CHATBOT_DISABLED" });

    const started = performance.now();
    let storedAudience: ChatbotAudience = ChatbotAudience.UNKNOWN;
    let memoryHistory: ChatbotMessageInput["history"] = [];
    if (options.config.memoryEnabled && input.conversationId) {
      const memory = await loadConversationMemory(input.conversationId, options.config.memoryMaxMessages ?? options.config.maxHistoryMessages, request.clientFingerprint);
      memoryHistory = memory.history;
      storedAudience = memory.conversation?.audience ?? ChatbotAudience.UNKNOWN;
    }
    const sourceHistory = memoryHistory.length ? memoryHistory : input.history;
    const history = options.config.maxHistoryMessages === 0 ? [] : sourceHistory.slice(-options.config.maxHistoryMessages);
    const audience = inferChatbotAudience(input.message, storedAudience);

    let cacheStatus: ChatbotCacheStatus = "bypass";
    let provider: Record<string, number | string | undefined> = {};
    let retrievalScore = 0;
    let emittedDelta = false;
    const emit = onDelta ? async (text: string) => { if (text) { emittedDelta = true; await onDelta(text); } } : undefined;

    try {
      let result: ChatbotMessageResult;
      const cacheEligible = options.config.cacheEnabled && history.length === 0 && !input.conversationId && Boolean(options.responseCache?.enabled);
      if (cacheEligible && options.responseCache) {
        const cached = await options.responseCache.remember({
          message: input.message,
          ...(input.currentPage ? { currentPage: input.currentPage } : {}),
          knowledgeFingerprint: options.retriever.fingerprint,
          modelSignature: options.config.modelSignature ?? "default",
        }, async () => {
          const generated = await generate(input, history, audience, request, emit);
          provider = generated.provider;
          retrievalScore = generated.retrievalScore;
          return generated.result;
        });
        result = cached.value;
        cacheStatus = cached.status;
      } else {
        const generated = await generate(input, history, audience, request, emit);
        result = generated.result;
        provider = generated.provider;
        retrievalScore = generated.retrievalScore;
      }

      if (emit && !emittedDelta) await emit(result.answer);
      const durationMs = performance.now() - started;
      if (options.config.memoryEnabled && input.conversationId) {
        await persistConversationTurn({
          publicId: input.conversationId,
          clientFingerprint: request.clientFingerprint,
          audience,
          currentPage: input.currentPage,
          userMessage: input.message,
          result,
          retrievalScore,
          latencyMs: durationMs,
        }).catch((error) => logger.warn("chatbot.memory.persist_failed", { requestId: request.requestId, error: error instanceof Error ? error.message.slice(0, 220) : "unknown" }));
      }

      metrics.record({
        ok: true, grounded: result.grounded, cacheStatus, durationMs,
        providerDurationMs: typeof provider.providerDurationMs === "number" ? provider.providerDurationMs : undefined,
        promptTokens: typeof provider.promptTokens === "number" ? provider.promptTokens : undefined,
        completionTokens: typeof provider.completionTokens === "number" ? provider.completionTokens : undefined,
        totalTokens: typeof provider.totalTokens === "number" ? provider.totalTokens : undefined,
        cachedPromptTokens: typeof provider.cachedPromptTokens === "number" ? provider.cachedPromptTokens : undefined,
      });
      logger.info("chatbot.request.completed", logContext(input, request, {
        durationMs: Math.round(durationMs * 100) / 100,
        cacheStatus,
        transport: onDelta ? "stream" : "json",
        grounded: result.grounded,
        unanswered: result.unanswered,
        confidence: result.confidence,
        audience,
        sourceCount: result.sources.length,
        retrievalScore,
        ...provider,
      }));
      return result;
    } catch (error) {
      if (error instanceof GroqApiError && error.code === "GROQ_ABORTED" && request.signal?.aborted) {
        logger.info("chatbot.request.cancelled", logContext(input, request, { durationMs: Math.round((performance.now() - started) * 100) / 100, transport: onDelta ? "stream" : "json" }));
        throw error;
      }
      const mapped = error instanceof GroqApiError ? mapGroqError(error) : error;
      const durationMs = performance.now() - started;
      metrics.record({ ok: false, cacheStatus, durationMs });
      logger.warn("chatbot.request.failed", logContext(input, request, {
        durationMs: Math.round(durationMs * 100) / 100,
        cacheStatus,
        transport: onDelta ? "stream" : "json",
        errorCode: mapped instanceof HttpError ? mapped.code : "CHATBOT_INTERNAL_ERROR",
        statusCode: mapped instanceof HttpError ? mapped.statusCode : 500,
        ...(error instanceof GroqApiError ? { providerStatus: error.status ?? null, providerCode: error.code ?? null, providerMessage: error.message.slice(0, 240) } : {}),
      }));
      throw mapped;
    }
  }

  return {
    reply(input: ChatbotMessageInput, request: ChatbotRequestContext = {}) { return execute(input, request); },
    streamReply(input: ChatbotMessageInput, request: ChatbotRequestContext, onDelta: (text: string) => void | Promise<void>) { return execute(input, request, onDelta); },
    metrics() { return metrics.snapshot(); },
  };
}

export type ChatbotService = ReturnType<typeof createChatbotService>;
