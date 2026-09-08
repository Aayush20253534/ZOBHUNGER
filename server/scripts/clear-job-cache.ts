import { setTimeout } from "node:timers/promises";
import { redisConfigured, redisTransport, startRedis, stopRedis } from "../src/config/redis.js";
import { jobCache } from "../src/services/job-cache.service.js";

try {
  if (!redisConfigured) throw new Error("Set REDIS_URL and enable Redis before clearing its cache.");
  startRedis();
  const deadline = Date.now() + 5_000;
  while (!redisTransport.isReady() && Date.now() < deadline) await setTimeout(100);
  if (!redisTransport.isReady() || !await jobCache.invalidate()) {
    throw new Error("Redis is unavailable; the cache was not cleared.");
  }
  console.log("Job lists, job details, and placement opportunity caches invalidated.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to clear the cache.");
  process.exitCode = 1;
} finally {
  stopRedis();
}
