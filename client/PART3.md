# ZOBHUNGER — Part 3: solutions and product pages

Part 3 completes the solutions overview and all seven product pages, using the
design system from Part 1 and the homepage from Part 2. Apply this incremental
patch **after `zobhunger-part2.patch`**. It targets the original setup scaffold
with Parts 1 and 2 applied.

## Apply and run

Download `zobhunger-part3.patch` into the project root and run in PowerShell:

```powershell
Set-Location "C:\Users\LENOVO\Desktop\ZOBHUNGER"

git apply --check --ignore-space-change .\zobhunger-part3.patch
if ($LASTEXITCODE -ne 0) { throw "Patch check failed. No files were changed." }

git apply --ignore-space-change .\zobhunger-part3.patch
if ($LASTEXITCODE -ne 0) { throw "The patch could not be applied." }

npm run dev:client
```

Start at `http://localhost:3000/solutions`, or use the homepage's solution cards.
The whitespace flag accommodates Windows line endings in the scaffold files.
No new dependency, asset download, environment variable or running backend is
needed for this part.

## Completed pages

| Route                  | Content                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `/solutions`           | Seven solution cards, service guidance and requirement actions                                         |
| `/workforce-solutions` | Ten recruitment/staffing services, who we hire, the five-step hiring process and all eleven industries |
| `/sales-force`         | Seven sales roles, team planning and the Hire → Train → Deploy → Track → Perform process               |
| `/promoter-solutions`  | Six promoter categories, daily/weekly/monthly/campaign engagements and campaign preparation            |
| `/retail-execution`    | Nine retail services, store coverage/checklists/reporting guidance and the execution process           |
| `/brand-activation`    | Nine activation services, audience/venue/team planning and the campaign process                        |
| `/business-operations` | Nine operations services, workflow planning, remote roles and team coordination                        |
| `/gig-workforce`       | Six role categories, five engagement options and the assignment process                                |

Every product page includes breadcrumbs, a product introduction, a summary panel,
section links, detailed service cards, relevant planning or engagement content,
delivery steps, industry links, two complementary solutions and a requirement
call to action.

The service names, promoter durations and gig engagement options follow the
client's WhatsApp brief. Explanatory copy expands that brief into usable page
content. Additional planning/process descriptions are proposed service copy for
the client to review; they do not assert verified operational performance.
No workforce counts, testimonials, customer logos, hiring deadlines or guaranteed
campaign outcomes are added.

## Files and content model

| File                                             | Purpose                                                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `src/data/solutions.ts`                          | Existing shared solution summaries and canonical slugs                                               |
| `src/data/solution-details.ts`                   | Full product copy, services, focus sections, processes, industry mappings, related products and CTAs |
| `src/types/solution-detail.types.ts`             | Content types and catalogue-derived solution/industry slug types                                     |
| `src/components/solutions/SolutionsOverview.tsx` | Complete solutions overview                                                                          |
| `src/components/solutions/SolutionDetail.tsx`    | Shared product renderer with content specific to each solution                                       |
| `src/components/common/Breadcrumbs.tsx`          | Semantic breadcrumb navigation                                                                       |
| `src/styles/solutions.css`                       | Styles scoped to the solutions pages                                                                 |
| `src/lib/solution-metadata.ts`                   | Unique product metadata and canonical URLs                                                           |
| `src/app/solutions/page.tsx`                     | Overview route and metadata                                                                          |
| The seven existing product `page.tsx` files      | Each selects its content slug and exports its product metadata                                       |

`solutionDetails` is checked against every existing `SolutionSlug`. Industry and
related-product references use the shared catalogue types. This keeps route
names consistent without changing the public URL structure.

The pages reuse `PageShell`, `SectionHeading`, `ActionLink`, `SolutionCard`,
`CTASection` and the existing shadcn `Card` primitive. Product content is rendered
by server components, with no new client state or data fetching. Section links
use native anchors, and the shared Part 1 header continues to supply the mobile
drawer and active-route navigation.

The layout uses the existing Manrope font and green palette. Product pages have
a clear brief panel, bordered service cards, a lighter planning section and
ordered delivery steps. Narrow screens use stacked layouts and wrapped section
links. Focus styles and the reduced-motion preference are respected.

## Requirement link contract

Product calls to action link to:

```text
/hire-workforce?service=<solution-slug>
```

For example: `/hire-workforce?service=retail-execution`.

The query preserves which solution the visitor selected. The requirement form
is still a route shell; it does not yet read or submit this value. When building
that form, validate `service` against `src/data/solutions.ts` and use it as the
initial `serviceRequired` field. Visitors must still be able to change the
selection. Do not treat the URL value as trusted backend input.

Industry links currently lead to the existing industry route shells. Completing
the industry overview and detail content is the next frontend part.

## Validation

The production build and TypeScript are checked against a reconstruction of the
setup scaffold with Parts 1 and 2 applied. Service-list coverage is compared with
the supplied client brief. Link/catalogue references and patch application are
also checked. Your Windows repository is not available for direct inspection.

Run in your checkout:

```powershell
npm run build:client
```

For your visual review, open `/solutions` and the seven product pages, follow the
section links, resize the window, and use Tab to navigate. Browser-based visual
testing was not requested or performed while producing this patch.

## Commit message

```text
feat(client): build solutions overview and seven product pages

- add complete service content from the client brief
- add product planning, engagement and delivery sections
- connect related solutions, industries and requirement actions
- add responsive layouts, breadcrumbs and page metadata
```
