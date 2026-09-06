import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) { next(error); return; }
  console.error(error);
  const status = typeof error?.status === "number" && error.status >= 400 && error.status < 500
    ? error.status : 500;
  res.status(status).json({ message: status === 500 ? "Internal server error" : "Invalid request" });
};
