# Part 7 — public website refinement and remaining pages

Apply `zobhunger-part7.patch` **after Parts 1–6, the Zod compatibility fix and the
page-intro fix**. This patch replaces the compact introduction styles from the
last update. Keep the preceding patches applied; do not reapply them afterward.

## Apply from the project root

Stop the running development server with Ctrl+C, save the patch in the project
root, then run:

```powershell
Set-Location "C:\Users\LENOVO\Desktop\ZOBHUNGER"

git apply --check --ignore-space-change .\zobhunger-part7.patch
if ($LASTEXITCODE -ne 0) { throw "Patch check failed. No files were changed." }

git apply --ignore-space-change .\zobhunger-part7.patch
if ($LASTEXITCODE -ne 0) { throw "Patch could not be applied." }

npm run build:client
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed. Review the error above." }

npm run dev:client
```

No new package or environment setting is needed. Keep
`NEXT_PUBLIC_DATA_MODE=mock` for frontend review. API mode requires the later
backend; it does not fall back to fabricated results when a request fails.

If the patch check fails because the local source differs, preserve those
changes and resolve the differences before applying. Do not force a partial
patch or reapply older parts over newer work.

## What changed visually

- Larger headings across public pages: approximately 59–64px at common laptop
  widths, with 18px introduction copy at the standard 16px root font size. The
  homepage title is approximately 61px at 1280px wide. Heading sizes now depend
  on width, not a height-based reduction that makes the content look small.
- Shared introduction cards have a clear heading, icon tile and separate inset
  information boxes. Solution, industry, business and worker pages use the same
  component. About and Technology statement panels have larger typography.
- Service, industry, worker, FAQ, briefing and form sections have clearer card
  boundaries, stronger headings and closer spacing between sections.
- The homepage keeps the sharp local photograph and its complete 3:2 composition.
  Engagement types are four useful cards with short descriptions. The main
  heading, description, business actions and Find work link remain together.
- The process component uses connected, numbered step cards. Select a step or
  use Previous/Next to read the detailed panel. Homepage and full delivery flows
  include the expected checkpoint. Solution flows and the planned worker
  journey use the same component with their own content.
- The worker example disclosure sits beside the introduction instead of taking
  a large full-width developer notice. Mock submissions still disclose that
  nothing is sent or saved.

Introductions stay in normal document flow. There is no forced viewport-height
container, clipped copy or hidden image. On phones, short windows and enlarged
text settings, content can scroll instead of becoming too small to read. Long
forms, articles and result lists continue below their opening section.

## Part 7 pages and states

| Route                          | Behaviour                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `/blog`                        | Insights catalogue, text search, seven topics, result counts and pagination                |
| `/blog/[slug]`                 | Full guide, key idea, section contents and a relevant next action                          |
| `/login`                       | Client Login, Worker Login and Admin Login entry cards; accounts clearly marked as planned |
| Unknown guide                  | Guide unavailable state with a working route back to Insights                              |
| Insights loading/error/empty   | Loading feedback, retry and clear-filter recovery                                          |
| Unknown site page / page error | Consistent recovery pages with useful navigation                                           |
| `/sitemap.xml`, `/robots.txt`  | Public service route sitemap and crawler configuration                                     |

The seven original editorial samples cover the topics in the client brief:
Hiring Trends, Workforce Management, Sales Hiring, Gig Economy, Retail Execution,
Trade Marketing and Industry Insights. They have no invented authors, publication
dates, company statistics or case-study claims. Samples are labelled and carry
noindex metadata. Demo jobs, sample articles, the portal selector and the design
system are excluded from the sitemap.

Examples to review:

```text
/blog
/blog?category=Retail+Execution
/blog?query=checklist
/blog?page=2
/blog?query=nonexistent-term
/blog/write-a-clear-workforce-brief
/blog/this-guide-does-not-exist
/login
```

Search and topic links preserve the applicable filters in the URL and reset to
page one when a filter changes. Pagination preserves those filters. Repeated query
parameters are ignored, text is bounded and invalid page values fall back safely.
The article bodies render structured text through React; there is no raw HTML
injection or rich-text dependency.

Insights is available in the main navigation. The footer includes Blog & Insights,
Portal access and Careers & jobs. Careers points to the existing job catalogue;
no unsupported internal vacancy claims or duplicate vacancy system were added.

