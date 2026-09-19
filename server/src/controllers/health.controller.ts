import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../utils/api-response.js";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { redisStatus } from "../config/redis.js";
import { privateFileStorageConfigured } from "../services/private-file-storage.js";
import { missingResendSettings } from "../services/resend.client.js";
import { chatbotOperationalStatus } from "../modules/chatbot/chatbot.runtime.js";
import { providerBudgetStatus } from "../operations/provider-budget.js";
import { providerCircuitStatus } from "../operations/provider-circuit.js";
import { errorMonitoringStatus } from "../observability/error-monitor.js";
import { httpMetricsSnapshot } from "../observability/http-metrics.js";
import { operationMetricsSnapshot } from "../observability/operation-metrics.js";

function releaseRevision() {
  const revision = process.env.RELEASE_SHA || process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || "";
  return /^[a-f0-9]{40,64}$/i.test(revision) ? revision.toLowerCase() : null;
}

function publicStatus(status: "ok" | "ready" | "not_ready", includeRevision = true) {
  return {
    status,
    service: "zobhunger-api",
    ...(includeRevision ? { revision: releaseRevision() } : {}),
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

async function readinessChecks() {
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
  return {
    ready: database && privateFileStorage && email && publicApp,
    checks: {
      database,
      privateFileStorage,
      email,
      publicApp,
      cache: cache.ready ? "ready" : cache.enabled ? "postgresql_fallback" : "disabled",
    },
  };
}

// Anonymous monitors only need proof that the Node process is serving the
// expected application. Operational configuration lives behind admin auth.
export const getMonitoringStatus: RequestHandler = (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json(publicStatus("ok", false));
};

export const getHealth: RequestHandler = (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json(apiSuccessResponse("API is healthy", publicStatus("ok")));
};

// Readiness remains public for load balancers, but dependency-by-dependency
// details are intentionally omitted. A 200/503 status is enough for routing.
export const getReadiness: RequestHandler = async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const { ready } = await readinessChecks();
  res.status(ready ? 200 : 503).json(publicStatus(ready ? "ready" : "not_ready"));
};

// Detailed diagnostics are mounted inside the authenticated, permission-gated
// admin router. No public origin or secret values are returned.
export const getDetailedHealth: RequestHandler = async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const { ready, checks } = await readinessChecks();
  res.status(ready ? 200 : 503).json(apiSuccessResponse("Operational health retrieved", {
    ...publicStatus(ready ? "ready" : "not_ready"),
    checks,
    chatbot: chatbotOperationalStatus(),
    safeguards: {
      providerBudgets: providerBudgetStatus(),
      providerCircuits: providerCircuitStatus(),
      errorMonitoring: errorMonitoringStatus(),
    },
    features: {
      businessPortal: true,
      workerPortal: true,
      placementPortal: true,
      technicalInstitutePortal: true,
      compliance: true,
      internshipPayments: env.CASHFREE_ENABLED,
      chatbot: env.CHATBOT_ENABLED,
    },
  }));
};


export const getOperationalMetrics: RequestHandler = (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json(apiSuccessResponse("Operational metrics retrieved", {
    http: httpMetricsSnapshot(),
    operations: operationMetricsSnapshot(),
    providerBudgets: providerBudgetStatus(),
    providerCircuits: providerCircuitStatus(),
  }));
};
