import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";
import { apiErrorResponse } from "../utils/api-response.js";
import { HttpError } from "../utils/http-error.js";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
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

  console.error(error);

  res.status(500).json(
    apiErrorResponse("Internal server error", {
      code: "INTERNAL_SERVER_ERROR",
      ...(env.NODE_ENV === "development" && error instanceof Error
        ? { details: error.message }
        : {}),
    }),
  );
};
