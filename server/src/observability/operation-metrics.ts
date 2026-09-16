import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const MAX_OPERATION_NAMES = 80;
type OperationMetric = { count: number; failures: number; totalMs: number; maxMs: number };
const metrics = new Map<string, OperationMetric>();

function record(name: string, durationMs: number, failed: boolean) {
  let metric = metrics.get(name);
  if (!metric) {
    if (metrics.size >= MAX_OPERATION_NAMES) return;
    metric = { count: 0, failures: 0, totalMs: 0, maxMs: 0 };
    metrics.set(name, metric);
  }
  metric.count += 1;
  if (failed) metric.failures += 1;
  metric.totalMs += durationMs;
  metric.maxMs = Math.max(metric.maxMs, durationMs);
}

export async function observeOperation<T>(name: string, operation: () => Promise<T>, slowMs = env.SLOW_REQUEST_MS): Promise<T> {
  const startedAt = process.hrtime.bigint();
  let failed = false;
  try {
    return await operation();
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    record(name, durationMs, failed);
    if (durationMs >= slowMs) {
      logger.warn("operation.slow", {
        operation: name,
        durationMs: Math.round(durationMs * 100) / 100,
        failed,
      });
    }
  }
}

export function operationMetricsSnapshot() {
  return Object.fromEntries([...metrics.entries()].map(([name, metric]) => [name, {
    count: metric.count,
    failures: metric.failures,
    averageDurationMs: metric.count ? Math.round((metric.totalMs / metric.count) * 100) / 100 : 0,
    maxDurationMs: Math.round(metric.maxMs * 100) / 100,
  }]));
}
