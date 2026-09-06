import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../utils/http-error.js";

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
