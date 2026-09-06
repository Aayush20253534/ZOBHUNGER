import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(5000),
  CLIENT_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
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
  TRUST_PROXY: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  MAILJET_API_KEY: z.string().trim().min(1).optional(),
  MAILJET_SECRET_KEY: z.string().trim().min(1).optional(),
  MAIL_FROM_EMAIL: z.string().trim().email().optional(),
  MAIL_FROM_NAME: z.string().trim().min(1).max(120).default("ZOBHUNGER"),
  SALES_TEAM_EMAIL: z.string().trim().email().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errors = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${errors}`);
}

export const env = parsedEnv.data;
