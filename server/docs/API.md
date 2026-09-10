# ZOBHUNGER API

Base path: `/api/v1`

The Express API is the shared business-logic boundary for the public website and authenticated portals. A future native application should reuse this API rather than duplicate portal logic.

## Response envelope

Successful JSON responses use:

```json
{ "success": true, "message": "...", "data": {} }
```

Errors use:

```json
{
  "success": false,
  "message": "...",
  "error": { "code": "MACHINE_READABLE_CODE" }
}
```

Responses include `X-Request-Id` so client failures can be correlated with structured server logs.

## Authentication

The current web client authenticates using JWT-backed secure httpOnly cookies. Browser requests to authenticated endpoints must include credentials.

Primary auth routes include:

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Compatibility endpoint; BUSINESS/WORKER self-registration is rejected pending review/approval |
| POST | `/auth/login` | Standard authenticated login |
| POST | `/auth/business-login` | Business portal login |
| POST | `/auth/placement-cell-login` | Institution/placement-cell login |
| POST | `/auth/logout` | End the current browser session |
| GET | `/auth/me` | Return the current authenticated user/session |
| POST | `/auth/business/forgot-password` | Request business recovery |
| POST | `/auth/business/reset-password` | Reset a business password |
| POST | `/auth/business/change-password` | Change a temporary/current business password |
| POST | `/auth/admin-mfa/setup` | Begin admin MFA setup |
| POST | `/auth/admin-mfa/confirm` | Confirm admin MFA setup/challenge |

Worker-specific account access is mounted under `/auth/worker/*` and covers approved-worker login, verification-email delivery/consumption and password recovery/reset. `POST /auth/worker/register` remains only as a compatibility guard and returns `403 WORKER_REVIEW_REQUIRED`; it does not create an account.

New business clients begin with the public workforce requirement flow, and new workers begin with the public career-profile flow. The team reviews/verifies the submitted details before approval and further communication. Public BUSINESS/WORKER self-registration is disabled. Admin access is protected separately and MFA is enforced by the admin router.

### Native mobile note

The API/service architecture is suitable for a future Android/iOS client, but the current authentication transport is browser-cookie oriented. Native support should add a properly scoped Bearer/access-token plus refresh-token flow while preserving the same authorization rules and service layer.

## Public API families

| Family | Representative paths | Purpose |
| --- | --- | --- |
| Health | `/health` | API/service health |
| Jobs | `/jobs`, `/jobs/:slug`, `/jobs/:jobId/applications` | Public opportunities and applications |
| Articles | `/articles`, `/articles/:slug` | Published articles/blog content |
| Contact | `/contact` | Public enquiry submission |
| Requirements | `/requirements` | Public workforce requirement submission |
| Partner applications | `/partner-applications` | Independent business partner intake and optional resume upload |
| Placement-cell applications | `/placement-cell-applications` | Institution application/activation and portal routes |
| Career applications | `/career-applications` | Career profile intake and optional PDF resume upload |
| Vendor applications | `/vendor-applications` | Vendor empanelment and document submission |

Public submission routes use stricter submission rate limits in addition to the global API limiter.

## Business portal

Protected by authenticated `BUSINESS` role access. The `/business` family includes:

- `/business/workspace`
- `/business/profile`
- `/business/dashboard`
- `/business/requirements` and requirement detail/update/withdrawal
- `/business/requirement-drafts`
- `/business/requirements/:id/jobs`
- `/business/candidates/*`
- `/business/deployments/*`
- `/business/attendance/*`
- `/business/attendance-approvals/*`
- `/business/reports`, `/business/reports/print`, `/business/reports/export`
- `/business/operations-summary`

Mutating portal operations use the portal write guard and server-side ownership/role checks.

## Worker portal

Protected by authenticated `WORKER` role access. Worker accounts are approval-gated rather than publicly self-created. Public applicants submit `/career-applications`; approved workers receive further communication/access as required. Email verification is required before profile/job workflow access beyond the initial workspace.

The `/workers` family includes:

- `/workers/workspace`
- `/workers/profile` and `/workers/profile/resume`
- `/workers/jobs` and `/workers/jobs/facets`
- `/workers/saved-jobs`
- worker application workflow routes
- assignment and attendance workflow routes
- worker earnings routes and statement export

Worker resume downloads/uploads are private, validated and returned with restrictive browser headers.

## Placement/institution portal

The `/placement-cell-applications` family includes public application/activation plus authenticated `PLACEMENT_CELL` portal routes:

- `/placement-cell-applications/portal/profile`
- `/placement-cell-applications/portal/candidates`
- `/placement-cell-applications/portal/opportunities`
- `/placement-cell-applications/portal/applications`

## Admin and operations

Everything under `/admin` requires authenticated `ADMIN` access and admin MFA. Major route groups include:

- enquiries, workforce requirements, jobs and job applications
- partner and placement-cell application review
- `/admin/partners/*` partner approval/credential operations
- `/admin/careers/*` career-profile review/resume access
- `/admin/vendors/*` vendor review, records and private documents
- requirement/job linking and qualification workflows
- `/admin/candidate-management/*`
- `/admin/deployments/*`
- `/admin/attendance/*`
- worker application and worker attendance review
- `/admin/earnings/*`
- operational reports/export

## Status, validation and concurrency

The API uses Zod validation and machine-readable error codes. Operational entities use explicit status models and, where applicable, revision/updated-at checks to avoid silent overwrites from stale portal state.

## Caching

Redis is optional. When configured and available it is used for selected read-heavy flows such as job catalogue data. The application falls back to PostgreSQL when Redis is unavailable; cache failures must not become a data-source failure.

## Rate limiting

The API has a global rate limiter plus stricter authentication and public-submission limits. Limit violations return HTTP `429` with a machine-readable error code.

## Request tracing

Every request receives an `X-Request-Id`. Preserve that value when reporting production failures so the corresponding structured server log can be found quickly.
