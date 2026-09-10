# Testing and verification

## Repository verification

From the repository root:

```bash
npm run verify
```

This runs:

1. server tests
2. server production build and Prisma generation
3. client lint
4. client production build

The release should not proceed while any stage fails.

## Server test suites

The default server suite is:

```bash
cd server
npm test
```

Focused integration/contract commands are available for the operational modules, including:

```text
npm run test:business
npm run test:dashboard
npm run test:requirements
npm run test:candidates
npm run test:attendance
npm run test:deployments
npm run test:partner-hr
npm run test:vendors
npm run test:workers
npm run test:cache
```

These suites cover authentication/authorization, validation, business ownership, revision protection, requirements, candidate/deployment workflows, attendance, partner/vendor flows, worker workflows, earnings and cache behavior.

## Running API smoke tests

Start the API with a migrated database, then in another terminal run:

```bash
npm run test:smoke
```

From the repository root the wrapper command is:

```bash
npm run smoke:server
```

To target another deployment:

```bash
SMOKE_API_URL=https://api.example.com/api/v1 npm run test:smoke
```

PowerShell:

```powershell
$env:SMOKE_API_URL="https://api.example.com/api/v1"
npm run test:smoke
```

## Public-site manual QA

Verify at minimum:

1. navbar, mobile navigation and footer links open valid destinations.
2. the footer shows the exact public office address and worldwide-client message.
3. app-store badges show a coming-soon state while URLs are blank and become external links only when configured.
4. `/jobs` and job detail pages load API data.
5. public job applications submit and duplicate handling is understandable.
6. `/hire-workforce` creates a workforce requirement.
7. `/contact` creates a contact enquiry.
8. `/careers/apply` remains visually contained at desktop/tablet/mobile widths and can submit a profile/resume.
9. partner, placement-cell and vendor application forms submit correctly.
10. articles/blog pages load published content.
11. the mobile footer shows the single public office address followed by dedicated Business, Careers, Queries and Legal email rows without horizontal overflow.
12. no public page has broken images, horizontal overflow, dead CTAs or console errors.

## Business portal manual QA

Verify:

1. business login/recovery works.
2. workspace/profile/dashboard load only for the correct business.
3. requirement creation, editing, withdrawal and drafts work.
4. candidate lists/details are scoped to the business.
5. deployments/rosters are visible and protected correctly.
6. attendance and correction flows work.
7. attendance approvals and reports/CSV export work.
8. stale revisions/ownership violations are rejected rather than silently overwritten.

## Worker portal manual QA

Verify:

1. `/for-workers` sends new workers to `/careers/apply`; no public worker signup action is exposed.
2. `/worker/register` does not expose a registration form, and both worker registration API paths reject self-registration with `WORKER_REVIEW_REQUIRED` without creating a user.
3. the public career profile/CV form submits without an account and appears in the admin career-review workflow.
4. approved worker email verification, login and recovery work.
5. unverified approved accounts cannot bypass the verification gate.
6. profile and resume operations work.
7. jobs, filters and saved jobs work.
8. application submit/detail/withdraw flows work.
9. assignments and attendance work.
10. earnings statements and export work.

## Placement/institution portal manual QA

Verify activation/login, institution profile, managed candidates, opportunities and submitted candidate applications.

## Admin/operations manual QA

Verify admin MFA and access control, then review representative records across enquiries, requirements, jobs, applications, partners, placement cells, careers, vendors, candidates, deployments, attendance and earnings.

Non-admin roles must receive authorization failures for `/admin/*` routes.

## Infrastructure QA

Check:

- `X-Request-Id` is present and matches structured logs.
- Resend notifications arrive when mail is enabled and the sender domain is verified.
- Redis-backed reads work when Redis is available and PostgreSQL fallback works when it is intentionally unavailable.
- private file downloads return restrictive headers and cannot be accessed by unauthorized users.
- production CORS accepts only configured frontend origins.
- secure-cookie authentication works over HTTPS.

Use Prisma Studio during local QA when direct record inspection is useful:

```bash
cd server
npm run db:studio
```
