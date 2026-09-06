# ZOBHUNGER — Part 2: complete homepage

Part 2 replaces the empty homepage with the full public-facing homepage. Apply this
incremental patch **after `zobhunger-part1.patch`**. The target is the original
`setup-phase1.ps1` scaffold with Part 1 applied.

## Apply and run

Download `zobhunger-part2.patch` into the project root, then run in PowerShell:

```powershell
Set-Location "C:\Users\LENOVO\Desktop\ZOBHUNGER"

git apply --check --ignore-space-change .\zobhunger-part2.patch
if ($LASTEXITCODE -ne 0) { throw "Patch check failed. No files were changed." }

git apply --ignore-space-change .\zobhunger-part2.patch
if ($LASTEXITCODE -ne 0) { throw "The patch could not be applied." }

npm run dev:client
```

Open `http://localhost:3000/`. The Part 1 component preview is still available in
development at `http://localhost:3000/design-system`.

The whitespace flag accommodates Windows line endings. Keep the downloaded patch
as a file: it includes the hero photograph as a Git binary diff. No new dependency,
backend server or environment variable is needed.

## Homepage content

| Section                | Content and behaviour                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Header and footer      | Reuses Part 1 navigation, disclosures, mobile drawer and business links                                                  |
| Hero                   | Client's workforce positioning, explanatory copy, hire/solutions/jobs actions and a locally bundled workplace photograph |
| Solutions              | All seven existing solution categories, service summaries and requirement guidance                                       |
| Why ZOBHUNGER          | One coordinated partner, multiple services, locations, hiring, management, attendance, reporting and scaling             |
| How it works           | Five ordered steps from requirement through performance reporting                                                        |
| Industries             | Links and sector-specific summaries for all eleven industry routes                                                       |
| Businesses and workers | Separate paths to share a business requirement or explore work                                                           |
| Technology vision      | Client, worker and operations portal summaries, visibly marked as planned                                                |
| Final call to action   | Invitation to discuss a workforce or business execution requirement                                                      |

The copy is adapted from the client's WhatsApp brief. No client logos, testimonials,
worker counts, city counts, case studies or delivery-time guarantees are invented.
Technology is presented as the future product direction; the homepage does not
suggest that account portals, online attendance or earnings tools are already live.

The homepage has real content. Its solution, industry, jobs and form destinations
still use the existing route shells until those frontend parts are implemented.
This patch completes the homepage; it does not complete every Phase 1 page.

## Editing the page

| File                                        | Purpose                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/app/page.tsx`                          | Homepage composition and metadata                                                 |
| `src/data/home.ts`                          | Homepage copy, delivery steps, benefits, portal descriptions and sector summaries |
| `src/data/solutions.ts`                     | Existing shared catalogue used for all seven solution cards                       |
| `src/data/industries.ts`                    | Existing shared industry titles and route slugs                                   |
| `src/components/home/Hero.tsx`              | Main positioning, actions and hero photograph                                     |
| `src/components/home/ServicesOverview.tsx`  | Solution catalogue and requirement card                                           |
| `src/components/home/WhyZobhunger.tsx`      | Business benefits                                                                 |
| `src/components/home/HowItWorks.tsx`        | Ordered delivery process                                                          |
| `src/components/home/IndustriesPreview.tsx` | Industry links and service examples                                               |
| `src/components/home/AudienceSection.tsx`   | Business and worker entry points                                                  |
| `src/components/home/TechnologyPreview.tsx` | Planned portal overview                                                           |
| `src/styles/home.css`                       | Styles scoped to `.zb-home`                                                       |
| `public/images/home/`                       | Bundled WebP photograph and source/license credit                                 |

The homepage reuses Part 1's `ActionLink`, `SectionHeading`, `SolutionCard`,
`CTASection` and existing shadcn primitives. Its copy and layouts are rendered by
server components; there is no homepage state store or extra client-side data
request. Interactive navigation remains provided by Part 1.

The original forest/green palette is replaced by the shared red-and-white theme
in Part 5; the Manrope typeface remains. Desktop has a split hero, four-column solution catalogue,
horizontal process, compact industry cards and two audience panels. Smaller
screens switch to fewer columns and a vertical process. Styles inherit the shared
focus and reduced-motion behaviour. The photograph reserves space before loading
and uses Next Image for responsive image delivery.

Page metadata includes the title, description, canonical homepage URL and text
Open Graph fields. The canonical domain comes from `src/data/site.ts`, using the
client's `zobhungr.com` domain. No social image was generated.

## Validation and next steps

Run the production build in your actual checkout:

```powershell
npm run build:client
```

The implementation was checked in a local reconstruction of the setup scaffold
with Part 1 applied. Production compilation, TypeScript and patch checks are
performed there; your Windows repository was not available for inspection.

For your review, open the homepage in development, resize it, navigate using Tab,
open the mobile menu and follow the primary calls to action. No browser-based
visual testing was requested or performed while producing this patch.

The next content part can expand the solutions overview and seven product pages
using the shared catalogue and components. Full forms, jobs and backend integration
remain in their planned parts. JWT and Argon2id remain backend work.

## Commit message

```text
feat(client): build the complete Phase 1 homepage

- add client-led hero, solution catalogue and business benefits
- explain the delivery process and link all eleven industries
- add business and worker sections with a planned technology overview
- extend the Part 1 theme with responsive layouts and a local hero image
- add homepage metadata, asset credits and implementation notes
```
