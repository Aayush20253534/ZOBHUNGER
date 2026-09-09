const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
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

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const method = (options.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !headers.has("X-Requested-With")) {
    // Authenticated mutations are intentionally recognizable as same-site app
    // requests. The server also validates Origin/Sec-Fetch-Site when present.
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  // Browser requests use the Next rewrite, so httpOnly cookies belong to the site.
  // Server-rendered public content can continue calling Express directly.
  const base = typeof window === "undefined" ? apiBaseUrl.replace(/\/$/, "") : "/api/backend";
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    let message = `Request failed (${response.status}). Please try again.`;
    let code: string | undefined;
    let details: unknown;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object") {
        if ("message" in body && typeof body.message === "string") {
          message = body.message;
        }
        if (
          "error" in body &&
          body.error &&
          typeof body.error === "object" &&
          "code" in body.error &&
          typeof body.error.code === "string"
        ) {
          code = body.error.code;
          if ("details" in body.error) details = body.error.details;
        }
      }
    } catch {
      /* A proxy or server can return a non-JSON error response. */
    }
    throw new ApiError(message, response.status, code, details);
  }

  if (response.status === 204) {
    throw new ApiError("The server returned an empty response.", 204);
  }

  return response.json() as Promise<T>;
}
