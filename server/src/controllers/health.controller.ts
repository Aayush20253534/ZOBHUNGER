import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../utils/api-response.js";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { redisStatus } from "../config/redis.js";
import { privateFileStorageConfigured } from "../services/private-file-storage.js";
import { missingResendSettings } from "../services/resend.client.js";
import { chatbotOperationalStatus } from "../modules/chatbot/chatbot.runtime.js";

function releaseRevision() {
  const revision = process.env.RELEASE_SHA || process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || "";
  return /^[a-f0-9]{40,64}$/i.test(revision) ? revision.toLowerCase() : null;
}

// Lightweight liveness probe for uptime monitors. It needs no cookies, does not
// touch the database or mail provider, and reports no configuration secrets.
export const getMonitoringStatus: RequestHandler = (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({ status: "ok", service: "zobhunger-api", uptimeSeconds: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
};

export const getHealth: RequestHandler = (_req, res) => {
  res.set("Cache-Control", "no-store");
  const cache = redisStatus();
  res.status(200).json(
    apiSuccessResponse("API is healthy", {
      status: "ok",
      service: "zobhunger-api",
      revision: releaseRevision(),
      features: {
        businessPortal: true,
        businessDashboard: true,
        businessRequirements: true,
        businessCandidates: true,
        businessDeployments: true,
        businessAttendance: true,
        businessPhase2Complete: true,
        workerAccess: true,
        workerProfiles: true,
        workerJobDiscovery: true,
        workerApplications: true,
        workerAssignments: true,
        workerAttendance: true,
        workerEarnings: true,
        workerDashboard: true,
        workerPhase3Complete: true,
        productionFoundation: true,
        productionDeployment: true,
        chatbot: env.CHATBOT_ENABLED,
      },
      chatbot: chatbotOperationalStatus(),
      publicAppOrigin: env.PUBLIC_APP_URL ? new URL(env.PUBLIC_APP_URL).origin : null,
      cache: cache.ready ? "ready" : cache.enabled ? "postgresql_fallback" : "disabled",
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

  const privateFileStorage = env.NODE_ENV !== "production" || privateFileStorageConfigured();
  const email = env.NODE_ENV !== "production" || missingResendSettings().length === 0;
  const publicApp = env.NODE_ENV !== "production" || Boolean(env.PUBLIC_APP_URL);
  const cache = redisStatus();
  const ready = database && privateFileStorage && email && publicApp;

  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    service: "zobhunger-api",
    revision: releaseRevision(),
    checks: {
      database,
      privateFileStorage,
      email,
      publicApp,
      cache: cache.ready ? "ready" : cache.enabled ? "postgresql_fallback" : "disabled",
    },
    timestamp: new Date().toISOString(),
  });
};