`/login` is a portal entry page, not an authentication implementation. Its active
links go to existing public pages. It does not accept passwords, create sessions,
store tokens or imply that later portal features work today.

## Where to edit

| Location                                                            | Responsibility                                            |
| ------------------------------------------------------------------- | --------------------------------------------------------- |
| `src/styles/brand.css`, `src/styles/page-layout.css`                | Shared type, spacing and public-page components           |
| `src/styles/home.css`, `src/components/home/Hero.tsx`               | Homepage composition and engagement cards                 |
| `src/components/common/IntroPanel.tsx`                              | Shared opening brief cards                                |
| `src/components/common/ProcessFlow.tsx`, `src/styles/process.css`   | Interactive process presentation                          |
| `src/app/blog/`, `src/components/blog/`, `src/styles/editorial.css` | Insights routes and reading experience                    |
| `src/mocks/articles.ts`                                             | Editorial samples, ready to replace with approved content |
| `src/types/article.types.ts`, `src/lib/article-filters.ts`          | Article content and search contracts                      |
| `src/services/articles.service.ts`, `src/services/adapters/`        | Data access boundary                                      |
| `src/app/login/page.tsx`, `src/styles/portal.css`                   | Planned portal entry cards                                |

`page-intro.css` is removed because its compact rules are superseded. Its import
in `brand.css` now points to `page-layout.css`. Obsolete styles for the replaced
context cards and process lists are removed too. The generated root layout,
installed shadcn primitives, dependency manifests and server are unchanged.

## Later article API contract

The same adapter pattern used for jobs and forms now includes:

```text
GET /api/v1/articles?query=&category=&page=1&pageSize=6
  -> ArticleList (items, total, page, pageSize, totalPages)

GET /api/v1/articles/:slug
  -> Article, or 404 when missing/unpublished
```

These are proposed integration contracts, not implemented server endpoints.
The API base already includes `/api/v1`. The backend should return published
content only, implement the agreed filters and pagination, and supply the
structured sections defined in `article.types.ts`. A CMS/editor workflow still
needs to be agreed with the client. Add approved real jobs and articles to the
sitemap when their backend publication workflow is ready.

## Phase 1 status and next step

The public frontend route set in the brief is now represented, including the
previously missing Insights and portal-entry pages. **Phase 1 is not ready for
launch while enquiries, requirements and applications are still mocks.**

| Area                          | Remaining work                                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend acceptance           | Review the refreshed pages with the client; finish the issues they identify; check actual laptop, mobile, keyboard and zoom behaviour                                        |
| Approved content              | Final service/about copy, business email/phone/address/social links, genuine vacancies and approved articles                                                                 |
| Phase 1 operating workflow    | Confirm who receives enquiries, whether Admin Lite is required, and how jobs/articles are maintained                                                                         |
| Backend and database          | Build the existing server foundation into persisted enquiries, requirements, published jobs/articles and applications, with server validation and reliable delivery feedback |
| Authentication where required | Implement JWT and Argon2id for approved protected/admin workflows on the backend, with role-based access; the current selector is only a public entry point                  |
| Integration and release       | Connect the client adapter, check end-to-end submissions and failure recovery, configure environments/deployment/domain and complete a production review                     |

**Proceed next with frontend/client acceptance, then the Phase 1 backend.** Keep
the existing client/server architecture and extend the same models, database and
authentication foundation. The business portal is Phase 2 and the worker portal
is Phase 3; attendance, earnings and full dashboards are not completed by this
public website patch. Do not rebuild the foundation as separate future sites.

## Validation

Production build/TypeScript and focused data tests are run against the reconstructed
scaffold. The actual Windows checkout is not available here. Browser rendering and
interaction testing have not been performed for this patch; review those in the
running project before accepting the visual design.

The data checks cover article filter URLs, all topics and pagination, unknown and
unpublished guides, sample labels, isolated detail responses, cancellation,
failure handling and the future HTTP contract. Existing job and form checks cover
their unchanged submission and validation behaviour. Patch application is checked
against the delivered baseline, including Windows CRLF and mixed line endings.

## Commit message

```text
feat(client): complete Part 7 pages and refine public website layouts

- enlarge page introductions and strengthen shared cards and spacing
- replace process lists with connected interactive step panels
- add Insights search, topic filters and complete sample guide pages
- add planned portal access and consistent recovery pages
- document Phase 1 acceptance, backend integration and launch work
```
