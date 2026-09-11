# Phase 3 · Part 1 — Production foundation

This part is the release-safety layer for the existing ZOBHUNGER website and portals. It intentionally does **not** add department RBAC, the blog CMS, WhatsApp or new operational modules; those remain later parts so security and production configuration are stable before more workflows are added.

## Implemented

### 1. Production configuration contracts

- Client build configuration validates data mode, API URL, site URL and optional store URLs.
- Vercel production deployments automatically reject mock mode, localhost endpoints and non-HTTPS public URLs.
- Other hosts can enable the same strict client gate with `ZOBHUNGER_STRICT_PRODUCTION_CONFIG=true`.
- Server startup validates PostgreSQL, frontend origins, canonical public URL, email, private storage and encryption configuration.
- Production startup fails fast instead of silently booting with placeholder security keys or incomplete operational services.
- `CLIENT_ORIGIN` accepts a comma-separated allow-list but every value must be a valid origin.

### 2. Production API hardening

- Disallowed CORS origins now return the stable API error envelope with HTTP 403 instead of falling through as a generic 500.
- `X-Request-Id` and rate-limit response headers are exposed to allowed browser clients for support/debugging.
- Server request/header/keep-alive timeouts are explicit.
- Graceful shutdown has a bounded drain period so a deployment cannot hang indefinitely on stale connections.

### 3. Health and readiness

- `/api/v1/health` remains a cheap API health endpoint and now reports the Phase 3 production-foundation marker plus cache mode.
- `/api/v1/health/ready` is the dependency-aware readiness endpoint.
- `/ready` remains available for host-level compatibility.
- Production readiness checks database connectivity plus required private-storage, email and public-app configuration. Redis remains non-blocking because the application is deliberately designed to fall back to PostgreSQL.

### 4. Mock/demo safety

- Public data mode defaults to API mode in production.
- Explicit mock mode is rejected in a production runtime.
- Strict production build configuration also rejects `NEXT_PUBLIC_DATA_MODE=mock` before deployment.
- The existing design-system preview remains unavailable in production.

### 5. Private-route indexing safety

- The complete `/admin` route family now inherits `noindex, nofollow` metadata and `no-referrer`, rather than relying on individual pages to remember it.
- Existing business, worker, placement and employee-joining privacy metadata remains intact.

### 6. Release gate

`npm run audit:foundation` now verifies the source-level platform inventory and required route/config contracts. At the time this part was implemented the repository contained:

- 121 frontend page routes
- 21 backend route modules
- 19 committed Prisma migrations

`npm run test:release` verifies the read-only deployment checker. `npm run verify` now runs both of these before the existing server tests/build and client lint/build.

The deployed release check now verifies both API health **and readiness** before checking protected route gates and web pages.

## Commands

From the repository root:

```bash
npm run audit:foundation
npm run test:release
npm run verify
```

Environment checks:

```bash
npm --prefix client run check:env
npm --prefix server run check:env
```

After deployment:

```bash
npm run check:release -- https://zobhungr.com <full-git-commit>
```

## Production environment policy

Frontend production:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=https://YOUR_API_HOST/api/v1
NEXT_PUBLIC_SITE_URL=https://zobhungr.com
NEXT_PUBLIC_GOOGLE_PLAY_URL=
NEXT_PUBLIC_APP_STORE_URL=
```

For non-Vercel builds also set:

```env
ZOBHUNGER_STRICT_PRODUCTION_CONFIG=true
```

Backend production must provide real values for the settings documented in `server/.env.example`, including distinct JWT/MFA/HR encryption secrets, production email configuration and private Cloudinary storage.

## Deferred intentionally

The following are not Part 1 changes and remain isolated for the later implementation parts:

- department roles/permissions and admin-user management
- form-to-department routing
- candidate/hiring workflow expansion
- admin-managed blog CMS
- WhatsApp Business integration
- final domain/DNS cutover
- full SEO/Search Console submission

This separation keeps later UI and workflow work on top of a production-safe base instead of retrofitting security and configuration after the fact.
