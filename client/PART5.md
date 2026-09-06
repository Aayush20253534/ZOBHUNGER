# ZOBHUNGER — Part 5: business pages, forms and red-and-white theme

Apply this incremental patch **after `zobhunger-part4.patch`**. It targets the
original setup scaffold with Parts 1–4 applied. Part 5 completes six public pages
and changes the shared theme across the whole website to the client's requested
red and white.

## Apply and run

Save `zobhunger-part5.patch` in the project root, then run in PowerShell:

```powershell
Set-Location "C:\Users\LENOVO\Desktop\ZOBHUNGER"

git apply --check --ignore-space-change .\zobhunger-part5.patch
if ($LASTEXITCODE -ne 0) { throw "Patch check failed. No files were changed." }

git apply --ignore-space-change .\zobhunger-part5.patch
if ($LASTEXITCODE -ne 0) { throw "Patch could not be applied." }

npm run dev:client
```

Open `http://localhost:3000/` to see the updated theme or
`http://localhost:3000/for-business` to begin the new business flow. No dependency
installation, new environment variable or running backend is required in mock
mode. If the development server was already running, restart it after applying.

## Completed pages

| Route             | Content and behaviour                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/for-business`   | The client's four business needs: workforce, sales teams, promoters and market execution; service links, briefing guidance, FAQs and requirement CTA |
| `/hire-workforce` | Full requirement form, editable service/industry prefill, repeatable locations, validation and mock submission feedback                              |
| `/about`          | Client positioning, mission, vision, operating approach and links to all seven solution categories                                                   |
| `/contact`        | Enquiry form, service prefill, business/worker entry points and configurable public contact details                                                  |
| `/technology`     | Public overview of the planned client, worker and admin portals; all three clearly labelled as future tools                                          |
| `/how-it-works`   | The client's six steps from requirement through sourcing, selection, deployment, tracking and reporting                                              |

The Technology navigation item is now available in the desktop header and mobile
drawer. The homepage and footer link to the new technology and process pages.
All six pages include titles, descriptions, canonical URLs and text Open Graph
metadata. Form-page canonical URLs omit query parameters.

## Current theme

| Role                       | Token                 | Colour    |
| -------------------------- | --------------------- | --------- |
| Page background            | `--zb-page`           | `#FAF9F9` |
| Cards and white surfaces   | `--zb-surface`        | `#FFFFFF` |
| Main text                  | `--zb-ink`            | `#272126` |
| Primary red                | `--zb-action`         | `#C8202F` |
| Primary hover              | `--zb-action-hover`   | `#A61826` |
| Burgundy panels and footer | `--zb-panel`          | `#461820` |
| Text on dark panels        | `--zb-on-panel-muted` | `#EFDDE1` |
| Highlight                  | `--zb-highlight`      | `#FFE2E5` |
| Soft panels                | `--zb-soft`           | `#FFF1F2` |
| Secondary text             | `--zb-muted`          | `#685E64` |
| Card borders               | `--zb-border`         | `#E7DFE2` |
| Form control borders       | `--zb-strong-border`  | `#9C8D95` |

The theme replaces both the original tokens and hardcoded green tints in the
homepage, solution and industry stylesheets. It also updates the header, footer,
cards, controls, focus colours, feedback and development palette at `/design-system`.
Text and dark panels now have separate semantic tokens in place of `--zb-forest`.
If you added custom CSS outside the supplied patches using that old token, use
`--zb-ink` for text or `--zb-panel` for a dark surface.

White surfaces carry most of the layout, red marks actions and navigation, and
burgundy anchors the dark sections. Manrope, card shapes and existing imagery are
retained. The desktop navigation breakpoint moves to 1200px to accommodate the
Technology item; the mobile drawer uses the same breakpoint.

Representative contrast checks: primary red on white is 5.67:1, secondary text
on the page background is 5.92:1, and form control borders on white are 3.15:1.
Error states still have explicit messages and icons; colour is not their only cue.

## Forms and mock behaviour

