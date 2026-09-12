# ZOBHUNGER

ZOBHUNGER is a workforce, sales and business-execution platform with a public Next.js website and an Express/PostgreSQL API. The repository now includes the public experience plus operational portals for businesses, workers, placement/institution partners and administrators.

## Repository

```text
client/   Next.js frontend: public website + authenticated portals
server/   Express + TypeScript + Prisma/PostgreSQL API
```

## Current capabilities

### Public website

- service, industry, presence, company and brand-experience pages
- database-backed jobs and published articles
- public workforce requirement and contact flows
- career profile submissions with resume upload
- independent business partner applications
- placement-cell/institution partnership applications
- vendor empanelment applications and document upload
- worldwide-client messaging with an India-focused operating footprint
- mobile-app download slots that activate when store URLs are configured

### Business portal

- business authentication and password recovery
- company profile and dashboard
- workforce requirements and reusable requirement drafts
- linked-job workflow and candidate management
- deployment/roster management
- attendance and correction workflow
- attendance approvals
- operational reports and CSV export

### Worker portal

- profile-first worker intake through the public career profile form
- approval-gated worker access, email verification, login and password recovery
- worker profile and resume management
- job discovery and saved jobs
- job applications and withdrawal
- assignment and attendance workflows
- earnings statements and exports

### Placement/institution portal

- institution activation and login
- institution profile
- candidate management
- opportunity discovery
- applications submitted for managed candidates

### Admin/operations

- protected ADMIN routes with MFA support
- enquiries, requirements, jobs and applications
- partner, placement-cell, career and vendor review
- candidate and deployment operations
- attendance management and approvals
- worker application/attendance review
- worker earnings administration
- private employee-joining records, document review and Excel/Google Sheets CSV export
- project-based employee-number generation and offer-letter approval/issuance
- audit-aware operational workflows
- department-scoped requests & intake queue with assignment, internal notes, workflow status and CSV export

### Platform infrastructure

- versioned `/api/v1` Express API
- Prisma/PostgreSQL persistence
- JWT authentication using secure httpOnly cookies for the web client
- Argon2 password hashing
- Redis caching with PostgreSQL fallback
- Resend operational email delivery
- Cloudinary-backed private document storage support
- AES-256-GCM encryption for Aadhaar, PAN, bank-account and UAN fields in the HR joining module
- Helmet, CORS, request IDs, validation and rate limiting
- database-triggered intake capture/backfill for website, workforce, partner, vendor, career, placement, joining and job submissions

## First-time local setup

### Backend

```bash
cd server
npm install
cp .env.example .env
```

Set a real PostgreSQL `DATABASE_URL`, a 32+ character `JWT_SECRET`, and an Argon2id value for `ADMIN_SEED_PASSWORD_HASH`.

For a fresh local database:

```bash
npx prisma generate
npx prisma migrate dev
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

Typical local configuration:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_PLAY_URL=
NEXT_PUBLIC_APP_STORE_URL=
```

Frontend: `http://localhost:3000`

The app-store URLs intentionally remain blank until the corresponding application is published. Supplying a valid URL and rebuilding the frontend activates that store badge automatically.

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

The release gate now runs the production-foundation inventory audit, read-only release checks and Phase 8 deployment-contract tests before server tests/build and client lint/build. Production environment contracts are checked separately with:

```bash
npm --prefix client run check:env
npm --prefix server run check:env
```

See `docs/PHASE3_PART1_PRODUCTION_FOUNDATION.md` for the Part 1 production-readiness contract and `docs/PHASE3_PART8_PRODUCTION_DEPLOYMENT.md` for the canonical-domain/HTTPS go-live procedure.

After Vercel, Render, DNS and SSL are live, run the read-only production gate:

```bash
npm run check:production -- https://zobhungr.com
```

Append a full Git commit SHA to require the frontend and backend to report that exact deployment revision.

Useful focused checks are also available from `server/package.json`, including business, worker, attendance, deployment, candidate, vendor and cache integration suites.

For a running API:

```bash
npm run smoke:server
```

## Mobile application integration

The backend is already separated from the Next.js frontend and can be reused by a future native application. Current browser authentication is carried through secure httpOnly cookies. Native mobile support should add an appropriate Bearer/access-token and refresh-token transport while reusing the existing API/service layer rather than duplicating business logic.

## Documentation

- `server/docs/API.md` - API families, authentication and response conventions
- `server/docs/TESTING.md` - automated and manual verification guidance
- `server/docs/DEPLOYMENT.md` - production deployment and environment notes
- `client/README.md` - frontend configuration and route overview
- `docs/` - feature-specific implementation notes and historical delivery documentation
- `docs/redis-performance.md` - Redis setup, cache invalidation and verification
