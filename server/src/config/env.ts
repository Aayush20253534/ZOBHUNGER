import "dotenv/config";
import { z } from "zod";
import { validateGroqModelPair } from "../modules/chatbot/groq-model-policy.js";

function optionalSetting<T extends z.ZodType>(schema: T) {
  return z.preprocess(value => typeof value === "string" && !value.trim() ? undefined : value, schema.optional());
}

const httpUrl = z.string().trim().url().refine((value) => {
  const url = new URL(value);
  return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
}, "must be an http(s) URL without embedded credentials");

const publicOrigin = httpUrl.refine((value) => {
  const url = new URL(value);
  return url.pathname === "/" && !url.search && !url.hash;
}, "must be an origin without a path, query or fragment");

const databaseUrl = z.string().trim().url().refine((value) => {
  const url = new URL(value);
  return ["postgres:", "postgresql:"].includes(url.protocol) && Boolean(url.hostname);
}, "DATABASE_URL must be a PostgreSQL connection URL");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(5000),
  CLIENT_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  PUBLIC_APP_URL: optionalSetting(publicOrigin),
  DATABASE_URL: databaseUrl,
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
  CHATBOT_ENABLED: z.enum(["true", "false"]).default("false")
    .transform((value) => value === "true"),
  CHATBOT_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(10_000).max(3_600_000).default(60_000),
  CHATBOT_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(500).default(20),
  CHATBOT_MAX_HISTORY_MESSAGES: z.coerce.number().int().min(0).max(10).default(10),
  CHATBOT_RAG_TOP_K: z.coerce.number().int().min(1).max(10).default(6),
  CHATBOT_CONTEXT_MAX_CHARACTERS: z.coerce.number().int().min(2_000).max(30_000).default(14_000),
  CHATBOT_CACHE_ENABLED: z.enum(["true", "false"]).default("true")
    .transform((value) => value === "true"),
  CHATBOT_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3_600).default(300),
  CHATBOT_DUPLICATE_WINDOW_MS: z.coerce.number().int().min(10_000).max(600_000).default(60_000),
  CHATBOT_DUPLICATE_MAX: z.coerce.number().int().min(1).max(20).default(4),
  GROQ_API_KEY: optionalSetting(z.string().trim().min(8).max(512)),
  GROQ_API_BASE_URL: httpUrl.default("https://api.groq.com/openai/v1"),
  GROQ_MODEL: z.string().trim().regex(/^[a-zA-Z0-9._/-]{2,160}$/).default("openai/gpt-oss-120b"),
  GROQ_FALLBACK_MODEL: optionalSetting(z.string().trim().regex(/^[a-zA-Z0-9._/-]{2,160}$/)).default("openai/gpt-oss-20b"),
  GROQ_API_TIMEOUT_MS: z.coerce.number().int().min(5_000).max(120_000).default(25_000),
  GROQ_MAX_COMPLETION_TOKENS: z.coerce.number().int().min(128).max(4_096).default(700),
  GROQ_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),
  GROQ_REASONING_EFFORT: optionalSetting(z.enum(["none", "default", "minimal", "low", "medium", "high", "xhigh", "max"])),
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default(process.env.NODE_ENV === "production" ? "true" : "false")
    .transform((value) => value === "true"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  RESEND_API_KEY: optionalSetting(z.string().trim().min(1)),
  RESEND_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(15000),
  MAIL_FROM_EMAIL: optionalSetting(z.string().trim().email()),
  MAIL_FROM_NAME: z.string().trim().min(1).max(120).default("ZOBHUNGER"),
  MAIL_REPLY_TO_EMAIL: optionalSetting(z.string().trim().email()),
  SALES_TEAM_EMAIL: optionalSetting(z.string().trim().email()),
  HR_TEAM_EMAIL: z.string().trim().email().default("hr@zobhungr.com"),
  TECH_TEAM_EMAIL: z.string().trim().email().default("tech@zobhungr.com"),
  PLACEMENT_TEAM_EMAIL: z.string().trim().email().default("placementcell@zobhungr.com"),
  LEGAL_TEAM_EMAIL: z.string().trim().email().default("legal@zobhungr.com"),
  CLOUDINARY_CLOUD_NAME: optionalSetting(z.string().trim().regex(/^[a-zA-Z0-9_-]{1,120}$/)),
  CLOUDINARY_API_KEY: optionalSetting(z.string().trim().min(1).max(160)),
  CLOUDINARY_API_SECRET: optionalSetting(z.string().trim().min(8).max(256)),
  CLOUDINARY_PRIVATE_FOLDER: z.string().trim().regex(/^[a-zA-Z0-9_/-]{1,180}$/).default("zobhunger-private"),
  CLOUDINARY_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(15000),
  CLOUDINARY_DOWNLOAD_TTL_SECONDS: z.coerce.number().int().min(30).max(300).default(90),
  JWT_ISSUER: z.string().trim().min(3).max(120).default("zobhunger-api"),
  JWT_AUDIENCE: z.string().trim().min(3).max(120).default("zobhunger-web"),
  MFA_ENCRYPTION_KEY: optionalSetting(z.string().trim().min(32).max(512)),
  HR_PII_ENCRYPTION_KEY: optionalSetting(z.string().trim().min(32).max(512)),
});

const firstSetting = (...names: string[]) => names.map(name => process.env[name]?.trim()).find(Boolean);
const parsedEnv = envSchema.safeParse({ ...process.env,
  RESEND_API_KEY: firstSetting("RESEND_API_KEY"),
  RESEND_TIMEOUT_MS: firstSetting("RESEND_TIMEOUT_MS"),
});

