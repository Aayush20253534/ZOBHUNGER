import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";
import { apiErrorResponse } from "../utils/api-response.js";
import { HttpError } from "../utils/http-error.js";
import { logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json(
      apiErrorResponse(error.message, {
        code: error.code,
        details: error.details,
      }),
    );
    return;
  }

  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    res.status(400).json(
      apiErrorResponse("Invalid JSON payload", {
        code: "INVALID_JSON",
      }),
    );
    return;
  }

  if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
    res.status(413).json(apiErrorResponse("The submitted content is too large. Use the file size limit shown on the form.", { code: "PAYLOAD_TOO_LARGE" }));
    return;
  }

  logger.error("request.failed", error, {
    requestId: res.locals.requestId,
    method: req.method,
    path: req.originalUrl,
  });

  res.status(500).json(
    apiErrorResponse("Internal server error", {
      code: "INTERNAL_SERVER_ERROR",
      ...(env.NODE_ENV === "development" && error instanceof Error
        ? { details: error.message }
        : {}),
    }),
  );
};
