# ZOBHUNGER Phase 1 API

Base path: `/api/v1`

All successful JSON responses use:

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

## Public endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API health check |
| GET | `/jobs` | List OPEN jobs with filtering/pagination |
| GET | `/jobs/:slug` | Read one OPEN job |
| POST | `/jobs/:jobId/applications` | Submit an application; ID or slug is accepted |
| GET | `/articles` | List published articles |
| GET | `/articles/:slug` | Read a published article |
| POST | `/contact` | Submit a contact enquiry |
| POST | `/requirements` | Submit a workforce requirement |

### Jobs query parameters

`city`, `location`, `category`, `engagementType`, `jobType`, `query`, `page`, `pageSize`.
`location` and `jobType` remain compatibility aliases for the frontend.

### Articles query parameters

`query`, `category`, `page`, `pageSize`.

## Authentication

Authentication is stored in an httpOnly cookie. Browser requests must include credentials.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Register BUSINESS or WORKER accounts |
| POST | `/auth/login` | Authenticate and set access cookie |
| POST | `/auth/logout` | Clear access cookie |
| GET | `/auth/me` | Return current authenticated user |

Public registration never accepts the ADMIN role. The initial admin is created through the seed configuration.

## Admin endpoints

Every route below requires authentication and role `ADMIN`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/enquiries` | Paginated enquiries |
| GET | `/admin/requirements` | Paginated requirements |
| GET | `/admin/jobs` | Jobs across all statuses |
| GET | `/admin/applications` | Paginated applications |
| PATCH | `/admin/requirements/:id/status` | Change requirement status |
| PATCH | `/admin/jobs/:id/status` | Change job status |
| PATCH | `/admin/applications/:id/status` | Change application status |

Status mutations create an `AuditLog` entry transactionally.

## Status values

- Requirement: `NEW`, `CONTACTED`, `QUALIFIED`, `CLOSED`
- Job: `DRAFT`, `OPEN`, `CLOSED`
- Application: `SUBMITTED`, `REVIEWED`, `SHORTLISTED`, `REJECTED`

## Rate limits

The server has a global API limit plus stricter limits for authentication and public submissions. Limits are environment configurable. A limit violation returns HTTP `429` with `RATE_LIMIT_EXCEEDED`.

## Request tracing

Responses include `X-Request-Id`. Use the same value to correlate a browser/API failure with structured server logs.

## Independent Business Partner applications

### `POST /api/v1/partner-applications`
Creates a public Independent Business Partner application. The request is JSON and includes the applicant's professional profile, experience, specialization, contribution preference and preferred partnership area. The response includes a one-time `resumeUploadToken` used only if the applicant attaches a resume/profile.

### `PUT /api/v1/partner-applications/:id/resume`
Uploads an optional resume/profile after the application is created. Send the file body directly with `Content-Type` set to PDF, DOC or DOCX, plus `X-Upload-Token` and `X-File-Name` headers. Files are limited to 2 MB and the upload token is invalidated after a successful upload.

### Admin endpoints
- `GET /api/v1/admin/partner-applications`
- `GET /api/v1/admin/partner-applications/:id/resume`
- `PATCH /api/v1/admin/partner-applications/:id/status`

Partner application status values are `SUBMITTED`, `REVIEWED`, `CONTACTED` and `CLOSED`. Admin endpoints require an authenticated `ADMIN` account.
