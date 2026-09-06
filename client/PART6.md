# ZOBHUNGER — Part 6: worker/job flow and compact homepage hero

> Part 7 supersedes the compact layout described here and adds the remaining
> Insights and portal-entry pages. See `PART7.md` for the current Phase 1 status.

Apply **after `zobhunger-part5.patch`**. Part 6 completes the worker landing page,
job search, role details and application preview. It also replaces the homepage
photo and resizes the top section for laptop windows. The red-and-white theme
from Part 5 remains in use, including on the new pages.

## Apply and run

Save the downloaded `zobhunger-part6.patch` in the project root. Keep the file
intact: it contains Git binary data for the photographs. Do not copy its contents
through PowerShell or the clipboard.

```powershell
Set-Location "C:\Users\LENOVO\Desktop\ZOBHUNGER"

git apply --check --ignore-space-change .\zobhunger-part6.patch
if ($LASTEXITCODE -ne 0) { throw "Patch check failed. No files were changed." }

git apply --ignore-space-change .\zobhunger-part6.patch
if ($LASTEXITCODE -ne 0) { throw "Patch could not be applied." }

npm run dev:client
```

No new dependency, environment setting or running backend is needed for the
default mock mode. Restart the development server if it was already running.

## Homepage changes

The previous hero had a tall image frame, a large heading and generous vertical
spacing. The replacement uses a landscape frame and tighter spacing, while keeping
the full heading, description, both business actions and the “Looking for your
next role? Find work” link.

At widths of at least 900px, copy and photo sit beside each other. Heading size
responds to both the viewport width and available height. Laptop windows up to
660px high use a compact 32px heading at the standard 16px root font size. The
homepage's top padding is reduced; the other public pages keep their spacing.
The engagement labels and “Find your solution” link sit in a separate row below
the main hero, so they no longer lengthen the copy column.

The intended laptop result is for all content through **Find work**, plus the
complete photo and caption, to be visible in the first viewport. On smaller
screens the content and photo stack, the buttons wrap, and the image retains its
full landscape composition. Phone pages may scroll naturally; no text, action or
image is hidden to force a one-screen layout. Large text and browser zoom can also
increase page height. There is no fixed hero height or clipped text container.

The new photograph by Ketut Subiyanto is bundled in three WebP variants:

| Width  | Approximate file size | Purpose                                    |
| ------ | --------------------- | ------------------------------------------ |
| 640px  | 61 KiB                | Smaller or lower-density displays          |
| 1280px | 171 KiB               | Typical laptop and phone display densities |
| 2400px | 476 KiB               | Higher-density displays                    |

The browser chooses a source using `srcset` and `sizes`. The image is eager-loaded
with high fetch priority. These pre-sized local images use a standard image element
to avoid another lossy optimization pass; this is intentional. The frame uses a
3:2 ratio and `object-fit: contain`, keeping the whole photograph visible. Fresh
filenames avoid loading the previous image from cache. Source and license details
are retained in `public/images/home/CREDITS.md`.

## Completed worker and job pages

