# ZOBHUNGER deployment guide

This guide covers the current public website and platform portals. Frontend and backend should be deployed from the same intended Git revision so the browser does not call routes that an older API build does not contain.

## Recommended backend service settings

For a Render service whose root directory is `server`:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Build Command | `npm ci --include=dev && npm run deploy` |
| Start Command | `npm start` |
| Health Check Path | `/api/v1/health/ready` |

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

Production startup now validates the complete operational configuration and fails fast when required values are missing or still use example placeholders. Configure values equivalent to:

```env
NODE_ENV=production
PORT=5000
CLIENT_ORIGIN=https://zobhungr.com
PUBLIC_APP_URL=https://zobhungr.com
DATABASE_URL=postgresql://...
JWT_SECRET=<long-random-secret>
MFA_ENCRYPTION_KEY=<different-long-random-secret>
HR_PII_ENCRYPTION_KEY=<different-stable-long-random-secret>
AUTH_COOKIE_NAME=zobhunger_access
AUTH_COOKIE_MAX_AGE_MS=900000
TRUST_PROXY=true
LOG_LEVEL=info
```

Use `TRUST_PROXY=true` only when Express is actually behind a trusted reverse proxy/load balancer. `PUBLIC_APP_URL` must also be present in the comma-separated `CLIENT_ORIGIN` allow-list. Production browser origins and the canonical app URL must use HTTPS.

### Redis

```env
REDIS_ENABLED=true
REDIS_URL=rediss://...
REDIS_KEY_PREFIX=zobhunger
REDIS_TTL_SECONDS=60
REDIS_COMMAND_TIMEOUT_MS=200
```

Redis is optional for correctness. If it is unavailable at runtime, supported cache paths fall back to PostgreSQL. When `REDIS_ENABLED=true` in production, a valid `REDIS_URL` must still be configured so an accidental missing cache configuration is not mistaken for a transient outage.

### Resend

```env
RESEND_API_KEY=re_...
MAIL_FROM_EMAIL=mail@your-verified-domain.com
MAIL_FROM_NAME=ZOBHUNGER
SALES_TEAM_EMAIL=sales@example.com
RESEND_TIMEOUT_MS=15000
```

Create the API key in Resend and verify the `MAIL_FROM_EMAIL` domain before production sending. Keep the API key only in the backend environment. `npm run check:email` sends a provider test message to Resend's safe `delivered@resend.dev` test recipient; it does not test delivery to a real customer inbox.

### Private file storage

Production resume/vendor/private-document storage requires the Cloudinary variables documented in `server/.env.example`; the API now refuses to start in production without them.

## Frontend environment

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api/v1
NEXT_PUBLIC_SITE_URL=https://zobhungr.com
NEXT_PUBLIC_GOOGLE_PLAY_URL=
NEXT_PUBLIC_APP_STORE_URL=
```

The backend `CLIENT_ORIGIN` must allow the deployed frontend origin exactly. Authentication uses secure browser cookies, so production traffic must use HTTPS. Vercel production builds enforce this automatically; on another frontend host set `ZOBHUNGER_STRICT_PRODUCTION_CONFIG=true` in the build environment.

Leave each app-store URL blank until that application is published. Add the final Google Play/App Store URL and rebuild the frontend to activate the corresponding footer badge.

## Backend/frontend version mismatch

If the frontend reports a missing portal route while older endpoints still work, first verify that the backend was actually rebuilt from the same Git revision. A successful frontend/Vercel deploy cannot add Express routes to an older backend service.

`404` generally indicates the route is missing from the deployed API revision. `401` or `403` indicates the route exists and authorization/session state should be inspected instead. `500` usually requires the backend log and database/migration state to be checked.

## Pre-release gate

Validate the resolved backend environment before a production start:

```bash
npm --prefix server run check:env
```

Validate the frontend build environment as well:

```bash
npm --prefix client run check:env
```

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
$env:SMOKE_API_URL="https://zobhungr.com/api/backend"
npm --prefix server run check:business
Remove-Item Env:SMOKE_API_URL
```

Protected endpoints should normally return authorization responses when called without a session; `404` is the deployment failure signal the route probe is designed to catch.

## Phase 8 canonical-domain release gate

After Vercel, Render, DNS and SSL are live, run from the repository root:

```bash
npm run check:production -- https://zobhungr.com
```

Optionally append the full intended Git commit SHA to require both deployed services to report that exact revision. The check also verifies the `www` permanent redirect, HSTS/security headers, private-route cache/index guards and canonical origin alignment. See `docs/PHASE3_PART8_PRODUCTION_DEPLOYMENT.md`.

## Final release checks

Before handing over the production URL, verify:

- `/api/v1/health` is healthy and `/api/v1/health/ready` returns `ready`
- the frontend proxy can reach the deployed API
- PostgreSQL migrations are current
- Redis does not continuously log connectivity failures when enabled
- Resend API key, sender domain and operational email delivery are valid
- Cloudinary/private-file configuration is valid when file uploads are enabled
- business, worker, institution and admin login flows operate over HTTPS
- public forms submit successfully without duplicate/dead requests
- no browser console CORS, mixed-content, asset 404 or server 500 errors remain

## Rollback discipline

Application rollback and database rollback are separate concerns. Prisma migrations should be forward-safe and reviewed before deployment. Do not delete or rewrite migration history after it has reached a shared or production database.

## Employee joining / HR module

Before enabling the private employee-joining link in production:

1. Run `prisma migrate deploy` so the employee joining, document, sequence and offer-letter tables exist.
2. Configure a stable `HR_PII_ENCRYPTION_KEY` of at least 32 characters. Store it only in the backend environment.
3. Keep Cloudinary authenticated private-file storage configured for Aadhaar, PAN, bank and other joining documents.
4. Keep Resend configured before HR uses **Issue & email final offer**.
5. Confirm the admin account has MFA enabled; employee records, exports, documents and offer controls are ADMIN + MFA protected.
6. Share `/employee-joining` directly with employees. Do not add it to public navigation, sitemap, campaigns or search-indexable pages.

The HR export is CSV by design. It opens directly in Excel and imports into Google Sheets while PostgreSQL remains the source of truth, avoiding a second unsynchronised employee database.
