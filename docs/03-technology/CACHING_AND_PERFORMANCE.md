# Caching and Performance

## Redis role

Redis accelerates selected repeat reads and hosts distributed provider-budget counters. PostgreSQL remains the source of truth.

The cache layer uses bounded command timeouts, TTLs, invalidation generations and outage cooldown behavior. Supported business reads fall back to PostgreSQL when Redis is transiently unavailable instead of converting a cache outage into an application outage.

## What must not be publicly cached

Authenticated portal records, HR data, payment records and other private responses use `no-store` behavior. Do not add them to public/shared Redis caches merely to improve benchmark numbers.

## Pagination and bounded work

Large list endpoints must paginate in the database. Existing hardened paths include placement candidates, placement opportunities/applications and technical-institute operations.

Expensive exports/matching use explicit ceilings:

- technical candidate scan limit;
- technical report export maximum rows;
- PF/ESIC compliance export maximum rows.

Compliance count checks happen before loading/decrypting an oversized sensitive export.

## Browser/network performance

The shared client API transport provides ordinary, upload and export timeout classes and supports cancellation. Search/list UIs should cancel stale requests when query/filter state changes.

## Compression

The Express response compression middleware supports Brotli/gzip for eligible responses without introducing a separate compression package dependency.

## Measuring performance

Do not infer production capacity from unit tests. Use the checked-in k6 suite against a production-like environment and track p95/p99 latency, failure rates, Node resource pressure, database connections/slow queries and Redis/provider behavior. See [Performance and load testing](../08-operations/PERFORMANCE_AND_LOAD_TESTING.md).
