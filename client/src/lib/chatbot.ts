import { ApiError, apiFetch, type ApiSuccessEnvelope } from "@/lib/api";

export type ChatbotMessageRole = "user" | "assistant";

export interface ChatbotHistoryMessage {
  role: ChatbotMessageRole;
  content: string;
}

export interface ChatbotSource {
  title: string;
  url: string;
  category: string;
}

export interface ChatbotUiMessage {
  id: string;
  role: ChatbotMessageRole;
  content: string;
  sources?: ChatbotSource[];
  includeInHistory: boolean;
}

export interface ChatbotReply {
  answer: string;
  sources: ChatbotSource[];
  grounded: boolean;
}

export interface SendChatbotMessageInput {
  message: string;
  history?: ChatbotHistoryMessage[];
  currentPage?: string;
}

function requestBody(input: SendChatbotMessageInput) {
  return JSON.stringify({
    message: input.message,
    history: input.history ?? [],
    ...(input.currentPage ? { currentPage: input.currentPage } : {}),
  });
}

export async function sendChatbotMessage(input: SendChatbotMessageInput): Promise<ChatbotReply> {
  const response = await apiFetch<ApiSuccessEnvelope<ChatbotReply>>("/chatbot/messages", {
    method: "POST",
    body: requestBody(input),
  });

  return response.data;
}

interface StreamChatbotOptions {
  signal?: AbortSignal;
  onDelta: (text: string) => void;
}

async function httpError(response: Response): Promise<ApiError> {
  let message = `Request failed (${response.status}). Please try again.`;
  let code: string | undefined;
  let details: unknown;
  try {
    const body = await response.json() as {
      message?: unknown;
      error?: { code?: unknown; details?: unknown };
    };
    if (typeof body.message === "string") message = body.message;
    if (typeof body.error?.code === "string") code = body.error.code;
    if (body.error && "details" in body.error) details = body.error.details;
  } catch {
    // Proxy errors can be plain text; the HTTP status remains actionable.
  }
  return new ApiError(message, response.status, code, details);
}

export async function streamChatbotMessage(
  input: SendChatbotMessageInput,
  options: StreamChatbotOptions,
): Promise<ChatbotReply> {
  const response = await fetch("/api/backend/chatbot/stream", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "text/event-stream",
    },
    body: requestBody(input),
    signal: options.signal,
  });

  if (!response.ok) throw await httpError(response);
  if (!response.body) throw new ApiError("The chatbot returned an empty stream.", 502, "CHATBOT_EMPTY_STREAM");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: ChatbotReply | null = null;

  const processBlock = (block: string) => {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    }
    if (!dataLines.length) return;
    const raw = dataLines.join("\n");
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new ApiError("The chatbot returned malformed streaming data.", 502, "CHATBOT_INVALID_STREAM");
    }

    if (event === "delta") {
      const text = data && typeof data === "object" && "text" in data
        ? (data as { text?: unknown }).text
        : undefined;
      if (typeof text === "string" && text) options.onDelta(text);
      return;
    }
    if (event === "done") {
      if (!data || typeof data !== "object") throw new ApiError("The chatbot stream ended without a result.", 502, "CHATBOT_INVALID_STREAM");
      const candidate = data as Partial<ChatbotReply>;
      if (typeof candidate.answer !== "string" || !Array.isArray(candidate.sources) || typeof candidate.grounded !== "boolean") {
        throw new ApiError("The chatbot stream ended with an invalid result.", 502, "CHATBOT_INVALID_STREAM");
      }
      result = candidate as ChatbotReply;
      return;
    }
    if (event === "error") {
      const payload = data && typeof data === "object" ? data as { message?: unknown; code?: unknown; details?: unknown } : {};
      throw new ApiError(
        typeof payload.message === "string" ? payload.message : "The chatbot could not generate a response.",
        502,
        typeof payload.code === "string" ? payload.code : "CHATBOT_STREAM_ERROR",
        payload.details,
      );
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: !done });
    let boundary = buffer.search(/\r?\n\r?\n/);
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      const separator = buffer.slice(boundary).match(/^\r?\n\r?\n/)?.[0] ?? "\n\n";
      buffer = buffer.slice(boundary + separator.length);
      processBlock(block);
      boundary = buffer.search(/\r?\n\r?\n/);
    }
    if (done) {
      buffer += decoder.decode();
      break;
    }
  }
  if (buffer.trim()) processBlock(buffer);
  if (!result) throw new ApiError("The chatbot stream ended before completion.", 502, "CHATBOT_INCOMPLETE_STREAM");
  return result;
}
