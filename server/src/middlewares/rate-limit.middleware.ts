import { createHash } from "node:crypto";
import type { Request, RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";
import { redisTransport } from "../config/redis.js";
import { apiErrorResponse } from "../utils/api-response.js";

function clientFingerprint(req: Request) {
  const value = req.ip || req.socket.remoteAddress || "unknown";
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function memoryLimiter(windowMs: number, limit: number, code: string, message: string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(apiErrorResponse(message, { code }));
    },
  });
}

/**
 * Prefer one Redis-backed bucket shared by every API instance. If Redis is
 * unavailable, fall back to the process-local limiter so an optional cache
 * outage never makes the API unavailable or removes rate limiting entirely.
 */
function limiter(scope: string, windowMs: number, limit: number, code: string, message: string): RequestHandler {
  const fallback = memoryLimiter(windowMs, limit, code, message);
  return async (req, res, next) => {
    if (!redisTransport.isReady()) return fallback(req, res, next);
    const bucket = Math.floor(Date.now() / windowMs);
    const key = `${env.REDIS_KEY_PREFIX}:ratelimit:${scope}:${clientFingerprint(req)}:${bucket}`;
    try {
      const raw = await redisTransport.command(["INCR", key]);
      const count = Number(raw);
      if (!Number.isSafeInteger(count) || count < 1) throw new Error("Invalid Redis rate-limit response");
      if (count === 1) {
        // Bucket keys are naturally disposable. Give them a little extra time
        // for clock skew while keeping Redis memory bounded.
        void redisTransport.command(["PEXPIRE", key, String(Math.max(windowMs * 2, 1_000))]).catch(() => undefined);
      }
      const resetSeconds = Math.max(1, Math.ceil((((bucket + 1) * windowMs) - Date.now()) / 1_000));
      res.set("RateLimit-Limit", String(limit));
      res.set("RateLimit-Remaining", String(Math.max(0, limit - count)));
      res.set("RateLimit-Reset", String(resetSeconds));
      if (count > limit) {
        res.set("Retry-After", String(resetSeconds));
        res.status(429).json(apiErrorResponse(message, { code }));
        return;
      }
      next();
    } catch {
      fallback(req, res, next);
    }
  };
}

export const apiRateLimiter = limiter(
  "api",
  env.API_RATE_LIMIT_WINDOW_MS,
  env.API_RATE_LIMIT_MAX,
  "RATE_LIMIT_EXCEEDED",
  "Too many requests. Please try again later.",
);

export const authRateLimiter = limiter(
  "auth",
  env.AUTH_RATE_LIMIT_WINDOW_MS,
  env.AUTH_RATE_LIMIT_MAX,
  "AUTH_RATE_LIMIT_EXCEEDED",
  "Too many authentication attempts. Please try again later.",
);

export const publicSubmissionRateLimiter = limiter(
  "submission",
  env.SUBMISSION_RATE_LIMIT_WINDOW_MS,
  env.SUBMISSION_RATE_LIMIT_MAX,
  "SUBMISSION_RATE_LIMIT_EXCEEDED",
  "Too many submissions. Please wait before trying again.",
);
