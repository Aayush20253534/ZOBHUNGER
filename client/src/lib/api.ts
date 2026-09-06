const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
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
  });
  if (!response.ok) {
    let message = `Request failed (${response.status}). Please try again.`;
    try {
      const body: unknown = await response.json();
      if (
        body &&
        typeof body === "object" &&
        "message" in body &&
        typeof body.message === "string"
      )
        message = body.message;
    } catch {
      /* A proxy or server can return a non-JSON error response. */
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204)
    throw new ApiError("The server returned an empty response.", 204);
  return response.json() as Promise<T>;
}
