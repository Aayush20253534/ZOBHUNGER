# Vendor empanelment and vendor onboarding

This patch adds company vendor intake and an admin vendor directory to the codebase containing the home scale, verification and branding changes. It is incremental to `zobhunger-home-scale-verification-branding.patch` and the earlier partner approval / career intake work.

## Where to check

| Website route | What it contains |
| --- | --- |
| `/vendor-empanelment` | Public vendor introduction, five service areas, visual review journey and application form |
| `/vendor-onboarding` | Redirect to the canonical vendor empanelment page |
| `/business/vendors` | The same vendor intake inside the authenticated Business Workspace |
| `/admin/vendors` | Admin application inbox, filters, status totals and incomplete drafts |
| `/admin/vendors/directory` | Approved and suspended vendor records, searchable by company, email, city or Vendor Code |
| `/admin/vendors/<application-id>` | Company information, documents, review decisions, contact/capacity editor and activity history |

Vendor entry points appear on Home, For Business, Become a Partner, the footer, the Business Workspace dashboard/navigation and the admin dashboard. Admin screens require an existing ADMIN account. The business workspace retains its existing approval and password-change requirements.

## Application and review flow

1. Companies, agencies, MSMEs, startups, partnerships, sole proprietors and other service providers introduce their business and authorised contact.
2. Applicants select one or more areas: Manpower & Workforce Solutions, Recruitment & Talent Sourcing, Advertising & Marketing, Business & Operational Support, or Other Specialized Services. The form also collects company registration references, address, experience, team capacity, coverage, industry experience, project examples and consent.
3. The form saves a draft, attaches selected documents, then explicitly submits it. A company profile PDF is required before final submission. Retry after a failed upload continues from the documents already saved; success is shown only after final submission.
4. Admins review the company and private documents, record notes, and approve or reject the application. Rejection requires a reason. Rejected applications must be reopened for review before approval.
5. First approval issues a unique `VND-XXXXXXXXXXXX` Vendor Code and adds the company to the directory. Admins can maintain contact details, team size, coverage, availability, account owner and internal notes. They can suspend or reactivate the vendor; its original code and first approval date remain unchanged.

Vendor empanelment records the supplier relationship. It does **not** create a BUSINESS user, issue a password, or change the existing Become a Partner approval/login process. Inclusion in the vendor network does not guarantee a project. The admin screen provides contact links for follow-up; this feature does not send email or credentials.

## Documents and data

- One PDF in each of five categories: company profile (required), company registration, GST/tax registration, MSME/Udyam registration, and another relevant certification/reference document.
- Each file must be non-empty and no larger than 2 MiB. The five slots cap one application's stored documents at 10 MiB.
- Documents are stored privately as database bytes, with filename, category, size, digest and upload time. Include them in normal database backup and retention practices. There are no public document URLs or browser storage copies of tokens/profile data.
- The upload receipt is valid for 60 minutes from the first save. The applicant sees a reference and can contact the team if it expires. A refresh does not automatically restore the unfinished form; re-entering a fresh form creates a new draft. Incomplete drafts are visible through the admin status filter and are never approvable.
- A document cannot replace an existing category's file. Retrying the exact file is safe. Final submission locks the document set for review. Admin maintenance does not rewrite submitted company identity or replace evidence documents.
- Validation checks PDF headers/end markers and size; it is not a malware scanning service. Downloads are forced attachments with `no-store`, `nosniff` and sandbox headers.
- Admin permissions apply to every list, detail, document and write route. Write requests use the existing portal request-header protection. Downloads also verify that the document belongs to the selected vendor application.
- Row locks and revision checks protect concurrent uploads, final submissions, decisions and record updates. A stale admin write returns 409 and asks the reviewer to reload. Submission, review, maintenance and document downloads are audited.

## API routes

All paths below are relative to the existing backend prefix `/api/v1`. Browser requests use the existing `/api/backend` rewrite.

| Method | Path | Access / purpose |
| --- | --- | --- |
| POST | `/vendor-applications` | Public validated company draft; UUID `requestKey` makes retries idempotent |
| PUT | `/vendor-applications/:id/documents/:kind` | Raw PDF; requires `X-Upload-Token` and accepts encoded `X-File-Name` |
| POST | `/vendor-applications/:id/submit` | Final submission with `X-Upload-Token`; company profile required |
| GET | `/admin/vendors` | ADMIN; `page`, `query`, `status`, `category`, `view=applications\|directory`; 12 results per page |
| GET | `/admin/vendors/:id` | ADMIN; safe profile/document metadata and last 30 activity entries |
| POST | `/admin/vendors/:id/review` | ADMIN; `status`, `notes`, `expectedRevision` and `X-Requested-With: XMLHttpRequest` |
| PATCH | `/admin/vendors/:id/record` | ADMIN; contact/capacity/owner/notes fields, `expectedRevision` and portal header |
| GET | `/admin/vendors/:id/documents/:documentId` | ADMIN; private, audited PDF download |

## Apply and deploy

Apply from the repository root. This patch adds two tables and two enums; it does not drop or reseed existing records. Build and redeploy both the backend and frontend, and run the migration against the backend's configured database. No new environment variables or dependencies are required.

```powershell
git apply --check zobhunger-vendor-empanelment.patch
git apply zobhunger-vendor-empanelment.patch

npm --prefix server run build
npm --prefix server run db:deploy
npm --prefix client run build

git add client/src server/src server/prisma server/tests server/package.json docs/vendor-empanelment.md
git commit -m "feat: add vendor empanelment and admin vendor management"
git push origin main
```

If your hosting pipeline already runs `npm --prefix server run deploy`, that script builds and applies migrations. Ensure the backend deploy completes before using the new form; deploying only the client would leave the new API routes unavailable.

## Verification

Production builds and client lint were checked. The vendor suite checks validation, draft/retry behaviour, document limits, private access, concurrent decisions, submission locks, approval codes, suspension/reactivation, record maintenance, paging and audit events. Existing partner/HR integration tests and 89 server tests were also run. Client lint retains two pre-existing unused-variable warnings in `BrandMarqueeMotion.tsx`; the new code has no lint errors.

Database-backed verification used an isolated PostgreSQL-compatible PGlite test database. All migrations applied and Prisma reported no schema drift. This is not a production PostgreSQL staging run. Live browser/mobile rendering was unavailable in this environment; responsive breakpoints and generated production HTML were checked, but a visual browser review is still needed after deployment.

To run the vendor integration suite locally, use a dedicated migrated test database:

```powershell
$env:TEST_DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/DEDICATED_TEST_DATABASE"
npm --prefix server run test:vendors
```

The test suite creates and cleans up its own prefixed fixtures. It mocks email and does not send messages. To review the interface after deploying, submit a test company with a small PDF, open it in the admin inbox, approve it, then check its code and contact editor in the vendor directory. Test at 360px and 390px widths as well as desktop, including the full form, filter controls, document downloads and decision confirmation.
