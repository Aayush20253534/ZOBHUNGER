# Partner approval and career intake

This patch is based on the completed Phase 2 code plus `zobhunger-public-business-access.patch`. It replaces business self-registration and adds a public career profile form with an HR review area. The existing worker and institution account flows are retained.

> **Current worker policy:** the career profile form is now also the required first step for new workers. Public worker account creation has since been retired; approved workers receive further communication/access after team review and verification.

## Where to check

| Page | What changed |
| --- | --- |
| `/for-business` | Become a Partner and Business login buttons, approval journey, updated account FAQs |
| `/become-a-partner#partner-application` | Existing application form with the application → review → approval → first-login explanation |
| `/business/register` | Redirects to the partner application; does not create accounts |
| `/business/login` | Partner ID or approved account email, plus password |
| `/business/change-password` | Required first-login password setup before workspace access |
| `/admin` | Links to Partner review & approvals and Career profiles & HR review |
| `/admin/partners` | Searchable partner inbox, real status counts and application links |
| `/admin/partners/{applicationId}` | Full review, notes, approval, credentials status and review history |
| `/careers` | Visible Submit your profile / CV buttons |
| `/careers/apply` | Personal details, repeatable education and experience, skills, preferences and PDF resume |
| `/admin/careers` | Searchable HR inbox with review status filters |
| `/admin/careers/{applicationId}` | Candidate details, private resume download, notes, shortlisting and contact links |
| Public footer | Become a Partner replaces Register your business; Submit your CV / profile is added under Opportunities |

Sign in at `/login` with an existing ADMIN account to use the review pages. This patch does not create an administrator or grant admin rights to applicants.

## Deployment

Apply from the repository root:

```powershell
git apply --check zobhunger-partner-approval-career-intake.patch
git apply zobhunger-partner-approval-career-intake.patch
npm --prefix server run build
npm --prefix server run db:deploy
npm --prefix client run build
```

Run the migration against the same database used by the deployed backend, then deploy the new backend and frontend together. A frontend-only deployment is insufficient.

For a Render service rooted at `server`, the existing `deploy` script builds the server and runs migrations:

```text
Build command: npm ci && npm run deploy
Start command: npm start
```

The new migration is `20260910180000_partner_approval_and_career_intake`. It adds account approval/password setup fields, approval review fields and a CareerApplication table. Do not edit an already-applied migration or run `db:seed` as part of this update.

### Existing business accounts

Existing BUSINESS users are unapproved after this migration. They retain their user IDs, company profiles, requirements and other records, but cannot access the Business Portal until reviewed. Ask these users to submit the partner form with the same account email. When an admin approves that application, the account is linked in place, a Partner ID and temporary password are issued, and old sessions are invalidated. Existing company profile data is preserved.

Existing ADMIN, WORKER and PLACEMENT_CELL users are not subject to the business approval gate. An application cannot take over an email that belongs to another role, an inactive account or an already-approved business. Resolve those conflicts with the applicant before approval.

## Approval and account access

1. The applicant submits the existing Become a Partner form. This creates an application only, with no user account or login session.
2. Admin opens the application, reviews its details and records internal notes. Reviewed, Contacted, Rejected and Closed are available review decisions.
3. Admin selects **Approve & issue Partner ID**, checks the displayed company/email and confirms.
4. The server locks the application and serializes approvals by email. It creates or links the pending business account, stores an Argon2id password hash, assigns a unique `ZB-...` code and records the approval. Repeated approval does not create a second account or issue another password.
5. A temporary password valid for 72 hours is issued. The email message contains the Partner ID, temporary password, login link and expiry.
6. A first login returns a restricted session. Both dedicated and generic login routes enforce the approval rules; private APIs reject the restricted session with `PASSWORD_CHANGE_REQUIRED` until setup finishes.
7. The partner supplies the temporary password and a different permanent password. The server invalidates older sessions and reset tokens, then issues a fresh session with workspace access.

New passwords use the existing policy: 8–128 characters, uppercase, lowercase and a number. Passwords are never stored in plaintext in the database. The temporary password is not returned by any profile, list, history or subsequent detail endpoint.

A partner who uses verified-email password recovery can choose their permanent password there instead. Recovery is restricted to approved accounts and cannot preserve the temporary password.

### Email failure and credentials handover

The existing Mailjet integration is used. No new environment variables are required. Confirm these backend settings are valid:

```dotenv
MAILJET_API_KEY=your-existing-mailjet-key
MAILJET_SECRET_KEY=your-existing-mailjet-secret
MAIL_FROM_EMAIL=your-verified-sender@example.com
MAIL_FROM_NAME=ZOBHUNGER
PUBLIC_APP_URL=https://your-frontend-domain
```

