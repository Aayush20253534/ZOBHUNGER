# P2.3 — Business requirement management

> Historical delivery notes. The remaining Phase 2 work is now implemented; see
> [Phase 2 completion](PHASE2_COMPLETION.md) for current behavior and setup.

Apply this patch after P2.2 (`zobhunger-p2-2-business-dashboard.patch`). The baseline is BZN(3).zip with the business login repair and P2.2 already applied.

## Pages to check

Use your website domain, for example `https://client-nine-wheat.vercel.app`, and sign in with a BUSINESS account.

| Page | What changed |
| --- | --- |
| `/business/requirements` | New requirement workspace: service cards, requested headcount, locations, status filters, search, sorting and nine requests per page. |
| `/business/requirements/new` | Three-step form with service icons, company/contact prefill, multiple locations, optional start date, review and a compact illustrated preview. |
| `/business/requirements/<id>` | Existing brief now includes Edit and Withdraw actions, changed-field history and the withdrawal reason. |
| `/business/requirements/<id>/edit` | Edit an open request using the same form. Closed requests show a read-only message. |
| `/business/dashboard` | New-request buttons open the portal form; Manage all requirements opens the new workspace. |

Open any requirement card to get its real ID. The sidebar and phone navigation drawer now include Requirements. New accounts show a first-request state; this patch does not insert sample production records.

## Workflow

1. **The team:** select a service (or describe another), requested headcount, duration and industry.
2. **The assignment:** add up to 50 locations, an optional start date and the work brief.
3. **Review & submit:** confirm company and contact details, review the assignment and submit. The receipt links to the saved brief.

The form retains entries between steps and after a failed save while it stays open. Company details are prefilled from the current profile; editing them in a requirement does not change that profile. Cancel asks before discarding unsaved edits; browser refresh/close prompts when changes are unsaved. Drafts are not persisted, and navigating elsewhere in the portal can discard unsaved entries.

Saving actual changes to an open request returns it to NEW for operational review. A save with no changes keeps its current status and revision. The server checks a revision number before updating; an administrative status change also increments it. A stale edit or withdrawal returns 409 with a link/action to reload the latest brief rather than silently overwriting it.

Withdrawal requires a short reason. It changes the request to CLOSED, removes its people count from open dashboard totals and retains the brief and history. Closed requests cannot be edited or withdrawn again by the business account. There is no delete operation.

The timeline includes the original submission and up to 20 recent recorded edits/status changes. It labels actual changed fields and business withdrawals, without exposing internal audit notes or actor details.

## API

| Method | Backend endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/business/requirements?query=Delhi&status=ALL&sort=newest&page=1` | Search and page the current company's requirements. |
| POST | `/api/v1/business/requirements` | Submit a requirement with a UUID `requestKey`. |
| GET | `/api/v1/business/requirements/:id` | Read the owned brief, revision and activity. |
| PUT | `/api/v1/business/requirements/:id` | Replace the editable brief fields with the current `revision`. |
| POST | `/api/v1/business/requirements/:id/withdraw` | Withdraw with `{ "revision": 0, "reason": "Project postponed" }`. |

The website uses `/api/backend/business/...` through the existing proxy and httpOnly session cookie. Writes require `X-Requested-With: XMLHttpRequest`; the client service sends it automatically. Every route requires an authenticated BUSINESS account, validates its inputs and uses `Cache-Control: no-store`. These private records do not enter the public Redis cache.

Ownership comes from the authenticated account and its explicit company association. Earlier signed-in requests without a company link remain accessible to their submitting user. Anonymous requests are never claimed through a matching email. Explicit company ownership takes precedence over the submitter. Missing and foreign IDs return the same 404 response.

Search covers reference ID, service, company and every recorded location, including secondary locations. Search is case-insensitive; `%` and `_` are treated literally. Status counts cover all owned requests; search narrows the list only. Sorting is stable for requests with identical timestamps, and out-of-range pages are clamped.

Creation uses a database-enforced submission key scoped to the account. Repeating the same key and normalized brief returns the existing receipt (200), while the first submission returns 201. Simultaneous retries create one record and one creation audit; only the successful insertion triggers the existing operational notification. Reusing the key with a different brief returns 409. Notification delivery continues to use the existing configuration and best-effort behavior.

## Apply and deploy

From the repository root, with the P2.2 changes already applied:

```powershell
git apply --check zobhunger-p2-3-requirement-management.patch
git apply zobhunger-p2-3-requirement-management.patch
git add client/src server/src server/prisma server/scripts server/tests server/package.json docs/p2-3-requirement-management.md
git commit -m "feat(business): add requirement management workflows"
git push
```

**This part includes a database migration.** It adds `revision`, `submissionKey` and `submissionHash`, plus the submission-key unique index. Existing records receive revision zero and null submission keys; their briefs and statuses are preserved.

Deploy the backend with the migration before using the new frontend workflow. Keep the existing backend settings:

- Root directory: `server`
- Build command: `npm ci --include=dev && npm run deploy`
- Start command: `npm start`

`npm run deploy` generates Prisma, builds the server and runs `prisma migrate deploy`. Redeploy the frontend from the same commit. No new environment variables or runtime dependencies are required; keep the existing database, session, proxy and optional notification settings. No database reset is needed.

The build/prestart route probe now checks list/create/edit/withdraw endpoints as well as the earlier business routes. Health includes `features.businessRequirements: true`. To check the deployed backend from `server/`, run:

```powershell
npm run check:business -- https://YOUR-BACKEND/api/v1
```

## Validation and review

- Server build and compiled-route probe pass.
- All 52 unit, schema and deployment checks pass.
- All 26 results across the business access, dashboard and requirement integration suites pass, including ownership, duplicate submissions, conflicting edits, withdrawal, audit filtering, search and session revocation.
- The additive migration was applied over an existing requirement and verified to preserve its brief and safe defaults.
- Database verification used a temporary PGlite PostgreSQL-compatible database with the project migrations. Its socket adapter required a test-only single-connection pool and sequential suites; concurrent HTTP requests were exercised, but this is not a native PostgreSQL concurrency/load test. Production connection settings are unchanged.
- Frontend production build and TypeScript pass. Lint has no errors and retains two existing warnings in `BrandMarqueeMotion.tsx`.
- HTTP checks through the built Next.js proxy pass for registration, profile setup, create/retry, search, edit, stale-revision rejection, withdrawal and dashboard totals. New protected page routes return their noindex workspace shells; public layouts still load.
- The actual client schema and service functions were also checked for normalization, invalid values, internal return URLs, write methods, private cache/cookie settings and proxy headers.

For a dedicated, migrated PostgreSQL test database, set `TEST_DATABASE_URL`, then run `npm run test:business`, `npm run test:dashboard` and `npm run test:requirements` from `server/`. These suites create and clean up their own fixtures. Use the project's Node 22 runtime when deploying; local verification used Node 24.

Browser visual review was unavailable in the implementation environment. Check the actual form, keyboard flow, withdrawal dialog and phone navigation at 320/390/768px and desktop widths of 1280/1440px. The new CSS stacks cards and form fields on phones, wraps filters, sizes touch controls, keeps the preview compact and respects reduced-motion preferences. The existing optimized AI-generated workforce illustration is reused with its label.

Candidate tracking, attendance and reports remain for the next Phase 2 parts.
