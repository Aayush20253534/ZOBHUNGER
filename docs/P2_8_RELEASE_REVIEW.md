# P2.8 — Business portal release review

This patch completes the code changes and repeatable automated checks for P2.8.
It does **not** mark production, live email or real-device review as passed.
Apply it after the vendor empanelment and verification/branding highlight patches.
It contains no new database migration and does not implement Phase 3.

## What changed

- A temporary network error, server outage or rate limit during a workspace
  refresh preserves the mounted form and its unfinished input. A compact notice
  explains that the workspace is showing its last loaded data and offers Retry.
  It wraps on mobile and keeps a 44px minimum button height.
- Expired sessions, revoked access and required password changes still clear the
  private workspace. Missing backend routes stop automatic repeat requests until
  the user retries. Signing into another business account from another tab starts
  fresh forms; late refresh responses cannot reopen a signed-out workspace.
- `npm run verify:phase2` runs the complete code gate, including dedicated-database
  migrations, schema drift, all ten business/operations/partner/vendor integration
  suites, mocked email contracts, session regressions, lint and both builds.
  It stops on failure and records unrun stages explicitly.
- GitHub Actions runs the same command on Node 22 with a fresh PostgreSQL 16
  service for pull requests and pushes to `main`. It uploads the JSON result;
  it does not deploy, use a production database or send email.
- `npm run check:release -- <frontend-origin> [commit]` checks the frontend pages
  and its actual `/api/backend` proxy using credential-free GET requests. It
  rejects wrong HTTP responses, missing feature markers, missing noindex metadata,
  redirects and incompatible deployment revisions. It never submits forms.
- `GET /api/release` identifies the frontend build. `GET /api/v1/health` now also
  reports the backend revision when available. Health remains a liveness endpoint,
  not proof that the database is reachable or migrated.

## Verification recorded for this patch

| Check | Result and scope |
| --- | --- |
| Server tests and release-check regressions | 203 passing Node test results |
| Client session tests | 10 passing React/jsdom tests |
| Builds and lint | Server build/route mounting, client production build/TypeScript and ESLint passed |
| Database migrations and schema drift | Passed on a fresh PGlite 0.5.8 database, with Node 22.23.2 |
| Integration suites | Business access, dashboard, requirements, candidates, deployments, attendance, Phase 2 workflow, recovery, partner/HR and vendors passed on PGlite |
| Local frontend/API checks | 35 read-only checks passed against the production Next build and local Express API; unauthenticated requests only |
| Patch compatibility | Checked against the restored latest source plus all delivered patches through the verification/branding highlight |
| Native PostgreSQL CI | Workflow included; execution and results must be checked after pushing |
| Live deployment and revision match | Not verified here; hosted site access was blocked and no hosted commit match is claimed |
| Real-device, keyboard and print layout | Not signed off; the browser blocked the local review URL |
| Live email delivery | Not verified; integration tests use mocked delivery |

PGlite is useful compatibility coverage but uses a single PostgreSQL connection
with multiplexing. It does not certify native PostgreSQL concurrency or hosted
performance. The full 19-stage code gate passed locally on Node 22.23.2, matching
the project's Node 22 target. Do not treat this table as a production acceptance certificate.

## Run the code gate

Use the current Node 22 release (22.22.2 or newer within 22.x for the test tools).
From PowerShell at the repository root:

```powershell
npm --prefix server ci
npm --prefix client ci
$env:TEST_DATABASE_URL = "postgresql://TEST_USER:TEST_PASSWORD@localhost:5432/zobhunger_phase2_test"
npm run verify:phase2
```

Replace the placeholder with a **dedicated test database**. The command applies
migrations and creates/deletes fixtures, including an export-limit fixture with
10,001 rows. It never falls back to your production `DATABASE_URL`, never resets
a database, and explicitly disables real mail settings in its subprocesses.
The JSON evidence is `.release-artifacts/phase2-code-checks.json`.

The client build in this gate points to a local test API. Your normal deployment
must rebuild the client with the real `NEXT_PUBLIC_API_URL`, then deploy both
applications from the same commit. Do not publish the test build output.

## Check the deployment

Vercel's `VERCEL_GIT_COMMIT_SHA` is captured at frontend build time. Render's
`RENDER_GIT_COMMIT` identifies the backend at runtime. On another host, set
`RELEASE_SHA` to the full commit hash before building the client and starting
the backend. Only valid commit hashes are exposed; no environment secrets are
returned. `GITHUB_SHA` is also supported for CI builds.

