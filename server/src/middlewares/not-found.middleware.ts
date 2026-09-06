import type { RequestHandler } from "express";
import { apiErrorResponse } from "../utils/api-response.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(
    apiErrorResponse(`Cannot ${req.method} ${req.originalUrl}`, {
      code: "ROUTE_NOT_FOUND",
    }),
  );
};
