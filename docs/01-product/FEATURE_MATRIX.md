# Feature Matrix

| Capability | Public | Business | Worker | Placement | Technical institute | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Corporate/service pages | ✓ |  |  |  |  |  |
| Jobs/articles | ✓ |  | ✓ |  |  | ✓ manage |
| Workforce requirement intake | ✓ | ✓ |  |  |  | ✓ manage |
| Company profile/dashboard |  | ✓ |  |  |  | ✓ oversight |
| Requirement drafts/linked jobs |  | ✓ |  |  |  | ✓ manage |
| Candidate review |  | ✓ |  | ✓ roster | ✓ student workflow | ✓ manage |
| Deployments/assignments |  | ✓ | ✓ view |  |  | ✓ manage |
| Attendance/corrections |  | ✓ | ✓ |  |  | ✓ manage |
| Attendance approvals |  | ✓ |  |  |  | ✓ queue |
| Worker jobs/saved jobs/applications |  |  | ✓ |  |  | ✓ review |
| Earnings statements |  |  | ✓ |  |  | ✓ manage |
| Placement opportunities/applications |  |  |  | ✓ |  | ✓ oversight |
| Technical students/opportunities | intake |  |  |  | ✓ | ✓ manage |
| Partner/vendor/career/internship intake | ✓ |  |  |  |  | ✓ review |
| Employee joining/offer workflow | intake |  |  |  |  | ✓ HR |
| PF/ESIC compliance | employee forms |  |  |  |  | ✓ scoped |
| Blog CMS | read |  |  |  |  | ✓ manage |
| AI assistant | ✓ chat | contextual | contextual | contextual | contextual | ✓ knowledge/analytics |
| System health/metrics | minimal health |  |  |  |  | ✓ detailed |

## Cross-cutting capabilities

- Versioned `/api/v1` API
- secure cookie sessions for browser portals
- production admin MFA
- department RBAC
- request validation and rate limiting
- PostgreSQL persistence through Prisma
- Redis cache/budget counters with defined fallbacks
- private Cloudinary document storage
- malware scanning for supported uploads in production
- Resend operational email
- Cashfree internship-document checkout
- structured logging, redaction and request IDs
- operational metrics and optional external error forwarding
- CI security gates and k6 load-test harness
