import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../utils/api-response.js";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { privateFileStorageConfigured } from "../services/private-file-storage.js";

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


// Readiness is intentionally separate from liveness. Deployments and load
// balancers can use it to avoid routing traffic before essential dependencies
// are available, while / and /route continue to prove only that Node is alive.
export const getReadiness: RequestHandler = async (_req, res) => {
  res.set("Cache-Control", "no-store");
  let database = false;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("database readiness timeout")), 2_000)),
    ]);
    database = true;
  } catch {
    database = false;
  }
  const fileStorage = env.NODE_ENV !== "production" || privateFileStorageConfigured();
  const ready = database && fileStorage;
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    service: "zobhunger-api",
    checks: { database, privateFileStorage: fileStorage },
    timestamp: new Date().toISOString(),
  });
};
