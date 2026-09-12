# Phase 9 — SEO, Sitemap & Google Indexing

Phase 9 makes the public ZOBHUNGER website crawlable as one canonical production property while keeping portals, admin surfaces and submission-only pages out of search results.

## Canonical production property

Use the apex production origin everywhere:

```text
https://zobhungr.com
```

Vercel:

```env
NEXT_PUBLIC_SITE_URL=https://zobhungr.com
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com/api/v1
```

Render:

```env
PUBLIC_APP_URL=https://zobhungr.com
CLIENT_ORIGIN=https://zobhungr.com
```

Do not mix `www.zobhungr.com` and `zobhungr.com` across those variables. The alternate hostname may redirect to the canonical origin, but metadata and backend public links should use the canonical apex origin.

## Google Search Console verification

Search Console can verify the site by an HTML meta tag. Copy only the token from Google's tag and add it to Vercel Production environment variables:

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<token-only>
```

For example, if Google gives:

```html
<meta name="google-site-verification" content="abc123" />
```

set:

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=abc123
```

Redeploy the frontend after changing the value. Phase 9 exposes the token through Next metadata on public pages. The value is intentionally public; it is a verification token, not an application secret.

After verification, submit:

```text
https://zobhungr.com/sitemap.xml
```

in Search Console → Sitemaps.

Google controls crawl timing, indexing eligibility and ranking. A successful technical check makes pages discoverable and indexable; it cannot guarantee that Google will index every URL immediately.

## Crawl policy

`/robots.txt` advertises the sitemap and blocks crawler access to private application surfaces such as:

- `/api/`
- `/admin/`
- `/admin-access/`
- `/business/`
- `/worker/`
- `/placement-portal/`
- private joining/login routes

Private HTML routes also receive `X-Robots-Tag: noindex, nofollow, noarchive` and `Cache-Control: private, no-store` where appropriate.

Public form/search surfaces that should remain accessible to users but should not become search landing pages use `noindex, follow` instead. This includes filtered job/blog result pages and submission-only forms.

## Dynamic sitemap

`/sitemap.xml` includes:

- public static landing pages
- all solution pages
- all industry pages
- case studies
- currently published, non-demo jobs from the production API
- currently published CMS articles

Dynamic job/article `lastModified` values come from their records. The sitemap intentionally omits demo vacancies, private routes and CMS articles whose canonical URL points to another origin.

The sitemap stays available if the backend temporarily fails: static pages still render in the sitemap and dynamic entries return automatically when the API becomes healthy again.

## Structured data

Phase 9 publishes JSON-LD for:

- `Organization`
- `WebSite`
- `BreadcrumbList`
- `JobPosting` for live, non-demo jobs
- `BlogPosting` for published CMS/editorial articles

JobPosting uses only information the platform actually stores. It does not invent salary ranges, closing dates or employer details that are not available in the job record.

## Social metadata

A 1200×630 Open Graph image is generated through Next metadata for pages that do not provide a CMS-specific image. Blog CMS cover/Open Graph images continue to override the default where configured.

Phase 9 also adds a web manifest and logo metadata so crawlers and browsers receive consistent brand assets.

## Query-page indexing policy

The canonical catalogue pages remain indexable:

```text
/jobs
/blogs
```

Filter/search/pagination URLs are canonicalized to their catalogue and marked `noindex, follow`, for example:

```text
/jobs?location=Delhi
/jobs?query=sales&page=2
/blogs?category=Hiring+Trends
/blogs?query=retail
```

This prevents thousands of thin parameter combinations from competing with the primary landing pages.

## Local verification

Run the Phase 9 regression suite:

```powershell
npm run test:seo
```

Then run the complete repository verification:

```powershell
npm run verify
```

## Live production gate

After Vercel has redeployed, run:

```powershell
npm run check:seo -- https://zobhungr.com
```

If Search Console verification has been configured, also verify the exact deployed token:

```powershell
npm run check:seo -- https://zobhungr.com YOUR_GOOGLE_VERIFICATION_TOKEN
```

The live gate checks:

- canonical homepage
- indexability of the homepage
- Organization/WebSite JSON-LD
- robots.txt sitemap declaration and private-route rules
- sitemap canonical-origin integrity
- absence of private/noindex URLs from sitemap
- filtered jobs/blogs `noindex` policy
- JobPosting JSON-LD when a live job exists
- BlogPosting JSON-LD when a live article exists
- optional Search Console verification token

The report is written to:

```text
.release-artifacts/seo-indexing-check.json
```

## Search Console launch checklist

1. Deploy Phase 9 to Vercel.
2. Confirm `https://zobhungr.com` is the canonical production domain.
3. Add `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and redeploy if using HTML-tag verification.
4. Run `npm run check:seo -- https://zobhungr.com`.
5. Verify the property in Google Search Console.
6. Submit `https://zobhungr.com/sitemap.xml`.
7. Use URL Inspection for the homepage, `/jobs`, `/blogs`, one live job and one published article.
8. Request indexing for the key launch URLs after they pass inspection.
9. Monitor Search Console Pages and Enhancements/Rich Results reports after Google recrawls the site.
