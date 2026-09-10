# Worker portal — P3.1, P3.2 and P3.3

> **Final onboarding policy:** public worker self-registration described in the original P3.1 delivery has been retired. New workers now submit `/careers/apply`; the team reviews and verifies the profile/CV, then communicates access or next steps after approval when there is a suitable project requirement. Existing approved worker login, verification, recovery and portal features remain active.

This patch builds on the P2.8 release-review baseline. It introduces authenticated
worker accounts and their own profile and saved-job records. It preserves the
business approval process, careers submissions and existing public applications.

## Delivered scope

| Part | Delivered behaviour |
| --- | --- |
| P3.1 | Worker registration with consent, email verification, worker-only login, password recovery, safe return-to-job links and an authenticated responsive shell |
| P3.2 | Personal details, education, experience or fresher status, skills, languages, work preferences, availability, a private PDF CV and a six-section completion checklist |
| P3.3 | Published job discovery, keyword/location/category/work-type filters, pagination, role details, account-specific saved jobs and closed-role handling |
| Monitoring | Public `GET /route` and `HEAD /route`, returning HTTP 200 while the Express process is running |

The visual treatment uses the existing ZOBHUNGER field-executive image, burgundy
panels, service icons, a real profile-completion ring and responsive job cards.
The worker sidebar becomes an accessible menu drawer on phones. Inputs use
16px text on mobile; actions have at least 44px touch targets; long values wrap.
Motion respects reduced-motion preferences.

## Pages to review

Use these paths on the **frontend** domain:

| Page | Path |
| --- | --- |
| Public entry, account creation and sign-in links | `/for-workers` and the website footer |
| Public profile submission | `/careers/apply` |
| Worker sign-in | `/worker/login` |
| Verify email or resend a link | `/worker/verify` |
| Request password recovery | `/worker/forgot-password` |
| Set a new password | `/worker/reset-password` — open the link received by email |
| Worker landing page | `/worker` — redirects to `/worker/jobs` |
| Personal profile, education, experience, preferences and CV | `/worker/profile` |
| Job discovery | `/worker/jobs` |
| Saved opportunities | `/worker/saved-jobs` |
| Live job details | `/worker/jobs/<published-job-slug>` |

The existing general `/login` also routes WORKER accounts into the worker space.
Unverified accounts can sign in, but profile, CV and job APIs remain locked until
email verification succeeds. Expired sessions return to sign-in; temporary
network failures preserve the mounted form and display a retry message.

Public live job details include **Save in worker space**, which sends a signed-out
person through sign-in and returns them to that job. Existing demo openings do
not appear in worker discovery. Publish a real, non-demo job with a past/current
publication date to review the job-card and save flows.

## API routes

All routes below use the **backend** domain and the existing `/api/v1` prefix.
Browser calls use the existing first-party `/api/backend` Next rewrite.

| Method | Path | Access / purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/worker/register` | Compatibility guard; returns `403 WORKER_REVIEW_REQUIRED` and creates no account |
| POST | `/api/v1/auth/worker/login` | Worker email/password sign-in |
| POST | `/api/v1/auth/worker/resend-verification` | Generic response; resend for an eligible worker |
| POST | `/api/v1/auth/worker/verify-email` | Consume a one-use verification token |
| POST | `/api/v1/auth/worker/forgot-password` | Generic recovery request |
| POST | `/api/v1/auth/worker/reset-password` | Consume a recovery token and invalidate old sessions |
| GET | `/api/v1/workers/workspace` | Signed-in worker identity and verified profile state |
| GET / PUT | `/api/v1/workers/profile` | Read/save the authenticated worker's profile |
| GET / PUT / DELETE | `/api/v1/workers/profile/resume` | Download/upload/remove that worker's private PDF |
| GET | `/api/v1/workers/jobs` | Live listings; `query`, `city`, `category`, `engagementType`, `page` |
| GET | `/api/v1/workers/jobs/facets` | Filter options drawn from live jobs |
| GET | `/api/v1/workers/jobs/:slug` | Live role details and personal saved status |
| GET | `/api/v1/workers/saved-jobs` | Personal saved list; optional `page` |
| PUT / DELETE | `/api/v1/workers/saved-jobs/:jobId` | Save/remove a job for the authenticated worker |

Writes require `X-Requested-With: XMLHttpRequest`, as existing portal writes do.
Profile saves include the last read `revision`. Resume upload accepts raw PDF
bytes with `Content-Type: application/pdf`, an encoded `X-File-Name`, and
`X-Resume-Revision`. Resume deletion accepts JSON `{ "revision": <last-read-resumeRevision> }`.
Successful writes return refreshed profile metadata and completion progress.

## Uptime monitor setup

On UptimeRobot or another HTTP monitor, choose an HTTP(S) monitor and set the URL
to **`https://YOUR-BACKEND-DOMAIN/route`**, with expected status **200**. No token,
cookie or extra environment setting is required. GET and HEAD both work.

GET returns:

```json
{
  "status": "ok",
  "service": "zobhunger-api",
  "uptimeSeconds": 120,
  "timestamp": "2026-09-09T12:00:00.000Z"
}
```

