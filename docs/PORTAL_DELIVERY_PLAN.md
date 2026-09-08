# Portal delivery sequence

Use the original part numbers below for future patches. The historical file
`P2_5_ATTENDANCE_MANAGEMENT.md` and attendance patch filename were misnumbered;
their attendance functionality belongs to P2.6. That work is preserved.

## Phase 2 — Business portal

| Part | Intended scope | Follow-up position |
| --- | --- | --- |
| P2.1 | Business access, onboarding, company profile and ownership | Existing foundation |
| P2.2 | Business dashboard | Existing requirement dashboard; later module totals belong in P2.7 |
| P2.3 | Requirement management, drafts and requirement-to-job linking | Core requirement flows exist; saved drafts and explicit requirement-to-job linking still need completion |
| P2.4 | Candidate tracking, profiles, decisions and history | Existing candidate workflow |
| **P2.5** | **Deployment and team roster** | **This follow-up: dedicated roster, locations, deployment progress and weekly schedules, using the existing assignment foundation** |
| P2.6 | Attendance, business approvals, corrections and approval history | Daily register, calendar, record history and correction workflow exist; business timesheet approvals and approval history remain pending |
| P2.7 | Reports and completed dashboard | Requirement/candidate/deployment/attendance summaries, filters, CSV, print and dashboard connections |
| P2.8 | Integration and release review | End-to-end workflow, company boundaries, mobile layouts, error states, performance and client walkthrough |

Recommended next work: complete P2.6 approval management, then close the remaining
P2.3 draft/job-link gaps before completing P2.7 reporting. Perform the full P2.8
release review after these flows are connected.

## Phase 3 — Worker portal

| Part | Intended scope |
| --- | --- |
| P3.1 | Registration, verification, login, recovery and return-to-job routing |
| P3.2 | Worker profile, onboarding, skills, preferences, CV and completion checklist |
| P3.3 | Job discovery, filters, saved jobs and job details |
| P3.4 | Applications, duplicate prevention, history, withdrawal and status tracking |
| P3.5 | Confirmed assignments, schedules, attendance submission and correction requests |
| P3.6 | Approved earnings and recorded payment history, maintained by operations |
| P3.7 | Completed worker dashboard and release review |

Phase 3 must securely connect authenticated workers with their actual application
and assignment records. P2.5 records selected candidate assignments; it does not
infer a worker-account relationship from names or email addresses.

Phase 4 remains separate: AI matching, geographic attendance, advanced analytics,
operational notifications, incentives and external integrations.
