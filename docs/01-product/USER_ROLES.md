# User Roles

The persisted application roles are defined by `UserRole` in `server/prisma/schema.prisma`.

| Role | Primary surface | Typical responsibility |
|---|---|---|
| `ADMIN` | `/admin/*` | Operations, HR, compliance, technical, placement, legal, finance and platform administration according to permissions |
| `BUSINESS` | `/business/*` | Company profile, workforce requirements, candidates, deployments, attendance and reports |
| `WORKER` | `/worker/*` | Profile/resume, jobs, applications, assignments, attendance and earnings |
| `PLACEMENT_CELL` | `/placement-portal/*` | Candidate roster, opportunities and candidate applications |
| `TECHNICAL_INSTITUTE` | `/technical-institute-portal/*` | Student roster, technical opportunities, applications and reports |

## Admin departments

Admin users also carry a department/access model. Current departments are:

`MAIN_ADMIN`, `HR`, `PF_EPFO`, `ESIC`, `ACCOUNTS`, `TECHNICAL`, `PLACEMENT_CELL`, `LEGAL`.

`MAIN_ADMIN` is the broad administration function. Other departments receive capabilities through explicit `AdminPermission` values such as `REQUIREMENTS_MANAGE`, `ATTENDANCE_MANAGE`, `EMPLOYEE_JOINING_MANAGE`, `PF_EXPORT`, `ESIC_VERIFY`, `TECHNICAL_MANAGE`, `BLOGS_MANAGE` and `AI_ASSISTANT_MANAGE`.

## Important authorization rule

The frontend may hide navigation items for usability, but **backend middleware is authoritative**. `/api/v1/admin/*` passes through authentication, admin-role verification, production MFA enforcement and fail-closed permission mapping before protected handlers run.

## Account lifecycle patterns

- Business accounts can be created/activated through the partner/business workflow and use business-specific authentication routes.
- Workers are profile/intake oriented and have worker access/verification flows before portal use.
- Placement cells and technical institutes are approved partner identities with their own login surfaces.
- Department admins can be invited and activated through admin-access flows.

See [Authentication](../05-features/AUTHENTICATION.md) and [RBAC and MFA](../07-security/RBAC_AND_MFA.md) for technical controls.
