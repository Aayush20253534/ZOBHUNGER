# Endpoint Families

This is a maintainers' map, not an OpenAPI contract. Exact methods/schemas live in `server/src/modules/**/**.routes.ts`.

| Base family | Purpose |
|---|---|
| `/api/v1/auth` | login/logout, role-specific auth, password recovery/change, admin MFA |
| `/api/v1/business` | business workspace/profile/dashboard/requirements plus candidate, deployment, attendance and reports subrouters |
| `/api/v1/workers` | worker workspace/profile/resume/jobs/saved jobs plus worker workflow routes |
| `/api/v1/jobs` | public job catalogue/application-related public behavior |
| `/api/v1/articles` | published articles |
| `/api/v1/contact` | public contact enquiries |
| `/api/v1/requirements` | public workforce-requirement intake |
| `/api/v1/partner-applications` | partner intake |
| `/api/v1/placement-cell-applications` | placement partnership + placement portal APIs |
| `/api/v1/technical-institute-applications` | technical-institute application/portal APIs |
| `/api/v1/career-applications` | careers intake |
| `/api/v1/internship-applications` | internship intake |
| `/api/v1/internship-payments` | payment checkout/status/receipt flows |
| `/api/v1/vendor-applications` | vendor intake |
| `/api/v1/employee-joining` | public/private employee-joining workflow endpoints |
| `/api/v1/employee-compliance` | employee-facing compliance endpoints |
| `/api/v1/chatbot` | assistant messages/context/lead behavior |
| `/api/v1/telemetry` | bounded client telemetry ingestion |
| `/api/v1/admin` | all administrator modules and protected system health/metrics |

## Health endpoints

- `/api/v1/health` — minimal public health signal;
- `/api/v1/health/ready` — readiness signal;
- `/route` and `/ready` — deployment monitoring compatibility;
- `/api/v1/admin/system/health` — detailed authenticated health;
- `/api/v1/admin/system/metrics` — authenticated operational metrics.

The public health endpoint deliberately does not disclose provider configuration, cache internals or private application origin details.
