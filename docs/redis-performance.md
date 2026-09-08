# Redis caching and page navigation

This change caches repeated job catalogue reads in the Express backend and removes
unnecessary document reloads from Blog navigation. PostgreSQL remains the source
of truth. Redis is optional: the application continues to work when it is disabled
or unavailable.

## Where caching is used

| Page / feature | Implementation |
| --- | --- |
| `/jobs` and its search/filter/pagination variants | Redis stores the public list and count for each validated filter combination. |
| `/jobs/[slug]` | Redis stores the public job details for each slug. Hovering, focusing, or touching a job card also prefetches that destination. |
| `/placement-portal/opportunities` | Redis stores the common open-job catalogue. Current institution approval is checked in PostgreSQL before every cache lookup. |
| `/blogs` and `/blog/[slug]` | Editorial content stays local, as in the existing site. Blog links use Next.js navigation; the search uses `next/form`. |
| Home, About, Presence, services and other marketing pages | Existing local/static rendering and Next.js link prefetching are retained. A route loading boundary provides feedback while uncached routes load. |
| Login, admin, profiles, candidates, applications and form submissions | These continue using current database reads and writes. Credentials, candidate records and applications are not placed in this shared cache. |

The default Redis TTL is **60 seconds**. There is no persistent in-process data
cache and no added Next.js data cache for jobs. Redis hits avoid the repeated job
query/count work. Other costs, such as API cold starts, distance between regions,
browser rendering and first-time downloads, still affect load time. Already open
or prefetched browser views can show an older snapshot until navigation/refresh;
application submission always checks that the job is still open in PostgreSQL.

## Apply and install

From the project root, after downloading the patch there:

```powershell
git apply --check zobhunger-redis-performance.patch
git apply zobhunger-redis-performance.patch
npm --prefix server ci
```

The patch includes the pinned `redis` dependency and its lockfile. No frontend
dependency or database migration is added.

## Run Redis locally

With Docker running, start the supplied local cache from the project root:

```powershell
docker compose -f compose.redis.yml up -d
```

Add these values to **`server/.env`**:

```dotenv
REDIS_URL=redis://127.0.0.1:6379
REDIS_ENABLED=true
REDIS_KEY_PREFIX=zobhunger
REDIS_TTL_SECONDS=60
REDIS_COMMAND_TIMEOUT_MS=200
```

Restart the API. The startup log reports `redis.ready` when connected. A blank
`REDIS_URL` or `REDIS_ENABLED=false` disables caching. The local Docker service
binds only to localhost and uses an expendable 128 MB cache without persistence.

## Configure a hosted backend

Set `REDIS_URL` in the environment of the **Express backend** to the connection
string supplied by your Redis provider. Both `redis://` and TLS `rediss://` URLs
are supported. Place Redis close to the backend, preferably in the same region.
Do not put Redis credentials in a `NEXT_PUBLIC_*` variable or the frontend.

Set a distinct `REDIS_KEY_PREFIX` when multiple sites share a Redis database.
The application also separates development/test/production keys and uses a `v1`
payload namespace. All backend replicas for one deployment must share the same
Redis database, prefix, environment and TTL configuration.

For live job data, retain `NEXT_PUBLIC_DATA_MODE=api` and the correct
`NEXT_PUBLIC_API_URL` in the frontend environment. Deploy/restart the backend
after installing dependencies, then rebuild/deploy the frontend navigation changes.

## Freshness and failure behavior

- After a committed admin job-status change, one version update invalidates all
  job lists, details and placement catalogue variants across backend instances.
- Atomic Redis scripts prevent a database read started before that update from
  writing an old result back into the current cache. Losing a version key also
  creates a new version rather than reviving old cached data.
- Empty successful lists can be cached. Errors and missing-job responses are not
  cached. Dates have the same JSON representation on cache hits and misses.
- Concurrent identical requests share one database read within each API process.
  This temporary tracking is bounded and removed when the request completes.
- Redis connection work does not block API startup. Commands have a bounded
  timeout, disconnected requests are not queued, and a failure pauses cache
  attempts for five seconds while PostgreSQL handles reads.
- A failed invalidation never rolls back a successful database write. The process
  that performed the write retries invalidation before using Redis again. Other
  replicas may see a previous entry until its TTL expires during an outage.
- Seed scripts or direct database edits bypass the admin invalidation hook. Wait
  for the TTL, or run the following from a configured `server` directory to make
  those changes visible to subsequent cache reads immediately:

```powershell
npm run cache:clear
```

This command only changes this application's job-cache version. It does not flush
the Redis database. Local Redis can be stopped with:

```powershell
docker compose -f compose.redis.yml down
```

## Verify the change

```powershell
npm --prefix server test
npm --prefix server run build
npm --prefix client run lint
npm --prefix client run build
```

Run the additional integration tests against a development Redis instance:

```powershell
$env:TEST_REDIS_URL = "redis://127.0.0.1:6379"
npm --prefix server run test:cache
Remove-Item Env:TEST_REDIS_URL
```

The integration suite skips explicitly when `TEST_REDIS_URL` is absent. It uses
random test prefixes, removes its own keys and never flushes the database. It
covers cache hits, filter separation, expiry, invalidation across instances,
concurrent stale writes, outage recovery, malformed entries and uncached errors.

For a manual performance check, temporarily use `LOG_LEVEL=debug`, request the
same jobs URL twice, and check for `cache.miss` followed by `cache.hit`. Compare
warm requests with Redis enabled/disabled using the same filters and deployment.
For invalidation, close a test role in the admin page and refresh the jobs and
placement opportunity views. A direct application to the closed role must fail.
Check that the Blog footer link and search navigation no longer request a new
HTML document in the browser Network panel. Evaluate Next.js prefetching using a
production build rather than development-mode compilation timings.

References: [Redis Node.js connection guide](https://redis.io/docs/latest/develop/clients/nodejs/connect/),
[Next.js navigation](https://nextjs.org/docs/app/getting-started/linking-and-navigating),
[Next.js Form](https://nextjs.org/docs/app/api-reference/components/form).
