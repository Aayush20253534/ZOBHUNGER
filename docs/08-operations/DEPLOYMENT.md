# Deployment

## Intended topology

- Next.js frontend deployed as a production web application (current operational setup uses Vercel).
- Express API deployed separately (current operational setup uses Render-style Node hosting).
- managed PostgreSQL database;
- Redis when enabled/required;
- external Resend, Cloudinary, Cashfree and Groq/Gemini services according to feature enablement.

## Backend build

From `server/`:

```bash
npm ci
npm run build
npm run db:deploy
```

The build cleans output, generates Prisma Client, compiles TypeScript, copies chatbot knowledge and runs backend build checks.

## Frontend build

From `client/`:

```bash
npm ci
npm run check:env
npm run lint
npm run build
```

Production must use the real API/site URLs and API data mode.

## Revision alignment

Frontend and backend should be deployed from compatible revisions. Repository production/release scripts compare reported revisions so a newly deployed frontend does not accidentally target an older API missing required routes.

## Database migrations

Apply committed Prisma migrations through `prisma migrate deploy` against production. Never run a destructive development migration command against production.

## Canonical site

The current canonical public origin is `https://zobhungr.com`. Configure the alternate hostname at the hosting/DNS layer and keep frontend/backend origin settings aligned.

## Post-deploy

Run the repository production gate from the root against the live site, then check admin detailed health/metrics with an authorized account. Live provider/inbox/browser verification remains separate evidence from code checks.
