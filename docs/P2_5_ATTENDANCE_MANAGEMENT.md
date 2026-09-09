# P2.6 — Attendance management (historical P2.5 filename)

> Historical delivery notes. The remaining Phase 2 work is now implemented; see
> [Phase 2 completion](PHASE2_COMPLETION.md) for current behavior and setup.

Numbering correction: this document and its original patch were labelled P2.5
incorrectly. In the agreed plan, P2.5 is Deployment and team roster; attendance is
P2.6. Keep the earlier patch applied. The dedicated roster follow-up is documented
in `P2_5_DEPLOYMENT_TEAM_ROSTER.md`. Business attendance approvals and their approval
history remain a pending P2.6 addition; correction review is not timesheet approval.

This patch is based directly on `09.zip` (archive commit
`699222948bdc0a0335823f5696c3e5fa15be346e`), which includes P2.4 candidate tracking.
That patch adds the assignment foundation and attendance workflow for the business portal.

## What clients and operations can do

- Operations creates an assignment from a candidate the business has selected.
  Each assignment records the site, supervisor, date range, working weekdays,
  shift start/end times and late-arrival grace period.
- Business users see their daily register, attendance coverage, seven-day chart,
  person-level monthly calendar, shift times, worked hours and record history.
- The daily register filters by date, person/role, location and status, with a
  requirement-specific view and bounded pagination.
- Operations explicitly records Present, Absent, Leave or Off. Present entries
  require a check-in; check-out can remain empty while work is in progress.
- A business can request a correction for an assigned date, including a missing
  entry. Operations accepts it with corrected attendance or declines it with a
  reason. Both parties can follow open and completed requests.
- Responsive cards, icons, coverage rings, chart buttons and a monthly calendar
  provide visual navigation. Status words and calendar letters supplement colors.
  Inputs use 16px text, actions have visible keyboard focus, and loading animation
  respects reduced-motion preferences.

No assignment or attendance data is seeded by this feature. Empty workspaces
remain empty until real selected candidates are assigned.

## Website pages

Append these paths to the deployed frontend domain.

| Path | Account | Purpose |
| --- | --- | --- |
| `/business/attendance` | Business | Daily register, summary cards and seven-day chart |
| `/business/attendance?tab=corrections` | Business | Open and completed correction requests |
| `/business/attendance/<assignmentId>?date=YYYY-MM-DD` | Business | Monthly calendar and selected daily record |
| `/business/requirements/<requirementId>/attendance` | Business | Register and corrections for one owned requirement |
| `/admin/attendance` | Admin | Attendance operations desk |
| `/admin/attendance?tab=assignments` | Admin | Assignment creation, search and management |
| `/admin/attendance?tab=corrections` | Admin | Review queue and completed decisions |
| `/admin/attendance/assignments/<assignmentId>?date=YYYY-MM-DD` | Admin | Calendar, daily entry, correction review and assignment settings |

Use the new Attendance link in the business sidebar, the attendance link on a
requirement brief, or Attendance & corrections on the operations dashboard.
Selected candidate profiles also link to the assignment workflow. IDs come from
these screens; `<assignmentId>` and `<requirementId>` are placeholders.

## First walkthrough

1. In `/admin/candidate-management`, share a real application with a business-owned
   requirement. The business then selects that candidate in `/business/candidates`.
2. Sign in as admin through `/login` and open
   `/admin/attendance?tab=assignments`. Choose **New assignment**, select that
   person and enter the site, supervisor, dates and shift. Include today's date
   if you want to see them on today's register.
3. Open the assignment calendar, choose today or a past assigned date, and record
   attendance with a note. Future entries are blocked. Check-in/out timestamps
   must already have occurred.
4. Sign in as the owning business and open `/business/attendance`. Choose the same
   date, use **View details**, and submit a correction with the requested change.
5. In `/admin/attendance?tab=corrections`, open **Review record**, inspect the request,
   then save corrected attendance and an explanation, or decline with a reason.
6. Return to the business's correction list to see the decision. The calendar and
   daily history retain the earlier attendance entries.

## Time and status rules

All dates and shift times use IST, independent of the viewer's device timezone.
Attendance belongs to the shift's start date. For a 22:00–06:00 shift, check-out
uses the next calendar date. Worked minutes equal elapsed check-in/out time minus
breaks; an open shift has no completed-hours value. Late minutes count the time
beyond the assignment's grace period.

Missing attendance is **Not recorded**, never an inferred absence. An unrecorded
non-working weekday is **Scheduled off**; a future working day is **Upcoming**.
An explicit Off entry remains distinguishable from a scheduled day off.

Coverage is recorded entries divided by assigned people excluding unrecorded
scheduled-off days. A recorded off-day entry is included in the denominator.
Chart and metric totals respect name, location and requirement filters. The
status filter applies to list rows. The seven-day chart includes all roster
statuses; its highlighted segment is Present. Recorded hours exclude open shifts.

Assignments have shifts of 1–16 hours and an end date within 366 days of the start.
Check-in permits up to four hours before the scheduled start and no later than
the shift end. Check-out permits up to four hours after the scheduled end, with a
maximum 20-hour elapsed span. Breaks cannot exceed the elapsed duration.

## Lifecycle and access

- Business data is scoped by the requirement's explicit business-profile owner,
  falling back to the submitting user only when no profile is attached. Matching
  email addresses never confer access. Foreign assignment IDs return the same
  404 as missing IDs.
- Assignment creation requires an unrevoked selected candidate on an open
  requirement belonging to an active business account. One assignment exists
  per shared candidate. Duplicate creation preserves and returns the existing
  assignment; it does not overwrite its schedule.
