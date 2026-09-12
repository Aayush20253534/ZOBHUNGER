# Phase 10 — Final Production QA & Acceptance

Phase 10 is the release gate for the completed ZOBHUNGER website and Phase 1–3 portal scope. It does not introduce another business feature. It verifies that the accumulated production work is deployable, protected, discoverable where intended, and ready for human acceptance.

## Automated repository gate

Run:

```powershell
npm run test:acceptance
npm run verify
```

`npm run verify` now includes the Phase 10 regression suite while preserving the chatbot release check and every earlier phase suite.

The Phase 10 source tests verify that the final repository still has:

- secure authentication-cookie settings
- branded root error and 404 states
- public submission pages in the acceptance inventory
- protected Business, Worker, Placement Cell and Admin API boundaries
- Phase 8 deployment and Phase 9 SEO gates composed into the final checker
- a strict Redis-ready requirement for final production acceptance
- a read-only live checker that never submits or mutates production data

## Automated live gate

After Vercel and Render deploy the same final commit, run:

```powershell
npm run check:acceptance -- https://zobhungr.com
```

To prove the exact commit is live on both services, pass the full Git SHA:

```powershell
npm run check:acceptance -- https://zobhungr.com FULL_GIT_COMMIT_SHA
```

The report is written to:

```text
.release-artifacts/final-acceptance-check.json
```

### What the live gate verifies

The checker is deliberately read-only. It performs only `GET` requests and composes the existing production-deployment and SEO checks.

It verifies:

1. canonical HTTPS deployment and permanent alternate-host redirect
2. HSTS/CSP/security headers and private-route cache/index protection
3. matching frontend/backend release revision when a SHA is supplied
4. Phase 8, Phase 9 and Phase 10 frontend release markers
5. backend health and canonical `PUBLIC_APP_URL` alignment
6. database readiness
7. private-file-storage configuration readiness
8. Resend/email configuration readiness
9. Redis/cache is actually `ready`, not PostgreSQL fallback
10. responsive `width=device-width` metadata and `en-IN` document language
11. public submission-page availability
12. noindex handling for login/private/submission-only entry pages
13. unauthenticated protection for Business, Worker, Placement Cell and Admin APIs
14. branded 404 behavior
15. web manifest and Open Graph image availability
16. robots, sitemap, canonical URLs, Search Console metadata and structured-data rules through the Phase 9 SEO gate

A successful automated result uses:

```json
{
  "status": "automated_passed"
}
```

This deliberately does **not** claim that authenticated workflows or real provider deliveries were exercised. Those require controlled accounts, inboxes and human visual review.

## Manual acceptance checklist

Use a private browser session and production test accounts. Do not reuse customer records as test data.

### Main Administration

- log in with a Main Admin account
- complete MFA
- confirm the blood-red collapsible sidebar renders correctly
- confirm all intended admin modules are visible
- confirm direct access to protected routes works only after authentication/MFA
- confirm logout invalidates the session

### Department administration

Test one authorized account for each department:

- HR
- Technical
- Placement Cell
- Legal

For each account confirm that permitted modules are visible and unrelated modules remain inaccessible even by direct URL.

### Hiring workflow

- create or use a controlled test requirement
- create a draft opening
- publish it
- submit a controlled application
- review/shortlist it
- share the candidate to the requirement
- verify Business-side visibility
- close/archive the opening
- confirm historical application data remains available

Clean up or clearly label acceptance records after the test.

### Worker Portal

With a controlled worker account:

- register and verify email
- complete profile
- upload/download a PDF resume
- find and save a live test job
- submit an application
- verify application history
- inspect assignments/attendance when test data exists
- inspect approved earnings when test data exists

### Business Portal

With a controlled approved partner account:

- complete first-login password change when applicable
- open dashboard/workspace
- create/edit/withdraw a test requirement
- review shared candidates
- verify deployment and attendance screens
- verify reports/export/print surfaces
- verify company/account pages

### Placement Cell Portal

- activate a controlled Placement Cell account
- open portal profile
- add/update a controlled candidate
- browse opportunities
- submit a controlled candidate application
- verify application state

### Employee joining and protected files

- submit one controlled employee joining form
- verify sensitive fields are not exposed in ordinary email/log output
- verify protected document access requires authorization
- generate/approve an offer letter using controlled test data
- verify the delivered PDF and branding

### Email delivery

Use controlled inboxes and trigger representative messages:

- public enquiry acknowledgement
- career/job application acknowledgement
- status update
- admin invitation or account email
- offer-letter delivery

Confirm sender identity, reply-to address, branding, links, mobile rendering, spam placement and attachment delivery.

### Chatbot/RAG

Run the repository chatbot release gate, then test the production widget with representative public questions. Confirm:

- public ZOBHUNGER answers are grounded in the approved knowledge base
- ambiguous follow-ups use conversation context appropriately
- unrelated/private facts are not invented
- the widget restores conversation history correctly
- mobile open/close/scroll behavior is usable

### Responsive/device review

Review representative widths rather than trusting one resized desktop window:

- small Android/iPhone width
- larger phone
- tablet portrait/landscape
- standard laptop
- wide desktop

Check navbar/menu, hero, cards, Trusted Partners marquee, forms, tables, sidebars, modals, chatbot, footer and long text wrapping.

### Search launch

- verify the Google Search Console property
- submit `https://zobhungr.com/sitemap.xml`
- inspect homepage, `/jobs`, `/blogs`, one live job and one published article
- confirm private portals/forms do not appear as indexable landing pages

## Acceptance decision

The website/Phase 1–3 scope is accepted only when:

- `npm run verify` passes on the final source tree
- the final commit is deployed to both Vercel and Render
- `npm run check:acceptance -- https://zobhungr.com FULL_GIT_COMMIT_SHA` returns `automated_passed`
- the manual checklist above has been completed with controlled production test accounts
- any defects found during manual acceptance are resolved and the affected checks are repeated

Advanced Phase 4 items such as AI matching, geo-attendance, performance analytics, incentive calculation and unrelated future application work are outside this acceptance scope.
