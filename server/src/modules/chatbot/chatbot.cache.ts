import { createHash } from "node:crypto";
import type { CacheTransport } from "../../cache/json-cache.js";
import type { ChatbotMessageResult } from "./chatbot.types.js";
import type { ChatbotCacheStatus } from "./chatbot.metrics.js";

export interface ChatbotCacheLookup {
  message: string;
  currentPage?: string;
  knowledgeFingerprint: string;
  modelSignature: string;
}

export interface ChatbotCacheResult {
  value: ChatbotMessageResult;
  status: ChatbotCacheStatus;
}

export interface ChatbotResponseCache {
  readonly enabled: boolean;
  remember(lookup: ChatbotCacheLookup, load: () => Promise<ChatbotMessageResult>): Promise<ChatbotCacheResult>;
}

interface ChatbotResponseCacheOptions {
  enabled: boolean;
  prefix: string;
  ttlSeconds: number;
  transport: CacheTransport;
}

function canonicalMessage(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function cacheDigest(lookup: ChatbotCacheLookup): string {
  return createHash("sha256").update(JSON.stringify({
    message: canonicalMessage(lookup.message),
    currentPage: lookup.currentPage ?? "",
    knowledgeFingerprint: lookup.knowledgeFingerprint,
    modelSignature: lookup.modelSignature,
  })).digest("hex");
}

function isCachedResult(value: unknown): value is ChatbotMessageResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ChatbotMessageResult>;
  return typeof candidate.answer === "string"
    && typeof candidate.grounded === "boolean"
    && Array.isArray(candidate.sources)
    && candidate.sources.every((source) => source
      && typeof source === "object"
      && typeof source.title === "string"
      && typeof source.url === "string"
      && typeof source.category === "string");
}

export function createChatbotResponseCache(options: ChatbotResponseCacheOptions): ChatbotResponseCache {
  const inFlight = new Map<string, Promise<ChatbotMessageResult>>();

  return {
    enabled: options.enabled,
    async remember(lookup, load) {
      if (!options.enabled || !options.transport.isReady()) {
        const digest = cacheDigest(lookup);
        const existing = inFlight.get(digest);
        if (existing) return { value: await existing, status: "bypass" };
        const pending = load();
        if (inFlight.size < 256) inFlight.set(digest, pending);
        try {
          return { value: await pending, status: "bypass" };
        } finally {
          if (inFlight.get(digest) === pending) inFlight.delete(digest);
        }
      }

      const digest = cacheDigest(lookup);
      const key = `${options.prefix}:chatbot:answer:v1:${digest}`;
      try {
        const raw = await options.transport.command(["GET", key]);
        if (typeof raw === "string") {
          try {
            const parsed: unknown = JSON.parse(raw);
            if (isCachedResult(parsed)) return { value: parsed, status: "hit" };
          } catch {
            // Malformed cache content is treated as a miss and overwritten.
          }
        }
      } catch {
        return { value: await load(), status: "bypass" };
      }

      const existing = inFlight.get(digest);
      if (existing) return { value: await existing, status: "miss" };
      const pending = load();
      if (inFlight.size < 256) inFlight.set(digest, pending);
      try {
        const value = await pending;
        // Only grounded successful answers are useful enough to retain. This also
        // prevents a temporary "I don't know" from becoming a sticky response.
        if (value.grounded) {
          const payload = JSON.stringify(value);
          if (Buffer.byteLength(payload) <= 128 * 1024) {
            try {
              await options.transport.command(["SET", key, payload, "EX", String(options.ttlSeconds)]);
            } catch {
              // Cache writes are optional; a valid model answer must still win.
            }
          }
        }
        return { value, status: "miss" };
      } finally {
        if (inFlight.get(digest) === pending) inFlight.delete(digest);
      }
    },
  };
}
