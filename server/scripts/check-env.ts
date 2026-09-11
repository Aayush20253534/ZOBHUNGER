import { allowedOrigins } from "../src/config/cors.js";
import { env } from "../src/config/env.js";
import { privateFileStorageConfigured } from "../src/services/private-file-storage.js";
import { missingResendSettings } from "../src/services/resend.client.js";

const summary = {
  status: "ok",
  scope: "server environment",
  environment: env.NODE_ENV,
  clientOrigins: allowedOrigins,
  publicAppOrigin: env.PUBLIC_APP_URL ? new URL(env.PUBLIC_APP_URL).origin : null,
  database: "configured",
  redis: { enabled: env.REDIS_ENABLED, configured: Boolean(env.REDIS_URL) },
  email: { configured: missingResendSettings().length === 0, salesNotifications: Boolean(env.SALES_TEAM_EMAIL) },
  privateFileStorage: privateFileStorageConfigured(),
  security: { mfaEncryption: Boolean(env.MFA_ENCRYPTION_KEY), hrPiiEncryption: Boolean(env.HR_PII_ENCRYPTION_KEY) },
};

console.log(JSON.stringify(summary, null, 2));
