# Part 8 — compact blog hero and responsive polish

This corrected patch is built against the supplied `NZH91.zip` codebase, which
already includes Part 7 and its recruitment and operations cover images. It
preserves the latest compact home hero, the removed motion button and the
removed image source badge. No packages, environment variables or migrations
are required. It includes eleven additional 960px WebP variants.

Use this file in place of the original Part 8 patch. From the repository root:

```bash
git apply --check zobhunger-part8-responsive-performance-fixed.patch
git apply zobhunger-part8-responsive-performance-fixed.patch
```

## Blog hero and covers

The featured card on `/blogs` is limited to 26rem wide, with an image no taller
than 13.5rem. On desktop its image height adapts to the visible viewport. The
headline uses more of the left column, and the card has a smaller heading and
tighter spacing. The full card remains in normal document flow: its title and
link are not truncated and it has no internal scrollbar.

| Article | Cover retained from Part 7 |
| --- | --- |
| How to build a field workforce that performs from day one | A recruiter interviewing a candidate (`workforce-hiring`) |
| The operating system for managing distributed teams | Coordinators reviewing field updates (`operations-coordination`) |

The same mappings drive the featured guide, article grid and individual article
headers. The featured guide can repeat its own thumbnail in the results, but the
two different articles use different images.

## Part 8 changes

- `/blogs` and `/blog/[slug]`: compact featured card, wrapping mobile category
  labels and filters, reduced nested spacing in article graphics. The article
  contents list stops being sticky on short laptop screens.
- `/solutions` and related service cards: service labels wrap, and execution
  steps adapt to the card's own width through container queries.
- Service detail pages and `/how-it-works`: activity selectors use two columns
  on phones, with narrower card padding and readable action text.
- `/`: compact touch selectors and captions. Continuous hero motion pauses
  when its figure is outside the viewport or when the tab is hidden. The moving
  process marker uses transforms; reduced-motion preferences remain respected.
- `/case-studies` and detail pages: room for wrapping links, larger link hit
  areas, compact phone layouts and reduced-motion hover behaviour.
- Every execution image: a 960px source between 600px and 1200px, plus native
  automatic sizing for lazy images with an explicit fallback. Priority covers
  retain eager loading, and intrinsic dimensions reserve space for all images.

## Verification

```bash
cd client
npm run lint
NEXT_PUBLIC_DATA_MODE=mock npm run build
```

The local checks cover client lint and production build, generated page markup,
distinct blog cover sources, image variants, motion gating and clean patch
application against the supplied ZIP. The 960px images are 24–26% smaller than
their 1200px versions; the actual chosen source depends on the browser and pixel
density.
There is no Lighthouse score or browser-rendered viewport measurement from this
environment.

For the visual pass on the deployed site, use 1280×720 and 1366×768 for the blog
hero, then 390px and 320px widths for the cards, activity selectors and diagrams.
At increased browser zoom and very short screen heights, content continues to
flow normally rather than hiding text to force a fixed-height hero.