- Schedule/location/supervisor settings can be edited, or a cancelled assignment
  reactivated, only before any attendance or correction history exists. These
  settings are intentionally fixed once history starts. This increment supports
  one fixed schedule per shared candidate; rotating schedules are a later extension.
- An assignment without history can be cancelled. An assignment with history can
  end earlier only if the new date excludes no saved attendance or correction.
- Current or upcoming assignments block reopening the selection or revoking the
  candidate. Requirements cannot close while assignments extend beyond today.
  End the assignments first. Historical attendance and corrections remain usable
  on valid assigned dates after the requirement closes.
- Mutations use requirement/assignment row locks and revision checks. Stale
  attendance writes fail with 409; they cannot overwrite a newer entry. One open
  correction is allowed per assignment/date. Correction resolution and the new
  attendance snapshot commit together, and every saved entry retains history.
- Reads send `Cache-Control: no-store`. Protected routes require the appropriate
  active account; writes also require the portal request header. Private attendance
  is not put in Redis or in publicly rendered page HTML. Pages have noindex metadata.

This increment uses operations-entered attendance. Worker self check-in, geo
attendance, payroll/earnings calculations, reports and automatic notifications
remain separate portal phases. Attendance works independently of Mailjet delivery.

## API routes

Backend prefix: `/api/v1`. Browser requests use the existing `/api/backend` rewrite.

| Method | Route | Access |
| --- | --- | --- |
| GET | `/business/attendance` | Business |
| GET | `/business/attendance/corrections` | Business |
| GET | `/business/attendance/assignments/:id` | Business |
| GET | `/business/attendance/assignments/:id/day` | Business |
| POST | `/business/attendance/assignments/:id/corrections` | Business |
| GET | `/admin/attendance` | Admin |
| GET | `/admin/attendance/assignments` | Admin |
| GET | `/admin/attendance/selected-candidates` | Admin |
| POST | `/admin/attendance/assignments` | Admin |
| GET, PUT | `/admin/attendance/assignments/:id` | Admin |
| GET | `/admin/attendance/assignments/:id/day` | Admin |
| PUT | `/admin/attendance/assignments/:id/records` | Admin |
| POST | `/admin/attendance/assignments/:id/end` | Admin |
| POST | `/admin/attendance/assignments/:id/cancel` | Admin |
| GET | `/admin/attendance/corrections` | Admin |
| POST | `/admin/attendance/corrections/:id/resolve` | Admin |

The register accepts `date`, `query`, `location`, `status`, `requirementId` and
`page`. Calendar reads accept `month=YYYY-MM`; daily reads require `date` and
optionally `historyPage`. Correction lists accept `query`, `status`, `page` and
optional `requirementId`. Invalid or extra query/body fields are rejected.

## Apply and deploy

Run from the project root containing `client/` and `server/`:

```powershell
git apply --check zobhunger-p2-5-attendance-management.patch
git apply zobhunger-p2-5-attendance-management.patch
git add client/src server/src server/prisma server/scripts server/tests server/package.json docs/P2_5_ATTENDANCE_MANAGEMENT.md
git commit -m "feat: add business attendance and correction workflows"
git push origin main
```

Deploy the backend with the existing build-and-migrate command before using the
new pages. From the repository root:

```powershell
npm --prefix server run deploy
```

For hosting with `server/` as the root directory, use **Build command**
`npm ci --include=dev && npm run deploy` and **Start command** `npm start`.
Redeploy the frontend from the same commit using its existing build command.
No new environment variables or npm dependencies are required.

The additive migration `20260909130000_business_attendance` creates
`WorkforceAssignment`, `AttendanceRecord`, `AttendanceEvent` and
`AttendanceCorrection`, their enums, constraints and indexes. It preserves existing
users, requirements and candidate history. Use `prisma migrate deploy` through the
deployment script; do not reset the database or re-run seed data for this patch.

`npm --prefix server run check:business -- https://YOUR-BACKEND/api/v1` now checks
the five business attendance endpoints in addition to existing portal routes.
`GET /api/v1/health` reports `features.businessAttendance: true` on this build.
The health flag identifies the mounted code; successful database-backed reads
also require the migration to have been deployed.

## Verification

- Server production build and compiled route gate passed.
- Client production build and TypeScript checks passed.
- 72 unit/deployment checks passed. Client lint had no errors; two existing
  unused-variable warnings remain in `BrandMarqueeMotion.tsx`.
- 51 database integration checks across access/recovery, dashboard, requirements,
  candidates and attendance passed. Attendance checks include cross-company
  isolation, profile-owner precedence, selected-only assignment setup, duplicate
  requests, missing/future/off dates, stale writes, correction decisions, lifecycle
  guards, overnight shifts and pagination. The added requirement-specific correction
  filter was also verified.
- A temporary embedded PostgreSQL-compatible database applied the migrations and
  retained a pre-existing requirement. Tests used one database connection for this
  environment; production multi-connection load testing was not performed.
- The production Next rewrite was checked with authenticated assignment creation,
  attendance entry, business correction and admin review requests. New pages were
  checked for successful responses and noindex metadata.
- Browser-rendered visual inspection was unavailable in this environment. The
  responsive CSS and accessible controls are implemented; inspect the new screens
  on desktop and phone after deployment.

To run the checked-in attendance integration suite yourself, use a dedicated,
migrated test database (the suite creates and removes temporary records):

```powershell
$env:TEST_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DEDICATED_TEST_DB"
npm --prefix server run test:attendance
```
