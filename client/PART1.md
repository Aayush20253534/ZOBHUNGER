# ZOBHUNGER — Part 1 frontend foundation

This patch targets the client created by `setup-phase1.ps1`. It adds the shared
design system and mock data layer used by the later frontend parts.

## Apply the patch

Save `zobhunger-part1.patch` in the project root and run:

```powershell
Set-Location "C:\Users\LENOVO\Desktop\ZOBHUNGER"
git apply --check --ignore-space-change .\zobhunger-part1.patch
if ($LASTEXITCODE -ne 0) { throw "Patch check failed. No files were changed." }
git apply --ignore-space-change .\zobhunger-part1.patch
if ($LASTEXITCODE -ne 0) { throw "The patch could not be applied." }
```

The whitespace flag accommodates Windows line endings in the setup files.
It does not bypass changed source context. If the check fails, compare the files
it identifies with the original scaffold before applying any changes. The patch
contains a Git binary diff for the font, so keep it as a downloaded file and use
`git apply` rather than copying its contents through the clipboard.

## Run and review

From `C:\Users\LENOVO\Desktop\ZOBHUNGER`:

```powershell
npm run dev:client
```

Open `http://localhost:3000/design-system`. This development-only route shows the
colour palette, typography, responsive navigation, cards, fields, form validation
and mock success/empty/error states. It returns a not-found response in production
and is excluded from indexing. The public page shells remain the starting points
for the following parts.

The patch uses the dependencies already installed by the setup script. No extra
installation, running server, database or credentials are required for mock mode.

## Design system

| Role               | Value     |
| ------------------ | --------- |
| Page background    | `#F7F8F4` |
| Card surface       | `#FFFFFF` |
| Heading and footer | `#173D31` |
| Primary action     | `#146C54` |
| Small accent       | `#DDEAAD` |
| Secondary text     | `#5B6B62` |
| Subtle border      | `#DDE5DE` |
| Error text         | `#B42318` |

The font is Manrope, self-hosted in `public/fonts/`. Its SIL Open Font License is
included beside it. The WOFF2 asset is subset from the Google Fonts variable
source at `https://github.com/google/fonts/tree/main/ofl/manrope`, covering Latin,
common punctuation and currency symbols, including the rupee sign.

Cards use a 12px radius, 24px padding and restrained borders. Content is constrained
to 1200px including its gutters. Buttons and inputs have at least a 44px minimum
height. Motion respects the reduced-motion preference. This is a light theme.

`src/styles/brand.css` contains the brand tokens and component styles. `Navbar`
imports it so the patch can preserve the generated `app/layout.tsx`,
`app/globals.css` and installed shadcn primitives. Token specificity takes
precedence over the generated theme. The existing root layout's global `Navbar`,
`main` and `Footer` structure is required.

## Components to use in later parts

| Component                                       | Purpose                                                       |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `PageShell`                                     | One page heading, description, actions and content            |
| `SectionHeading`                                | Section heading with optional eyebrow and action              |
| `ActionLink`                                    | Navigation styled as primary, secondary, light or text action |
| `ActionButton`                                  | Existing shadcn button with loading and disabled behaviour    |
| `SolutionCard`                                  | Service summary, included services and destination            |
| `IndustryCard`                                  | Industry summary and destination                              |
| `JobCard`                                       | Role, category, location, engagement type and destination     |
| `TextField`, `TextAreaField`, `SelectField`     | Labelled inputs with connected hints and errors               |
| `LoadingState`, `EmptyState`, `FeedbackMessage` | Loading, empty, error and confirmation UI                     |
| `CTASection`                                    | Shared business requirement call to action                    |

Use `zb-section` for section spacing and `zb-card-grid` with `data-columns="3"`
for a responsive one/two/three-column grid. Cards contain one link and no nested
interactive controls. The navigation supports keyboard-operated disclosures,
Escape dismissal, current-route states and a shadcn mobile drawer. `app/template.tsx`
provides the skip-to-content destination without replacing the root layout.

Site identity and navigation live in `src/data/`. Solution and industry slugs stay
consistent with the routes created by the scaffold. Client-approved photographs,
logos, testimonials, contacts and performance figures can be added when supplied.

## Mock data boundary

```dotenv
NEXT_PUBLIC_DATA_MODE=mock
```

This is the default when the variable is absent. Existing `.env.local` files need
no changes. `src/services/` is the single entry point for page data:

- `getJobs(filters, options)` returns `{ items, total, page, pageSize, totalPages }`.
- `getJobBySlug(slug, options)` returns a job or `null`.
- `submitEnquiry(input, options)` validates and returns a `SubmissionReceipt`.
- `submitRequirement(input, options)` validates and returns a `SubmissionReceipt`.

The mock adapter supports text search, exact case-insensitive location/category/
engagement filters, bounded pagination and abort signals. Unknown jobs return
`null`. Preview controls can request `success`, `empty` or `error` scenarios.

All six job fixtures are fictional and carry `isDemo: true`. They display a
visible demo badge. Submissions use only temporary memory during the operation:
no network request, email, database or browser storage is involved. A mock receipt
always has `mode: "mock"` and `delivered: false`. Its message explicitly states that
the information has not been sent or saved. Future forms must preserve that
distinction in their confirmation UI.

The design-system route uses its own mock adapter regardless of the environment
mode. Its example job cards link to the jobs shell until job pages are implemented.
The preview enquiry form is an example of React Hook Form + Zod integration;
the public contact and requirement forms remain for their planned frontend part.

## Later backend integration

`NEXT_PUBLIC_DATA_MODE=api` is an explicit opt-in for after the backend exists.
Restart the development server after changing a public environment variable;
production requires a rebuild. `NEXT_PUBLIC_API_URL` supplies the API base URL.
The HTTP adapter records the proposed contracts below. They are not implemented
by the scaffold backend, whose feature endpoints still return 501.

| Method and path      | Expected response                          |
| -------------------- | ------------------------------------------ |
| `GET /jobs`          | `JobList` JSON object                      |
| `GET /jobs/:slug`    | `Job` JSON object; HTTP 404 maps to `null` |
| `POST /enquiries`    | `SubmissionReceipt` JSON object            |
| `POST /requirements` | `SubmissionReceipt` JSON object            |

Job query keys are `query`, `location`, `category`, `jobType`, `page`, and `pageSize`.
Schemas and adapter interfaces are in `src/schemas/` and `src/types/`.
The schemas validate known service and industry slugs; workforce count is a number
and locations is an array. Native number inputs should use `valueAsNumber`, and
dates should use ISO date strings. Backend validation and authorisation will be
implemented independently when that phase begins.

JWT and Argon2id remain planned backend authentication work. This frontend part
does not create login pages, tokens, password hashing or account access controls.

## Verification

The patch was built against a reconstruction of the supplied setup script using
Next.js 16, React 19, Tailwind CSS 4 and the installed shadcn component APIs.
TypeScript and the production build passed. Five automated checks covered mock
filtering, pagination, cancellation, validation, delivery flags and the HTTP
adapter contracts. Patch application was verified against LF, CRLF and mixed line
endings, including the binary font. This does not replace a build in your actual
checkout, which was not available for inspection.

```powershell
npm run build:client
```

For a visual review, run development mode and check the header, mobile drawer,
keyboard focus, cards, validation and mock state controls at `/design-system`.

Suggested commit:

```text
feat(client): add Part 1 design system and mock data foundation

- establish the green and warm-white brand theme with self-hosted Manrope
- add responsive navigation, footer, cards, fields and feedback components
- introduce typed mock services with filtering, validation and cancellation
- add a development-only component preview and integration notes
```
