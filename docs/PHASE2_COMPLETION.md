# Phase 2 completion — P2.3, P2.6, P2.7 and P2.8

This incremental patch follows `zobhunger-p2-5-deployment-roster.patch`. Keep the
earlier attendance and roster patches applied. The old attendance patch was named
P2.5, but belongs to P2.6 in the agreed plan. No Phase 3 worker portal is included.

## Apply and deploy

From the repository root, with your previous changes committed:

```powershell
git apply --check zobhunger-phase2-completion.patch
git apply zobhunger-phase2-completion.patch
npm --prefix server run db:generate
npm --prefix server run db:deploy
npm --prefix server run build
npm --prefix client run build
git add client/src server/src server/prisma server/scripts server/tests server/package.json docs README.md
git commit -m "feat: complete business portal drafts, hiring, approvals and reports"
git push origin main
```

Stop if `git apply --check` fails; this patch targets the roster baseline, so do
not force rejected hunks onto an unrelated version. There are no new npm packages
or environment variables. `DATABASE_URL` must point at the intended database when
running the migration. Deploy both the API and frontend from the same commit.

The additive migration `20260909140000_phase2_completion` adds private drafts,
optional job-to-requirement links and attendance decisions. Existing job openings
keep their current status with no requirement link. Existing attendance values
and record revisions are preserved; approval starts at Pending with no invented
approval history. Apply this migration before serving the new API. No seed/reset
command is needed.

Keep the backend root at `server`, build command `npm ci --include=dev && npm run
deploy`, and start command `npm start`. The frontend still uses
`NEXT_PUBLIC_API_URL` and the existing `/api/backend` rewrite. Once deployed:

```powershell
npm --prefix server run check:business -- https://YOUR-BACKEND/api/v1
```

This read-only deployment probe checks all new modules. Its unauthenticated
401/400 responses are expected. `/api/v1/health` must include
`features.businessPhase2Complete: true`. The marker confirms route availability;
it does not test your database connection or approve a production release.

## Pages to inspect

Use your site's domain followed by these paths. Sign in as the indicated role;
`[id]` means an actual record ID obtained by opening a card in the portal.

| Role | Page | What changed |
| --- | --- | --- |
| Business | `/business/dashboard` | Candidate pipeline, active/upcoming assignments, oldest pending review, corrections, published openings and draft totals |
| Business | `/business/requirements/new` | Save an incomplete draft at any form step |
| Business | `/business/requirements/drafts` | Private draft cards, resume and delete |
| Business | `/business/requirements/drafts/[id]` | Resume saved values, save changes, submit once |
| Business | `/business/requirements/[id]` | Links to openings, candidates, roster and attendance |
| Business | `/business/requirements/[id]/jobs` | Linked job status, public content and application count |
| Business | `/business/attendance-approvals` | Date/site/person filters, approval states and approved time |
| Business | `/business/attendance-approvals/[id]` | Review one record, request a correction, approve and inspect decision snapshots |
| Business | `/business/reports` | Four report types, charts, staffing progress, CSV and print |
| Admin | `/admin/requirement-jobs` | Find business hiring briefs |
| Admin | `/admin/requirement-jobs/[id]` | Qualify the current brief, write job content, publish/close linked openings |
| Admin | `/admin/candidate-management` | Applications filtered by the receiving requirement; linked applications cannot be shared with another business |
| Admin | `/admin/attendance-approvals` | Business review queue and approval history |
| Admin | `/admin/attendance-approvals/[id]` | Read the decision and open the attendance/correction workflow |
| Admin | `/admin/reports` | Reports across business-owned requirements |
| Public | `/jobs`, `/jobs/[slug]` | Published linked jobs accept applications through the existing form |

The existing `/admin/deployments`, `/business/deployments`, `/admin/attendance`
and `/business/attendance` remain the assignment/recording workflows. A candidate
selection is still required before operations can create an assignment.

## Business rules

- Drafts belong to the signed-in business account. They do not appear in the
  submitted requirement list, operations brief list or requirement totals. Save
  draft permits incomplete fields; final submission uses the full validation.
  Saved versions reject stale edits. Repeated submission of a draft returns its
  original receipt and does not create another requirement.
- Operations marks a business-owned requirement Qualified before creating or
  publishing linked openings. The new qualification action checks the exact
  brief revision. Each opening starts as Draft. The public description is written
  separately; private contact details and requirement notes are not copied into
  it automatically. Publishing and closing are explicit admin actions.
