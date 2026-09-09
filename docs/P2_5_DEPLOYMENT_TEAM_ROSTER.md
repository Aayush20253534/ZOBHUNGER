# P2.5 — Deployment and team roster

> Historical delivery notes. The remaining Phase 2 work is now implemented; see
> [Phase 2 completion](PHASE2_COMPLETION.md) for current behavior and setup.

This completes the deployment part from the original portal plan. The previous
`zobhunger-p2-5-attendance-management.patch` was numbered incorrectly: it added
the assignment foundation and much of **P2.6 — Attendance management**. Keep it
applied. This patch builds on those records and adds the dedicated P2.5 workspace.

## Apply and deploy

Baseline: `09.zip` (archive commit
`699222948bdc0a0335823f5696c3e5fa15be346e`) **with the previously delivered
attendance patch applied**. Do not apply this follow-up directly to the unchanged
ZIP or apply the attendance patch twice.

From the repository root:

```powershell
git apply --check zobhunger-p2-5-deployment-roster.patch
git apply zobhunger-p2-5-deployment-roster.patch
git add client/src server docs
git commit -m "feat(business): complete deployment and team roster workspace"
git push origin main
```

Redeploy both the backend and frontend. This follow-up adds no environment
variables, dependencies or migrations. The assignment/attendance migration from
the earlier patch must already be deployed. The backend's existing build/start
check now verifies the deployment routes as well, to catch missing route builds.

## Pages to check

Append these paths to your frontend domain. Business pages require a business
account; operations pages require an administrator account.

| Page | What to check |
| --- | --- |
| `/business/deployments` | Team cards, assignment statuses, work sites, supervisors, dates and shifts |
| `/business/deployments?view=locations` | Team grouped by work site |
| `/business/deployments?view=schedule` | Monday–Sunday planned shifts with previous/next week controls |
| `/business/deployments?view=progress` | Requested headcount compared with active and upcoming assignments |
| `/business/deployments/<assignmentId>` | Assignment brief, weekly plan, milestones and attendance link |
| `/business/requirements/<requirementId>/deployments` | Roster, schedule and progress for a single owned requirement |
| `/admin/deployments` | All business assignments and the New assignment side panel |
| `/admin/deployments?view=progress` | Deployment progress across business requirements |
| `/admin/deployments/assignments/<assignmentId>` | Assignment settings, end/cancel actions, schedule and internal change notes |

Optional `date=YYYY-MM-DD` selects the reference date. The same `view` choices
work on admin and requirement-specific roster pages. Admin views also accept
`requirementId=<id>` for a focused requirement. IDs come from real records or the
links inside the workspace; literal placeholder IDs are not seeded.

Navigation is available through **Team roster** in the business sidebar, the
requirement brief, selected candidate profiles and the operations dashboard.
Existing attendance URLs and assignment controls remain valid.

## Walkthrough

1. Submit a business requirement and share a candidate through the existing
   operations candidate workflow. The business records a **Selected** decision.
2. As admin, open `/admin/deployments`, choose **New assignment**, select that
   candidate and confirm the location, supervisor, date range, shift and weekdays.
3. As the owning business, open **Team roster**. Try the location, schedule and
   progress views, then open the assignment brief.
4. Follow **View recorded attendance** to the existing attendance calendar.
   Operations can record attendance against the same assignment ID.

New accounts show helpful empty states until assignments exist. Charts and
counts come from saved records; this feature does not generate sample personnel,
attendance, progress or worker account links.

## Interpretation and permissions

- **Active** means the reference date falls within the saved assignment's
  inclusive date range, and the assignment is not cancelled. An active assignment
  may have a day off. This is planned coverage, not a claim that someone attended.
- **Upcoming**, **Ended** and **Cancelled** are separate from active coverage.
  Coverage is active assignments divided by requested headcount. Counts above
  the target remain visible; the bar stops at 100% and the excess is labelled.
- Selected profiles and unassigned selections are shown separately. One
  assignment belongs to one selected candidate and one requirement. A duplicate
  create request returns the existing assignment without overwriting settings.
- The schedule covers Monday–Sunday in IST, includes assignments overlapping
  that week, and excludes cancelled assignments. Overnight shifts show `+1d`.
  Off days and dates outside the assignment have distinct labels.
- Reference-date views use the latest saved assignment, not historical snapshots
  of previous schedule settings. Cancellation removes all planned days. Summary
  cards follow search/location/requirement filters; the status filter affects the
  displayed cards. Site grouping is case-insensitive and can span multiple pages.
- Roster pages contain at most 12 assignments; progress pages contain at most 9
  requirements. Filtering and aggregation happen on the server. Private data
  uses `Cache-Control: no-store`, with no shared Redis or browser-storage cache.
- Business access follows explicit requirement ownership. Matching email
  addresses do not grant access. Other companies' assignment and requirement IDs
  return the same 404 as missing IDs. Only operations can create/edit/end/cancel.
- Existing attendance or correction history locks schedule changes. End dates
  cannot exclude recorded days. Optimistic revisions prevent stale overwrites.
  Known assignment milestones are visible to the business; free-text internal
  change notes remain admin-only. Revoked candidate skills are hidden.

## Visual design and verification

The workspace uses a burgundy three-step graphic, labelled status icons, compact
team cards, progress bars, seven-day schedules and assignment timelines. On
phones, cards stack, summary tiles form two columns, roster filters open in a
drawer, and the assignment form fits the viewport. Controls have keyboard focus
states, text labels and touch targets; animations respect reduced motion.

Verified during implementation:

- Backend and frontend production builds.
- 79 unit and deployment-route checks.
- 61 integration checks across access, dashboard, requirements, candidates,
  submissions, attendance and deployments, using an isolated PGlite test database.
- Production frontend proxy checks for assignment creation, roster, schedule,
  progress and attendance integration, plus the new page routes and noindex
  metadata.
- Frontend lint: no errors; two existing BrandMarqueeMotion warnings.

Browser visual inspection was unavailable in this environment. Before the client
walkthrough, inspect the populated roster and assignment side panel at phone and
desktop widths, including long names, sites and supervisors.

Local commands:

```powershell
npm --prefix server test
npm --prefix server run build
npm --prefix client run build
npm --prefix client run lint
# Use an isolated, migrated test database for the integration suite.
$env:TEST_DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/ISOLATED_TEST_DATABASE"
npm --prefix server run test:deployments
```

**Next:** finish the remaining P2.6 business attendance approval workflow and its
approval history, then P2.7 reports and completed dashboard integration.
