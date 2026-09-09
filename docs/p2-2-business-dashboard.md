# P2.2 — Business dashboard

> Historical delivery notes. The remaining Phase 2 work is now implemented; see
> [Phase 2 completion](PHASE2_COMPLETION.md) for current behavior and setup.

This patch adds a company dashboard and read-only requirement briefs to the P2.1 business workspace. It is based on BZN(3).zip with `zobhunger-business-login-404-fix.patch` already applied. Apply this patch after that fix.

## Pages to check

| Page | What to check |
| --- | --- |
| `/business/login` | Sign in with your existing BUSINESS account. |
| `/business/dashboard` | Summary cards, submission chart, status breakdown, location bars, filtered request list, pagination and company setup progress. |
| `/business/requirements/<id>` | Open any request from the dashboard to see its brief, contact details, locations and recorded status changes. |
| `/business` | Existing entry point redirects to the dashboard. |
| `/hire-workforce` | Submit a requirement while signed in, then return to the dashboard and refresh. |

Use your existing website domain, for example `https://client-nine-wheat.vercel.app/business/dashboard`. No sample requests are inserted into your production database. A new account sees zero totals and an illustrated first-request guide until it submits a requirement.

## What the numbers mean

| Dashboard item | Definition |
| --- | --- |
| Open requirements | All owned requests currently NEW, CONTACTED or QUALIFIED. |
| People requested | Sum of requested headcount in open requirements. This is not a deployed-worker count. |
| New requirements | Requests submitted during the selected 7, 30 or 90 IST calendar days, including today up to the refresh time. Includes all current statuses. |
| Requested locations | Distinct trimmed, case-insensitive location labels in open requirements. |
| Request status | All-time snapshot of current NEW, CONTACTED, QUALIFIED and CLOSED statuses. Select a legend item to filter the list. |
| Request activity | Submission totals in daily, 5-day or 14-day groups depending on the selected period. Empty days contribute zero. The last group can be shorter. |
| Location bars | Up to five locations ranked by the number of distinct open requests mentioning them. One request can mention multiple locations. |

The period selector changes submission activity and its summary card. The open totals, status chart and list cover all time. Status filtering applies to the request list. Lists show six requests per page, newest first, with stable ordering. The refresh timestamp is displayed in IST. Closing a request does not assert that workers were hired or deployed.

## API and access

- `GET /api/v1/business/dashboard?range=30&status=ALL&page=1`
- `GET /api/v1/business/requirements/:id`
- Browser equivalents use the existing `/api/backend/business/...` proxy and httpOnly session cookie.

Both endpoints require an authenticated BUSINESS user. Company ownership comes from the server-side session. Requests explicitly linked to that user's BusinessProfile are included; older submissions explicitly owned by that user with no profile link are also included. Anonymous requests are never claimed through matching email addresses. An explicit association with another company takes precedence over the submitting-user field. Missing and unowned requirement IDs return the same `REQUIREMENT_NOT_FOUND` response.

Private responses use `Cache-Control: no-store`. Aggregate queries use a consistent database snapshot, bounded request pages and a bounded history projection. Internal audit metadata and actor details are not exposed. The dashboard does not use public Redis caching. Aborted or outdated browser requests cannot replace the current account's response; failed requests show a retry state rather than invented zero totals.

The requirement timeline shows the original submission and up to 20 recent recorded status changes. It does not fabricate stages that were skipped. Profile edits do not rewrite the contact details captured with an older requirement.

## Apply and deploy

From the repository root after applying the P2.1 login fix:

```powershell
git apply --check zobhunger-p2-2-business-dashboard.patch
git apply zobhunger-p2-2-business-dashboard.patch
git add client/src/app/business client/src/components/business client/src/services/business.service.ts client/src/types/business-dashboard.types.ts client/src/styles/business-dashboard.css server/src/modules/business server/src/controllers/health.controller.ts server/scripts/business-route-checks.mjs server/scripts/check-business-build.mjs server/tests server/package.json docs/p2-2-business-dashboard.md
git commit -m "feat(business): add company dashboard and requirement briefs"
git push
```

Redeploy the backend and frontend from this commit. Existing environment variables remain sufficient; this patch adds no dependencies or database migrations. Keep the backend build/start setup from the login repair:

- Backend root directory: `server`
- Build: `npm ci --include=dev && npm run deploy`
- Start: `npm start`
- Frontend `NEXT_PUBLIC_API_URL`: the deployed backend's `/api/v1` base URL.

The compiled build/prestart probe now checks the actual dashboard and requirement-detail routes in addition to login, workspace, profile and recovery. Health reports `features.businessDashboard: true`. Check the deployed API with `npm run check:business -- https://YOUR-BACKEND/api/v1` from `server/`. Business guards are attached to individual routes so missing endpoints cannot accidentally satisfy probes with a router-wide 401.

## Validation and review

- Server compilation and compiled-route probe.
- 44 schema, utility and deployment tests, including IST boundaries and strict filter validation.
- 14 test results across the existing business and new dashboard integration suites, run against a temporary PGlite PostgreSQL-compatible database with project migrations applied.
- Database checks cover account isolation, older owned submissions, anonymous matching emails, status/headcount totals, deduplicated locations, empty accounts, paging, administrative updates, limited history fields and invalidated sessions.
- Frontend production build and TypeScript; lint has no errors and retains two pre-existing warnings in BrandMarqueeMotion.
- HTTP checks through the built Next.js proxy exercise business registration, profile setup, a signed-in requirement submission, dashboard/detail reads and protected page shells.

For your own dedicated migrated test database, run `npm test`, `npm run test:business` and `npm run test:dashboard` from `server/`, setting `TEST_DATABASE_URL` only for integration tests. From `client/`, run `npm run lint` and `npm run build`.

Browser visual review was not available in the implementation environment. Review at phone widths (320, 390 and 768px) and desktop widths (1280 and 1440px): the navigation drawer, two-column mobile metric cards, stacked charts, filter controls, empty state, long request titles and detail text. All chart controls support keyboard focus, values have text labels and reduced-motion preferences disable decorative motion. The existing locally optimized coordination illustration is reused with its AI-generated label.

Full requirement editing, candidate tracking, attendance and reports remain for later Phase 2 parts. This dashboard deliberately uses only requirement data currently supported by the application.
