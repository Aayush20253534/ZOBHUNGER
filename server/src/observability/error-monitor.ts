import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { redactSensitiveText, sanitizeLogContext } from "../utils/log-sanitizer.js";

let lastDeliveryWarning = 0;

function releaseRevision() {
  const revision = process.env.RELEASE_SHA || process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || "";
  return /^[a-f0-9]{7,64}$/i.test(revision) ? revision.toLowerCase() : null;
}

export function errorMonitoringStatus() {
  return { configured: Boolean(env.ERROR_MONITORING_WEBHOOK_URL), delivery: env.ERROR_MONITORING_WEBHOOK_URL ? "webhook" : "logs_only" };
}

export async function captureOperationalError(input: {
  source: string;
  error?: unknown;
  requestId?: string;
  statusCode?: number;
  path?: string;
  context?: Record<string, unknown>;
}) {
  if (!env.ERROR_MONITORING_WEBHOOK_URL) return;
  const error = input.error instanceof Error
    ? { name: errorName(input.error), message: redactSensitiveText(input.error.message).slice(0, 800) }
    : input.error == null ? undefined : { name: "Error", message: redactSensitiveText(String(input.error)).slice(0, 800) };
  const payload = {
    service: "zobhunger-api",
    environment: env.NODE_ENV,
    revision: releaseRevision(),
    timestamp: new Date().toISOString(),
    source: input.source.slice(0, 120),
    requestId: input.requestId?.slice(0, 120),
    statusCode: input.statusCode,
    path: input.path ? redactSensitiveText(input.path).slice(0, 300) : undefined,
    error,
    context: input.context ? sanitizeLogContext(input.context) : undefined,
  };
  try {
    const response = await fetch(env.ERROR_MONITORING_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.ERROR_MONITORING_TOKEN ? { Authorization: `Bearer ${env.ERROR_MONITORING_TOKEN}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(env.ERROR_MONITORING_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`monitoring webhook returned ${response.status}`);
  } catch {
    if (Date.now() - lastDeliveryWarning > 60_000) {
      lastDeliveryWarning = Date.now();
      logger.warn("error_monitor.delivery_failed", { source: input.source });
    }
  }
}

function errorName(error: Error) {
  return (error.name || "Error").slice(0, 120);
}
