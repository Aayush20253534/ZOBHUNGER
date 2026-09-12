import { performance } from "node:perf_hooks";
import { HttpError } from "../../utils/http-error.js";
import { logger } from "../../utils/logger.js";
import { buildChatbotSystemPrompt, buildRetrievalQuery } from "./chatbot.prompt.js";
import type { ChatbotResponseCache } from "./chatbot.cache.js";
import { ChatbotMetrics, type ChatbotCacheStatus } from "./chatbot.metrics.js";
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

function uniqueSources(results: ReturnType<ChatbotRetriever["search"]>["results"]): ChatbotSource[] {
  const seen = new Set<string>();
  const sources: ChatbotSource[] = [];
  for (const result of results) {
    const key = `${result.chunk.documentId}:${result.chunk.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push({
      title: result.chunk.title,
      url: result.chunk.url,
      category: result.chunk.category,
    });
  }
  return sources;
}

function mapGroqError(error: GroqApiError): HttpError {
  const providerSignal = `${error.code ?? ""} ${error.message}`.toLowerCase();
  if ([400, 403, 404, 410, 422].includes(error.status ?? 0)
    && /(model|deprecat|decommission|retir|permission|not found|does not exist|unsupported)/.test(providerSignal)) {
    return new HttpError(503, "The chatbot model is temporarily unavailable. Please try again shortly.", {
      code: "CHATBOT_MODEL_UNAVAILABLE",
    });
  }
  if (error.status === 429) {
    return new HttpError(503, "The chatbot is temporarily busy. Please try again shortly.", {
      code: "CHATBOT_UPSTREAM_RATE_LIMITED",
      ...(error.retryAfterSeconds !== undefined ? { details: { retryAfterSeconds: error.retryAfterSeconds } } : {}),
    });
  }
  if (error.status === 401 || error.status === 403) {
    return new HttpError(503, "The chatbot is temporarily unavailable.", {
      code: "CHATBOT_CONFIGURATION_ERROR",
    });
  }
  if (error.code === "GROQ_TIMEOUT") {
    return new HttpError(504, "The chatbot took too long to respond. Please try again.", {
      code: "CHATBOT_TIMEOUT",
    });
  }
  return new HttpError(502, "The chatbot could not generate a response. Please try again.", {
    code: "CHATBOT_UPSTREAM_ERROR",
  });
}

function logContext(input: ChatbotMessageInput, request: ChatbotRequestContext, extra: Record<string, unknown>) {
  return {
    requestId: request.requestId,
    messageCharacters: input.message.length,
    historyMessages: input.history.length,
    currentPage: input.currentPage ?? null,
    ...extra,
  };
}

export function createChatbotService(options: CreateChatbotServiceOptions) {
  const metrics = options.metrics ?? new ChatbotMetrics();

  async function generate(
    input: ChatbotMessageInput,
    history: ChatbotMessageInput["history"],
    request: ChatbotRequestContext,
    onDelta?: (text: string) => void | Promise<void>,
  ): Promise<{ result: ChatbotMessageResult; provider: Record<string, number | string | undefined> }> {
    const retrievalQuery = buildRetrievalQuery(input.message, history);
    const search = options.retriever.search(retrievalQuery, {
      topK: options.config.ragTopK,
      ...(input.currentPage ? { currentPage: input.currentPage } : {}),
    });
    const systemPrompt = buildChatbotSystemPrompt(
      search.results,
      input.currentPage,
      options.config.contextMaxCharacters,
    );

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
    if (onDelta && options.modelClient.stream) {
      response = await options.modelClient.stream(modelRequest, onDelta);
    } else {
      response = await options.modelClient.generate(modelRequest);
      if (onDelta) await onDelta(response.text);
    }
    const providerDurationMs = response.usage?.providerDurationMs ?? (performance.now() - providerStarted);

    return {
      result: {
        answer: response.text,
        sources: uniqueSources(search.results),
        grounded: search.results.length > 0,
      },
      provider: {
        providerDurationMs,
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens,
        totalTokens: response.usage?.totalTokens,
        cachedPromptTokens: response.usage?.cachedPromptTokens,
        providerQueueMs: response.usage?.queueDurationMs,
        providerResponseId: response.responseId,
        providerModel: response.model,
        retrievedChunks: search.results.length,
      },
    };
  }

  async function execute(
    input: ChatbotMessageInput,
    request: ChatbotRequestContext,
    onDelta?: (text: string) => void | Promise<void>,
  ): Promise<ChatbotMessageResult> {
    if (!options.config.enabled) {
      throw new HttpError(503, "The chatbot is currently unavailable.", {
        code: "CHATBOT_DISABLED",
      });
    }

    const started = performance.now();
    const history = options.config.maxHistoryMessages === 0
      ? []
      : input.history.slice(-options.config.maxHistoryMessages);
    let cacheStatus: ChatbotCacheStatus = "bypass";
    let provider: Record<string, number | string | undefined> = {};
    let emittedDelta = false;
    const emit = onDelta
      ? async (text: string) => {
          if (!text) return;
          emittedDelta = true;
          await onDelta(text);
        }
      : undefined;

    try {
      let result: ChatbotMessageResult;
      const cacheEligible = options.config.cacheEnabled
        && history.length === 0
        && Boolean(options.responseCache?.enabled);

      if (cacheEligible && options.responseCache) {
        const cached = await options.responseCache.remember({
          message: input.message,
          ...(input.currentPage ? { currentPage: input.currentPage } : {}),
          knowledgeFingerprint: options.retriever.fingerprint,
          modelSignature: options.config.modelSignature ?? "default",
        }, async () => {
          const generated = await generate(input, history, request, emit);
          provider = generated.provider;
          return generated.result;
        });
        result = cached.value;
        cacheStatus = cached.status;
      } else {
        const generated = await generate(input, history, request, emit);
        result = generated.result;
        provider = generated.provider;
      }

      // Cache hits and coalesced identical requests have no provider delta stream
      // for this caller. Emit the complete cached/coalesced answer once so the
      // streaming transport still has a single, stable contract.
      if (emit && !emittedDelta) await emit(result.answer);

      const durationMs = performance.now() - started;
      metrics.record({
        ok: true,
        grounded: result.grounded,
        cacheStatus,
        durationMs,
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
        sourceCount: result.sources.length,
        ...provider,
      }));
      return result;
    } catch (error) {
      if (error instanceof GroqApiError && error.code === "GROQ_ABORTED" && request.signal?.aborted) {
        logger.info("chatbot.request.cancelled", logContext(input, request, {
          durationMs: Math.round((performance.now() - started) * 100) / 100,
          transport: onDelta ? "stream" : "json",
        }));
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
        ...(error instanceof GroqApiError ? {
          providerStatus: error.status ?? null,
          providerCode: error.code ?? null,
          providerMessage: error.message.slice(0, 240),
        } : {}),
      }));
      throw mapped;
    }
  }

  return {
    reply(input: ChatbotMessageInput, request: ChatbotRequestContext = {}) {
      return execute(input, request);
    },
    streamReply(
      input: ChatbotMessageInput,
      request: ChatbotRequestContext,
      onDelta: (text: string) => void | Promise<void>,
    ) {
      return execute(input, request, onDelta);
    },
    metrics() {
      return metrics.snapshot();
    },
  };
}

export type ChatbotService = ReturnType<typeof createChatbotService>;