if (!parsedEnv.success) {
  const errors = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${errors}`);
}

// Zod's safeParse data is typed as optional by the generated declaration used in
// this project. Keep one explicitly narrowed value after the error branch so
// strict TypeScript builds never have to dereference a possibly undefined data
// property repeatedly.
const parsedData = parsedEnv.data;
if (!parsedData) {
  throw new Error("Invalid environment configuration: parsed environment data is unavailable");
}
if (parsedData.CHATBOT_ENABLED && !parsedData.GROQ_API_KEY) {
  throw new Error("Invalid environment configuration:\nGROQ_API_KEY is required when CHATBOT_ENABLED=true");
}
if (parsedData.CHATBOT_ENABLED) {
  const groqModelProblems = validateGroqModelPair(parsedData.GROQ_MODEL, parsedData.GROQ_FALLBACK_MODEL);
  if (groqModelProblems.length) {
    throw new Error(`Invalid environment configuration:\n${groqModelProblems.join("\n")}`);
  }
}

function parseClientOrigins(value: string) {
  const origins = value.split(",").map(item => item.trim()).filter(Boolean);
  if (!origins.length) throw new Error("CLIENT_ORIGIN must contain at least one frontend origin");
  return origins.map((origin) => {
    let url: URL;
    try { url = new URL(origin); } catch { throw new Error(`CLIENT_ORIGIN contains an invalid URL: ${origin}`); }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      throw new Error(`CLIENT_ORIGIN must contain origins only: ${origin}`);
    }
    return url.origin;
  });
}

let clientOrigins: string[];
try {
  clientOrigins = [...new Set(parseClientOrigins(parsedData.CLIENT_ORIGIN))];
} catch (error) {
  throw new Error(`Invalid environment configuration:\nCLIENT_ORIGIN: ${error instanceof Error ? error.message : "invalid origins"}`);
}

function productionProblems() {
  if (parsedData.NODE_ENV !== "production") return [] as string[];
  const problems: string[] = [];
  const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);

  for (const origin of clientOrigins) {
    const url = new URL(origin);
    if (url.protocol !== "https:" || loopback.has(url.hostname)) problems.push(`CLIENT_ORIGIN must use a public HTTPS origin in production: ${origin}`);
  }

  if (!parsedData.PUBLIC_APP_URL) {
    problems.push("PUBLIC_APP_URL is required in production");
  } else {
    const publicUrl = new URL(parsedData.PUBLIC_APP_URL);
    if (publicUrl.protocol !== "https:" || loopback.has(publicUrl.hostname)) problems.push("PUBLIC_APP_URL must use a public HTTPS origin in production");
    if (!clientOrigins.includes(publicUrl.origin)) problems.push("PUBLIC_APP_URL must also be present in CLIENT_ORIGIN");
  }

  if (parsedData.JWT_SECRET === "replace-with-at-least-32-random-characters") problems.push("JWT_SECRET still uses the example placeholder");
  if (!parsedData.MFA_ENCRYPTION_KEY) problems.push("MFA_ENCRYPTION_KEY is required in production");
  if (!parsedData.HR_PII_ENCRYPTION_KEY) problems.push("HR_PII_ENCRYPTION_KEY is required in production");
  if (parsedData.HR_PII_ENCRYPTION_KEY === "replace-with-a-long-random-secret-at-least-32-characters") problems.push("HR_PII_ENCRYPTION_KEY still uses the example placeholder");
  if (parsedData.MFA_ENCRYPTION_KEY && parsedData.MFA_ENCRYPTION_KEY === parsedData.JWT_SECRET) problems.push("MFA_ENCRYPTION_KEY must be distinct from JWT_SECRET in production");
  if (parsedData.HR_PII_ENCRYPTION_KEY && parsedData.HR_PII_ENCRYPTION_KEY === parsedData.JWT_SECRET) problems.push("HR_PII_ENCRYPTION_KEY must be distinct from JWT_SECRET in production");

  if (!parsedData.RESEND_API_KEY) problems.push("RESEND_API_KEY is required in production");
  if (!parsedData.MAIL_FROM_EMAIL) problems.push("MAIL_FROM_EMAIL is required in production");
  if (!parsedData.SALES_TEAM_EMAIL) problems.push("SALES_TEAM_EMAIL is required in production");

  if (!parsedData.CLOUDINARY_CLOUD_NAME) problems.push("CLOUDINARY_CLOUD_NAME is required in production");
  if (!parsedData.CLOUDINARY_API_KEY) problems.push("CLOUDINARY_API_KEY is required in production");
  if (!parsedData.CLOUDINARY_API_SECRET) problems.push("CLOUDINARY_API_SECRET is required in production");

  if (parsedData.REDIS_ENABLED && !parsedData.REDIS_URL) problems.push("REDIS_URL is required when REDIS_ENABLED=true in production");

  if (parsedData.CHATBOT_ENABLED) {
    const groqUrl = new URL(parsedData.GROQ_API_BASE_URL);
    if (groqUrl.protocol !== "https:") problems.push("GROQ_API_BASE_URL must use HTTPS when the chatbot is enabled in production");
    if (parsedData.CHATBOT_CACHE_ENABLED && !parsedData.REDIS_ENABLED) problems.push("REDIS_ENABLED=true is required when CHATBOT_CACHE_ENABLED=true in production");
  }
  return problems;
}

const problems = productionProblems();
if (problems.length) {
  throw new Error(`Invalid production environment configuration:\n${problems.map(problem => `- ${problem}`).join("\n")}`);
}

export const env = parsedData;
export const configuredClientOrigins = clientOrigins;
