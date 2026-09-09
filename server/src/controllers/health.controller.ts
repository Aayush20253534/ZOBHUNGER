import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../utils/api-response.js";

export const getHealth: RequestHandler = (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json(
    apiSuccessResponse("API is healthy", {
      status: "ok",
      service: "zobhunger-api",
      features: { businessPortal: true, businessDashboard: true, businessRequirements: true, businessCandidates: true, businessDeployments: true, businessAttendance: true, businessPhase2Complete: true },
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    }),
  );
};
