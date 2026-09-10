# P3.6–P3.7 — Worker earnings, payments and integrated dashboard

P3.6 and P3.7 complete the Phase 3 worker portal on top of the existing P3.1–P3.5 account, application, assignment and attendance workflows.

## What is implemented

### P3.6 earnings and payment history

- Worker navigation and pages at `/worker/earnings` and `/worker/earnings/<statement-id>`.
- Summary totals for approved earnings, valid recorded payments and outstanding balances.
- Assignment/date filters, ten-row pagination, statement details, print layout and account-scoped CSV download.
- Statement lines for agreed earnings, allowances, reimbursements and deductions. Deductions require a reason.
- Operations-maintained payment records with date/time, method, reference and note. Partial and completed payment states are derived from valid records.
- Admin earnings management at `/admin/earnings`, creation at `/admin/earnings/new`, and statement review at `/admin/earnings/<statement-id>`.
- Draft creation/revision, explicit approval, attendance/business-approval context, append-only approved adjustments, manual payment recording and audited payment voiding.
- Integer-paise storage and calculation. The feature records operations payment history only; it does not transfer funds.

### P3.7 integrated worker dashboard

- `/worker` is the normal landing page for approved workers after login/verification and recovery flows while valid return destinations still win.
- Personalized profile completion and next actions.
- Exact application and active/upcoming assignment totals, recent hiring updates and confirmed assignments.
- Next scheduled shift with IST times, location, supervisor and overnight handling from the existing assignment schedule.
- Attendance review count and recent decisions.
- P3.6 approved earnings/payment/outstanding totals.
- Real recent-activity timeline assembled from application, attendance, earnings-approval and payment records.
- Direct links to jobs, saved jobs, applications, assignments, attendance, earnings and profile/CV.

## Financial data and invariants

Money is stored as integer paise (`Int`) and validated before database writes. No floating-point amount is stored. Worker summary totals are aggregated from the complete approved ledger in PostgreSQL rather than from the current result page.

An earnings statement belongs to a confirmed `WorkforceAssignment`. Worker ownership is not inferred from a name or email. It follows the existing trusted relation:

`WorkforceAssignment -> BusinessCandidate -> JobApplication.workerUserId -> User`

Important mutation rules:

1. A statement period must stay inside the confirmed assignment dates.
2. Statement periods for the same assignment cannot overlap, preventing duplicate earnings for the same work.
3. Draft create, adjustment and payment mutations carry UUID request keys for idempotency.
4. Statements and payments carry revisions. Important writes lock the target row and reject stale revisions; concurrent writes cannot both mutate the same revision.
5. Earnings cannot be approved unless at least one attendance record in the statement period is business-approved. The approval stores an attendance summary snapshot for audit context.
6. Approved statement lines cannot be rewritten. Corrections are append-only credit/debit adjustments with reasons.
7. Payments cannot exceed the derived outstanding balance.
8. Payment corrections void the old record with actor, time and reason. The original payment remains in history and no longer contributes to paid totals.
9. A debit adjustment cannot reduce approved payable below zero or below payments already recorded.

Automated payroll, tax calculation, incentive engines, bank/UPI initiation and payment-provider integrations are intentionally outside P3.6.

## API endpoints

