const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export const DEFAULT_API_TIMEOUT_MS = 25_000;
export const UPLOAD_API_TIMEOUT_MS = 60_000;
export const EXPORT_API_TIMEOUT_MS = 90_000;

export interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiRequestInit extends RequestInit {
  /** Set to null or 0 only for intentionally long-lived requests such as SSE streams. */
  timeoutMs?: number | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiFieldErrors(error: unknown): Record<string, string[]> {
  if (!(error instanceof ApiError) || error.code !== "VALIDATION_ERROR") return {};
  const details = error.details;
  if (!details || typeof details !== "object" || !("fieldErrors" in details)) return {};
  const fields = details.fieldErrors;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return {};
  return Object.fromEntries(Object.entries(fields).slice(0, 50).flatMap(([field, messages]) => {
    if (!/^[a-zA-Z][a-zA-Z0-9_.]{0,99}$/.test(field) || !Array.isArray(messages)) return [];
    const safeMessages = messages.filter((message): message is string => typeof message === "string" && Boolean(message.trim()))
      .slice(0, 3).map(message => message.slice(0, 240));
    return safeMessages.length ? [[field, safeMessages]] : [];
  }));
}

function inferredTimeout(options: ApiRequestInit) {
  if (options.timeoutMs !== undefined) return options.timeoutMs;
  const body = options.body;
  if (typeof Blob !== "undefined" && body instanceof Blob) return UPLOAD_API_TIMEOUT_MS;
  if (typeof FormData !== "undefined" && body instanceof FormData) return UPLOAD_API_TIMEOUT_MS;
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return UPLOAD_API_TIMEOUT_MS;
  return DEFAULT_API_TIMEOUT_MS;
}

function controlledSignal(externalSignal: AbortSignal | null | undefined, timeoutMs: number | null) {
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const forwardAbort = () => controller.abort(externalSignal?.reason);
  if (externalSignal?.aborted) forwardAbort();
  else externalSignal?.addEventListener("abort", forwardAbort, { once: true });

  if (timeoutMs && timeoutMs > 0 && !controller.signal.aborted) {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup: () => {
      if (timer) clearTimeout(timer);
      externalSignal?.removeEventListener("abort", forwardAbort);
    },
  };
}

function apiUrl(path: string) {
  const base = typeof window === "undefined" ? apiBaseUrl.replace(/\/$/, "") : "/api/backend";
  return `${base}${path}`;
}

/**
 * Shared transport for JSON calls, downloads and uploads. It deliberately
 * returns the raw Response so binary callers can keep their own error/body
 * handling while still inheriting timeout, cancellation and CSRF headers.
 */
function responseWithControlledBody(
  response: Response,
  control: ReturnType<typeof controlledSignal>,
  timeoutMs: number | null,
  externalSignal: AbortSignal | null | undefined,
) {
  if (!response.body) {
    control.cleanup();
    return response;
  }

  const reader = response.body.getReader();
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    control.cleanup();
  };
  const requestFailure = (fallback: unknown) => {
    if (control.timedOut()) return new ApiError("The request timed out. Please try again.", 0, "REQUEST_TIMEOUT", { timeoutMs });
    if (externalSignal?.aborted) return new ApiError("The request was cancelled.", 0, "REQUEST_ABORTED");
    return fallback;
  };

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await reader.read();
        if (chunk.done) {
          cleanup();
          controller.close();
          return;
        }
        controller.enqueue(chunk.value);
      } catch (error) {
        cleanup();
        controller.error(requestFailure(error));
      }
    },
    async cancel(reason) {
      cleanup();
      await reader.cancel(reason).catch(() => undefined);
    },
  });

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

/**
 * Shared transport for JSON calls, downloads, uploads and intentional streams.
 * The timeout remains active until the response body is consumed, rather than
 * stopping as soon as response headers arrive.
 */
export async function apiRawFetch(
  path: string,
  options: ApiRequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const method = (options.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !headers.has("X-Requested-With")) {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  const timeoutMs = inferredTimeout(options);
  const requestSignal = controlledSignal(options.signal, timeoutMs);
  const fetchOptions: ApiRequestInit = { ...options };
  delete fetchOptions.timeoutMs;
  delete fetchOptions.signal;

  try {
    const response = await fetch(apiUrl(path), {
      ...fetchOptions,
      headers,
      signal: requestSignal.signal,
      credentials: options.credentials ?? "include",
      cache: options.cache ?? "no-store",
    });
    return responseWithControlledBody(response, requestSignal, timeoutMs, options.signal);
  } catch {
    requestSignal.cleanup();
    if (requestSignal.timedOut()) {
      throw new ApiError("The request timed out. Please try again.", 0, "REQUEST_TIMEOUT", { timeoutMs });
    }
    if (options.signal?.aborted) {
      throw new ApiError("The request was cancelled.", 0, "REQUEST_ABORTED");
    }
    throw new ApiError("Unable to reach the server. Check your connection and try again.", 0, "NETWORK_ERROR");
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestInit = {},
): Promise<T> {
  const response = await apiRawFetch(path, options);

  if (!response.ok) {
    let message = `Request failed (${response.status}). Please try again.`;
    let code: string | undefined;
    let details: unknown;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object") {
        if ("message" in body && typeof body.message === "string") message = body.message;
        if (
          "error" in body && body.error && typeof body.error === "object" &&
          "code" in body.error && typeof body.error.code === "string"
        ) {
          code = body.error.code;
          if ("details" in body.error) details = body.error.details;
        }
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      /* A proxy or server can return a non-JSON error response. */
    }
    throw new ApiError(message, response.status, code, details);
  }

  if (response.status === 204) {
    throw new ApiError("The server returned an empty response.", 204, "EMPTY_RESPONSE");
  }

  try {
    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("The server returned an invalid response. Please try again.", response.status, "INVALID_RESPONSE");
  }
}
