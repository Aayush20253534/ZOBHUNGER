# Phase 3 Part 8 - Production deployment, canonical domain and HTTPS

Phase 8 is the go-live hardening layer for the ZOBHUNGER website and API. It does not replace Vercel/Render domain controls; it makes the repository enforce the assumptions those platforms must satisfy and adds a live production gate that proves the deployed pair is aligned.

## Canonical public origin

The intended canonical public website is:

```text
https://zobhungr.com
```

Configure Vercel with both `zobhungr.com` and `www.zobhungr.com`, with the apex domain as the primary/canonical domain. The Next.js app also contains a host-based permanent redirect so the alternate `www` hostname resolves to the canonical origin even if traffic reaches the application directly.

Do not configure the frontend with different site origins between builds. Canonical metadata, public links, backend recovery links, CORS and the production deployment checker all use the same origin contract.

## Vercel frontend

Recommended project settings:

| Setting | Value |
| --- | --- |
| Root Directory | `client` |
| Framework | Next.js |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Production domain | `zobhungr.com` |
| Alias domain | `www.zobhungr.com` |

Production environment:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api/v1
NEXT_PUBLIC_SITE_URL=https://zobhungr.com
NEXT_PUBLIC_GOOGLE_PLAY_URL=
NEXT_PUBLIC_APP_STORE_URL=
```

Use the API URL actually shown by Render. If the API later receives its own custom HTTPS hostname, replace the Render hostname and rebuild Vercel.

Vercel production builds automatically enable the strict frontend environment gate. Do not add `ZOBHUNGER_STRICT_PRODUCTION_CONFIG=true` on Vercel unless you intentionally want the same strict gate on preview builds as well.

## DNS and SSL

Add the exact DNS records Vercel displays for the apex and `www` custom domains. Do not copy historical A/CNAME values from old tutorials because Vercel can change the recommended record type or target.

A Phase 8 release is not complete until:

- `https://zobhungr.com` presents a valid publicly trusted certificate;
- `https://www.zobhungr.com` presents a valid certificate and permanently redirects to the apex origin;
- plain HTTP is upgraded by the hosting edge to HTTPS;
- the canonical application response carries HSTS;
- no browser mixed-content warnings remain.

The application adds HSTS and `upgrade-insecure-requests` in production. Vercel still owns certificate issuance/renewal and the edge-level HTTP-to-HTTPS upgrade.

## Render backend

Recommended service settings when Render root directory is `server`:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root Directory | `server` |
| Build Command | `npm ci --include=dev && npm run deploy` |
| Start Command | `npm start` |
| Health Check Path | `/api/v1/health/ready` |
| Auto deploy | Same production branch/revision as Vercel |

Canonical production origin settings must be:

```env
NODE_ENV=production
CLIENT_ORIGIN=https://zobhungr.com
PUBLIC_APP_URL=https://zobhungr.com
TRUST_PROXY=true
```

`PUBLIC_APP_URL` must appear in `CLIENT_ORIGIN`. Do not use `https://www.zobhungr.com` for one and the apex domain for the other. The alternate hostname is a redirect target, not a second application identity.

Keep the remaining production secrets/configuration from `server/.env.example` configured in Render, including PostgreSQL, Redis when enabled, encryption secrets, Resend and Cloudinary.

## Browser/API architecture

The browser calls:

```text
https://zobhungr.com/api/backend/*
```

Next.js rewrites that same-origin request to the configured Express `/api/v1` backend. This keeps secure httpOnly authentication cookies first-party on the canonical website even though Express is hosted separately.

Phase 8 also marks browser API proxy responses as `no-store` and adds no-cache/no-index response headers to private admin/business/worker/placement/employee routes.

## Deployment order

Use this order for a production release:

1. Push one verified Git revision.
2. Deploy the Render backend from that revision.
3. Let `npm run deploy` apply committed Prisma migrations and build the API.
4. Wait for `/api/v1/health/ready` to report `ready`.
5. Deploy Vercel from the same revision.
6. Confirm `NEXT_PUBLIC_SITE_URL=https://zobhungr.com` and the Render API URL are present in the Vercel production environment.
7. Attach/verify `zobhungr.com` and `www.zobhungr.com` in Vercel.
8. Apply the Vercel-provided DNS records at the registrar/DNS provider.
9. Wait for certificate issuance and DNS propagation.
10. Run the live Phase 8 checker.

Do not deploy the frontend first when it depends on backend routes/migrations that are not live yet.

## Repository release gates

Before deployment:

```bash
npm --prefix server run check:env
npm --prefix client run check:env
npm run verify
```

After both deployments and DNS/SSL are active:

```bash
npm run check:production -- https://zobhungr.com
```

To also prove that the deployed frontend and backend are the exact Git commit you intended:

```bash
npm run check:production -- https://zobhungr.com FULL_GIT_COMMIT_SHA
```

The production checker is read-only. It verifies:

- canonical HTTPS availability;
- HSTS and browser security headers;
- private-route no-cache/no-index headers;
- the `www` permanent redirect;
- frontend and backend production markers;
- frontend/backend canonical-origin alignment;
- API readiness through the first-party proxy;
- protected API routes still reject unauthenticated access;
- the public and portal route inventory still renders;
- optional revision equality when a full commit SHA is supplied.

A successful result is written to:

```text
.release-artifacts/production-deployment-check.json
```

## Rollback

Frontend and backend code can be rolled back to a known compatible commit, but production Prisma migration history must not be rewritten. If a schema problem needs correction after a migration reached production, ship a forward migration.

If the frontend is rolled back, ensure that rollback does not expect API/database fields removed by later code. Database rollbacks and application rollbacks are separate operational decisions.

## Phase 8 completion criteria

Part 8 is complete when all of the following are true:

- canonical domain loads over trusted HTTPS;
- `www` permanently redirects to the canonical apex domain;
- Vercel and Render run the intended compatible revision;
- browser API calls work through `/api/backend` with no CORS or mixed-content errors;
- `/api/v1/health/ready` is ready;
- production environment checks pass;
- private portals are not cached or indexed;
- `npm run check:production -- https://zobhungr.com` passes.
