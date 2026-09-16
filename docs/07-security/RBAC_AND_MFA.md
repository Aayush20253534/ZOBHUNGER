# RBAC and MFA

## Role authorization

Normal portal families require their persisted `UserRole`. A route intended for businesses must verify `BUSINESS`; worker data must verify `WORKER`, and so on.

## Admin authorization pipeline

```text
requireAuth
→ requireRole("ADMIN")
→ requireAdminMfa
→ requireMappedAdminPermission
→ handler
```

## Fail-closed permission mapping

Admin permission middleware maintains explicit route-family mappings. If a protected admin route does not match the configured permission map, it is rejected rather than allowed through. This prevents newly added admin modules from becoming accessible simply because an engineer forgot to update RBAC.

## Department permissions

Examples include:

- HR: joining/worker/career operations as assigned;
- PF/EPFO: separate PF view/verify/update/export capabilities;
- ESIC: separate ESIC capabilities;
- Accounts: earnings/financial operational permissions as configured;
- Technical / Placement Cell: institute and placement operations;
- Legal: legal operational capability;
- Main Admin: administration/access-management responsibilities.

Exact assignments are code/configuration concerns; the authoritative permissions enum is `AdminPermission` in the Prisma schema and the route map is the backend permission middleware.

## MFA

Production admins cannot use the normal admin API without completed TOTP MFA. Enrollment state is deliberately limited to the MFA/auth flow. Secrets are encrypted and recovery codes are one-time material. Production disable is blocked; rotation enters a new enrollment/confirmation flow.
