import { HttpError } from "../../utils/http-error.js";
import { buildChatbotSystemPrompt, buildRetrievalQuery } from "./chatbot.prompt.js";
import type {
  ChatbotMessageInput,
  ChatbotMessageResult,
  ChatbotModelClient,
  ChatbotRetriever,
  ChatbotServiceConfig,
  ChatbotSource,
} from "./chatbot.types.js";
import { GroqApiError } from "./groq.client.js";

export interface CreateChatbotServiceOptions {
  config: ChatbotServiceConfig;
  retriever: ChatbotRetriever;
  modelClient: ChatbotModelClient;
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

export function createChatbotService(options: CreateChatbotServiceOptions) {
  return {
    async reply(input: ChatbotMessageInput): Promise<ChatbotMessageResult> {
      if (!options.config.enabled) {
        throw new HttpError(503, "The chatbot is currently unavailable.", {
          code: "CHATBOT_DISABLED",
        });
      }

      const history = options.config.maxHistoryMessages === 0
        ? []
        : input.history.slice(-options.config.maxHistoryMessages);
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

      try {
        const response = await options.modelClient.generate({
          input: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: input.message },
          ],
        });

        return {
          answer: response.text,
          sources: uniqueSources(search.results),
          grounded: search.results.length > 0,
        };
      } catch (error) {
        if (error instanceof GroqApiError) throw mapGroqError(error);
        throw error;
      }
    },
  };
}

export type ChatbotService = ReturnType<typeof createChatbotService>;
