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
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    let message = `Request failed (${response.status}). Please try again.`;
    let code: string | undefined;
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
        }
      }
    } catch {
      /* A proxy or server can return a non-JSON error response. */
    }
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    throw new ApiError("The server returned an empty response.", 204);
  }

  return response.json() as Promise<T>;
}
