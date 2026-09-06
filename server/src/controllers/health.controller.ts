import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../utils/api-response.js";

export const getHealth: RequestHandler = (_req, res) => {
  res.status(200).json(
    apiSuccessResponse("API is healthy", {
      status: "ok",
      service: "zobhunger-api",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    }),
  );
};
