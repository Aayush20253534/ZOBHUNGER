import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../utils/http-error.js";
import { logger } from "../utils/logger.js";

export interface RequestValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export interface ValidatedRequestData {
  body?: unknown;
  params?: unknown;
  query?: unknown;
}

export function validate(schemas: RequestValidationSchemas): RequestHandler {
  return (req, res, next) => {
    const validated: ValidatedRequestData = {};

    for (const source of ["body", "params", "query"] as const) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source]);
      if (!result.success) {
        // Log field names only; submitted values may contain personal data or passwords.
        logger.info("request.validation_failed", { requestId: res.locals.requestId, method: req.method,
          source, fields: [...new Set(result.error.issues.map(issue => String(issue.path[0] ?? source)))].slice(0, 50) });
        next(
          new HttpError(400, "Request validation failed", {
            code: "VALIDATION_ERROR",
            details: result.error.flatten(),
          }),
        );
        return;
      }

      validated[source] = result.data;
    }

    res.locals.validated = validated;
    next();
  };
}
