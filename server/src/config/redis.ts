import { createClient } from "redis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";
import type { CacheTransport } from "../cache/json-cache.js";

export const redisConfigured = env.REDIS_ENABLED && Boolean(env.REDIS_URL);

const client = redisConfigured
  ? createClient({
      url: env.REDIS_URL,
      disableOfflineQueue: true,
      commandsQueueMaxLength: 1_000,
      socket: {
        connectTimeout: 1_000,
        reconnectStrategy: (retries: number) =>
          Math.min(250 * (retries + 1), 5_000) + Math.floor(Math.random() * 100),
      },
    })
  : undefined;

let lastErrorLog = 0;
client?.on("error", () => {
  if (Date.now() - lastErrorLog < 30_000) return;
  lastErrorLog = Date.now();
  // Do not log connection URLs or authentication errors containing credentials.
  logger.warn("redis.unavailable", { fallback: "postgresql" });
});
client?.on("ready", () => logger.info("redis.ready"));

/** Cache availability never blocks HTTP server startup. */
export function startRedis(): void {
  if (!client) {
    logger.info("redis.disabled", { fallback: "postgresql" });
    return;
  }
  if (!client.isOpen) {
    void client.connect().catch(() => {
      logger.warn("redis.connection_failed", { fallback: "postgresql" });
    });
  }
}

export function stopRedis(): void {
  if (client?.isOpen) client.destroy();
}

export function redisStatus() {
  return {
    enabled: env.REDIS_ENABLED,
    configured: redisConfigured,
    ready: client?.isReady ?? false,
  };
}

export const redisTransport: CacheTransport = {
  isReady: () => client?.isReady ?? false,
  async command(args) {
    if (!client?.isReady) throw new Error("Redis is unavailable");
    return client.sendCommand(args, {
      timeout: env.REDIS_COMMAND_TIMEOUT_MS,
    });
  },
};
