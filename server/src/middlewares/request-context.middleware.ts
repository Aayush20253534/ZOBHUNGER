import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { requestMetricCompleted, requestMetricStarted } from "../observability/http-metrics.js";
import { logger } from "../utils/logger.js";
import { sanitizeRequestTarget } from "../utils/log-sanitizer.js";

export const requestContext: RequestHandler = (req, res, next) => {
  const requestId = req.get("x-request-id")?.slice(0, 120) || randomUUID();
  const startedAt = process.hrtime.bigint();
  let finalized = false;

  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  requestMetricStarted();

  const finalize = (aborted: boolean) => {
    if (finalized) return;
    finalized = true;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const roundedDurationMs = Math.round(durationMs * 100) / 100;
    const statusCode = aborted && !res.headersSent ? 499 : res.statusCode;
    requestMetricCompleted({ method: req.method, statusCode, durationMs, aborted });
    const context = {
      requestId,
      method: req.method,
      path: sanitizeRequestTarget(req.originalUrl),
      statusCode,
      durationMs: roundedDurationMs,
      aborted,
    };
    if (durationMs >= env.SLOW_REQUEST_MS) logger.warn("request.slow", context);
    else logger.info("request.completed", context);
  };

  res.on("finish", () => finalize(false));
  res.on("close", () => finalize(!res.writableEnded));

  next();
};
