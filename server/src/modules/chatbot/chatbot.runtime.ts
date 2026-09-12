import { env } from "../../config/env.js";
import { getDefaultKnowledgeRetriever } from "./rag/index.js";
import { createChatbotService, type ChatbotService } from "./chatbot.service.js";
import { createGroqClient } from "./groq.client.js";

let servicePromise: Promise<ChatbotService> | null = null;

export function getChatbotService(): Promise<ChatbotService> {
  if (!servicePromise) {
    const config = {
      enabled: env.CHATBOT_ENABLED,
      maxHistoryMessages: env.CHATBOT_MAX_HISTORY_MESSAGES,
      ragTopK: env.CHATBOT_RAG_TOP_K,
      contextMaxCharacters: env.CHATBOT_CONTEXT_MAX_CHARACTERS,
    };
    const modelClient = createGroqClient({
      apiKey: env.GROQ_API_KEY ?? "",
      baseUrl: env.GROQ_API_BASE_URL,
      model: env.GROQ_MODEL,
      timeoutMs: env.GROQ_API_TIMEOUT_MS,
      maxCompletionTokens: env.GROQ_MAX_COMPLETION_TOKENS,
      temperature: env.GROQ_TEMPERATURE,
      ...(env.GROQ_REASONING_EFFORT ? { reasoningEffort: env.GROQ_REASONING_EFFORT } : {}),
    });

    if (!env.CHATBOT_ENABLED) {
      servicePromise = Promise.resolve(createChatbotService({
        config,
        modelClient,
        retriever: { search: () => ({ results: [] }) },
      }));
    } else {
      servicePromise = getDefaultKnowledgeRetriever().then((retriever) => createChatbotService({
        config,
        retriever,
        modelClient,
      }));
    }
  }
  return servicePromise;
}

export function resetChatbotServiceForTests() {
  servicePromise = null;
}
