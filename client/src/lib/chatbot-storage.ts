import type { ChatbotUiMessage } from "@/lib/chatbot";

const STORAGE_KEY = "zobhunger.chatbot.conversation.v1";
const STORAGE_VERSION = 1;
const MAX_STORED_MESSAGES = 40;
const MAX_STORED_CONTENT_LENGTH = 4000;
const MAX_STORED_SOURCES = 4;

export interface StoredChatbotConversation {
  version: 1;
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatbotUiMessage[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSafePublicSourceUrl(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  return ![
    "/admin",
    "/admin-access",
    "/business",
    "/worker",
    "/employee-joining",
  ].some((prefix) => value === prefix || value.startsWith(`${prefix}/`));
}

function sanitizeMessage(value: unknown): ChatbotUiMessage | null {
  if (!isRecord(value)) return null;
  if (value.role !== "user" && value.role !== "assistant") return null;
  if (typeof value.content !== "string") return null;
  const content = value.content.trim().slice(0, MAX_STORED_CONTENT_LENGTH);
  if (!content) return null;

  const rawSources = Array.isArray(value.sources) ? value.sources : [];
  const sources = rawSources.flatMap((source) => {
    if (!isRecord(source)) return [];
    if (
      typeof source.title !== "string" ||
      typeof source.url !== "string" ||
      typeof source.category !== "string" ||
      !isSafePublicSourceUrl(source.url)
    ) return [];
    return [{
      title: source.title.trim().slice(0, 160),
      url: source.url.slice(0, 300),
      category: source.category.trim().slice(0, 80),
    }];
  }).slice(0, MAX_STORED_SOURCES);

  return {
    id: typeof value.id === "string" && value.id.trim()
      ? value.id.slice(0, 120)
      : `restored-${Math.random().toString(36).slice(2)}`,
    role: value.role,
    content,
    ...(sources.length ? { sources } : {}),
    includeInHistory: true,
  };
}

function sanitizeConversation(value: unknown): StoredChatbotConversation | null {
  if (!isRecord(value) || value.version !== STORAGE_VERSION) return null;
  if (typeof value.id !== "string" || !value.id.trim()) return null;
  if (!Array.isArray(value.messages)) return null;

  const messages = value.messages
    .slice(-MAX_STORED_MESSAGES)
    .map(sanitizeMessage)
    .filter((message): message is ChatbotUiMessage => Boolean(message));

  return {
    version: STORAGE_VERSION,
    id: value.id.slice(0, 120),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
    messages,
  };
}

export function createChatbotConversationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `chat_${crypto.randomUUID()}`;
  }
  return `chat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function loadStoredChatbotConversation(): StoredChatbotConversation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sanitizeConversation(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveStoredChatbotConversation(
  conversation: Omit<StoredChatbotConversation, "version">,
): void {
  if (typeof window === "undefined") return;
  try {
    const successfulMessages = conversation.messages
      .filter((message) => message.includeInHistory && message.id !== "welcome")
      .slice(-MAX_STORED_MESSAGES);

    const sanitized = sanitizeConversation({
      version: STORAGE_VERSION,
      ...conversation,
      messages: successfulMessages,
    });
    if (!sanitized) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Storage can be disabled or full. Chat remains fully usable in memory.
  }
}

export function clearStoredChatbotConversation(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export const chatbotStorageInternals = {
  key: STORAGE_KEY,
  maxStoredMessages: MAX_STORED_MESSAGES,
};
