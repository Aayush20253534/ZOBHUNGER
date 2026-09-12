import type {
  ChatbotModelClient,
  ChatbotModelRequest,
  ChatbotModelResponse,
} from "./chatbot.types.js";

export interface GroqClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
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

type GroqChatCompletionPayload = {
  id?: string;
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

export function createGroqClient(config: GroqClientConfig, fetchImpl: FetchLike = fetch): ChatbotModelClient {
  const endpoint = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;

  return {
    async generate(request: ChatbotModelRequest): Promise<ChatbotModelResponse> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const body: Record<string, unknown> = {
          model: config.model,
          messages: request.input,
          max_completion_tokens: config.maxCompletionTokens,
          temperature: config.temperature,
          stream: false,
        };
        if (config.reasoningEffort) body.reasoning_effort = config.reasoningEffort;

        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        let payload: GroqChatCompletionPayload = {};
        try {
          payload = await response.json() as GroqChatCompletionPayload;
        } catch {
          // Keep the upstream status available even when a proxy returns non-JSON.
        }

        if (!response.ok) {
          throw new GroqApiError(payload.error?.message || `Groq request failed with status ${response.status}`, {
            status: response.status,
            code: payload.error?.code || payload.error?.type,
            retryAfterSeconds: parseRetryAfter(response.headers.get("retry-after")),
          });
        }

        const text = extractAssistantText(payload);
        if (!text) {
          throw new GroqApiError("Groq returned no assistant text", { status: response.status });
        }

        return {
          text,
          ...(payload.id ? { responseId: payload.id } : {}),
        };
      } catch (error) {
        if (error instanceof GroqApiError) throw error;
        if (error instanceof Error && error.name === "AbortError") {
          throw new GroqApiError("Groq request timed out", { code: "GROQ_TIMEOUT" });
        }
        throw new GroqApiError("Unable to reach Groq", { code: "GROQ_UNAVAILABLE" });
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
