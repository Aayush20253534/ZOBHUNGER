import { env } from "../config/env.js";
import { redisStatus, redisTransport } from "../config/redis.js";
import { logger } from "../utils/logger.js";

export type ProviderBudgetProvider = "groq" | "gemini" | "resend" | "cloudinary";
export type ProviderBudgetMetric = "requests" | "tokens" | "input_chars" | "recipients" | "upload_bytes";

export class ProviderBudgetExceededError extends Error {
  readonly code = "PROVIDER_DAILY_BUDGET_EXCEEDED";
  constructor(
    readonly provider: ProviderBudgetProvider,
    readonly metric: ProviderBudgetMetric,
    readonly used: number,
    readonly limit: number,
  ) {
    super(`${provider} daily ${metric} safety limit reached`);
    this.name = "ProviderBudgetExceededError";
  }
}

interface Counter { day: string; used: number }
const memory = new Map<string, Counter>();
const observed = new Map<string, { used: number; limit: number; source: "redis" | "memory"; day: string }>();
let fallbackLoggedAt = 0;

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function secondsUntilTomorrowUtc() {
  const now = new Date();
  const tomorrow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(60, Math.ceil((tomorrow - now.getTime()) / 1000) + 60);
}

function key(provider: ProviderBudgetProvider, metric: ProviderBudgetMetric, day = utcDay()) {
  return `${env.REDIS_KEY_PREFIX}:provider-budget:${day}:${provider}:${metric}`;
}

function consumeMemory(provider: ProviderBudgetProvider, metric: ProviderBudgetMetric, units: number, limit: number) {
  const day = utcDay();
  const id = `${provider}:${metric}`;
  const current = memory.get(id);
  const next = !current || current.day !== day ? units : current.used + units;
  memory.set(id, { day, used: next });
  observed.set(id, { used: next, limit, source: "memory", day });
  return next;
}

export async function consumeProviderBudget(
  provider: ProviderBudgetProvider,
  metric: ProviderBudgetMetric,
  units: number,
  limit: number,
) {
  if (!env.PROVIDER_BUDGETS_ENABLED || units <= 0) return { used: 0, limit, source: "disabled" as const };
  const safeUnits = Math.max(1, Math.ceil(units));
  let used: number;
  let source: "redis" | "memory" = "memory";

  if (redisStatus().ready) {
    try {
      const budgetKey = key(provider, metric);
      const result = await redisTransport.command(["INCRBY", budgetKey, String(safeUnits)]);
      used = Number(result);
      if (!Number.isFinite(used)) throw new Error("invalid redis counter");
      await redisTransport.command(["EXPIRE", budgetKey, String(secondsUntilTomorrowUtc()), "NX"]);
      source = "redis";
      observed.set(`${provider}:${metric}`, { used, limit, source, day: utcDay() });
    } catch {
      used = consumeMemory(provider, metric, safeUnits, limit);
      if (Date.now() - fallbackLoggedAt > 60_000) {
        fallbackLoggedAt = Date.now();
        logger.warn("provider_budget.redis_fallback", { provider, metric });
      }
    }
  } else {
    used = consumeMemory(provider, metric, safeUnits, limit);
  }

  if (used > limit) throw new ProviderBudgetExceededError(provider, metric, used, limit);
  return { used, limit, source };
}

export function providerBudgetStatus() {
  return {
    enabled: env.PROVIDER_BUDGETS_ENABLED,
    distributed: redisStatus().ready,
    observed: Object.fromEntries([...observed.entries()].map(([id, value]) => [id, value])),
    limits: {
      groq: { requests: env.GROQ_DAILY_REQUEST_LIMIT, tokens: env.GROQ_DAILY_TOKEN_LIMIT },
      gemini: { requests: env.GEMINI_DAILY_REQUEST_LIMIT, inputChars: env.GEMINI_DAILY_INPUT_CHAR_LIMIT },
      resend: { recipients: env.RESEND_DAILY_EMAIL_LIMIT },
      cloudinary: { requests: env.CLOUDINARY_DAILY_REQUEST_LIMIT, uploadBytes: env.CLOUDINARY_DAILY_UPLOAD_BYTES_LIMIT },
    },
  };
}

export function resetProviderBudgetsForTests() {
  memory.clear();
  observed.clear();
}
