# ZOBHUNGER deployment guide

This guide covers the current public website and platform portals. Frontend and backend should be deployed from the same intended Git revision so the browser does not call routes that an older API build does not contain.

## Recommended backend service settings

For a Render service whose root directory is `server`:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Build Command | `npm ci --include=dev && npm run deploy` |
| Start Command | `npm start` |
| Health Check Path | `/api/v1/health` |

If the service root is the repository root instead, use the corresponding `npm --prefix server ...` commands. Do not combine a `server` root directory with another `--prefix server`.

`npm run deploy` cleans and compiles the server, generates Prisma Client, runs the compiled route/deployment checks, applies committed production migrations and runs the private-file storage migration helper. `npm start` validates the compiled business route surface again before starting `dist/index.js`.

## Production database

Never run `prisma migrate dev` against production. Commit migrations during development and deploy them with `prisma migrate deploy` through the deployment script.

For a manual backend release:

```bash
npm ci --include=dev
npm run deploy
npm start
```

## Required backend environment

At minimum configure values equivalent to:

```env
NODE_ENV=production
PORT=5000
CLIENT_ORIGIN=https://www.example.com
PUBLIC_APP_URL=https://www.example.com
DATABASE_URL=postgresql://...
JWT_SECRET=<long-random-secret>
AUTH_COOKIE_NAME=zobhunger_access
AUTH_COOKIE_MAX_AGE_MS=900000
TRUST_PROXY=true
LOG_LEVEL=info
```

Use `TRUST_PROXY=true` only when Express is actually behind a trusted reverse proxy/load balancer.

### Redis

```env
REDIS_ENABLED=true
REDIS_URL=rediss://...
REDIS_KEY_PREFIX=zobhunger
REDIS_TTL_SECONDS=60
REDIS_COMMAND_TIMEOUT_MS=200
```

Redis is optional for correctness. If it is unavailable, supported cache paths fall back to PostgreSQL.

### Mailjet

```env
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAIL_FROM_EMAIL=verified-sender@example.com
MAIL_FROM_NAME=ZOBHUNGER
SALES_TEAM_EMAIL=sales@example.com
MAILJET_API_HOST=api.mailjet.com
```

The sender/domain must be verified under the same Mailjet account/API credentials.

### Private file storage

Production resume/vendor/private-document storage requires the Cloudinary variables documented in `server/.env.example`.

## Frontend environment

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
NEXT_PUBLIC_SITE_URL=https://www.example.com
NEXT_PUBLIC_GOOGLE_PLAY_URL=
NEXT_PUBLIC_APP_STORE_URL=
```

The backend `CLIENT_ORIGIN` must allow the deployed frontend origin exactly. Authentication uses secure browser cookies, so production traffic must use HTTPS.

Leave each app-store URL blank until that application is published. Add the final Google Play/App Store URL and rebuild the frontend to activate the corresponding footer badge.

## Backend/frontend version mismatch

If the frontend reports a missing portal route while older endpoints still work, first verify that the backend was actually rebuilt from the same Git revision. A successful frontend/Vercel deploy cannot add Express routes to an older backend service.

`404` generally indicates the route is missing from the deployed API revision. `401` or `403` indicates the route exists and authorization/session state should be inspected instead. `500` usually requires the backend log and database/migration state to be checked.

## Pre-release gate

From the repository root:

```bash
npm run verify
```

This must pass before production deployment:

- server test suite
- server production build
- client lint
- client production build

Then validate the running API:

```bash
npm run smoke:server
```

For the business route deployment probe against a deployed website proxy:

```powershell
$env:SMOKE_API_URL="https://www.example.com/api/backend"
npm --prefix server run check:business
Remove-Item Env:SMOKE_API_URL
```

Protected endpoints should normally return authorization responses when called without a session; `404` is the deployment failure signal the route probe is designed to catch.

## Final release checks

Before handing over the production URL, verify:

- `/api/v1/health` is healthy
- the frontend proxy can reach the deployed API
- PostgreSQL migrations are current
- Redis does not continuously log connectivity failures when enabled
- Mailjet sender/domain and operational email delivery are valid
- Cloudinary/private-file configuration is valid when file uploads are enabled
- business, worker, institution and admin login flows operate over HTTPS
- public forms submit successfully without duplicate/dead requests
- no browser console CORS, mixed-content, asset 404 or server 500 errors remain

## Rollback discipline

Application rollback and database rollback are separate concerns. Prisma migrations should be forward-safe and reviewed before deployment. Do not delete or rewrite migration history after it has reached a shared or production database.
