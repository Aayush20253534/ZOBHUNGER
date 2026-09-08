import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { after, before, test } from "node:test";
import { createClient } from "redis";
import { RedisJsonCache, type CacheTransport } from "../src/cache/json-cache.js";

// Use a development Redis instance. Each fixture owns a random key prefix and
// deletes only keys that it created; this suite never calls FLUSHDB/FLUSHALL.
const url = process.env.TEST_REDIS_URL;
const client = url ? createClient({
  url,
  disableOfflineQueue: true,
  socket: { connectTimeout: 1_000, reconnectStrategy: false },
}) : undefined;
client?.on("error", () => undefined);
const ownedKeys = new Set<string>();
const integration = { skip: !url };

before(async () => { if (client) await client.connect(); });
after(async () => {
  try {
    if (client?.isReady && ownedKeys.size) {
      await client.del([...ownedKeys]);
    }
  } finally {
    if (client?.isOpen) client.destroy();
  }
});

function fixture(ttlSeconds = 60) {
  const prefix = `zobhunger-cache-test:${randomUUID()}`;
  const keys = new Set<string>();
  let ready = true;
  const transport: CacheTransport = {
    isReady: () => ready && Boolean(client?.isReady),
    async command(args) {
      for (const key of args[0] === "EVAL" ? args.slice(3, 5) : [args[1]]) {
        keys.add(key);
        ownedKeys.add(key);
      }
      return client!.sendCommand(args, { timeout: 1_000 });
    },
  };
  const makeCache = () => new RedisJsonCache(transport, { prefix, namespace: "jobs", ttlSeconds });
  return { cache: makeCache(), makeCache, keys, setReady: (value: boolean) => { ready = value; } };
}

test("Redis hits reuse results and keep filter/resource variants separate", integration, async () => {
  const { cache } = fixture();
  let loads = 0;
  const load = async () => ({ revision: ++loads, publishedAt: new Date("2026-09-01T00:00:00.000Z") });
  const initial = await cache.remember("list", { city: "Delhi", page: 1 }, load);
  assert.equal(initial.publishedAt, "2026-09-01T00:00:00.000Z");
  assert.deepEqual(await cache.remember("list", { page: 1, city: "Delhi" }, load), initial);
  await cache.remember("list", { page: 2, city: "Delhi" }, load);
  await cache.remember("placement-list", { city: "Delhi", page: 1 }, load);
  await cache.remember("detail", "delhi-role", load);
  assert.equal(loads, 4);
});

test("cached values expire after the configured TTL", integration, async () => {
  const { cache } = fixture(1);
  let loads = 0;
  const load = async () => ++loads;
  assert.equal(await cache.remember("list", {}, load), 1);
  assert.equal(await cache.remember("list", {}, load), 1);
  await setTimeout(1_100);
  assert.equal(await cache.remember("list", {}, load), 2);
});

test("job invalidation refreshes public lists, details, and placement lists across instances", integration, async () => {
  const { cache, makeCache } = fixture();
  const anotherServer = makeCache();
  let state = "open";
  const load = async () => state;
  for (const resource of ["list", "detail", "placement-list"]) {
    await cache.remember(resource, {}, load);
  }
  state = "closed";
  assert.equal(await anotherServer.invalidate(), true);
  for (const resource of ["list", "detail", "placement-list"]) {
    assert.equal(await cache.remember(resource, {}, load), "closed");
  }
});

test("a slow old read cannot overwrite data after invalidation on another server", integration, async () => {
  const { cache, makeCache } = fixture();
  let started!: () => void;
  let release!: () => void;
  const startedPromise = new Promise<void>((resolve) => { started = resolve; });
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const oldRequest = cache.remember("list", {}, async () => {
    started();
    await barrier;
    return "old-open-role";
  });
  await startedPromise;
  await makeCache().invalidate();
  assert.equal(await cache.remember("list", {}, async () => "closed"), "closed");
  release();
  await oldRequest;
  assert.equal(await makeCache().remember("list", {}, async () => {
    throw new Error("The fresh cache entry should still be available");
  }), "closed");
});

test("invalidation missed during an outage is retried before reading Redis again", integration, async () => {
  const { cache, setReady } = fixture();
  await cache.remember("list", {}, async () => "old-open-role");
  setReady(false);
  assert.equal(await cache.invalidate(), false);
  assert.equal(await cache.remember("list", {}, async () => "closed"), "closed");
  setReady(true);
  assert.equal(await cache.remember("list", {}, async () => "closed"), "closed");
});

test("evicting a version key never resurrects old cached entries", integration, async () => {
  const { cache, keys } = fixture();
  await cache.remember("list", {}, async () => "old-open-role");
  await client!.del([...keys].filter((key) => key.endsWith(":version")));
  assert.equal(await cache.remember("list", {}, async () => "closed"), "closed");
});

test("malformed Redis values are replaced with database data", integration, async () => {
  const { cache, keys } = fixture();
  await cache.remember("list", {}, async () => ({ total: 1 }));
  const valueKey = [...keys].find((key) => key.includes(":value:"))!;
  await client!.set(valueKey, "{broken-json");
  assert.deepEqual(await cache.remember("list", {}, async () => ({ total: 2 })), { total: 2 });
});

test("404/database failures do not become persistent cache hits", integration, async () => {
  const { cache } = fixture();
  await assert.rejects(cache.remember("detail", "new-role", async () => {
    throw new Error("Job not found");
  }), /Job not found/);
  assert.equal(await cache.remember("detail", "new-role", async () => "published"), "published");
});
