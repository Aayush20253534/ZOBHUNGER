import { createHash, createHmac } from "node:crypto";
import type { Request, RequestHandler, Response } from "express";
import { env } from "../../config/env.js";
import { redisTransport } from "../../config/redis.js";
import { apiErrorResponse } from "../../utils/api-response.js";
import type { ChatbotMessageRequest } from "./chatbot.schema.js";

interface MemoryBucket {
  count: number;
  expiresAt: number;
}

const memoryBuckets = new Map<string, MemoryBucket>();
const clientFingerprintKey = createHash("sha256")
  .update("zobhunger-chatbot-client-v1\0")
  .update(env.JWT_SECRET)
  .digest();

const INCREMENT_WITH_EXPIRY = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return count
`;

export function chatbotClientFingerprint(req: Pick<Request, "ip" | "socket">): string {
  const source = req.ip || req.socket.remoteAddress || "unknown";
  return createHmac("sha256", clientFingerprintKey).update(source).digest("hex").slice(0, 32);
}

export function chatbotDuplicateDigest(input: Pick<ChatbotMessageRequest, "message" | "currentPage">): string {
  const normalized = `${input.message.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US")}|${input.currentPage ?? ""}`;
  return createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

function pruneMemory(now: number): void {
  if (memoryBuckets.size < 1_024) return;
  for (const [key, value] of memoryBuckets) {
    if (value.expiresAt <= now) memoryBuckets.delete(key);
    if (memoryBuckets.size < 768) break;
  }
}

function reject(res: Response, retryAfterSeconds: number): void {
  res.set("Retry-After", String(retryAfterSeconds));
  res.status(429).json(apiErrorResponse(
    "Please avoid sending the same chatbot message repeatedly. Try again shortly.",
    { code: "CHATBOT_DUPLICATE_MESSAGE_LIMIT" },
  ));
}

export const chatbotAbuseGuard: RequestHandler = async (req, res, next) => {
  const input = res.locals.validated.body as ChatbotMessageRequest;
  const client = chatbotClientFingerprint(req);
  const duplicate = chatbotDuplicateDigest(input);
  res.locals.chatbotClientFingerprint = client;
  const key = `${env.REDIS_KEY_PREFIX}:chatbot:duplicate:${client}:${duplicate}`;
  const windowMs = env.CHATBOT_DUPLICATE_WINDOW_MS;
  const retryAfterSeconds = Math.max(1, Math.ceil(windowMs / 1_000));

  if (redisTransport.isReady()) {
    try {
      const raw = await redisTransport.command(["EVAL", INCREMENT_WITH_EXPIRY, "1", key, String(windowMs)]);
      const count = Number(raw);
      if (!Number.isSafeInteger(count) || count < 1) throw new Error("Invalid duplicate limiter response");
      if (count > env.CHATBOT_DUPLICATE_MAX) {
        reject(res, retryAfterSeconds);
        return;
      }
      next();
      return;
    } catch {
      // Redis outages fall through to the process-local guard.
    }
  }

  const now = Date.now();
  pruneMemory(now);
  const existing = memoryBuckets.get(key);
  const bucket = !existing || existing.expiresAt <= now
    ? { count: 1, expiresAt: now + windowMs }
    : { count: existing.count + 1, expiresAt: existing.expiresAt };
  memoryBuckets.set(key, bucket);
  if (bucket.count > env.CHATBOT_DUPLICATE_MAX) {
    reject(res, Math.max(1, Math.ceil((bucket.expiresAt - now) / 1_000)));
    return;
  }
  next();
};

export function resetChatbotAbuseGuardForTests(): void {
  memoryBuckets.clear();
}
