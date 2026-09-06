import type { RequestHandler } from "express";

// TODO: validate input, call the service, and map its result to an HTTP response.
export const pendingImplementation: RequestHandler = (_req, res) => {
  res.status(501).json({ message: "This Phase 1 endpoint has not been implemented yet." });
};
