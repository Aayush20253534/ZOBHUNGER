# Portal delivery sequence

Use the original part numbers below for future patches. The historical file
`P2_5_ATTENDANCE_MANAGEMENT.md` and attendance patch filename were misnumbered;
their attendance functionality belongs to P2.6. That work is preserved.

## Phase 2 — Business portal

| Part | Intended scope | Follow-up position |
| --- | --- | --- |
| P2.1 | Business access, onboarding, company profile and ownership | Existing foundation |
| P2.2 | Business dashboard | Complete; requirement and operations summaries are connected |
| P2.3 | Requirement management, drafts and requirement-to-job linking | Complete; private saved drafts and reviewed, linked job publishing |
| P2.4 | Candidate tracking, profiles, decisions and history | Existing candidate workflow |
| **P2.5** | **Deployment and team roster** | **Complete; dedicated roster, locations, deployment progress and weekly schedules** |
| P2.6 | Attendance, business approvals, corrections and approval history | Complete; attendance, business decisions, corrections and immutable decision snapshots |
| P2.7 | Reports and completed dashboard | Complete; four filtered reports, CSV, print, charts and dashboard connections |
| P2.8 | Integration and release review | Code checks, session recovery fixes and release tooling complete; hosted PostgreSQL, deployment, email and real-device signoff remain (see P2_8_RELEASE_REVIEW.md) |

The completion patch implements P2.3, P2.6 and P2.7 together and includes the P2.8
integration work and client walkthrough. See `PHASE2_COMPLETION.md` for deployment,
page endpoints, verification evidence and the remaining real-device visual signoff.
The P2.8 follow-up adds a repeatable release command, PostgreSQL CI, read-only
deployment checks and workspace session regression coverage. Its evidence and
remaining external checks are recorded in `P2_8_RELEASE_REVIEW.md`.
P3.1–P3.3 are implemented in the worker-portal patch described in
`P3_1_3_WORKER_PORTAL.md`. P3.4 is the next implementation scope; Phase 2 production
signoff is tracked separately.

## Phase 3 — Worker portal

| Part | Intended scope |
| --- | --- |
| P3.1 | Implemented: registration, verification, login, recovery and return-to-job routing |
| P3.2 | Implemented: worker profile, onboarding, skills, preferences, private PDF CV and completion checklist |
| P3.3 | Implemented: live job discovery, filters, saved jobs and job details |
| P3.4 | Applications, duplicate prevention, history, withdrawal and status tracking |
| P3.5 | Confirmed assignments, schedules, attendance submission and correction requests |
| P3.6 | Approved earnings and recorded payment history, maintained by operations |
| P3.7 | Completed worker dashboard and release review |

Phase 3 must securely connect authenticated workers with their actual application
and assignment records. P2.5 records selected candidate assignments; it does not
infer a worker-account relationship from names or email addresses.

Phase 4 remains separate: AI matching, geographic attendance, advanced analytics,
operational notifications, incentives and external integrations.
