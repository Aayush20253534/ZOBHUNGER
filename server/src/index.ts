import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

async function startServer(): Promise<void> {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info("server.started", { port: env.PORT, environment: env.NODE_ENV });
  });

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("server.shutdown.started", { signal });

    server.close(async (error) => {
      try {
        await disconnectDatabase();
      } finally {
        if (error) {
          logger.error("server.shutdown.failed", error);
          process.exit(1);
        }
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
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
