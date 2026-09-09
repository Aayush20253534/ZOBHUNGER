# P3.4–P3.5 — Applications, assignments and attendance

This patch targets the supplied `BZB(3).zip`, with the P3.1–P3.3 worker foundations already present. It adds account-owned applications and an operations-reviewed attendance workflow, connected to the existing Phase 2 business portal.

## What is included

- **P3.4:** application preview from the saved worker profile; explicit sharing consent; optional private PDF CV snapshot; duplicate prevention; application lists and filters; hiring timeline; interview times and worker-facing messages; withdrawal before a confirmed assignment. Changing a profile or removing its current CV does not alter earlier submissions.
- **P3.5:** confirmed assignment lists, locations, supervisors, weekly shifts and monthly attendance calendars; completed-shift submissions; missing/wrong attendance correction requests; status/history; admin review queue with comparison to the official record. Approved worker requests enter the existing business approval process.
- Responsive layouts, compact status cards, graphical application steps, calendar and schedule controls, icons, keyboard labels, reduced-motion support, loading, empty, conflict and retry states.
- Admin dashboard links to the application and attendance review desks. Candidate sharing supports the submitted private CV and a separate message shared with the worker.

The public `GET /route` and `HEAD /route` uptime monitor remain available. `GET /api/v1/health` also advertises `workerApplications`, `workerAssignments` and `workerAttendance`.

## Apply and deploy

Run from the repository root after placing the patch there:

```powershell
git apply --check zobhunger-p3-4-5-applications-attendance.patch
git apply zobhunger-p3-4-5-applications-attendance.patch
git add client/src client/tests server/src server/prisma server/scripts server/tests scripts docs
git commit -m "feat(worker): add application tracking and reviewed attendance workflows"
git push origin main
```

Deploy **both** server and client. The server needs the included migration before the new pages are used. Use the backend's normal configured deployment environment, with its existing `DATABASE_URL`:

```powershell
npm --prefix server run deploy
```

That existing command builds the server, generates Prisma Client and runs `prisma migrate deploy`. The frontend uses its normal `npm --prefix client run build`. No new environment variables or dependencies are required. Node 22 remains the project's runtime.

Migration: `20260909170000_worker_applications_attendance`. This adds tables and columns; it does not delete or relink existing applications. The new `(jobId, workerUserId)` uniqueness constraint protects signed-in submissions. If a manually modified database already contains duplicate non-null pairs, review those records before applying the migration; the migration will not silently delete them.

## Website pages

Sign in with a verified **worker** account:

| Page | What to check |
| --- | --- |
| `/worker/jobs` | Find an actual published job and open its details. |
| `/worker/jobs/<slug>/apply` | Review saved details, choose whether to include the CV, give consent and submit. |
| `/worker/applications` | Application cards, status filters and counts. |
| `/worker/applications/<id>` | Submitted snapshot and CV, safe hiring history, interview updates and withdrawal. |
| `/worker/assignments` | Confirmed assignments, dates, locations and shift summaries. |
| `/worker/assignments/<id>` | Weekly plan, month calendar, daily record and submission/correction form. |
| `/worker/assignments/<id>?date=YYYY-MM-DD` | Open a particular workday from attendance history. |
| `/worker/attendance` | Pending, approved and rejected requests across assignments. |

Sign in with an **admin** account:

| Page | What to check |
| --- | --- |
| `/admin/worker-applications` | Submitted worker profiles and hiring stages. |
| `/admin/worker-applications/<id>` | Review the profile/CV, record a decision and share a message with the worker. |
| `/admin/candidate-management` | Share a reviewed application with the correct business requirement. |
| `/admin/attendance` | Existing assignment setup and official attendance management. |
| `/admin/worker-attendance` | Worker attendance/correction request queue. |
| `/admin/worker-attendance/<id>` | Compare submitted and current entries; approve or reject with an explanation. |

Existing business pages remain connected: `/business/candidates/<id>` for candidate selection and worker-facing interview instructions, `/business/attendance-approvals` for the separate business attendance decision.

Replace `<id>` and `<slug>` with values reached through the lists; they are not literal route values.

## End-to-end walkthrough

