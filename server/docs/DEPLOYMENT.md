# Phase 1 deployment guide

## Business login/workspace 404 repair

The P2.1 source mounts `GET /api/v1/business/workspace` and
`POST /api/v1/auth/business-login`. If the API logs `ROUTE_NOT_FOUND` for these
paths while `/auth/register` succeeds, the deployed API does not contain the new
route tree. Registration already existed before P2.1, so successful registration
does not prove the business portal backend has been deployed. The frontend proxy
is forwarding the request if that exact path appears in the API logs.

Rebuild and deploy the **backend** from the same Git commit as the frontend.
Rebuilding only the Vercel frontend cannot add routes to Express. Check that the
API service tracks the intended repository and branch. A failed backend deploy
can leave the older service running; review its latest build log.

For an existing Render API service, use these settings:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Build Command | `npm ci --include=dev && npm run deploy` |
| Start Command | `npm start` |
| Health Check Path | `/api/v1/health` |

These commands run relative to `server`. If keeping the repository root as the
service root, use `npm --prefix server ci --include=dev && npm --prefix server run deploy`
for the build and `npm --prefix server start` for startup. Choose one layout;
do not use the `--prefix server` commands inside an already selected `server`
root directory. The build needs TypeScript and Prisma, so include development
dependencies during installation.

After pushing this patch, manually deploy the latest commit on the API service.
Make sure its auto-deploy filters include changes under `server/`.
[Render monorepo settings](https://render.com/docs/monorepo-support) explain root
directories and build filters; [Render's Express guide](https://render.com/docs/deploy-node-express-app)
describes build/start commands and what happens after a failed build.

`npm run deploy` now cleans and compiles the server, checks the compiled business
routes, and applies committed database migrations. `npm start` repeats the route
check before launching `dist/index.js`. The check imports compiled code and sends
unauthenticated GET requests plus empty POST bodies to a temporary loopback
server. It never creates accounts, sends emails or connects to the real database.
A failed compilation cannot silently reuse an old `dist` directory. The route
check catches missing mounts as well as accidentally unprotected endpoints.

Keep the existing PostgreSQL, JWT, Redis and mail environment values. For this
website, the API settings should include:

```dotenv
CLIENT_ORIGIN=https://client-nine-wheat.vercel.app
PUBLIC_APP_URL=https://client-nine-wheat.vercel.app
NODE_ENV=production
```

On Vercel, `NEXT_PUBLIC_API_URL` must point to that deployed API service and end
in `/api/v1`. Rebuild the frontend after changing the value; the Next rewrite
uses it at build time. Apply and redeploy the frontend changes in this patch too.
Missing routes now show a useful unavailable message; background focus/timer
checks pause until the user selects Try again. Authentication and company
ownership checks remain on the server.

### Verify the deployed service

Open `/api/v1/health` on the API service, or `/api/backend/health` on the website.
The JSON response must include `data.features.businessPortal: true`.
Health responses are not cached. To test all business routes through the deployed
website proxy from PowerShell at the repository root:

```powershell
$env:SMOKE_API_URL="https://client-nine-wheat.vercel.app/api/backend"
npm --prefix server run check:business
Remove-Item Env:SMOKE_API_URL
```

This checks the actual GET/POST route methods without submitting credentials or
valid form data. Protected workspace/profile endpoints should return `401`, and
empty login/recovery requests should return `400`; `404` means the route is still
missing. A `500` after deployment needs its server error log inspected and is a
different issue, such as an unapplied migration. Sign in at `/business/login`
using the account already created; do not register it again.

## Backend requirements

- Node.js 22+ recommended
- PostgreSQL
- production environment variables from `.env.example`
- writable network access to PostgreSQL and, when enabled, Mailjet

## Production database

Never run `prisma migrate dev` against production. After migrations have been committed, deploy them with:

```bash
npm ci
npm run db:generate
npm run db:deploy
npm run build
npm start
```

The process must fail if required environment configuration is missing. This is intentional.

## Required backend environment

At minimum configure:

```env
NODE_ENV=production
PORT=5000
CLIENT_ORIGIN=https://www.example.com
DATABASE_URL=postgresql://...
JWT_SECRET=<long-random-secret>
AUTH_COOKIE_NAME=zobhunger_access
AUTH_COOKIE_MAX_AGE_MS=900000
TRUST_PROXY=true
LOG_LEVEL=info
```

Use `TRUST_PROXY=true` only when the app is actually behind a trusted reverse proxy/load balancer.

For email notifications also configure:

```env
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAIL_FROM_EMAIL=verified-sender@example.com
MAIL_FROM_NAME=ZOBHUNGER
SALES_TEAM_EMAIL=sales@example.com
```

## Frontend environment

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

The backend `CLIENT_ORIGIN` must exactly allow the deployed frontend origin. Auth requests use cookies, so HTTPS is required in production for the secure cookie behavior.

## Admin account

Generate an Argon2id hash locally, place only the hash in `ADMIN_SEED_PASSWORD_HASH`, then run the seed in the intended environment. Do not commit the plain password or production `.env`.

## Pre-release gate

Before deployment:

```bash
npm run verify
```

Then against the running backend:

```bash
npm run smoke:server
```

Also execute the manual browser checklist in `server/docs/TESTING.md`.

## Rollback discipline

Application rollback and database rollback are separate concerns. Prisma migrations should be forward-safe and reviewed before deployment. Do not delete migration history after it has reached a shared or production database.
