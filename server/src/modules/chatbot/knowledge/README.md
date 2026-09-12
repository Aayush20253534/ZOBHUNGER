# ZOBHUNGER Chatbot Knowledge Base

This directory is the version-controlled source of truth for the public website chatbot.
The chatbot must retrieve facts from these files before sending context to an LLM.
Do not place customer, worker, employee, candidate, admin, authentication, payroll, attendance,
or other private records in this directory.

## Folder contract

Every knowledge document belongs in one of these category folders:

- `company/`
- `services/`
- `industries/`
- `workers/`
- `businesses/`
- `jobs/`
- `partnerships/`
- `case-studies/`
- `contact/`
- `policies/`

`_templates/` and `runtime/` are infrastructure folders and are ignored by the loader.

## Required frontmatter

```md
---
id: workforce-solutions
title: Workforce Solutions
category: services
url: /workforce-solutions
keywords:
  - workforce
  - manpower
  - deployment
status: published
description: Public facts about ZOBHUNGER workforce solutions and how businesses can enquire.
updatedAt: 2026-09-11
---

# Workforce Solutions

Write explicit, factual chatbot knowledge here.
```

Required fields are `id`, `title`, `category`, `url`, `keywords`, and `status`.
Optional fields are `description`, `aliases`, and `updatedAt`.

## Status behavior

- `published`: loaded by the runtime knowledge loader.
- `draft`: validated but excluded from normal runtime loading.
- `archived`: preserved in Git and validated, but excluded from normal runtime loading.

## Writing rules

1. Write facts explicitly instead of copying vague marketing prose.
2. Keep one topic per document where practical.
3. Use descriptive headings because later RAG chunking will preserve heading context.
4. Include alternate terminology in `keywords` or `aliases` instead of repeating paragraphs.
5. Use site-relative public URLs only, such as `/for-business`.
6. Never index `/admin`, private `/business/*`, private `/worker/*`, or employee-joining routes.
7. Do not store secrets, API keys, personal data, internal notes, or unpublished commercial terms.
8. Update `updatedAt` when facts materially change.

## Validation

From the repository root:

```bash
npm run chatbot:knowledge:validate
```

Or from `server/`:

```bash
npm run chatbot:knowledge:validate
```

The command fails with a non-zero exit code on invalid metadata, malformed frontmatter,
duplicate IDs, category/folder mismatches, protected URLs, or published files with almost no body content.
Warnings identify quality issues such as missing headings or duplicate keywords.


## Phase 2 public knowledge corpus

The repository now contains a curated public website corpus generated from the current frontend/data sources. The published set covers the homepage/company facts, services, industry pages, business and worker journeys, careers, partnerships, brand experience, case studies and contact details. A draft policy document records chatbot-only grounding boundaries and is excluded from the normal runtime loader.

Primary maintenance sources include `client/src/data/solutions.ts`, `solution-details.ts`, `industry-details.ts`, `company.ts`, `market.ts`, `workers.ts`, `brand-experience.ts`, `case-studies.ts`, `partner-program.ts`, `placement-partnership.ts`, `vendors.ts`, `site.ts`, and the corresponding public page/form components.

When public website copy changes materially, update the matching knowledge document in the same commit and run `npm run chatbot:knowledge:validate`.