1. Use a real, published, non-demo job. A job tied to a requirement must remain eligible under the existing Phase 2 publishing rules.
2. Worker signs in, verifies their email and saves at least name, phone, city and state in their profile. Apply from **Find work**. A second submission returns the existing application without replacing it.
3. Admin reviews it under **Worker applications**, then uses **Candidate sharing** to share it with the relevant requirement. Business reviews, shortlists or selects the candidate. The worker sees the stage and only messages explicitly shared with them; business/internal notes and coordination details remain private.
4. After selection, admin creates an assignment using the existing attendance/deployment setup. Worker sees the confirmed location, supervisor and weekly plan under **My assignments**.
5. Worker opens a completed workday, enters actual arrival/departure times in IST, break minutes and a note, confirms accuracy and submits. For overnight shifts, mark departure as the next day. Future days and dates outside the assignment cannot be submitted. Work on a scheduled day off must be coordinated with operations.
6. The request is **awaiting review**, and the official record remains unchanged. Admin compares and approves or rejects it under **Worker attendance requests**.
7. Approval writes official attendance atomically and makes it available for business approval. The worker calendar shows the recorded entry and business approval status separately from the request decision.
8. For a correction, the worker reviews the current record and explains the change. The previously approved record stays intact until operations approves the correction. If the record, approval version or schedule changed in the meantime, the admin must reject the stale request and ask the worker to review the current day before submitting again.
9. A worker may withdraw before a confirmed assignment. Withdrawal closes that application permanently, revokes business candidate access and prevents subsequent sharing, selection or assignment creation. A confirmed assignment must be discussed with operations instead.

## Ownership and workflow boundaries

- Worker ownership is the authenticated account's stored `workerUserId`, never a submitted email, name or request-body user ID.
- Earlier public/anonymous applications and existing assignments with no trusted worker-account relationship are not automatically attached to an account. Duplicate email-only submissions prompt the worker to contact the team for review. This patch does not add an automatic legacy-record claim or migration.
- CV bytes are excluded from lists and profile JSON. Download routes enforce owner/admin/scoped-business access and attachment/no-store headers. Business access requires explicit candidate sharing; withdrawal/revocation removes that access.
- Attendance is a completed-shift **self-report**, not GPS or biometric proof. Operations review and business approval remain separate. Pending worker requests do not modify official attendance or reset its approval.
- A request uses its own retry key and the record, business approval and assignment versions observed by the worker. One pending request is allowed per assignment/date. History prevents assignment schedule edits or cancellation that would invalidate records; end dates cannot exclude past requests.
- Attendance requests and decisions are kept for review. Rejected requests can be followed by a fresh submission; approved records can be corrected through a new request. An open business correction blocks worker approval until operations resolves the conflict.
- P3.6/P3.7 now add approved earnings/payment history and the completed worker dashboard; see `P3_6_7_EARNINGS_DASHBOARD.md`. Automated operational notifications, GPS attendance, incentives and AI matching remain Phase 4. Hiring updates are visible in the portal; this workflow does not send interview or attendance emails.

## API endpoints

All paths below are relative to `/api/v1`; the Next browser proxy uses `/api/backend`. Worker routes require an active verified WORKER session. Admin routes require ADMIN. Mutations on the new routes require `X-Requested-With: XMLHttpRequest`.

| Method | Endpoint |
| --- | --- |
| POST | `/workers/jobs/:jobId/applications` |
| GET | `/workers/applications` |
| GET | `/workers/applications/:id` |
| GET | `/workers/applications/:id/resume` |
| POST | `/workers/applications/:id/withdraw` |
| GET | `/workers/assignments` |
| GET | `/workers/assignments/:id?date=YYYY-MM-DD` |
| GET | `/workers/assignments/:id/calendar?month=YYYY-MM` |
| POST | `/workers/assignments/:id/attendance` |
| GET | `/workers/attendance` |
| GET | `/admin/worker-applications` |
| GET | `/admin/worker-applications/:id` |
| GET | `/admin/worker-applications/:id/resume` |
| POST | `/admin/worker-applications/:id/review` |
| GET | `/admin/worker-attendance` |
| GET | `/admin/worker-attendance/:id` |
| POST | `/admin/worker-attendance/:id/review` |
| GET | `/business/candidates/:id/resume` |
| GET | `/admin/candidate-management/:id/resume` |

## Verification evidence

The existing `npm run verify:workers` release command now includes `worker-workflows.integration.test.mjs` and the new client interactions. The PostgreSQL CI workflow runs this command too.

Local verification passed all 21 release stages: server build and mounted-route checks; migrations and schema drift; existing Phase 2 and P3.1–P3.3 integrations; the new application/attendance integration suite; 35 client tests; lint (two existing unrelated warnings); and the production Next build with the new routes.

New integration coverage includes role/verification/ownership boundaries, duplicate and stale applications, immutable CV snapshots, legacy email ownership, private business notes, withdrawal guards, assignment access, IST dates, pending-request isolation, retry keys, single review, business approval, stale corrections and overnight shifts. Client coverage checks duplicate clicks, conflict recovery, existing applications, explicit withdrawal and IST/overnight payloads.

The local database check used **PGlite 0.5.8** through its PostgreSQL-compatible socket. Native/hosted PostgreSQL, deployment, live email and real-device visual/keyboard checks were not performed here. Use a dedicated PostgreSQL test database to repeat the release command before hosted release; never point `TEST_DATABASE_URL` at production.
