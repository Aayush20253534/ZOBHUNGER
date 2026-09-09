# ZOBHUNGER

Business portal completion: [setup, page endpoints and client walkthrough](docs/PHASE2_COMPLETION.md).

Phase 1 of ZOBHUNGER is a public workforce, sales hiring and business-execution website backed by a real Express/PostgreSQL API.

## Repository

```text
client/   Next.js 16 frontend
server/   Express + TypeScript + Prisma/PostgreSQL backend
```

## Phase 1 capabilities

- public marketing and solution pages
- database-backed jobs and job details
- worker job applications
- workforce-requirement submissions
- contact enquiries
- database-backed blogs/articles
- JWT authentication in httpOnly cookies
- ADMIN/BUSINESS/WORKER roles
- Phase 1 admin operations dashboard and protected admin APIs
- audit logs for admin status changes
- Mailjet operational notifications
- structured request/error logging, request IDs and rate limiting

Business and worker operational workspaces remain later-phase features; Phase 1 provides the authentication foundation but does not fabricate those dashboards.

## First-time local setup

### Backend

```bash
cd server
npm install
cp .env.example .env
```

Set a real PostgreSQL `DATABASE_URL`, a 32+ character `JWT_SECRET`, and an Argon2id value for `ADMIN_SEED_PASSWORD_HASH`.

If this database has never been migrated:

```bash
npx prisma generate
npx prisma migrate dev --name init_phase1
npm run db:seed
npm run dev
```

Backend: `http://localhost:5000`
Health: `http://localhost:5000/api/v1/health`

### Frontend

```bash
cd client
npm install
cp .env.example .env.local
npm run dev
```

Use:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Frontend: `http://localhost:3000`

## Admin seed password

`ADMIN_SEED_PASSWORD_HASH` contains an Argon2id hash, not the password itself. Example development command:

```bash
node -e "require('argon2').hash('CHANGE-ME',{type:require('argon2').argon2id}).then(console.log)"
```

Copy the complete `$argon2id$...` output into the server `.env`. Login uses the original plain password.

## Verification

From the repository root after dependencies are installed:

```bash
npm run verify
```

This runs server tests, the server build, client lint and the client production build.

For a running API:

```bash
npm run smoke:server
```

## Documentation

- `server/docs/API.md` - endpoint and response contract reference
- `server/docs/TESTING.md` - automated tests and Phase 1 QA checklist
- `server/docs/DEPLOYMENT.md` - production database/environment/deployment notes
- `client/README.md` - frontend configuration
## Redis performance setup

Optional job catalogue caching and navigation improvements are documented in
[docs/redis-performance.md](docs/redis-performance.md), including local Docker,
hosted Redis configuration, cache invalidation and verification commands.
