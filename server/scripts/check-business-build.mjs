import { once } from "node:events";
import { checkBusinessRoutes } from "./business-route-checks.mjs";

// This is a separate build/prestart process. These temporary values never
// change the environment of the real API started by npm afterwards.
Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://build_check:build_check@127.0.0.1:1/build_check",
  JWT_SECRET: "business-route-build-check-not-a-production-secret",
  REDIS_ENABLED: "false",
  REDIS_URL: "",
  MAILJET_API_KEY: "",
  MAILJET_SECRET_KEY: "",
  MAIL_FROM_EMAIL: "",
  SALES_TEAM_EMAIL: "",
  PUBLIC_APP_URL: "http://localhost:3000",
  TRUST_PROXY: "false",
  LOG_LEVEL: "error",
  API_RATE_LIMIT_MAX: "1000",
  AUTH_RATE_LIMIT_MAX: "1000",
});

let server;
try {
  // Import the compiled application, not src. No database connection is opened
  // because every protected request is unauthenticated and every POST invalid.
  const { app } = await import("../dist/app.js");
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  await checkBusinessRoutes(`http://127.0.0.1:${server.address().port}/api/v1`);
  console.log("Business route check passed: access, dashboard, requirement list/create/edit/withdraw, profile and recovery are mounted.");
} catch (error) {
  console.error("Business route check failed:", error instanceof Error ? error.message : "Unable to load the compiled API.");
  console.error("From server/, run npm ci --include=dev, then npm run deploy. Start the service with npm start.");
  process.exitCode = 1;
} finally {
  if (server) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
