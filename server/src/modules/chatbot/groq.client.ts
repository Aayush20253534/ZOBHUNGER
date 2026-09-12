import type {
  ChatbotModelClient,
  ChatbotModelRequest,
  ChatbotModelResponse,
  ChatbotModelUsage,
} from "./chatbot.types.js";

export interface GroqClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  fallbackModel?: string;
  timeoutMs: number;
  maxCompletionTokens: number;
  temperature: number;
  reasoningEffort?: "none" | "default" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
}

export interface GroqApiFailureDetails {
  status?: number;
  code?: string;
  retryAfterSeconds?: number;
}

export class GroqApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly retryAfterSeconds?: number;

  constructor(message: string, details: GroqApiFailureDetails = {}) {
    super(message);
    this.name = "GroqApiError";
    this.status = details.status;
    this.code = details.code;
    this.retryAfterSeconds = details.retryAfterSeconds;
  }
}

type FetchLike = typeof fetch;

type GroqUsagePayload = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  queue_time?: number;
  total_time?: number;
  prompt_tokens_details?: { cached_tokens?: number };
};

type GroqChatCompletionPayload = {
  id?: string;
  model?: string;
  choices?: Array<{
    index?: number;
    message?: {
      role?: string;
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  } | null;
  usage?: GroqUsagePayload;
};

type GroqChatStreamPayload = {
  id?: string;
  model?: string;
  choices?: Array<{
    index?: number;
    delta?: {
      role?: string;
      content?: string | null;
    };
    finish_reason?: string | null;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  } | null;
  usage?: GroqUsagePayload;
};

function extractAssistantText(payload: GroqChatCompletionPayload): string {
  const content = payload.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

function shouldRetryWithFallback(error: GroqApiError, primaryModel: string, fallbackModel?: string): boolean {
  if (!fallbackModel || fallbackModel === primaryModel) return false;
  const status = error.status ?? 0;
  if (![400, 403, 404, 410, 422].includes(status)) return false;
  const signal = `${error.code ?? ""} ${error.message}`.toLowerCase();
  return /(model|deprecat|decommission|retir|permission|not found|does not exist|unsupported)/.test(signal);
}

function usageFrom(payload?: GroqUsagePayload): ChatbotModelUsage | undefined {
  if (!payload) return undefined;
  return {
    ...(typeof payload.prompt_tokens === "number" ? { promptTokens: payload.prompt_tokens } : {}),
    ...(typeof payload.completion_tokens === "number" ? { completionTokens: payload.completion_tokens } : {}),
    ...(typeof payload.total_tokens === "number" ? { totalTokens: payload.total_tokens } : {}),
    ...(typeof payload.prompt_tokens_details?.cached_tokens === "number"
      ? { cachedPromptTokens: payload.prompt_tokens_details.cached_tokens } : {}),
    ...(typeof payload.total_time === "number" ? { providerDurationMs: payload.total_time * 1000 } : {}),
    ...(typeof payload.queue_time === "number" ? { queueDurationMs: payload.queue_time * 1000 } : {}),
  };
}

function requestBody(config: GroqClientConfig, request: ChatbotModelRequest, model: string, stream: boolean) {
  const body: Record<string, unknown> = {
    model,
    messages: request.input,
    max_completion_tokens: config.maxCompletionTokens,
    temperature: config.temperature,
    stream,
  };
  if (config.reasoningEffort) body.reasoning_effort = config.reasoningEffort;
  if (request.user) body.user = request.user;
  return body;
}

function abortScope(timeoutMs: number, external?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;
  const onExternalAbort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", onExternalAbort, { once: true });
  }
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup() {
      clearTimeout(timer);
      external?.removeEventListener("abort", onExternalAbort);
    },
  };
}

function mapTransportError(error: unknown, timedOut: boolean): GroqApiError {
  if (error instanceof GroqApiError) return error;
  if (error instanceof Error && error.name === "AbortError") {
    return timedOut
      ? new GroqApiError("Groq request timed out", { code: "GROQ_TIMEOUT" })
      : new GroqApiError("Groq request was cancelled", { code: "GROQ_ABORTED" });
  }
  return new GroqApiError("Unable to reach Groq", { code: "GROQ_UNAVAILABLE" });
}

async function upstreamFailure(response: Response): Promise<GroqApiError> {
  let payload: GroqChatCompletionPayload = {};
  try {
    payload = await response.json() as GroqChatCompletionPayload;
  } catch {
    // A provider proxy may return a non-JSON error while the HTTP status is still useful.
  }
  return new GroqApiError(payload.error?.message || `Groq request failed with status ${response.status}`, {
    status: response.status,
    code: payload.error?.code || payload.error?.type,
    retryAfterSeconds: parseRetryAfter(response.headers.get("retry-after")),
  });
}

