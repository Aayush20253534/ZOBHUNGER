import { apiRawFetch } from "./api";

function safePath() {
  if (typeof window === "undefined") return undefined;
  return window.location.pathname.slice(0, 300);
}

export async function reportClientError(error: Error & { digest?: string }, source: string) {
  const message = (error.message || "Client rendering error").slice(0, 800);
  try {
    const response = await apiRawFetch("/telemetry/client-error", {
      method: "POST",
      timeoutMs: 5_000,
      keepalive: true,
      body: JSON.stringify({
        source: source.slice(0, 120),
        message,
        path: safePath(),
        digest: error.digest?.slice(0, 160),
        release: process.env.NEXT_PUBLIC_RELEASE_SHA?.slice(0, 100),
      }),
    });
    await response.body?.cancel().catch(() => undefined);
  } catch {
    // Monitoring is best effort and must never replace the original UI error.
  }
}
