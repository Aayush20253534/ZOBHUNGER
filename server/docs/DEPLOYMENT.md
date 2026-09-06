# Phase 1 deployment guide

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
