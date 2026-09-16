# Business Portal

## Entry and account

Routes live under `/business/*` with login, registration, password recovery/change and onboarding/company-profile surfaces.

## Workspace capabilities

### Dashboard
Summarizes business operational data using authenticated company ownership boundaries.

### Requirements
Businesses can create workforce requirements, inspect individual requirements, update eligible records and withdraw them. A reusable draft subsystem allows incomplete requirements to be saved and later submitted.

### Linked openings
Requirement-specific job/opening views connect operational demand with hiring work managed by the ZOBHUNGER team.

### Candidates
Businesses receive candidates shared into their scope and can inspect history/resumes and submit review decisions according to route permissions/domain state.

### Deployments and attendance
Businesses can inspect workforce assignments/deployments, daily/monthly attendance data and correction/approval workflows exposed to their account.

### Reports
Operational reports can be filtered, rendered for print and exported as CSV through server-generated data rather than browser-side bulk table scraping.

## Data protection

Every business record query is ownership-scoped by the authenticated business user. The business router marks private responses `no-store`; mutations require the business role and portal-write protections.
