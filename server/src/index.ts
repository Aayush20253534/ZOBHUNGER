import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

async function startServer(): Promise<void> {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    console.log(`ZOBHUNGER API listening on port ${env.PORT}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received. Shutting down gracefully.`);

    server.close(async (error) => {
      try {
        await disconnectDatabase();
      } finally {
        if (error) {
          console.error("HTTP server shutdown failed", error);
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
  console.error("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection", reason);
});

startServer().catch(async (error) => {
  console.error("Failed to start ZOBHUNGER API", error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