This checks **process liveness**. It intentionally does not call PostgreSQL,
Redis or Resend and cannot prove their availability. `/api/v1/health` remains
available and now advertises the worker access/profile/discovery feature flags.
Build and prestart checks verify that both worker routes and `/route` are mounted,
without opening a database connection.

## Configuration and deployment

Use Node.js **22.x**, the existing project requirement. No new npm package or
Redis setting is introduced. Private worker data uses PostgreSQL and no-store
responses rather than a shared public cache.

Configure the backend's existing settings:

```dotenv
DATABASE_URL=postgresql://...
JWT_SECRET=your-existing-strong-secret
CLIENT_ORIGIN=https://YOUR-FRONTEND-DOMAIN
PUBLIC_APP_URL=https://YOUR-FRONTEND-DOMAIN
RESEND_API_KEY=re_your_api_key
MAIL_FROM_EMAIL=your-verified-sender@example.com
MAIL_FROM_NAME=ZOBHUNGER
```

The frontend continues to use:

```dotenv
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-DOMAIN/api/v1
```

Apply from the repository root:

```powershell
git apply --check zobhunger-p3-1-3-worker-portal.patch
git apply zobhunger-p3-1-3-worker-portal.patch
```

For a fresh checkout, install with `npm --prefix server ci` and
`npm --prefix client ci`. Build/deploy the backend using
`npm --prefix server run deploy`, which builds and applies migrations to its
configured `DATABASE_URL`; start with `npm --prefix server start`. Rebuild and
redeploy the frontend too. Do not run the dedicated test suite against that
deployment database.

The migration `20260909120000_worker_access_profiles_saved_jobs` adds worker
profile fields, access tokens, private resume storage and saved-job records.
It does not remove existing data or automatically verify old accounts.

Resend must be active and the `MAIL_FROM_EMAIL` domain must be verified. API-key or account restrictions
still need to be resolved with the provider. Registration preserves the new
account when delivery fails and shows a resend/help path; it never marks an
undelivered email as verified. `npm --prefix server run check:email` checks the
existing transport configuration. Email delivery must also be checked using a
real mailbox after deployment.

## Data and workflow boundaries

- Worker access tokens are random, hash-only in the database, purpose-bound,
  session-version-bound, expiring and single-use. Verification expires after an
  hour; password recovery after 30 minutes; resend has a 60-second cooldown.
- Email links hold the token in the fragment, not the query string. The browser
  removes it from the address bar and requires explicit confirmation. Redirect
  destinations are restricted to worker pages and job details.
- Worker profile and CV routes derive ownership from the authenticated user.
  Passwords, raw tokens and resume bytes never appear in profile JSON or audits.
- CV uploads accept PDF only, up to 2 MB, with PDF signature/EOF checks and safe
  filenames. Downloads require authentication and use attachment disposition,
  `no-store`, `nosniff` and a sandbox CSP. This is file-type validation, not
  malware scanning. Each worker has one replaceable CV.
- Separate, monotonic profile and resume versions prevent stale overwrites.
  A resume version survives deletion, so a stale tab cannot overwrite a reupload.
- Unfinished text remains in memory while browsing the signed-in worker space.
  It is not written to localStorage, is cleared on account loss/switch, and a
  reload warns about unsaved changes. Cross-tab conflicts require explicit reload.
- Saved jobs are personal, idempotent and capped at 200 per worker. Closed or
  unpublished saved roles show only their previously public title/location/type
  snapshot, not newly edited private draft content.
- Requirement-linked jobs require a qualified requirement and an active, approved
  business owner. Demo, future, unpublished and closed jobs are excluded.

**P3.4 is next.** Job details currently link to the existing public application
form at `/jobs/<slug>#apply`. This patch does not claim application-status
tracking, assignments, attendance or earnings. It does not match existing career,
candidate or application records to a worker merely because an email/name matches.
Those secure ownership connections belong to the next application workflow.

## Verification

`npm run verify:workers` runs the Phase 2 checks plus the worker integration
suite, database migration/drift checks, client interaction tests, lint and builds.
Set `TEST_DATABASE_URL` to a **dedicated disposable PostgreSQL database**. The
command creates temporary fixtures and mocks delivery; it never sends real email.
The existing CI workflow now runs this combined check against PostgreSQL 16.

The local release report remains `.release-artifacts/phase2-code-checks.json` and
records the expanded scope. Tests include role/ownership isolation, verification
and recovery token lifecycle, profile conflicts, private PDF upload/download,
saved-job visibility, invalid-session cleanup, draft preservation and late
responses after account switches. Local DB evidence uses PGlite compatibility
checks; hosted PostgreSQL, production performance, real-device layout and live
mailbox delivery still require deployment checks.

Local run on 2026-09-09: **20/20 release stages passed** on Node 22.23.2 with
PGlite 0.5.8. This includes 30 client interaction/session tests, the worker API
suite, existing business regressions, clean migration/schema comparison and both
production builds. Lint has zero errors and two pre-existing warnings in
`BrandMarqueeMotion.tsx`. The patch applies cleanly to the P2.8 baseline and the
applied files match the implementation byte for byte.

Before signoff, review registration/verification/profile/jobs at 360px, 390px,
768px and desktop widths, navigate the mobile drawer by keyboard, upload and
replace a PDF, save an open job then close it in admin, and confirm the monitor's
backend URL returns HTTP 200.
