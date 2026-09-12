import type { KnowledgeCategory } from "./knowledge/knowledge.types.js";
import type { KnowledgeSearchResult } from "./rag/rag.types.js";

export type ChatbotHistoryRole = "user" | "assistant";

export interface ChatbotHistoryMessage {
  role: ChatbotHistoryRole;
  content: string;
}

export interface ChatbotMessageInput {
  message: string;
  history: ChatbotHistoryMessage[];
  currentPage?: string;
}

export interface ChatbotSource {
  title: string;
  url: string;
  category: KnowledgeCategory;
}

export interface ChatbotMessageResult {
  answer: string;
  sources: ChatbotSource[];
  grounded: boolean;
}

export interface ChatbotServiceConfig {
  enabled: boolean;
  maxHistoryMessages: number;
  ragTopK: number;
  contextMaxCharacters: number;
  cacheEnabled?: boolean;
  modelSignature?: string;
}

export interface ChatbotRequestContext {
  requestId?: string;
  clientFingerprint?: string;
  signal?: AbortSignal;
}

export interface ChatbotModelUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cachedPromptTokens?: number;
  providerDurationMs?: number;
  queueDurationMs?: number;
}

export interface ChatbotModelInputMessage {
  role: "system" | ChatbotHistoryRole;
  content: string;
}

export interface ChatbotModelRequest {
  input: ChatbotModelInputMessage[];
  user?: string;
  signal?: AbortSignal;
}

export interface ChatbotModelResponse {
  text: string;
  responseId?: string;
  model?: string;
  usage?: ChatbotModelUsage;
}

export interface ChatbotModelClient {
  generate(request: ChatbotModelRequest): Promise<ChatbotModelResponse>;
  stream?(
    request: ChatbotModelRequest,
    onDelta: (text: string) => void | Promise<void>,
  ): Promise<ChatbotModelResponse>;
}

export interface ChatbotRetriever {
  readonly fingerprint: string;
  search(
    query: string,
    options?: {
      topK?: number;
      currentPage?: string;
    },
  ): {
    results: KnowledgeSearchResult[];
  };
}
