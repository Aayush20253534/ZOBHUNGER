import type { KnowledgeCategory } from "./knowledge/knowledge.types.js";
import type { KnowledgeIndex, KnowledgeSearchResult } from "./rag/rag.types.js";

export type ChatbotHistoryRole = "user" | "assistant";
export type ChatbotAudienceKey = "UNKNOWN" | "JOB_SEEKER" | "BUSINESS" | "VENDOR_PARTNER" | "GENERAL";

export interface ChatbotHistoryMessage {
  role: ChatbotHistoryRole;
  content: string;
}

export interface ChatbotMessageInput {
  message: string;
  history: ChatbotHistoryMessage[];
  currentPage?: string;
  conversationId?: string;
}

export interface ChatbotSource {
  citation: string;
  title: string;
  url: string;
  category: KnowledgeCategory;
  section?: string;
}

export type ChatbotLinkAction = { id: string; label: string; kind: "link"; href: string };
export type ChatbotToolAction = {
  id: string;
  label: string;
  kind: "tool";
  tool: string;
  confirmationRequired: boolean;
  input: Record<string, unknown>;
};
export type ChatbotAction =
  | ChatbotLinkAction
  | { id: string; label: string; kind: "lead" | "handover"; audience?: ChatbotAudienceKey }
  | ChatbotToolAction;

export interface ChatbotToolExecutionResult {
  tool: string;
  status: "completed";
  message: string;
  action?: ChatbotLinkAction;
  data?: Record<string, unknown>;
}

export interface ChatbotMessageResult {
  answer: string;
  language?: "en" | "hi" | "hinglish";
  toolUsed?: string;
  sources: ChatbotSource[];
  grounded: boolean;
  unanswered: boolean;
  confidence: number;
  audience: ChatbotAudienceKey;
  actions: ChatbotAction[];
  handoverRecommended: boolean;
  conversationId?: string;
}

export interface ChatbotServiceConfig {
  enabled: boolean;
  maxHistoryMessages: number;
  ragTopK: number;
  contextMaxCharacters: number;
  cacheEnabled?: boolean;
  modelSignature?: string;
  rerankEnabled?: boolean;
  rerankCandidates?: number;
  minGroundingScore?: number;
  memoryEnabled?: boolean;
  memoryMaxMessages?: number;
  vectorEnabled?: boolean;
  vectorCandidates?: number;
  rrfK?: number;
  decompositionEnabled?: boolean;
  toolsEnabled?: boolean;
  multilingualEnabled?: boolean;
}

export interface ChatbotRequestActor {
  id: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "BUSINESS" | "WORKER" | "PLACEMENT_CELL";
  adminDepartment?: string | null;
  adminPermissions?: string[];
}

export interface ChatbotRequestContext {
  requestId?: string;
  clientFingerprint?: string;
  signal?: AbortSignal;
  actor?: ChatbotRequestActor;
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
  readonly index?: KnowledgeIndex;
  search(
    query: string,
    options?: {
      topK?: number;
      currentPage?: string;
      includeDebug?: boolean;
    },
  ): {
    results: KnowledgeSearchResult[];
  };
}
