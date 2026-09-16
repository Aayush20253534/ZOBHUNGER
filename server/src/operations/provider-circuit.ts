import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export type CircuitProvider = "groq" | "gemini" | "resend" | "cloudinary" | "file_scan";

type CircuitState = { consecutiveFailures: number; openedUntil: number; lastFailureAt: number };
const states = new Map<CircuitProvider, CircuitState>();

export class ProviderCircuitOpenError extends Error {
  readonly code = "PROVIDER_CIRCUIT_OPEN";
  constructor(readonly provider: CircuitProvider, readonly retryAfterMs: number) {
    super(`${provider} is temporarily paused after repeated upstream failures`);
    this.name = "ProviderCircuitOpenError";
  }
}

function state(provider: CircuitProvider) {
  const existing = states.get(provider);
  if (existing) return existing;
  const created = { consecutiveFailures: 0, openedUntil: 0, lastFailureAt: 0 };
  states.set(provider, created);
  return created;
}

export function assertProviderCircuit(provider: CircuitProvider) {
  const current = state(provider);
  const now = Date.now();
  if (current.openedUntil > now) throw new ProviderCircuitOpenError(provider, current.openedUntil - now);
  if (current.openedUntil && current.openedUntil <= now) {
    current.openedUntil = 0;
    current.consecutiveFailures = 0;
  }
}

export function recordProviderSuccess(provider: CircuitProvider) {
  const current = state(provider);
  current.consecutiveFailures = 0;
  current.openedUntil = 0;
}

export function recordProviderFailure(provider: CircuitProvider, status?: number) {
  // Client-side validation/configuration errors are not evidence that the provider is unhealthy.
  if (status && status < 429) return;
  const current = state(provider);
  current.consecutiveFailures += 1;
  current.lastFailureAt = Date.now();
  if (current.consecutiveFailures < env.PROVIDER_CIRCUIT_FAILURE_THRESHOLD) return;
  current.openedUntil = Date.now() + env.PROVIDER_CIRCUIT_COOLDOWN_MS;
  logger.warn("provider.circuit_open", {
    provider,
    failures: current.consecutiveFailures,
    cooldownMs: env.PROVIDER_CIRCUIT_COOLDOWN_MS,
  });
}

export function providerCircuitStatus() {
  const now = Date.now();
  return Object.fromEntries((["groq", "gemini", "resend", "cloudinary", "file_scan"] as CircuitProvider[]).map((provider) => {
    const current = state(provider);
    return [provider, {
      state: current.openedUntil > now ? "open" : "closed",
      consecutiveFailures: current.consecutiveFailures,
      retryAfterMs: current.openedUntil > now ? current.openedUntil - now : 0,
    }];
  }));
}

export function resetProviderCircuitsForTests() {
  states.clear();
}

export async function guardedProviderRequest<T>(
  provider: CircuitProvider,
  request: () => Promise<T>,
): Promise<T> {
  assertProviderCircuit(provider);
  try {
    const result = await request();
    const status = result && typeof result === "object" && "status" in result && typeof (result as { status?: unknown }).status === "number"
      ? (result as { status: number }).status
      : undefined;
    if (status === 429 || (status !== undefined && status >= 500)) recordProviderFailure(provider, status);
    else recordProviderSuccess(provider);
    return result;
  } catch (error) {
    if (error instanceof ProviderCircuitOpenError) throw error;
    recordProviderFailure(provider);
    throw error;
  }
}
