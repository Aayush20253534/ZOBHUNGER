import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../utils/api-response.js";

// Lightweight liveness probe for uptime monitors. It needs no cookies, does not
// touch the database or mail provider, and reports no configuration secrets.
export const getMonitoringStatus: RequestHandler = (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({ status: "ok", service: "zobhunger-api", uptimeSeconds: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
};

export const getHealth: RequestHandler = (_req, res) => {
  const revision = process.env.RELEASE_SHA || process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || "";
  res.set("Cache-Control", "no-store");
  res.status(200).json(
    apiSuccessResponse("API is healthy", {
      status: "ok",
      service: "zobhunger-api",
      revision: /^[a-f0-9]{40,64}$/i.test(revision) ? revision.toLowerCase() : null,
      features: { businessPortal: true, businessDashboard: true, businessRequirements: true, businessCandidates: true, businessDeployments: true, businessAttendance: true, businessPhase2Complete: true, workerAccess: true, workerProfiles: true, workerJobDiscovery: true, workerApplications: true, workerAssignments: true, workerAttendance: true, workerEarnings: true, workerDashboard: true, workerPhase3Complete: true },
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    }),
  );
};
