# Careers page — visual refresh

Visit `/careers`, available through the Careers link in the site footer.

## What changes

- A compact team photograph replaces the text panel beside the hero.
- Three linked icon tiles lead to career areas, the working environment and the hiring journey.
- A learning scene sits beside four concise working principles.
- Six career areas have illustrated icon headers and a short view of each function's work.
- A field scene introduces the company-role and platform-opportunity paths.
- A numbered, icon-led hiring timeline becomes a vertical sequence on smaller screens.

The existing six career areas, role-dependent hiring process, and contact/jobs
destinations are retained. This is a presentation update; it does not create new
vacancies or a job application backend.

## Apply

Built against `NZH91.zip` with the corrected Part 8 patch applied.

```powershell
git apply --check zobhunger-careers-visual-refresh.patch
git apply zobhunger-careers-visual-refresh.patch
```

No new packages, environment variables or migrations are required.

## Images and performance

These three original scenes were created with the built-in image generation
tool. They are illustrative workplace scenes, not documentary photographs of
employees or offices. Their alt text identifies them as AI-generated.

| Scene | Page placement | Saved asset base |
| --- | --- | --- |
| Team collaboration | Hero | `client/public/images/careers/team-collaboration` |
| Learning together | Working environment | `client/public/images/careers/learning-together` |
| Field opportunities | Ways to work with us | `client/public/images/careers/field-opportunities` |

Each base has `-600.webp`, `-960.webp`, `-1200.webp` and `-1536.webp`
variants, all at a 3:2 ratio. The patch embeds all twelve images. The hero is
loaded eagerly with high priority; the other two scenes load lazily with
automatic rendered-width sizing and an explicit fallback. Width and height
reserve image space. The page and its images are server components; the refresh
does not add a client animation library or require an image service.

The hero image has a viewport-aware height on desktop; text remains in normal
flow on small screens and at increased zoom. The hiring journey uses an ordered
list, decorative icons are hidden from assistive technology, and section links
have visible keyboard focus. Hover movement follows reduced-motion preferences.

## Verification

The client lint check completed with no errors; the two existing warnings in
the unchanged brand marquee component remain. The production build in mock
data mode generated all 68 routes. The Careers page and all twelve image
variants returned HTTP 200. The page checks cover the three distinct scenes,
loading priorities, alt text, six career areas, four hiring steps, section
anchors and existing opportunity destinations.

The local preview URL was blocked by the preview browser
(`ERR_BLOCKED_BY_CLIENT`), so a browser-rendered viewport check was not available.
For a visual review after applying, check `/careers` on a laptop and phone,
including the full hero card, image crops and the vertical hiring journey.

## Image prompts

The prompts below are the final generation prompts. WebP conversion preserves
the generated compositions and applies only resizing and compression.

### team-collaboration

```text
Use case: photorealistic-natural.
Asset type: landscape 3:2 photograph for the Careers page of ZOBHUNGER, an Indian workforce and business execution company.
Create one premium, natural editorial photograph of four Indian adult colleagues, women and men aged about 24–40, working together around a small meeting table in a bright, realistic Indian regional office. One female team lead in a deep burgundy polo discusses a work plan with three colleagues, with an open laptop, a notebook and a simple printed checklist on the table. An inclusive, engaged team, candid expressions, looking at each other and the work rather than posing at the camera. Two colleagues wear burgundy company polos with a small clean white embroidered wordmark on the left chest; others wear understated smart casual office clothes.
Text (verbatim, only on the polos): "ZOBHUNGER" — spell Z O B H U N G E R exactly. No large text or slogan in the scene.
Warm daylight, natural skin and fabric texture, white walls, subtle plants, a burgundy accent, a believable professional office. Eye-level medium-wide composition, all four faces and meaningful work actions within the central 80% of frame, generous breathing room around subjects so the photograph can be cropped to 16:10. Muted warm neutral palette with rich burgundy uniforms, polished but not glossy stock photography. No collage, no watermarks, no UI overlay, no fake charts or visible personal information, no implausible hands, no corporate skyscraper. One complete scene, landscape 1536x1024.
```

### learning-together

```text
Use case: photorealistic-natural.
Asset type: landscape 3:2 photograph for a ZOBHUNGER Careers page section about learning through work.
Create one realistic editorial photograph of an Indian woman mentor in her thirties wearing a deep burgundy ZOBHUNGER polo, guiding two adult new colleagues through an onboarding exercise at a modest bright office training table. The mentor is seated at the left, a woman and man aged about 22–28 sit nearby, all looking at a tablet showing simple abstract checklist blocks, one colleague taking notes in a notebook. Friendly, attentive body language; clearly a hands-on learning moment, distinct from a group meeting. Burgundy polos for the mentor and one trainee, a neutral beige shirt for the other trainee. Small white left-chest embroidery reads exactly "ZOBHUNGER" (Z O B H U N G E R). No other prominent text.
Eye-level medium close shot showing three faces, tablet and notebooks; central composition with subjects safely inside the frame for responsive cropping. Soft window light, natural Indian skin tones, authentic fabric textures, a modest light oak table, cream walls and a softly blurred training-room backdrop. Warm neutrals, burgundy accents, no large wall lettering, no statistics, no certificates, no watermark, no collage, no UI overlay. Landscape 1536x1024.
```

### field-opportunities

```text
Use case: photorealistic-natural.
Asset type: landscape 3:2 photograph for ZOBHUNGER Careers page, showing real-world field work.
Create one polished, natural editorial photograph in a clean, lively neighbourhood shopping street in India, in soft morning daylight. Two Indian adult field colleagues, a woman and a man aged about 24–32, both in matching deep burgundy company polo uniforms with navy lanyards and dark trousers, stand just outside a grocery shop. The woman holds a tablet and explains a store-visit plan to her colleague, who holds a slim notebook and listens. The shop shelves and blurred market shoppers in the background make the setting recognisably real, but the focus is on the two colleagues supporting each other on a field assignment. This is a careers teamwork image, not a sales pitch to a customer.
Exact small white embroidered wordmark on their left chest: "ZOBHUNGER" spelled Z O B H U N G E R. No other prominent readable text, no personal information on lanyards.
Eye-level medium-wide view, frame both from roughly waist upward, central 80% crop-safe for card layouts. Natural expressions, believable tablet grip and hands, subtle depth of field, warm stone and shop colours with strong burgundy uniforms. No giant logo, no large title, no collage, no watermark or UI graphics. Landscape 1536x1024.
```
