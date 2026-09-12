import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { startRedis, stopRedis } from "./config/redis.js";
import { logger } from "./utils/logger.js";
import { chatbotOperationalStatus, getChatbotService } from "./modules/chatbot/chatbot.runtime.js";

const SHUTDOWN_GRACE_MS = 12_000;

async function startServer(): Promise<void> {
  await connectDatabase();
  startRedis();
  if (env.CHATBOT_ENABLED) {
    await getChatbotService();
    logger.info("chatbot.ready", chatbotOperationalStatus());
  }

  const server = app.listen(env.PORT, () => {
    logger.info("server.started", { port: env.PORT, environment: env.NODE_ENV });
  });
  // Keep slow or abandoned clients from pinning a production instance forever.
  server.requestTimeout = 60_000;
  server.headersTimeout = 65_000;
  server.keepAliveTimeout = 5_000;

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("server.shutdown.started", { signal });

    const forceTimer = setTimeout(() => {
      logger.warn("server.shutdown.forced", { signal, graceMs: SHUTDOWN_GRACE_MS });
      server.closeAllConnections();
    }, SHUTDOWN_GRACE_MS);
    forceTimer.unref();

    server.close(async (error) => {
      clearTimeout(forceTimer);
      try {
        stopRedis();
        await disconnectDatabase();
      } finally {
        if (error) {
          logger.error("server.shutdown.failed", error);
          process.exit(1);
        }
        logger.info("server.shutdown.complete", { signal });
        process.exit(0);
      }
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

process.on("uncaughtException", (error) => {
  logger.error("process.uncaught_exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("process.unhandled_rejection", reason);
});

startServer().catch(async (error) => {
  logger.error("server.start.failed", error);
  stopRedis();
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
