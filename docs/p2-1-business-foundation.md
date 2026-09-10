# P2.1 — Business access and company setup

This patch adds a working business portal foundation to the website. It includes registration, dedicated business sign-in, guided company onboarding, a persistent editable company profile, account recovery and a responsive workspace layout. Existing AI illustrations are reused for access and welcome screens. The profile completion graphic is based on saved company fields.

This part provides one business owner account per company profile. Inviting colleagues, multi-company memberships, dashboard metrics, requirement management screens, candidate tracking, attendance and reports are later parts. The existing public requirement form remains available.

## Apply and run

Apply from the repository root, on top of the latest mobile menu/footer patch:

```powershell
git apply --check zobhunger-p2-1-business-foundation.patch
git apply zobhunger-p2-1-business-foundation.patch
npm --prefix server ci
npm --prefix client ci
npm --prefix server run db:deploy
npm --prefix server run build
npm --prefix client run build
```

The migration is additive. It adds company setup fields, a company reference on requirements, password recovery tokens and session versions. Run the migration before starting the updated API. It retains existing accounts, enquiries, jobs and placement records. Only requirements already explicitly linked to a business user are backfilled to that user's company; matching email addresses never establish ownership.

For local use, start the API and frontend in separate terminals:

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

## Environment

Keep the existing database, JWT and Redis configuration. Set these values in the API environment (local `server/.env`, or your API hosting settings):

```dotenv
CLIENT_ORIGIN=http://localhost:3000
PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_your_api_key
MAIL_FROM_EMAIL=your-verified-sender@example.com
MAIL_FROM_NAME=ZOBHUNGER
```

Use the deployed frontend URL for `CLIENT_ORIGIN` and `PUBLIC_APP_URL` in production. `CLIENT_ORIGIN` can contain a comma-separated list of permitted website origins. `PUBLIC_APP_URL` must be one frontend URL; it controls the destination of password recovery links. Keep `NODE_ENV=production` on the deployed API so cookies are Secure. Production portal access requires HTTPS.

Resend recovery uses a verified sender domain and does not require `SALES_TEAM_EMAIL`. That setting remains necessary for existing operational enquiry emails. Blank optional mail settings are accepted; sign-in and company setup work without email configuration, while recovery returns an explicit unavailable message. Password recovery emails are delivered through Resend after a request is accepted. Check API delivery logs if a link does not arrive.

Frontend configuration (local `client/.env.local`, or frontend hosting settings):

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_DATA_MODE=api
```

In production, use your deployed API URL including `/api/v1`, then rebuild the frontend. Browser requests now go through the Next `/api/backend/*` rewrite so authentication cookies belong to the website even when Express uses another domain. Server-rendered public content still calls the configured API directly. Users with cookies from the previous direct-API login need to sign in once through the updated website. Use a Next server or Vercel deployment; this rewrite requires a server and will not work in a plain static export.

## Pages to check

Append these paths to `http://localhost:3000` or your deployed website URL:

| Page | Path | Check |
| --- | --- | --- |
| Business registration | `/business/register` | Create a business account; continue to company setup. |
| Business sign-in | `/business/login` | Sign in with a BUSINESS account. Other roles receive a clear access message. |
| Company setup | `/business/onboarding` | Complete Company → Contact → Review; save to the database. |
| Workspace overview | `/business` | Welcome illustration, actual profile completion, company summary and working next-step links. |
| Company profile | `/business/company` | View and edit saved company details; refresh to confirm persistence. |
| Account and security | `/business/account` | Review account details and request a password recovery email. |
| Forgotten password | `/business/forgot-password` | Request a recovery link; see the generic acceptance message. |
| Password reset | `/business/reset-password` | Open through the emailed link. Without a valid token it offers a fresh recovery request. |
| Public business entry | `/for-business` | “Business workspace” opens the dedicated sign-in page. |
| Existing portal access | `/login` | BUSINESS accounts now enter `/business`. Other role destinations stay as before. |

Protected pages redirect signed-out users to business sign-in. The API enforces role and ownership checks independently of the interface. Access pages are not indexed. The portal has its own navigation and compact footer; public site pages retain their existing header and footer.

## API endpoints

These are the Express endpoints; browser requests use the equivalent path after `/api/backend`:

| Method | API path | Access / behaviour |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Existing public registration, with `role: "BUSINESS"`. |
| POST | `/api/v1/auth/business-login` | Dedicated business login; sets the session cookie. |
| POST | `/api/v1/auth/logout` | Clears the session cookie. |
| GET | `/api/v1/business/workspace` | Current business account and its company profile. |
| GET | `/api/v1/business/profile` | Current account's company only. |
| PUT | `/api/v1/business/profile` | Validated profile update; requires `X-Requested-With: XMLHttpRequest`. |
| POST | `/api/v1/auth/business/forgot-password` | Generic response, rate limiting and per-account issuance cooldown. |
| POST | `/api/v1/auth/business/reset-password` | Single-use token and new password. |
| POST | `/api/v1/requirements` | Guests remain supported; valid signed-in submissions receive server-derived ownership. |

Profile fields: `companyName`, `contactPerson`, `phone`, `industry`, `city`, `state`, and optional `website`. A blank website becomes null. Owner IDs are not accepted in the profile payload. Requirements are bound to the verified session, regardless of any owner fields supplied by a browser. A supplied expired cookie must be renewed before a requirement can be submitted while signed in.

Recovery links expire after 30 minutes. Only SHA-256 token hashes are stored. The raw token travels in the email link's fragment, not its query string. Resetting the password consumes the token and increments the account session version, invalidating old sessions. Private API responses use `Cache-Control: no-store` and are not placed in the public Redis cache.

## Verification

```powershell
npm --prefix server test
npm --prefix server run build
npm --prefix client run lint
npm --prefix client run build
```

The integration suite uses a dedicated database and a mocked mail transport. It never sends real email. After creating and migrating a separate test database, run:

```powershell
$env:TEST_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/zobhunger_test"
npm --prefix server run test:business
Remove-Item Env:TEST_DATABASE_URL
```

The suite rejects an absent `TEST_DATABASE_URL`; it never falls back to the application's database. It covers guest and wrong-role denial, independent company profiles, owner-field spoofing, requirement ownership, legacy sessions, recovery response privacy, token hashing, cooldown, expiry, reuse, password changes, and session invalidation. It removes the temporary records it creates.

For visual review, check 320px, 390px, 768px and desktop widths: mobile navigation opens and closes, all three setup steps fit the screen width, inputs retain readable sizes, long company names/emails wrap, and actions remain reachable by keyboard. Reduced-motion preferences are respected. Live email delivery still requires your Resend configuration.

## Commit

```powershell
git add client server docs/p2-1-business-foundation.md
git commit -m "feat: add business portal access and company onboarding"
git push
```
