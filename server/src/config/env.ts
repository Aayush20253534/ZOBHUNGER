import "dotenv/config";
import { z } from "zod";

function optionalSetting<T extends z.ZodType>(schema: T) {
  return z.preprocess(value => typeof value === "string" && !value.trim() ? undefined : value, schema.optional());
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(5000),
  CLIENT_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  PUBLIC_APP_URL: optionalSetting(z.string().trim().url().refine((value) => {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  }, "PUBLIC_APP_URL must be an http(s) frontend URL")),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().url().refine((value) => {
      try {
        const url = new URL(value);
        return (url.protocol === "redis:" || url.protocol === "rediss:") && Boolean(url.hostname);
      } catch {
        return false;
      }
    }, "REDIS_URL must use redis:// or rediss://").optional(),
  ),
  REDIS_ENABLED: z.enum(["true", "false"]).default("true")
    .transform((value) => value === "true"),
  REDIS_KEY_PREFIX: z.string().regex(/^[a-zA-Z0-9:_-]{1,80}$/).default("zobhunger"),
  REDIS_TTL_SECONDS: z.coerce.number().int().min(1).max(300).default(60),
  REDIS_COMMAND_TIMEOUT_MS: z.coerce.number().int().min(25).max(2_000).default(200),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().min(2).default("15m"),
  AUTH_COOKIE_NAME: z.string().min(1).default("zobhunger_access"),
  AUTH_COOKIE_MAX_AGE_MS: z.coerce.number().int().positive().default(900_000),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  SUBMISSION_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(3_600_000),
  SUBMISSION_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default(process.env.NODE_ENV === "production" ? "true" : "false")
    .transform((value) => value === "true"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  MAILJET_API_KEY: optionalSetting(z.string().trim().min(1)),
  MAILJET_SECRET_KEY: optionalSetting(z.string().trim().min(1)),
  MAIL_FROM_EMAIL: optionalSetting(z.string().trim().email()),
  MAIL_FROM_NAME: z.string().trim().min(1).max(120).default("ZOBHUNGER"),
  SALES_TEAM_EMAIL: optionalSetting(z.string().trim().email()),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errors = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${errors}`);
}

export const env = parsedEnv.data;
