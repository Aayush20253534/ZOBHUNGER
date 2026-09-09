import type { CorsOptions } from "cors";
import { env } from "./env.js";

export const allowedOrigins = env.CLIENT_ORIGIN.split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

export function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  try { return allowedOrigins.includes(new URL(origin).origin); } catch { return false; }
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) { callback(null, true); return; }
    callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Upload-Token", "X-File-Name", "X-Resume-Revision"],
};
