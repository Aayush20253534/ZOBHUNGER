# P2.4 — Candidate tracking

Apply this patch after P2.3 and the requirement/email validation fix. It builds on
the business access repair, dashboard and requirement-management patches, and does
not replace them. No new dependencies or environment variables are required.

## What is implemented

- A private business candidate workspace with five stages: Shared, Shortlisted,
  Interview requested, Selected and Not selected.
- Stage counters, name/city/role search, pagination, a desktop pipeline and card
  view, stacked small-screen layouts, a profile side panel and a full profile page.
- Requirement-specific candidate views linked from each requirement's brief.
- Reviewed skills, experience, availability, a team summary and an external CV
  link when the submitted application supplies a valid HTTPS URL.
- Feedback, interview requests in IST, selection decisions and paginated history.
- A protected admin sharing desk with searchable requirements and applications,
  a sharing confirmation, visibility of company feedback/interview requests, and
  revocation of an incorrectly shared profile.

The board is a review workflow, not drag-and-drop: decisions need a recorded
reason. Metrics come from actual submissions, never invented candidates or AI
scores. Selection does not claim that a candidate is hired, assigned or deployed.

## Review pages after deployment

| Page | Path | Account |
| --- | --- | --- |
| Candidate pipeline | `/business/candidates` | Business |
| Full candidate profile | `/business/candidates/<candidateId>` | Owning business |
| Candidates for one requirement | `/business/requirements/<requirementId>/candidates` | Owning business |
| Sharing and review desk | `/admin/candidate-management` | Admin |

Open **Candidates** in the business navigation. Use **View profile** on a card for
the side panel; **Open full profile** opens the detail URL. From a requirement's
brief, choose **Review candidates for this requirement**. The operations dashboard
links to **Candidate sharing & reviews**. Replace ID placeholders with real IDs
from these links; placeholder URLs do not create data.

## How to test with your accounts

1. Sign in as a business and submit a requirement. It must still be open.
2. Have a real applicant apply to an existing non-demo job opening using its
   normal job application form. The applicant can include an HTTPS CV URL.
3. Sign in as an administrator at `/login`; open `/admin/candidate-management`.
4. Select the business requirement and application, write a relevant summary,
   review the skills/CV, confirm the receiving company and share the profile.
5. Return to that business account and open `/business/candidates`. Review the
   profile, shortlist it, request an interview, add feedback or record a decision.
6. In the admin desk, open that same candidate to see the company's review history
   and requested interview time/details.
7. Verify another business account cannot see the profile or access its ID.

The application picker intentionally excludes rejected applications and the
existing seeded demo jobs. Job creation/publishing is managed by your existing
job-data workflow; this patch does not add an admin job-authoring module. An empty
workspace is expected until eligible applications are explicitly shared. A guest
requirement with a matching email is not automatically claimed by a business.

## Deployment

Commit the frontend **and** backend changes. Deploy the backend migration before
testing the new pages. With the existing backend deployment workflow:

```sh
npm --prefix server run deploy
```

This builds the server and runs `prisma migrate deploy`, including the additive
`20260909120000_business_candidates` migration. It creates two tables and two
enums; it does not delete or populate existing records. On hosting where the root
directory is `server`, the build command remains
`npm ci --include=dev && npm run deploy`, and the start command is `npm start`.
Redeploy the frontend normally after applying the patch.

`GET /api/v1/health` now reports `features.businessCandidates: true`. The compiled
build and existing `check:business` probes also check the candidate list, detail
and review methods. A route 404 usually means the old backend is still serving
requests or the frontend is pointing at a different backend.

## API

All business routes require a BUSINESS session. Admin routes require ADMIN.
POST requests require `X-Requested-With: XMLHttpRequest` and JSON bodies. Private
responses are `Cache-Control: no-store`; candidate data is not cached in Redis.

