import { RedisJsonCache } from "../cache/json-cache.js";
import { env } from "../config/env.js";
import { redisTransport } from "../config/redis.js";
import { logger } from "../utils/logger.js";

// Jobs and the institution opportunity catalogue represent the same open roles.
// One invalidation covers public lists, public details, and portal lists.
export const jobCache = new RedisJsonCache(redisTransport, {
  prefix: `${env.REDIS_KEY_PREFIX}:${env.NODE_ENV}:v1`,
  namespace: "jobs",
  ttlSeconds: env.REDIS_TTL_SECONDS,
  onEvent: (event) => {
    if (event === "unavailable") {
      logger.warn("cache.unavailable", { namespace: "jobs", fallback: "postgresql" });
    } else {
      logger.debug(`cache.${event}`, { namespace: "jobs" });
    }
  },
});
