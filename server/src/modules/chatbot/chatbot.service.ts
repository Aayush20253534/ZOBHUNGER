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

    const providerStarted = performance.now();
    const response = await options.modelClient.generate({
      input: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: input.message },
      ],
      ...(request.clientFingerprint ? { user: request.clientFingerprint } : {}),
    });
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

  return {
    async reply(input: ChatbotMessageInput, request: ChatbotRequestContext = {}): Promise<ChatbotMessageResult> {
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
            const generated = await generate(input, history, request);
            provider = generated.provider;
            return generated.result;
          });
          result = cached.value;
          cacheStatus = cached.status;
        } else {
          const generated = await generate(input, history, request);
          result = generated.result;
          provider = generated.provider;
        }

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
          grounded: result.grounded,
          sourceCount: result.sources.length,
          ...provider,
        }));
        return result;
      } catch (error) {
        const mapped = error instanceof GroqApiError ? mapGroqError(error) : error;
        const durationMs = performance.now() - started;
        metrics.record({ ok: false, cacheStatus, durationMs });
        logger.warn("chatbot.request.failed", logContext(input, request, {
          durationMs: Math.round(durationMs * 100) / 100,
          cacheStatus,
          errorCode: mapped instanceof HttpError ? mapped.code : "CHATBOT_INTERNAL_ERROR",
          statusCode: mapped instanceof HttpError ? mapped.statusCode : 500,
        }));
        throw mapped;
      }
    },
    metrics() {
      return metrics.snapshot();
    },
  };
}

export type ChatbotService = ReturnType<typeof createChatbotService>;