The requirement form collects company name, contact person, business email,
mobile number, industry, service, workforce count, locations, duration, optional
start date and requirement details. Add or remove location rows, with at least
one and up to fifty. The form's location objects transform into the existing
`string[]` service payload; the API contract stays the same.

The enquiry form collects name, optional company name, email, phone, service and
message. Both forms use the existing field components, React Hook Form, Zod and
service functions. Labels, hints and errors remain connected to their controls.
Submissions lock the fields while pending, block duplicate requests, retain
entries after failure, and move focus to the response. After a mock confirmation,
Edit details restores the entries; Start again clears them.

```text
/hire-workforce?service=sales-force&industry=retail
/contact?service=workforce-solutions
```

Only recognised catalogue slugs become initial selections. Unknown values and
repeated parameters are ignored. Both selections remain editable, and related
links between the two forms preserve the selected service from the incoming URL.
The routes read their search parameters on the server, so these two form pages
are dynamic Next.js routes; the four other new pages are statically rendered.

`NEXT_PUBLIC_DATA_MODE=mock` remains the default. Each form explicitly asks for
sample details and explains that nothing is sent or saved. A mock receipt is
always presented as a preview, even if its other flags or message were inconsistent.
An API receipt without confirmed delivery is never shown as a successful submission.
There is no new browser storage, email delivery or database write in this part.

The existing `api` opt-in still belongs to the later backend integration. JWT,
Argon2id, server validation, lead routing, accounts and portal functionality remain
backend or later-phase work. Do not enable API mode until its endpoints exist.

## Where to edit

| File or folder                                                | Purpose                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/styles/brand.css`                                        | Current shared palette and primitive styles                                 |
| `src/styles/home.css`, `solutions.css`, `industries.css`      | Earlier page styles now using the shared red-and-white tokens               |
| `src/styles/company.css`                                      | New public page layouts and form presentation                               |
| `src/data/company.ts`                                         | Business needs, mission, vision, delivery steps and planned portal features |
| `src/data/contact.ts`                                         | Client-approved public contact details                                      |
| `src/components/company/`                                     | Six page components                                                         |
| `src/components/forms/RequirementForm.tsx`, `ContactForm.tsx` | Public form fields and interactions                                         |
| `src/hooks/use-form-submission.ts`                            | Submission lifecycle, cancellation, duplicate prevention and response focus |
| `src/schemas/requirement-form.schema.ts`                      | Location-row validation and conversion to the existing service payload      |
| `src/lib/form-selection.ts`                                   | Validation of incoming service and industry selections                      |
| `src/lib/submission-feedback.ts`                              | Truthful preview and delivery messages                                      |
| `src/lib/page-metadata.ts`                                    | Shared metadata for these six pages                                         |

No verified public business email, phone, office address or social links were
provided in the brief. The contact configuration is intentionally empty; those
items render when approved values are added. The private WhatsApp number is not
repurposed as a public business contact. The copy does not invent customer
endorsements, operating statistics or delivery guarantees.

## Validation and remaining work

Production compilation and TypeScript passed against a reconstruction of the
setup scaffold with Parts 1–4 applied. Five focused checks cover valid and invalid
query selections, multiple-location payloads, field validation, mock receipts and
unconfirmed delivery. Shared colour contrasts and removal of the old green values
are checked. Patch application is checked with LF, CRLF and mixed line endings.

Run the build in your actual Windows checkout:

```powershell
npm run build:client
```

The Windows repository itself was not available for inspection. Browser-based
visual and interaction testing has not been performed for this patch. The next
frontend part is the worker/job flow. After the remaining frontend parts are
complete, review Aayush's issue list and fix the remaining layout, content,
navigation and interaction problems before moving to backend integration.

## Commit message

```text
feat(client): add Part 5 pages and switch to a red-and-white theme

- replace green colours across the shared theme and existing pages
- build business, about, technology and delivery process pages
- add requirement and enquiry forms with validated mock submissions
- carry service and industry selections into the requirement form
- connect navigation and document the remaining frontend review
```