| Method | Path below `/api/v1` | Purpose |
| --- | --- | --- |
| GET | `/business/candidates` | Search, stage totals and paginated candidates |
| GET | `/business/candidates/:id` | Profile and paginated history |
| POST | `/business/candidates/:id/reviews` | Feedback, decision or interview request |
| GET | `/admin/candidate-management` | Review all explicitly shared candidates |
| GET | `/admin/candidate-management/requirements` | Eligible requirement search |
| GET | `/admin/candidate-management/applications` | Eligible application search |
| POST | `/admin/candidate-management` | Share an application with a requirement |
| GET | `/admin/candidate-management/:id` | Read a company's candidate review |
| POST | `/admin/candidate-management/:id/revoke` | Remove business access, retaining history |

Lists accept `page`, `query`, `status` (`ALL` or a stage), and optional
`requirementId`. A page contains at most 15 profiles. Counts cover the same search
and requirement across every stage/page; a pipeline page contains only that page's
profiles. Detail accepts `historyPage`, with at most 20 events per page. Admin
lookups accept `page` and `query` and return at most 10 results.

Example review bodies:

```json
{"action":"STATUS","revision":0,"status":"SHORTLISTED","note":"Relevant territory experience."}
```

```json
{"action":"FEEDBACK","revision":1,"note":"Please confirm availability for weekend store visits."}
```

For `action: "INTERVIEW"`, include `revision`, `note`, `interviewAt` (ISO datetime
with an explicit offset), `interviewMode` (`PHONE`, `VIDEO`, `IN_PERSON`) and
`interviewDetails`. The proposed time must be at least five minutes ahead and
within 180 days. The UI converts explicitly from IST, independent of the device's
timezone. A subsequent proposal creates another history event.

Reviews require the latest candidate revision. Conflicts return 409; refresh and
review the current state before resubmitting. Completed decisions can be reopened
to Shared with a reason before changing them. Closed requirements are read-only.
Admin revocation is explicit, reasoned and not reversible through this UI.

## Data ownership and boundaries

`BusinessCandidate` links one existing `JobApplication` to one
`WorkforceRequirement`. The `(requirementId, applicationId)` unique constraint
prevents duplicate sharing. The curated profile is a snapshot: later application
changes do not silently rewrite a shared profile.

Explicit company ownership takes precedence over the submitting account; legacy
requests without a company profile use their authenticated business submitter.
There is no email-based ownership inference. Cross-company IDs return the same
404 as missing IDs. Business responses omit raw application IDs, applicant
email/phone, internal audit identities, IPs and unrelated institution records.

Sharing, decisions, interview requests and revocation append history and audit
records transactionally. Requirement row locks coordinate these mutations with
closure/withdrawal; conditional candidate revisions prevent lost updates. A
business decision does not overwrite the source application's status or another
company's candidate submission. Revoked candidates disappear from business
queries immediately; the admin desk retains their history.

The API never downloads CVs or renders them as HTML. Only credential-free HTTPS
links are exposed; they open separately with `noopener`, `noreferrer` and no
referrer. The account team should review submitted files before sharing them.

## Interview delivery and future modules

Interview requests are saved in the business/admin portal. They do **not** send
emails/calendar invites, confirm availability or create assignments. Mailjet
suspension therefore does not block P2.4. Scheduling confirmation is currently
coordinated by the account team. Attendance, earnings, automated notifications and
AI matching remain separate planned modules.

## Verification

```sh
npm --prefix client run build
npm --prefix client run lint
npm --prefix server test
# Set TEST_DATABASE_URL to a dedicated, migrated test database first:
npm --prefix server run test:candidates
```

The candidate integration suite refuses to run without `TEST_DATABASE_URL`. It
writes temporary fixture users/jobs/requirements, then removes only those fixtures.
Never point it at production. It tests tenant boundaries, roles, missing write
headers, duplicate sharing, CV filtering, interview time validation, decisions,
history pagination, stale/concurrent reviews, requirement closure and revocation.

During patch preparation, the existing business, dashboard, requirement and email
recovery suites were also run against an isolated PGlite-backed PostgreSQL
protocol server. This validates behavior but is not a native PostgreSQL load test.
Production frontend route/noindex and authenticated API-proxy checks passed.
Interactive browser visual checks were blocked by the environment; manually check
the new screens at desktop and 320/390/430px phone widths after deployment.
