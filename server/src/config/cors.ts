import type { CorsOptions } from "cors";
import { configuredClientOrigins } from "./env.js";
import { HttpError } from "../utils/http-error.js";

export const allowedOrigins = configuredClientOrigins;

export function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  try { return allowedOrigins.includes(new URL(origin).origin); } catch { return false; }
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) { callback(null, true); return; }
    callback(new HttpError(403, "This origin is not allowed to access the API", { code: "CORS_ORIGIN_DENIED" }));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Upload-Token", "X-File-Name", "X-Resume-Revision"],
  exposedHeaders: ["X-Request-Id", "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset", "Retry-After"],
};
