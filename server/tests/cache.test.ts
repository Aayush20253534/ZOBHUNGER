import assert from "node:assert/strict";
import test from "node:test";
import { RedisJsonCache, type CacheTransport } from "../src/cache/json-cache.js";

const disabled: CacheTransport = {
  isReady: () => false,
  command: async () => { throw new Error("Disabled Redis must not receive commands"); },
};
const options = { prefix: "test", namespace: "jobs", ttlSeconds: 60 };

test("disabled Redis preserves JSON output and coalesces simultaneous reads", async () => {
  const cache = new RedisJsonCache(disabled, options);
  let calls = 0;
  let release!: () => void;
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const load = async () => {
    calls += 1;
    await barrier;
    return { count: 0, publishedAt: new Date("2026-09-01T00:00:00.000Z"), items: [] };
  };
  const first = cache.remember("list", { city: "Delhi", page: 1 }, load);
  const second = cache.remember("list", { page: 1, city: "Delhi" }, load);
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.deepEqual(a, b);
  assert.equal(a.publishedAt, "2026-09-01T00:00:00.000Z");
  assert.deepEqual(a.items, []);
  // Coalescing is temporary, not a second long-lived cache.
  await cache.remember("list", { city: "Delhi", page: 1 }, load);
  assert.equal(calls, 2);
});

test("database errors are propagated and are not retained for later requests", async () => {
  const cache = new RedisJsonCache(disabled, options);
  let calls = 0;
  const load = async () => {
    if (++calls === 1) throw new Error("Database unavailable");
    return { items: [] };
  };
  await assert.rejects(cache.remember("list", {}, load), /Database unavailable/);
  assert.deepEqual(await cache.remember("list", {}, load), { items: [] });
  assert.equal(calls, 2);
});

test("failed Redis reads fall back to the database and trigger a cooldown", async () => {
  let clock = 0;
  let commands = 0;
  const cache = new RedisJsonCache({
    isReady: () => true,
    command: async () => { commands += 1; throw new Error("Redis timed out"); },
  }, { ...options, now: () => clock });
  assert.equal(await cache.remember("list", {}, async () => "first"), "first");
  assert.equal(await cache.remember("list", {}, async () => "second"), "second");
  assert.equal(commands, 1);
  clock = 5_001;
  await cache.remember("list", {}, async () => "third");
  assert.equal(commands, 2);
});

test("a Redis write error cannot discard a successful database result", async () => {
  let commands = 0;
  const cache = new RedisJsonCache({
    isReady: () => true,
    command: async () => {
      if (++commands === 1) return ["current-version", null];
      throw new Error("Redis write unavailable");
    },
  }, options);
  assert.deepEqual(await cache.remember("list", {}, async () => ({ total: 12 })), { total: 12 });
  assert.equal(commands, 2);
});
