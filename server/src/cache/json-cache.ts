import { createHash, randomUUID } from "node:crypto";

export type JsonSerialized<T> = T extends Date
  ? string
  : T extends readonly (infer Item)[]
    ? JsonSerialized<Item>[]
    : T extends object
      ? { [Key in keyof T]: JsonSerialized<T[Key]> }
      : T;

export interface CacheTransport {
  isReady(): boolean;
  command(args: string[]): Promise<unknown>;
}

type CacheEvent = "hit" | "miss" | "bypass" | "invalidated" | "unavailable";

interface CacheOptions {
  prefix: string;
  namespace: string;
  ttlSeconds: number;
  cooldownMs?: number;
  now?: () => number;
  onEvent?: (event: CacheEvent) => void;
}

// Both keys share a Redis hash tag. A missing/evicted version gets a fresh UUID,
// so removing the version key can never revive entries from an older generation.
const READ = `
local version = redis.call('GET', KEYS[1])
if not version then
  version = ARGV[1]
  redis.call('SET', KEYS[1], version)
end
return {version, redis.call('GET', KEYS[2])}
`;

// An old database read must not refill the cache after a job was closed/updated.
const WRITE_IF_CURRENT = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3])
return 1
`;

function jsonValue<T>(value: T): JsonSerialized<T> {
  return JSON.parse(JSON.stringify(value)) as JsonSerialized<T>;
}

/** Only use this cache for explicitly selected, JSON-serializable read models. */
export class RedisJsonCache {
  private readonly root: string;
  private readonly versionKey: string;
  private readonly now: () => number;
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private localGeneration = 0;
  private pendingInvalidation = false;
  private cooldownUntil = 0;

  constructor(
    private readonly transport: CacheTransport,
    private readonly options: CacheOptions,
  ) {
    this.root = `${options.prefix}:{${options.namespace}}`;
    this.versionKey = `${this.root}:version`;
    this.now = options.now ?? Date.now;
  }

  private unavailable(): void {
    this.cooldownUntil = this.now() + (this.options.cooldownMs ?? 5_000);
    this.options.onEvent?.("unavailable");
  }

  private async flushInvalidation(): Promise<void> {
    const generation = this.localGeneration;
    // Use a new token on every attempt, including retries after a timeout.
    const result = await this.transport.command([
      "SET", this.versionKey, randomUUID(),
    ]);
    if (result !== "OK") throw new Error("Redis invalidation failed");
    if (generation === this.localGeneration) this.pendingInvalidation = false;
  }

  /** Invalidate all filter variants and details, without scanning Redis keys. */
  async invalidate(): Promise<boolean> {
    this.localGeneration += 1;
    this.pendingInvalidation = true;
    // Requests started after a write cannot join an older in-flight read.
    this.inFlight.clear();
    if (!this.transport.isReady()) return false;
    try {
      await this.flushInvalidation();
      this.options.onEvent?.("invalidated");
      return true;
    } catch {
      this.unavailable();
      return false;
    }
  }

  async remember<T>(
    resource: string,
    parameters: object | string,
    load: () => Promise<T>,
  ): Promise<JsonSerialized<T>> {
    // These inputs are validated, flat query objects or a slug. Sorting avoids
    // different keys for the same filters supplied in a different order.
    const parametersKey = typeof parameters === "string"
      ? parameters
      : Object.entries(parameters)
          .filter(([, value]) => value !== undefined)
          .sort(([a], [b]) => a.localeCompare(b));
    const digest = createHash("sha256")
      .update(JSON.stringify([resource, parametersKey]))
      .digest("hex");
    const valueKey = `${this.root}:value:${digest}`;
    const generation = this.localGeneration;
    let version: string | undefined;

    if (this.transport.isReady() && this.now() >= this.cooldownUntil) {
      try {
        if (this.pendingInvalidation) await this.flushInvalidation();
        const result = await this.transport.command([
          "EVAL", READ, "2", this.versionKey, valueKey, randomUUID(),
        ]);
        if (!Array.isArray(result) || typeof result[0] !== "string") {
          throw new Error("Invalid Redis cache response");
        }
        version = result[0];
        if (typeof result[1] === "string") {
          try {
            const entry: unknown = JSON.parse(result[1]);
            if (entry && typeof entry === "object" &&
                "version" in entry && entry.version === version &&
                "value" in entry && generation === this.localGeneration) {
              this.options.onEvent?.("hit");
              return entry.value as JsonSerialized<T>;
            }
          } catch {
            // A malformed entry is a miss and will be replaced by a valid value.
          }
        }
      } catch {
        version = undefined;
        this.unavailable();
      }
    }

    this.options.onEvent?.(version ? "miss" : "bypass");
    const flightKey = `${digest}:${version ?? "database"}:${generation}`;
    const existing = this.inFlight.get(flightKey);
    if (existing) return existing as Promise<JsonSerialized<T>>;

    const pending = (async () => {
      // Errors (including 404s) are never cached. Normalize Dates on both paths
      // to keep the HTTP payload identical on a miss, hit, or Redis outage.
      const value = jsonValue(await load());
      if (version && generation === this.localGeneration &&
          !this.pendingInvalidation && this.transport.isReady() &&
          this.now() >= this.cooldownUntil) {
        const payload = JSON.stringify({ version, value });
        // Bound individual cached values; oversized results still reach clients.
        if (Buffer.byteLength(payload) <= 512 * 1_024) {
          try {
            await this.transport.command([
              "EVAL", WRITE_IF_CURRENT, "2", this.versionKey, valueKey,
              version, payload, String(this.options.ttlSeconds),
            ]);
          } catch {
            this.unavailable();
          }
        }
      }
      return value;
    })();

    // Share concurrent reads in this process without retaining a second cache.
    if (this.inFlight.size < 512) this.inFlight.set(flightKey, pending);
    try {
      return await pending;
    } finally {
      if (this.inFlight.get(flightKey) === pending) this.inFlight.delete(flightKey);
    }
  }
}
