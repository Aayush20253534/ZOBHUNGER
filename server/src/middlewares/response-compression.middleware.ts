import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";
import type { RequestHandler } from "express";

const minimumBytes = 1_024;

function compressibleContentType(value: string) {
  const type = value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  return type.startsWith("text/") || /(?:json|javascript|xml|svg\+xml|font|wasm)$/.test(type.split("/")[1] ?? "");
}

function preferredEncoding(header: string | undefined) {
  if (!header) return null;
  const values = header.toLowerCase();
  if (/\bbr\b/.test(values)) return "br" as const;
  if (/\bgzip\b/.test(values)) return "gzip" as const;
  return null;
}

/**
 * Compresses normal buffered Express responses without interfering with raw
 * webhook parsing, SSE/streaming responses, downloads or already-compressed
 * payloads. This intentionally wraps res.send rather than res.write/end so
 * streaming semantics stay untouched.
 */
export const responseCompression: RequestHandler = (req, res, next) => {
  const originalSend = res.send.bind(res);

  res.send = ((body?: unknown) => {
    if (
      req.method === "HEAD" ||
      res.statusCode === 204 ||
      res.statusCode === 304 ||
      res.getHeader("Content-Encoding") ||
      /\bno-transform\b/i.test(String(res.getHeader("Cache-Control") ?? ""))
    ) return originalSend(body);

    const encoding = preferredEncoding(req.get("accept-encoding"));
    if (!encoding) return originalSend(body);

    let payload: Buffer;
    if (Buffer.isBuffer(body)) payload = body;
    else if (typeof body === "string") payload = Buffer.from(body);
    else return originalSend(body);

    if (payload.byteLength < minimumBytes) return originalSend(body);

    let contentType = String(res.getHeader("Content-Type") ?? "");
    if (!contentType && typeof body === "string") {
      res.type("html");
      contentType = String(res.getHeader("Content-Type") ?? "text/html; charset=utf-8");
    }
    if (!compressibleContentType(contentType) || contentType.toLowerCase().startsWith("text/event-stream")) {
      return originalSend(body);
    }

    const compressed = encoding === "br"
      ? brotliCompressSync(payload, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 4 } })
      : gzipSync(payload, { level: 6 });

    if (compressed.byteLength >= payload.byteLength) return originalSend(body);

    res.vary("Accept-Encoding");
    res.setHeader("Content-Encoding", encoding);
    res.setHeader("Content-Length", String(compressed.byteLength));
    return originalSend(compressed);
  }) as typeof res.send;

  next();
};
