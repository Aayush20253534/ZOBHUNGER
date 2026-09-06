import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";
import { apiErrorResponse } from "../utils/api-response.js";

function limiter(windowMs: number, limit: number, code: string, message: string) {
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

export const authRateLimiter = limiter(
  env.AUTH_RATE_LIMIT_WINDOW_MS,
  env.AUTH_RATE_LIMIT_MAX,
  "AUTH_RATE_LIMIT_EXCEEDED",
  "Too many authentication attempts. Please try again later.",
);

export const publicSubmissionRateLimiter = limiter(
  env.SUBMISSION_RATE_LIMIT_WINDOW_MS,
  env.SUBMISSION_RATE_LIMIT_MAX,
  "SUBMISSION_RATE_LIMIT_EXCEEDED",
  "Too many submissions. Please wait before trying again.",
);