- Editing opening content returns it to Draft. Editing a requirement returns it
  to New and closes its open linked jobs. Closing or downgrading a requirement
  through the existing admin workflow also closes those openings. Jobs must be
  reviewed and published again. Existing assignment history remains available.
  Application inserts recheck availability under the same requirement/job locks,
  including the existing placement application path. Public catalogue caches are
  invalidated after publication/status/content changes.
- Business approval applies to one saved attendance record revision. Operations
  maintains attendance; the owning business records the approval. An open shift
  needs check-out before approval. An open correction must be resolved first.
  Requesting changes creates a correction for operations. Decisions store the
  exact values reviewed. Later record edits or a new correction invalidate the
  earlier approval and retain its snapshot. Approved minutes use current approved
  records only. Approval does not generate payroll or earnings.
- Ownership uses the business profile's user, or the original authenticated
  submitter only when no profile is attached. Matching an email does not confer
  access. Every private API requires the appropriate role; writes require the
  existing portal header. All private responses use `Cache-Control: no-store`.
  Reports omit application contacts, CV URLs, actor IDs and internal audit data.

## Report definitions and limits

The date range includes both endpoints and supports up to 366 days, ending today
or earlier. Work dates and displayed times use Asia/Kolkata.

| Report | Included records | Location filter |
| --- | --- | --- |
| Requirement fulfilment | Requirements submitted in the period; full requested headcount, current selected count and active assignments at period end | Requested locations |
| Candidate progress | Non-revoked profiles shared in the period, at their current stage | Receiving requirement's requested locations |
| Deployments | Assignments whose saved date ranges overlap the period; state evaluated at period end | Assignment site |
| Attendance | Recorded work dates in the period, with current attendance/approval state | Assignment site |

Statuses use the latest saved records, not a reconstruction of every historical
status change. Current dashboard totals cover all dates independently of report
filters. Scheduled working days without an entry are Missing, not Absent; recorded
rest-day entries remain visible. Cancelled assignments are not planned work.

Reports paginate at 12 rows. CSV exports every matching row up to 10,000; Print
loads every matching row up to 1,000 and opens the browser print dialog (including
Save as PDF where available). Larger requests fail with a clear message to narrow
filters, rather than truncating. CSV quotes cells and neutralizes formula-leading
text. The file and print view are generated from a consistent database snapshot.
Phone report tables become labelled cards; period filters open in a drawer.

## Client walkthrough

1. Sign in at `/business/login`, complete the company profile and save an
   incomplete requirement. Open Saved drafts, resume it and submit the brief.
2. Sign in with an existing ADMIN account. Open Hiring briefs, review the details,
   mark the brief Qualified, and write a job draft. Publish it explicitly.
3. Open its public job page and apply with a test applicant. In Candidate
   management select the receiving requirement, review the application and share
   it. Sign in as the business and record a selection decision.
4. In admin Deployments assign the selected person with real dates, site,
   supervisor and shift. Inspect the business roster and weekly schedule.
5. Operations records attendance. The business opens the approval queue, requests
   a correction, and operations resolves it. The business reviews the revised
   times and approves. Inspect both the record history and approval snapshots.
6. Open Reports, switch through all four datasets, change dates/site, download CSV
   and print. Check that approved time agrees with the approved record and the
   dashboard links open the corresponding workflow.
7. Check a second business account: the first company's drafts, candidates,
   assignments, approvals and reports must be unavailable.
8. On actual phones at 360/390/768px widths, check navigation, draft forms, filter
   drawers, record decisions and labelled report cards. Use keyboard Tab/Escape,
   long company/site names, 200% zoom, an expired session and an interrupted
   network request. Confirm focus returns after closing each drawer and every
   action remains reachable. Check a desktop print preview before client signoff.

## Verification

The completion patch includes `server/tests/phase2.integration.test.mjs` for the
full draft → submission → qualification → job → application → candidate selection
→ assignment → correction → approval → report/export workflow. It also checks
company boundaries, stale revisions, retries, public/private data separation,
CSV formula escaping, export limits and job closure. Existing access, dashboard,
requirement, candidate, roster, attendance and email-recovery suites remain useful
regression checks.

Run integration tests only with a dedicated migrated test database:

```powershell
$env:TEST_DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/phase2_test"
npm --prefix server run test:phase2
```

Builds, automated database/API checks and the production Next rewrite/page checks
are verified during patch preparation. The local database harness uses PGlite's
PostgreSQL engine with a single connection; it does not substitute for production
load testing on your hosted PostgreSQL service. The browser preview environment
blocks localhost, so a rendered mobile/print walkthrough could not be completed
here. The responsive styles are implemented; the real-device checks above remain
the final visual signoff. The Resend API key and verified sender domain must still be
validated with the provider for live email delivery.
