# Admin Portal

## Scope

The admin portal is the operational control surface. It is not one universal superuser screen: department permissions determine which route families an administrator can use.

## Major areas

- overview/dashboard;
- enquiries and shared intake queue;
- workforce requirements and linked jobs;
- candidates, deployments and attendance;
- attendance approvals and reporting;
- worker applications/attendance/earnings;
- partner, placement, technical-institute and vendor administration;
- careers and internships;
- employee joining and offer workflow;
- PF and ESIC compliance;
- article/blog CMS;
- AI-assistant knowledge/analytics tools;
- admin user/access management;
- security settings, detailed system health and operational metrics.

## Security chain

Every `/api/v1/admin/*` request passes through authentication, admin role, MFA and mapped permission middleware. Permission mapping is fail-closed so a newly created admin route family is not silently accessible because somebody forgot an RBAC entry.

## Admin access management

Main administration can list/create department users, change access/status and resend invitations. Invitation activation is handled through a dedicated activation flow rather than exposing a default password.

## Operational data behavior

Admin queues are expected to paginate/filter on the server. Sensitive exports have row ceilings. Private data is not cached as public content and private downloads are mediated by authenticated endpoints.
