import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../utils/api-response.js";

export const getHealth: RequestHandler = (_req, res) => {
  const revision = process.env.RELEASE_SHA || process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || "";
  res.set("Cache-Control", "no-store");
  res.status(200).json(
    apiSuccessResponse("API is healthy", {
      status: "ok",
      service: "zobhunger-api",
      revision: /^[a-f0-9]{40,64}$/i.test(revision) ? revision.toLowerCase() : null,
      features: { businessPortal: true, businessDashboard: true, businessRequirements: true, businessCandidates: true, businessDeployments: true, businessAttendance: true, businessPhase2Complete: true },
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    }),
  );
};
