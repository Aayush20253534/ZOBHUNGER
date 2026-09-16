# Public Website

## Purpose

The public site explains ZOBHUNGER's workforce, sales and execution services and provides intake routes into the platform.

## Main route groups

### Company and discovery
`/`, `/about`, `/presence`, `/how-it-works`, `/technology`, `/brand-experience`, `/case-studies`.

### Solutions/services
`/solutions`, `/workforce-solutions`, `/gig-workforce`, `/sales-force`, `/retail-execution`, `/promoter-solutions`, `/verification-services`, `/telecaller-telesales-services`, `/website-application-development`, `/brand-activation`, `/business-operations`.

### Industry/content
`/industries`, `/industries/[slug]`, `/jobs`, `/jobs/[slug]`, `/blog`, `/blogs`, `/blog/[slug]`.

### Intake
`/contact`, `/hire-workforce`, `/careers/apply`, `/internships/apply`, `/become-a-partner`, `/placement-cell-partnership/apply`, `/iti-polytechnic-cell/apply`, `/iti-polytechnic-cell/student-registration`, `/vendor-empanelment`, `/employee-joining`, `/employee-compliance/*`.

## Data behavior

Public jobs and published articles are backend-connected. Intake forms send validated submissions to `/api/v1` endpoint families rather than writing directly to the database.

## SEO

Canonical site configuration comes from `NEXT_PUBLIC_SITE_URL`. The app provides route metadata, sitemap/robots behavior and Google verification support. Private portal route families are excluded from indexing.

## AI assistant

The floating/public assistant uses the chatbot API and official managed knowledge. Public answers should remain grounded in approved ZOBHUNGER information and provide official navigation/actions where appropriate.
