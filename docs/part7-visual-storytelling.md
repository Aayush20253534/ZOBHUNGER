# Part 7 — covers, case studies and homepage motion

Apply this patch on top of the completed Parts 1–6. It contains the code and all
15 new WebP files; it does not need an image-generation key or a new dependency.

```bash
git apply --check zobhunger-part7-covers-case-studies-hero.patch
git apply zobhunger-part7-covers-case-studies-hero.patch
```

## Where to see the changes

| Page | Change |
| --- | --- |
| `/solutions` | All seven service cards have activity-specific photographic covers. Related service cards reuse them wherever `SolutionCard` is rendered. |
| `/blogs` | Photographic article cards and featured cover; recruitment, operations and gig articles now use the new images. Page 2 contains the remaining article. |
| `/blog/[slug]` | Updated covers for the same articles, alongside the Part 6 field examples and diagrams. |
| `/case-studies` | Photographic featured story and covers for all eight project models. |
| `/case-studies/[slug]` | A cover, four-step activity sequence, suggested client handover, feedback loop and related service/article links. |
| `/` | Longer hero entrance, continuous image and process-graphic motion with a pause button; photographic case-study previews further down the page. |

Case studies are representative project models. Their images are labelled
AI-generated and the outcome section describes intended results. No client names,
measured campaign statistics or fictional testimonials have been added.

## Motion and image delivery

The hero entrance lasts about 2.4 seconds overall. Copy and actions settle once;
the image gently zooms over 14 seconds and the Plan / Deploy / Review graphic
cycles over 9 seconds. The pause button stops both continuous animations. Motion
is disabled by the reduced-motion preference, stays static when printing, and
continuous animations pause while the browser tab is hidden. They only run after
the pause control has hydrated; there is no continuously moving no-JavaScript UI.

Only the small motion control is a client component. Images, case-study stories
and service cards remain server-rendered, with intrinsic dimensions, responsive
WebP sources and lazy loading below the fold. Existing Part 3 scenes are reused
where they match the activity. The five new scene prompts and asset paths are
recorded in `docs/execution-visuals.md`.

## Local verification

```bash
cd client
npm run lint
NEXT_PUBLIC_DATA_MODE=mock npm run build
```

Check the homepage with reduced motion enabled and disabled, and use Pause motion
and Resume motion on the image. On narrow screens the case-study sequence stacks
in reading order; on wider screens it uses two or four columns. Existing service
details, blog content and case-study challenge/solution/outcome text are retained.
