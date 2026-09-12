export type ChatbotCacheStatus = "hit" | "miss" | "bypass";

export interface ChatbotMetricEvent {
  ok: boolean;
  grounded?: boolean;
  cacheStatus: ChatbotCacheStatus;
  durationMs: number;
  providerDurationMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cachedPromptTokens?: number;
}

export interface ChatbotMetricsSnapshot {
  requests: number;
  successes: number;
  errors: number;
  grounded: number;
  ungrounded: number;
  cache: {
    hits: number;
    misses: number;
    bypasses: number;
    hitRate: number;
  };
  tokens: {
    prompt: number;
    completion: number;
    total: number;
    cachedPrompt: number;
  };
  latency: {
    averageMs: number;
    averageProviderMs: number;
  };
}

export class ChatbotMetrics {
  private requests = 0;
  private successes = 0;
  private errors = 0;
  private grounded = 0;
  private ungrounded = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private cacheBypasses = 0;
  private promptTokens = 0;
  private completionTokens = 0;
  private totalTokens = 0;
  private cachedPromptTokens = 0;
  private totalDurationMs = 0;
  private providerRequests = 0;
  private providerDurationMs = 0;

  record(event: ChatbotMetricEvent): void {
    this.requests += 1;
    this.totalDurationMs += Math.max(0, event.durationMs);
    if (event.ok) this.successes += 1;
    else this.errors += 1;

    if (event.grounded === true) this.grounded += 1;
    if (event.grounded === false) this.ungrounded += 1;

    if (event.cacheStatus === "hit") this.cacheHits += 1;
    else if (event.cacheStatus === "miss") this.cacheMisses += 1;
    else this.cacheBypasses += 1;

    this.promptTokens += Math.max(0, event.promptTokens ?? 0);
    this.completionTokens += Math.max(0, event.completionTokens ?? 0);
    this.totalTokens += Math.max(0, event.totalTokens ?? 0);
    this.cachedPromptTokens += Math.max(0, event.cachedPromptTokens ?? 0);

    if (event.providerDurationMs !== undefined) {
      this.providerRequests += 1;
      this.providerDurationMs += Math.max(0, event.providerDurationMs);
    }
  }

  snapshot(): ChatbotMetricsSnapshot {
    const cacheLookups = this.cacheHits + this.cacheMisses;
    return {
      requests: this.requests,
      successes: this.successes,
      errors: this.errors,
      grounded: this.grounded,
      ungrounded: this.ungrounded,
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        bypasses: this.cacheBypasses,
        hitRate: cacheLookups ? this.cacheHits / cacheLookups : 0,
      },
      tokens: {
        prompt: this.promptTokens,
        completion: this.completionTokens,
        total: this.totalTokens,
        cachedPrompt: this.cachedPromptTokens,
      },
      latency: {
        averageMs: this.requests ? this.totalDurationMs / this.requests : 0,
        averageProviderMs: this.providerRequests ? this.providerDurationMs / this.providerRequests : 0,
      },
    };
  }

  reset(): void {
    this.requests = 0;
    this.successes = 0;
    this.errors = 0;
    this.grounded = 0;
    this.ungrounded = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.cacheBypasses = 0;
    this.promptTokens = 0;
    this.completionTokens = 0;
    this.totalTokens = 0;
    this.cachedPromptTokens = 0;
    this.totalDurationMs = 0;
    this.providerRequests = 0;
    this.providerDurationMs = 0;
  }
}
