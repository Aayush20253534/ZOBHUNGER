# Larger homepage text and consistent page introductions

> This update is a prerequisite for Part 7. Part 7 replaces its compact styles
> with larger page introductions and fuller cards. See `PART7.md` after applying it.

Apply this patch after **Part 6 and the Zod compatibility correction**. Leave
those changes applied; this is an additional layout update.

## Changes

- The homepage heading now grows from 40px to 56px in laptop layouts at the
  standard 16px root size. The previous short-window rule fixed it at 32px.
  At 1280×592 CSS pixels, the new heading is approximately 44px.
- The homepage description increases from 16px to 17px. The eyebrow is 14px.
  The larger text balances the existing sharp photograph without hiding either
  business action or the Find work link.
- Header height, page top padding, breadcrumbs and opening-section spacing
  respond to the available window height across the site.
- Solution, industry, business and worker introductions use consistent title
  sizing and two columns from 900px wide. Opening cards place icons beside their
  headings and use compact label/value rows, retaining all their content.
- About, Technology, How It Works, Contact and Hire Workforce receive the same
  shared opening spacing. Job listings keep their search/filter controls close
  to the introduction; job details keep the action and metadata together.

The laptop goal is to show the complete opening section in the first viewport.
For Contact and Hire Workforce, that section is the page introduction; their
long forms continue below it. Job results and the remaining page sections also
retain their normal document flow.

Below 900px, split introductions stack naturally. No fixed viewport height,
clipped text, hidden actions or forced page scaling is used. Small screens,
large text settings and browser zoom can require scrolling.

## Apply

Save the patch in the project root. Stop the development server if it is running.

```powershell
Set-Location "C:\Users\LENOVO\Desktop\ZOBHUNGER"

git apply --check --ignore-space-change .\zobhunger-page-intro-fix.patch
if ($LASTEXITCODE -ne 0) { throw "Patch check failed. No files were changed." }

git apply --ignore-space-change .\zobhunger-page-intro-fix.patch
if ($LASTEXITCODE -ne 0) { throw "Patch could not be applied." }

npm run dev:client
```

## Files

| File                        | Purpose                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| `src/styles/brand.css`      | Shared intro sizing, header height, main padding and typography     |
| `src/styles/home.css`       | Larger home heading and description; removal of the fixed 32px cap  |
| `src/styles/page-intro.css` | Shared public-page openings, compact context cards and job controls |

The red-and-white theme, images, page copy, form validation and mock flows are
preserved. No dependency change is needed.

## Verification

The production build and TypeScript pass on the reconstructed project. Patch
application is checked against the delivered baseline with LF, CRLF and mixed
line endings.

Source-based estimates using the bundled Manrope font cover the current public
introductions at 900×540, 1024×576, 1280×592, 1366×650, 1440×750, 1536×864 and
1920×1080 CSS pixels. These are sizing estimates, not browser-rendered results.
The actual Windows checkout was not available, and browser visual testing was
not performed.

## Commit message

```text
fix(client): balance hero typography and fit page introductions

- enlarge the home headline and supporting copy
- adapt header and opening spacing to laptop window height
- compact introduction cards across the public pages
- keep job filters and primary actions close to their headings
```