All paths are relative to `/api/v1`; browser calls continue through `/api/backend`. Worker endpoints require an active verified `WORKER` session. Admin endpoints require `ADMIN`. Personalized worker/admin responses remain `no-store`; the CSV endpoint explicitly returns `private, no-store` and `nosniff`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/workers/dashboard` | Integrated worker dashboard data |
| GET | `/workers/earnings` | Approved worker statements, filters, pagination and exact summary |
| GET | `/workers/earnings/:id` | One approved account-owned statement |
| GET | `/workers/earnings/:id/csv` | Secure CSV for one approved account-owned statement |
| GET | `/admin/earnings` | Admin earnings queue/list |
| GET | `/admin/earnings/assignments` | Eligible confirmed worker assignments |
| GET | `/admin/earnings/assignments/:id/context` | Assignment + attendance/business-approval evidence for a period |
| POST | `/admin/earnings` | Create an idempotent draft |
| GET | `/admin/earnings/:id` | Draft/approved statement, ledger and current attendance context |
| PUT | `/admin/earnings/:id/draft` | Revise a current draft revision |
| POST | `/admin/earnings/:id/approve` | Explicitly approve the current draft revision |
| POST | `/admin/earnings/:id/adjustments` | Append an approved credit/debit adjustment |
| POST | `/admin/earnings/:id/payments` | Record a partial or completed operations payment |
| POST | `/admin/earnings/:id/payments/:paymentId/void` | Void a payment with an audit reason |

Important writes use the existing portal write protection (`X-Requested-With: XMLHttpRequest`).

## Database migration

Migration:

`server/prisma/migrations/20260909190000_worker_earnings_dashboard/migration.sql`

It adds:

- `EarningsStatement`
- `EarningsLine`
- `EarningsAdjustment`
- `PaymentRecord`
- statement/line/adjustment/payment status/type enums
- unique idempotency keys, unique assignment-period protection and bounded-query indexes

No new environment variable is required.

Production migration uses the existing server deployment command:

```powershell
npm --prefix server run deploy
```

That command runs the repository's existing Prisma deployment/build sequence. For an explicit migration-only deployment use:

```powershell
npm --prefix server exec prisma migrate deploy
npm --prefix server exec prisma generate
```

## End-to-end operational flow

1. P3.5 already has a confirmed worker assignment and scheduled shift.
2. The worker submits attendance. Operations reviews it and creates/updates the official attendance record.
3. The business approves the official attendance record through the existing business attendance workflow.
4. An admin opens `/admin/earnings/new`, selects the confirmed assignment and period, and sees recorded/business-approved attendance for that period.
5. The admin enters agreed earnings, approved allowances/reimbursements and any documented deduction, then saves a draft.
6. The admin explicitly approves the current draft revision. Only then does the worker see it in `/worker/earnings` and on `/worker`.
7. Operations records a partial payment. Paid and outstanding totals change from the payment ledger; no transfer is initiated by ZOBHUNGER.
8. Operations records the remaining payment. The statement derives `PAID` when valid recorded payments reach net payable.
9. If a payment entry was wrong, operations voids it with a reason and records a corrected entry. If approved earnings change, operations appends a credit/debit adjustment instead of rewriting the approved lines.
10. The worker dashboard and statement detail immediately derive their figures from the approved ledger.

## Release verification

`npm run verify:workers` now includes `worker-finance.integration.test.mjs` in addition to the earlier P3 worker and Phase 2 regressions. The finance suite covers role/verification boundaries, account isolation, deduction reasons, duplicate periods, request-key idempotency, business-approved-attendance gating, stale revisions, concurrent adjustments, partial payments, overpayment rejection, completed payment, payment void/replacement, audit entries, secure CSV and dashboard/ledger reconciliation.

Use a dedicated PostgreSQL database only:

```powershell
$env:TEST_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/zobhunger_test"
npm run verify:workers
```

The command intentionally performs migrations and writes temporary fixtures to `TEST_DATABASE_URL`.

## Remaining work after P3.7

There is no remaining planned implementation item in Phase 3. Remaining release evidence is environmental rather than missing P3 functionality:

- apply the migration to a dedicated native/hosted PostgreSQL test database and run `npm run verify:workers`;
- deploy the exact frontend/backend commit and verify the `/api/backend` proxy plus `/route` monitor;
- perform real-device phone/tablet/laptop visual checks, keyboard navigation and print/CSV checks;
- verify production observability/backups and operational access around financial records.

Future product scope remains Phase 4: AI matching, GPS/geographic attendance, advanced analytics, automated operational notifications, incentives, payroll/tax automation and external payment-provider integrations.
