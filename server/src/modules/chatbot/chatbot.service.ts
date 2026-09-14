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
import { detectChatbotLanguage, localizedUnknown } from "./chatbot.language.js";
import { decomposeChatbotQuery } from "./chatbot.decomposition.js";
import { citationRepairPrompt, validateAnswerCitations } from "./chatbot.citations.js";
import { tryAuthenticatedChatbotTool } from "./chatbot.tools.js";
import { hybridRetrieve } from "./rag/vector-retrieval.js";
import type { EmbeddingClient } from "./rag/embedding.client.js";
import type { KnowledgeSearchResult } from "./rag/rag.types.js";
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
  embeddingClient?: EmbeddingClient;
  responseCache?: ChatbotResponseCache;
  metrics?: ChatbotMetrics;
}

const SOCIAL_MESSAGE = /^(?:hi|hello|hey|namaste|नमस्ते|good\s+(?:morning|afternoon|evening)|thanks|thank\s+you|shukriya|धन्यवाद|what can you do|help)\s*[!.?]*$/i;
const IDENTITY_MESSAGE = /(?:\bwho\s+are\s+you\b|\bwhat\s+are\s+you\b|\bwhat(?:'s|\s+is)\s+your\s+name\b|\bintroduce\s+yourself\b|\b(?:tum|aap)\s+(?:kaun|kon)\s+ho\b|\b(?:kaun|kon)\s+ho\s+(?:tum|aap)\b|(?:तुम|आप)\s+कौन\s+हो|तुम्हारा\s+नाम\s+क्या\s+है|आपका\s+नाम\s+क्या\s+है)/i;
const UNCERTAINTY_SIGNAL = /\b(?:i do not have|i don't have|not enough verified information|cannot confirm|unable to confirm|enough verified zobhunger information nahi|verified zobhunger information nahi)\b|पर्याप्त.*जानकारी नहीं/i;

function sourcesFor(results: KnowledgeSearchResult[]): ChatbotSource[] {
  return results.map((result, index) => ({
    citation: `S${index + 1}`,
    title: result.chunk.title,
    url: result.chunk.url,
    category: result.chunk.category,
    section: result.chunk.section,
  }));
}

function mapGroqError(error: GroqApiError): HttpError {
  const providerSignal = `${error.code ?? ""} ${error.message}`.toLowerCase();
  if ([400, 403, 404, 410, 422].includes(error.status ?? 0)
    && /(model|deprecat|decommission|retir|permission|not found|does not exist|unsupported)/.test(providerSignal)) {
    return new HttpError(503, "The chatbot model is temporarily unavailable. Please try again shortly.", { code: "CHATBOT_MODEL_UNAVAILABLE" });
  }
  if (error.status === 429) return new HttpError(503, "The chatbot is temporarily busy. Please try again shortly.", { code: "CHATBOT_UPSTREAM_RATE_LIMITED", ...(error.retryAfterSeconds !== undefined ? { details: { retryAfterSeconds: error.retryAfterSeconds } } : {}) });
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
    authenticatedRole: request.actor?.role ?? null,
    ...extra,
  };
}

function confidenceFor(score: number, threshold: number) {
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.round(Math.min(1, score / Math.max(1, threshold * 3)) * 100) / 100;
}

function unansweredResult(input: ChatbotMessageInput, audience: ChatbotAudience, language: ReturnType<typeof detectChatbotLanguage>, confidence = 0): ChatbotMessageResult {
  return {
    answer: localizedUnknown(language), language, sources: [], grounded: false, unanswered: true, confidence, audience,
    actions: audienceActions(audience, true), handoverRecommended: true,
    ...(input.conversationId ? { conversationId: input.conversationId } : {}),
  };
}

function identityResult(input: ChatbotMessageInput, audience: ChatbotAudience, language: ReturnType<typeof detectChatbotLanguage>): ChatbotMessageResult {
  const answer = language === "hi"
    ? "नमस्ते, मैं Aarohi हूँ, ZOBHUNGER की assistant। मैं आपको हमारी services, hiring process, jobs, partnerships और public company information समझने में मदद कर सकती हूँ।"
    : language === "hinglish"
      ? "Hi, main Aarohi hoon, ZOBHUNGER ki assistant. Main aapko services, hiring process, jobs, partnerships aur public company information samajhne mein help kar sakti hoon."
      : "Hi, I’m Aarohi, ZOBHUNGER’s assistant. I can help you understand our services, hiring process, jobs, partnerships and public company information.";
  return { answer, language, sources: [], grounded: true, unanswered: false, confidence: 1, audience, actions: audienceActions(audience, false), handoverRecommended: false, ...(input.conversationId ? { conversationId: input.conversationId } : {}) };
}

function socialResult(input: ChatbotMessageInput, audience: ChatbotAudience, language: ReturnType<typeof detectChatbotLanguage>): ChatbotMessageResult {
  const answer = language === "hi"
    ? "नमस्ते, मैं Aarohi हूँ, ZOBHUNGER की assistant। मैं verified services, workforce requirements, jobs, vendors और partnerships में मदद कर सकती हूँ।"
    : language === "hinglish"
      ? "Namaste, main Aarohi hoon, ZOBHUNGER ki assistant. Main verified services, workforce requirements, jobs, vendors aur partnerships mein help kar sakti hoon."
      : "Hello, I’m Aarohi, ZOBHUNGER’s assistant. I can help with verified information about services, workforce requirements, jobs, vendors and partnerships, and connect you with the right team when needed.";
  return { answer, language, sources: [], grounded: true, unanswered: false, confidence: 1, audience, actions: audienceActions(audience, false), handoverRecommended: false, ...(input.conversationId ? { conversationId: input.conversationId } : {}) };
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
    const language = options.config.multilingualEnabled === false ? "en" : detectChatbotLanguage(input.message);

    const tool = await tryAuthenticatedChatbotTool({ message: input.message, actor: request.actor, language, toolsEnabled: options.config.toolsEnabled !== false });
    if (tool) {
      const result: ChatbotMessageResult = {
        answer: tool.answer, language, toolUsed: tool.toolName, sources: [], grounded: true, unanswered: false, confidence: 1,
        audience, actions: tool.actions, handoverRecommended: false,
        ...(input.conversationId ? { conversationId: input.conversationId } : {}),
      };
      if (onDelta) await onDelta(result.answer);
      return { result, provider: { retrievedChunks: 0, toolUsed: tool.toolName }, retrievalScore: 0 };
    }

    if (IDENTITY_MESSAGE.test(input.message.trim())) {
      const result = identityResult(input, audience, language);
      if (onDelta) await onDelta(result.answer);
      return { result, provider: { retrievedChunks: 0, intent: "identity" }, retrievalScore: 0 };
    }

    if (SOCIAL_MESSAGE.test(input.message.trim())) {
      const result = socialResult(input, audience, language);
      if (onDelta) await onDelta(result.answer);
      return { result, provider: { retrievedChunks: 0, intent: "social" }, retrievalScore: 0 };
    }

    const retrievalQuery = buildRetrievalQuery(input.message, history);
    const queries = decomposeChatbotQuery(retrievalQuery, options.config.decompositionEnabled !== false);
    const candidateCount = options.config.rerankEnabled ? Math.max(options.config.ragTopK, options.config.rerankCandidates ?? 12) : options.config.ragTopK;
    const search = await hybridRetrieve(options.retriever, queries, {
      topK: candidateCount,
      ...(input.currentPage ? { currentPage: input.currentPage } : {}),
    }, {
      enabled: Boolean(options.config.vectorEnabled),
      denseCandidates: options.config.vectorCandidates ?? 16,
      rrfK: options.config.rrfK ?? 60,
      embeddingClient: options.embeddingClient,
    });

    const threshold = options.config.minGroundingScore ?? 4;
    const initialTopScore = search.results[0]?.score ?? 0;
    if (!search.results.length || initialTopScore < threshold) {
      const result = unansweredResult(input, audience, language, confidenceFor(initialTopScore, threshold));
      if (onDelta) await onDelta(result.answer);
      return { result, provider: { retrievedChunks: search.results.length, vectorUsed: search.vectorUsed ? "yes" : "no", decomposedQueries: queries.length }, retrievalScore: initialTopScore };
    }

    const results = options.config.rerankEnabled
      ? await rerankKnowledgeResults({ modelClient: options.modelClient, query: queries.join("\n"), results: search.results, topK: options.config.ragTopK })
      : search.results.slice(0, options.config.ragTopK);
    const topScore = results[0]?.score ?? initialTopScore;
    const confidence = confidenceFor(topScore, threshold);
    const systemPrompt = buildChatbotSystemPrompt(results, input.currentPage, options.config.contextMaxCharacters, { language, actor: request.actor, decomposedQueries: queries });
    const modelRequest = {
      input: [{ role: "system" as const, content: systemPrompt }, ...history, { role: "user" as const, content: input.message }],
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

    let answer = response.text.trim();
    let modelUncertain = UNCERTAINTY_SIGNAL.test(answer);
    let citationCheck = modelUncertain ? { valid: true, cited: [], invalid: [], missing: false } : validateAnswerCitations(answer, results);
    let citationRepaired = false;
    if (!modelUncertain && !citationCheck.valid) {
      const repair = await options.modelClient.generate({
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: citationRepairPrompt(answer, results) },
        ],
        ...(request.clientFingerprint ? { user: request.clientFingerprint } : {}),
        ...(request.signal ? { signal: request.signal } : {}),
      });
      const repaired = repair.text.trim();
      const repairedCheck = validateAnswerCitations(repaired, results);
      if (repairedCheck.valid) {
        answer = repaired;
        citationCheck = repairedCheck;
        citationRepaired = true;
      } else {
        modelUncertain = true;
        answer = localizedUnknown(language);
      }
    }

    const providerDurationMs = response.usage?.providerDurationMs ?? (performance.now() - providerStarted);
    const result: ChatbotMessageResult = {
      answer,
      language,
      sources: modelUncertain ? [] : sourcesFor(results),
      grounded: !modelUncertain && results.length > 0 && citationCheck.valid,
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
        vectorUsed: search.vectorUsed ? "yes" : "no",
        decomposedQueries: queries.length,
        citations: citationCheck.cited.length,
        citationRepaired: citationRepaired ? "yes" : "no",
      },
    };
  }

  async function execute(input: ChatbotMessageInput, request: ChatbotRequestContext, onDelta?: (text: string) => void | Promise<void>): Promise<ChatbotMessageResult> {
    if (!options.config.enabled) throw new HttpError(503, "The chatbot is currently unavailable.", { code: "CHATBOT_DISABLED" });
    const started = performance.now();
    let storedAudience: ChatbotAudience = ChatbotAudience.UNKNOWN;
    let memoryHistory: ChatbotMessageInput["history"] = [];
    if (options.config.memoryEnabled && input.conversationId && !request.actor) {
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
      const cacheEligible = options.config.cacheEnabled && history.length === 0 && !input.conversationId && !request.actor && Boolean(options.responseCache?.enabled);
      if (cacheEligible && options.responseCache) {
        const cached = await options.responseCache.remember({
          message: input.message,
          ...(input.currentPage ? { currentPage: input.currentPage } : {}),
          knowledgeFingerprint: options.retriever.fingerprint,
          modelSignature: options.config.modelSignature ?? "default",
        }, async () => {
          const generated = await generate(input, history, audience, request, emit);
          provider = generated.provider; retrievalScore = generated.retrievalScore; return generated.result;
        });
        result = cached.value; cacheStatus = cached.status;
      } else {
        const generated = await generate(input, history, audience, request, emit);
        result = generated.result; provider = generated.provider; retrievalScore = generated.retrievalScore;
      }

      if (emit && !emittedDelta) await emit(result.answer);
      const durationMs = performance.now() - started;
      if (options.config.memoryEnabled && input.conversationId && !request.actor) {
        await persistConversationTurn({
          publicId: input.conversationId, clientFingerprint: request.clientFingerprint, audience, currentPage: input.currentPage,
          userMessage: input.message, result, retrievalScore, latencyMs: durationMs,
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
        durationMs: Math.round(durationMs * 100) / 100, cacheStatus, transport: onDelta ? "stream" : "json",
        grounded: result.grounded, unanswered: result.unanswered, confidence: result.confidence, audience,
        sourceCount: result.sources.length, retrievalScore, ...provider,
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
        durationMs: Math.round(durationMs * 100) / 100, cacheStatus, transport: onDelta ? "stream" : "json",
        errorCode: mapped instanceof HttpError ? mapped.code : "CHATBOT_INTERNAL_ERROR", statusCode: mapped instanceof HttpError ? mapped.statusCode : 500,
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