After both services have deployed the commit being checked:

```powershell
$releaseCommit = git rev-parse HEAD
npm run check:release -- https://YOUR_FRONTEND_DOMAIN $releaseCommit
```

Without the commit argument, checks still verify routing and compare revisions
when both are present. A missing revision is recorded as `not_verified`.
Supply the commit argument to require both services to report that exact commit.
The output is `.release-artifacts/deployment-check.json`. Request durations are
diagnostics, not a production load test or a performance service-level guarantee.

If the check returns an API 404, verify the backend deployment and the frontend's
build-time API URL. If it reports a revision mismatch, deploy the intended commit
to both services. Do not disable the authentication checks to make the gate pass.

## Pages and endpoints to inspect

| Address | What to check |
| --- | --- |
| `/business/login` | Approved partner access using the existing credentials flow |
| `/business/change-password` | Temporary passwords require a change before portal access |
| `/business/dashboard` | Summaries link to requirements, team, approvals and reports |
| `/business/requirements/new` | Start a brief, briefly interrupt the connection, then return to the tab; input remains available with the reconnect notice |
| `/business/requirements/drafts` | Save and resume a private brief before submission |
| `/business/candidates` and `/business/deployments` | Candidate decisions connect to the actual team roster |
| `/business/attendance` and `/business/attendance-approvals` | Corrections, approval decisions and history remain consistent |
| `/business/reports` | Filters, CSV export and print use the same owned records |
| `/business/company` and `/business/account` | Profile persistence and account/session controls |
| `/business/vendors` | Vendor application and onboarding entry point |
| `/admin/partners` and `/admin/vendors` | Admin-only review, decisions and vendor records |
| `/api/release` | New frontend revision endpoint (JSON) |
| `/api/backend/health` | Backend health reached through the frontend proxy |

The visible P2.8 change is the reconnect notice across portal pages. There is no
new dashboard redesign in this release patch.

## External acceptance still required

Record the reviewer, date and result before calling Phase 2 production-ready:

1. **Native database and deployment:** pass the new PostgreSQL CI workflow,
   apply any previously outstanding migrations, and run the deployed revision
   check against the same frontend/backend commit. Exercise one approved partner
   through requirement, candidate selection, deployment, attendance and reporting.
2. **Real devices:** review the drawer, focus order, labels, filters, long company
   names and tables at 320/390/768px and on an actual Android and iPhone browser.
   Verify keyboard navigation, visible focus and Escape/close behaviour. Check the
   reconnect notice and confirm a session expiry still requires sign-in.
3. **Reports:** print a filtered report using print preview, verify page breaks and
   column legibility, then compare its totals with the full CSV and screen report.
4. **Hosted performance:** review large real-world lists/reports and API timings on
   the hosted database. The automated tests cover pagination and export limits;
   they do not provide a production load or capacity signoff.
5. **Email:** confirm the previously reported Mailjet suspension is resolved and
   the sender is verified. Run `npm --prefix server run check:email` in the backend
   environment. Then use an account you control to verify actual recovery delivery
   and the single-use reset link. A readiness check alone does not prove delivery.

## Phase 3 — agreed implementation order

| Part | Functionality | Visual direction |
| --- | --- | --- |
| P3.1 | Worker registration, verification, login, recovery and return-to-job routing | Clear account steps and a compact mobile access layout |
| P3.2 | Profile, onboarding, education/experience, skills, preferences and CV | Profile card, completion progress and an actionable checklist |
| P3.3 | Search, location/category/engagement filters, saved jobs and details | Readable job cards, filter chips and save controls |
| P3.4 | Profile-based applications, duplicate prevention, history, withdrawal and status tracking | Application timeline and clear current-status cards |
| P3.5 | Confirmed assignments, supervisors, locations, schedules, attendance submission and corrections | Today's assignment, shift cards and a weekly calendar |
| P3.6 | Approved assignment/period earnings and operations-maintained payment history | Earnings summary and payment-status cards using actual records |
| P3.7 | Completed worker dashboard and release review | Today's work, applications, profile progress and earnings together; mobile, accessibility and integration checks |

Link workers to verified application/assignment records; never infer ownership
from matching names or email addresses. Phase 4 remains separate: AI matching,
geo-attendance, advanced analytics, automated operational notifications, incentive
calculation, external integrations and automated payouts.