`PUBLIC_APP_URL` must point to the frontend; if omitted, the first configured `CLIENT_ORIGIN` is used. Keep Mailjet secrets on the server.

Check email configuration with:

```powershell
npm --prefix server run check:email
```

Approval is retained if email fails. The admin review screen distinguishes an email accepted by the provider from a failure; acceptance does not guarantee inbox delivery. The approving admin receives a one-time credential panel, initially masked, with an explicit copy action for secure handover to the verified applicant. Do not paste credentials into review notes or ordinary project documentation.

If the response was lost or the temporary password expired, admins can **Reissue temporary credentials** before the partner finishes password setup. This preserves the Partner ID, replaces the temporary password and invalidates prior sessions. After setup, use the ordinary password recovery flow. No mail was sent to real applicants while validating this patch.

## Career profile storage and HR workflow

The public form does not require or create an account. It records name, contact details, city/state, role interest, qualifications, employment history, skills, location preferences, availability, optional portfolio and additional notes. Freshers can enter zero experience and leave employment history empty. The recruitment storage/contact consent checkbox is required and its timestamp is saved.

CV uploads accept PDF files up to 2 MB. The client checks size/type, and the backend checks the content signature, end marker and size. This is format validation, not a malware scanning service. Files are stored in the existing PostgreSQL database as private bytes rather than on an ephemeral server disk or a public URL. Include these records in database backups and storage planning.

Profile submission is idempotent for a client-generated request key. The response provides a resume upload receipt valid for 30 minutes. The upload token is hashed in the database; it permits attaching a resume to that application and safely retrying the same upload, without overwriting an already attached file. If uploading fails, the form retains the saved profile reference and offers a retry instead of posting another profile. It does not keep applicant data or credentials in localStorage.

Admins can filter/search submissions, review all profile sections, download resumes and save internal notes. Review statuses are Reviewed, Shortlisted, Contacted, Hired and Rejected. Notes and status changes are recorded in audit history; resume downloads are audited. Email and phone links let HR contact shortlisted applicants. Changing status does not automatically send recruitment messages or promise a job.

Only ADMIN accounts can read career applications or download their files. Business clients, workers and guests have no access to this inbox. Downloads are attachments with `no-store` and `nosniff` headers. Stale admin edits are rejected so reviewers can reload the latest record.

## API routes

Paths below are relative to `/api/v1`. Browser requests continue to use the existing `/api/backend` rewrite.

| Method | Path | Access |
| --- | --- | --- |
| POST | `/auth/register` with `role: BUSINESS` | Rejected with `BUSINESS_APPROVAL_REQUIRED` |
| POST | `/partner-applications` | Public application submission |
| POST | `/auth/business-login` | Partner ID/approved email and password |
| POST | `/auth/business/change-password` | Approved business session; restricted first-login sessions allowed |
| GET | `/admin/partners` | Admin partner inbox |
| GET | `/admin/partners/:id` | Admin partner details/history |
| POST | `/admin/partners/:id/review` | Admin review/approval, expected update timestamp required |
| POST | `/admin/partners/:id/credentials` | Admin reissue before password setup |
| POST | `/career-applications` | Public profile submission with consent |
| PUT | `/career-applications/:id/resume` | Valid upload receipt; raw PDF body |
| GET | `/admin/careers` | Admin HR inbox |
| GET | `/admin/careers/:id` | Admin candidate profile/history |
| POST | `/admin/careers/:id/review` | Admin review/shortlist/notes |
| GET | `/admin/careers/:id/resume` | Admin private download |

New authenticated write actions require `X-Requested-With: XMLHttpRequest`. All new private/read and receipt responses use `Cache-Control: no-store`. Rate limits cover public submission, uploads and password actions.

## Verification

Run the new integration suite against a dedicated migrated test database, never the production database:

```powershell
$env:TEST_DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/TEST_DATABASE"
npm --prefix server run test:partner-hr
```

The suite uses a mocked mailer and covers blocked self-registration, account provisioning, unique IDs, concurrent/repeated approval, role checks, password setup, session invalidation, legacy account linking, email failure/reissue, recovery, form validation, safe submission retries, upload limits and tokens, private downloads, HR status/history and stale edits. Existing portal test fixtures were updated to use explicitly approved business accounts.

The patch was checked using production builds, lint, schema/migration validation and integration tests on an isolated PostgreSQL-compatible [PGlite socket](https://pglite.dev/docs/pglite-socket) test database. PGlite is used only in the verification environment and is not added to application dependencies. Its connection multiplexer differs from a normal PostgreSQL server; staging on the deployed PostgreSQL version remains the final deployment check. Desktop/mobile browser rendering and live Mailjet inbox delivery were not verified in this environment.
