# ZOBHUNGER — Part 4: industries overview and detail pages

Part 4 completes the industry section: an overview and eleven pages with their
own sector copy, service mix, example requirements and briefing guidance. Apply
this incremental patch **after `zobhunger-part3.patch`**. It targets the original
setup scaffold with Parts 1, 2 and 3 applied.

## Apply and run

Download `zobhunger-part4.patch` into the project root and run in PowerShell:

```powershell
Set-Location "C:\Users\LENOVO\Desktop\ZOBHUNGER"

git apply --check --ignore-space-change .\zobhunger-part4.patch
if ($LASTEXITCODE -ne 0) { throw "Patch check failed. No files were changed." }

git apply --ignore-space-change .\zobhunger-part4.patch
if ($LASTEXITCODE -ne 0) { throw "The patch could not be applied." }

npm run dev:client
```

Open `http://localhost:3000/industries`. The homepage and product pages already
link to these routes, so their industry links now lead to complete content.
No dependency installation, new environment setting or running backend is needed.

## Completed pages

| Route                              | Main focus                                                                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `/industries`                      | Eleven industry cards, sector summaries and requirement guidance                                                                              |
| `/industries/fmcg`                 | The client's six specified services: sales promoters, merchandisers, field sales teams, product sampling, retail audits and brand activations |
| `/industries/retail`               | Store teams, promotions, merchandising, audits and seasonal support                                                                           |
| `/industries/e-commerce`           | Customer support, data work, back-office tasks and seasonal capacity                                                                          |
| `/industries/bfsi-fintech`         | Field outreach, calling, customer support and operational roles                                                                               |
| `/industries/telecom`              | Field sales, promoters, customer outreach and market activity                                                                                 |
| `/industries/logistics`            | Operations staff, field assignments and flexible support teams                                                                                |
| `/industries/food-beverage`        | Product sampling, promotions, outlet activity and campaigns                                                                                   |
| `/industries/consumer-electronics` | Product demonstrations, in-store promoters, displays and launches                                                                             |
| `/industries/manufacturing`        | Recruitment, contract staffing, temporary workforce and office support                                                                        |
| `/industries/healthcare`           | Non-clinical enquiry, calling, recruitment and administrative support                                                                         |
| `/industries/startups`             | Hiring, remote sales, customer support and project workforce                                                                                  |

Each detail page includes a sector introduction, summary panel, section links,
six service cards, three example requirements, four briefing prompts and a
requirement CTA. Service cards link to the corresponding completed product pages.

The client supplied the eleven sectors and a detailed FMCG example. The other ten
pages adapt services from the agreed catalogue into proposed sector copy.
Examples describe potential requirements; they are not customer case studies.
Healthcare content is limited to non-clinical support, and no regulated-service
credentials, operational results, client endorsements or service guarantees are
claimed. The client can review this draft copy alongside the final frontend.

## Content and components

| File                                               | Purpose                                                          |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| `src/data/industries.ts`                           | Existing canonical industry names and slugs                      |
| `src/data/industry-details.ts`                     | Sector summaries, services, examples, brief prompts and CTA copy |
| `src/types/industry-detail.types.ts`               | Industry content shape and typed links to the solution catalogue |
| `src/lib/industry-content.ts`                      | Catalogue lookup and metadata for each industry                  |
| `src/components/industries/IndustriesOverview.tsx` | Complete industry overview                                       |
| `src/components/industries/IndustryDetail.tsx`     | Shared renderer with sector-specific content                     |
| `src/components/industries/IndustryIcon.tsx`       | Sector icons and a fallback for other card inputs                |
| `src/components/industries/IndustryCard.tsx`       | Existing card, now using the appropriate sector icon             |
| `src/styles/industries.css`                        | Styles scoped to the industry pages                              |
| `src/app/industries/page.tsx`                      | Overview route and metadata                                      |
| `src/app/industries/[slug]/page.tsx`               | Eleven statically generated pages with unknown-slug handling     |

Industry keys are checked against the existing `IndustrySlug` type. Every service
references a known `SolutionSlug`. The dynamic route awaits its parameters, exports
metadata for each sector and limits generated paths to the eleven catalogue slugs.
Unknown industries use the not-found flow.

The pages reuse the existing brand tokens, typography, `PageShell`, `Breadcrumbs`,
`SectionHeading`, `ActionLink`, `CTASection` and shadcn `Card`. Layouts use one, two
or three columns as space permits. Section links wrap on small screens, and the
existing focus and reduced-motion behaviour is retained. No new imagery or
client-side data fetching was added.

## Requirement link contract

Industry CTAs link to:

```text
/hire-workforce?industry=<industry-slug>
```

For example: `/hire-workforce?industry=consumer-electronics`.

The query preserves the industry selected by the visitor. The requirement page
is still a shell and does not yet read or submit this value. When building the
form, validate the `industry` parameter against the catalogue and use it as the
initial industry field. Preserve the visitor's ability to change it. Part 3's
`service` query remains the corresponding contract for product-page CTAs.

## Build sequence and final frontend review

As agreed, finish all remaining frontend parts before the general frontend fix
pass. The remaining public business/company pages, forms and worker/job flows
should be completed first. Then review Aayush's issue list and resolve the
remaining layout, content, navigation and interaction problems across the site.
Backend integration follows frontend completion and that review.

This patch implements the industry section. It does not attempt the later general
fix pass or expand backend/authentication work.

## Validation

Production compilation and TypeScript are checked against a reconstruction of the
setup scaffold with Parts 1–3 applied. Catalogue coverage, the client's FMCG list,
service destinations, unique metadata and unknown-slug handling are checked too.
Patch application is checked with LF, CRLF and mixed line endings while retaining
the earlier parts.

Run in your own checkout:

```powershell
npm run build:client
```

The actual Windows repository was not available for inspection. Browser-based
visual testing was not requested or performed while producing this patch. The
frontend review remains planned after the remaining frontend parts.

## Commit message

```text
feat(client): build industries overview and eleven sector pages

- add sector-specific services, example requirements and briefing content
- connect industry cards to the existing product catalogue
- include the selected industry in requirement links and add page metadata
- add responsive layouts, sector icons and unknown-slug handling
- record the final frontend review after the remaining parts
```