| Route                              | Behaviour                                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/for-workers`                     | Seven job categories, links into filtered results and the planned six-step worker journey                  |
| `/jobs`                            | Keyword search, location/category/type filters, result counts, pagination, loading, empty and error states |
| `/jobs/demo-field-sales-lucknow`   | Field Sales Executive example and application preview                                                      |
| `/jobs/demo-brand-promoter-delhi`  | In-store Brand Promoter example and application preview                                                    |
| `/jobs/demo-telecaller-prayagraj`  | Telecalling Executive example and application preview                                                      |
| `/jobs/demo-retail-auditor-mumbai` | Retail Audit Associate example and application preview                                                     |
| `/jobs/demo-operations-pune`       | Operations Associate example and application preview                                                       |
| `/jobs/demo-recruiter-bengaluru`   | Recruitment Coordinator example and application preview                                                    |

The six existing demo roles now include responsibilities and role requirements.
No employer, pay, benefits or selection promises are invented. Unknown and
unpublished roles follow the not-found flow. Demo listings and details are
excluded from indexing; no JobPosting structured data is added for fictional jobs.

Profile creation, selection updates, joining and earnings are shown as the planned
worker journey. The account-based worker portal remains Phase 3 work. This patch
does not create a login, worker account or claimed profile registration.

## Search and applications

Filter selections are stored in the URL, so they can be shared and restored by
browser navigation. Search applies the selected filters together and resets to
page 1. Clear filters removes the selections. Pagination preserves the query and
filters; four results per page make both pages of the six-role demo catalogue
available for review.

```text
/jobs?category=Sales&location=Lucknow
/jobs?category=Field+Work&jobType=Project-based
/jobs?category=Marketing
/jobs?page=2
```

Marketing currently demonstrates the empty state because no Marketing vacancy
fixture is published. Unknown filter values remain visible as selections rather
than silently showing unfiltered results. Repeated query values are ignored;
search text is bounded and invalid page numbers fall back to page 1.

The application form collects name, email, phone and current location, with
optional experience, availability and message fields. It uses the shared React
Hook Form/Zod fields and submission lifecycle from Part 5. Pending requests lock
the fields, failures retain entries, and response feedback receives focus. Edit
details restores the form after a preview; Start again clears its entries.

Mock submissions validate their input and published job slug, then return a
receipt with `mode: "mock"` and `delivered: false`. The confirmation explicitly
states that nothing was sent or saved. There is no browser storage, database,
email delivery, file upload or account creation in this part.

For later backend integration, the HTTP adapter records this proposed contract:

```text
POST /api/v1/jobs/:slug/applications
Body: fullName, email, phone, currentLocation,
      experience?, availableFrom?, message?
Response: SubmissionReceipt
```

The existing API base URL supplies `/api/v1`. This endpoint is not implemented by
the scaffold server. Keep `NEXT_PUBLIC_DATA_MODE=mock` until backend integration.
The real backend must independently validate input and whether the job is open.
The location filter options should also come from the published backend catalogue
when that integration is built.

## Where to edit

| File or folder                                                 | Purpose                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/components/home/Hero.tsx`, `src/styles/home.css`          | Compact responsive hero and image delivery                         |
| `src/data/home.ts`, `public/images/home/`                      | Hero image references, files and source credits                    |
| `src/components/workers/ForWorkers.tsx`, `src/data/workers.ts` | Worker page, categories and planned journey                        |
| `src/components/jobs/`                                         | Filters, results, pagination and role details                      |
| `src/app/jobs/`                                                | Server-rendered job routes, loading, error and missing-role states |
| `src/lib/job-filters.ts`                                       | Query parsing and consistent job URLs                              |
| `src/lib/job-page.ts`                                          | Shared per-render job read for page content and metadata           |
| `src/components/forms/JobApplicationForm.tsx`                  | Job application preview                                            |
| `src/schemas/job-application.schema.ts`                        | Application payload validation                                     |
| `src/services/jobs.service.ts`, `src/mocks/adapter.ts`         | Application service and mock submission boundary                   |
| `src/styles/work.css`, `src/styles/forms.css`                  | Worker/job styles and shared public-form presentation              |

Common form styles are extracted from `company.css` into `forms.css` and imported
by both company and worker/job pages. The existing business forms retain their
presentation. No server, dependency manifest, generated root layout or vendored
shadcn primitive is changed.

## Validation and frontend review

Production compilation and TypeScript pass against the reconstructed setup
scaffold with Parts 1–5 applied. Five focused checks cover query handling,
filtering/pagination/empty results, detail fixtures, application validation,
delivery flags, failures and cancellation. Image files, internal links and patch
application are checked, including LF, CRLF and mixed Windows line endings.

Static font-metric sizing estimates cover laptop windows from 900×540 through
1920×1080 CSS pixels, including 1024×576 and 1280×592. They leave room for the main
hero content and image at standard text sizing. These are source-based estimates,
not browser-rendered measurements. The actual Windows repository was not available,
and browser interaction/visual testing was not performed for this patch.

Run in your own checkout:

```powershell
npm run build:client
```

The planned public frontend parts are now implemented. The next step is the agreed
review of Aayush's remaining frontend issues and client feedback, followed by the
required fixes. Backend integration, JWT and Argon2id come after that review.

## Commit message

```text
feat(client): complete worker flows and improve responsive home hero

- build worker categories, job search, details and application previews
- preserve search filters through navigation and pagination
- add validated mock applications and unavailable-role handling
- replace the hero photo with sharp responsive image variants
- fit the main hero content and image into common laptop viewports
```
