type MethodBucket = Record<string, number>;

type LatencyBucket = {
  le100: number;
  le250: number;
  le500: number;
  le1000: number;
  le2500: number;
  le5000: number;
  gt5000: number;
};

const startedAt = new Date();
let activeRequests = 0;
let totalRequests = 0;
let errorResponses = 0;
let abortedRequests = 0;
let durationTotalMs = 0;
let durationMaxMs = 0;
const methods: MethodBucket = {};
const statuses: MethodBucket = {};
const latency: LatencyBucket = { le100: 0, le250: 0, le500: 0, le1000: 0, le2500: 0, le5000: 0, gt5000: 0 };

export function requestMetricStarted() {
  activeRequests += 1;
}

export function requestMetricCompleted(input: { method: string; statusCode: number; durationMs: number; aborted?: boolean }) {
  activeRequests = Math.max(0, activeRequests - 1);
  totalRequests += 1;
  methods[input.method] = (methods[input.method] ?? 0) + 1;
  const statusFamily = `${Math.floor(input.statusCode / 100)}xx`;
  statuses[statusFamily] = (statuses[statusFamily] ?? 0) + 1;
  if (input.statusCode >= 500) errorResponses += 1;
  if (input.aborted) abortedRequests += 1;
  durationTotalMs += input.durationMs;
  durationMaxMs = Math.max(durationMaxMs, input.durationMs);
  if (input.durationMs <= 100) latency.le100 += 1;
  else if (input.durationMs <= 250) latency.le250 += 1;
  else if (input.durationMs <= 500) latency.le500 += 1;
  else if (input.durationMs <= 1_000) latency.le1000 += 1;
  else if (input.durationMs <= 2_500) latency.le2500 += 1;
  else if (input.durationMs <= 5_000) latency.le5000 += 1;
  else latency.gt5000 += 1;
}

export function httpMetricsSnapshot() {
  return {
    since: startedAt.toISOString(),
    activeRequests,
    totalRequests,
    errorResponses,
    abortedRequests,
    averageDurationMs: totalRequests ? Math.round((durationTotalMs / totalRequests) * 100) / 100 : 0,
    maxDurationMs: Math.round(durationMaxMs * 100) / 100,
    methods: { ...methods },
    statuses: { ...statuses },
    latencyMs: { ...latency },
  };
}