export function createGroqClient(config: GroqClientConfig, fetchImpl: FetchLike = fetch): ChatbotModelClient {
  const endpoint = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;

  async function requestModel(request: ChatbotModelRequest, model: string): Promise<ChatbotModelResponse> {
    const scope = abortScope(config.timeoutMs, request.signal);
    try {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody(config, request, model, false)),
        signal: scope.signal,
      });

      if (!response.ok) throw await upstreamFailure(response);
      let payload: GroqChatCompletionPayload = {};
      try {
        payload = await response.json() as GroqChatCompletionPayload;
      } catch {
        throw new GroqApiError("Groq returned an invalid JSON response", { status: response.status });
      }

      const text = extractAssistantText(payload);
      if (!text) throw new GroqApiError("Groq returned no assistant text", { status: response.status });

      return {
        text,
        ...(payload.id ? { responseId: payload.id } : {}),
        ...(payload.model ? { model: payload.model } : {}),
        ...(payload.usage ? { usage: usageFrom(payload.usage) } : {}),
      };
    } catch (error) {
      throw mapTransportError(error, scope.timedOut());
    } finally {
      scope.cleanup();
    }
  }

  async function requestModelStream(
    request: ChatbotModelRequest,
    model: string,
    onDelta: (text: string) => void | Promise<void>,
  ): Promise<ChatbotModelResponse> {
    const scope = abortScope(config.timeoutMs, request.signal);
    try {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody(config, request, model, true)),
        signal: scope.signal,
      });

      if (!response.ok) throw await upstreamFailure(response);
      if (!response.body) throw new GroqApiError("Groq returned no streaming body", { status: response.status });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completeText = "";
      let responseId: string | undefined;
      let responseModel: string | undefined;
      let usage: ChatbotModelUsage | undefined;
      let done = false;

      const processEvent = async (eventBlock: string) => {
        const data = eventBlock
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n")
          .trim();
        if (!data) return;
        if (data === "[DONE]") {
          done = true;
          return;
        }

        let payload: GroqChatStreamPayload;
        try {
          payload = JSON.parse(data) as GroqChatStreamPayload;
        } catch {
          throw new GroqApiError("Groq returned malformed streaming data", { status: response.status });
        }
        if (payload.error) {
          throw new GroqApiError(payload.error.message || "Groq stream failed", {
            status: response.status,
            code: payload.error.code || payload.error.type,
          });
        }
        if (payload.id) responseId = payload.id;
        if (payload.model) responseModel = payload.model;
        if (payload.usage) usage = usageFrom(payload.usage);
        const delta = payload.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) {
          completeText += delta;
          await onDelta(delta);
        }
      };

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: !readerDone });

        let boundary = buffer.search(/\r?\n\r?\n/);
        while (boundary >= 0) {
          const block = buffer.slice(0, boundary);
          const separator = buffer.slice(boundary).match(/^\r?\n\r?\n/)?.[0] ?? "\n\n";
          buffer = buffer.slice(boundary + separator.length);
          await processEvent(block);
          if (done) break;
          boundary = buffer.search(/\r?\n\r?\n/);
        }

        if (readerDone) {
          buffer += decoder.decode();
          break;
        }
      }

      if (!done && buffer.trim()) await processEvent(buffer);
      const text = completeText.trim();
      if (!text) throw new GroqApiError("Groq returned no assistant text", { status: response.status });

      return {
        text,
        ...(responseId ? { responseId } : {}),
        ...(responseModel ? { model: responseModel } : { model }),
        ...(usage ? { usage } : {}),
      };
    } catch (error) {
      throw mapTransportError(error, scope.timedOut());
    } finally {
      scope.cleanup();
    }
  }

  return {
    async generate(request: ChatbotModelRequest): Promise<ChatbotModelResponse> {
      try {
        return await requestModel(request, config.model);
      } catch (error) {
        if (error instanceof GroqApiError && shouldRetryWithFallback(error, config.model, config.fallbackModel)) {
          return requestModel(request, config.fallbackModel as string);
        }
        throw error;
      }
    },
    async stream(request, onDelta): Promise<ChatbotModelResponse> {
      let emitted = false;
      const forward = async (delta: string) => {
        emitted = true;
        await onDelta(delta);
      };
      try {
        return await requestModelStream(request, config.model, forward);
      } catch (error) {
        if (!emitted && error instanceof GroqApiError && shouldRetryWithFallback(error, config.model, config.fallbackModel)) {
          return requestModelStream(request, config.fallbackModel as string, forward);
        }
        throw error;
      }
    },
  };
}
