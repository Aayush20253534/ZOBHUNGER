# Homepage scale, verification and brand activation

This incremental patch is based on the source after `zobhunger-partner-approval-career-intake.patch`. Apply it after that patch. It contains frontend content, styling and optimized image assets; no database migration, environment variable or new dependency is required.

## Pages to review

| Page | Changes |
| --- | --- |
| `/#our-scale` | Reference-inspired metric grid, modern/general trade imagery and technology capability strip |
| `/#home-solutions` | See Our Team in Action with eight keyboard/touch-selectable activity stories |
| `/#execution-service-offerings` | All verification and branding offerings, plus linked workforce/business support services |
| `/verification-services` | Full service page, compact illustrated hero, eight verification services, execution flow and related services |
| `/brand-activation` | New branding/sticker/flyer image and campaign example, plus the six requested offerings |
| `/business-operations` | Content moderation, onboarding/KYC support and hyperlocal operations added to the service list |
| `/solutions` | Verification added as the eighth catalogue service |
| `/for-business` | Verification and branding cards in the business needs section |
| `/hire-workforce?service=verification-services` | Verification preselected in the existing requirement form |
| Public footer | Verification and branding links under For business; verification also appears in Services |

The existing partner approval, business login, HR, admin and portal flows are unchanged by this patch.

## Content and presentation

The statistics and technology capability wording come from the client's 9 September 2026 brief: 15,000+ Gig Field Force, 70+ clients, 12,000+ deployment PIN codes, five regional offices and a 100% in-house technology platform. The requested industry names are included in full. These are company-supplied marketing figures, not totals read from the portal database. Edit their shared source in `client/src/data/service-expansion.ts` when the company updates them.

The technology strip presents the supplied AI, image recognition, analytics and BI copy. This content patch does not implement the Phase 4 AI models or introduce new live monitoring/analytics integrations.

The section title is corrected to **See Our Team in Action**. The original six activities remain available, with verification and branding added first. Radio controls support native keyboard and touch interaction. In browsers without CSS `:has`, the complete stories remain visible. Print styles also show all stories.

Verification is part of the shared service catalogue, so the existing requirement selector and form validation accept `verification-services`. The existing backend accepts service names as strings and needs no schema change. The new page has no fabricated case study; it shows an illustrative execution example and a practical process instead. Existing services retain their case studies.

The layout uses the current red, burgundy and white theme. Grids collapse for narrow screens, text stays in normal flow, controls remain usable by touch, and the existing reduced-motion behavior is retained. The metric values are readable without JavaScript or count-up animation.

## Assets

Two new illustrations were created with the built-in image-generation tool and inspected for the requested interaction:

- `client/public/images/execution/verification-{600,960,1200,1536}.webp`
- `client/public/images/execution/brand-deployment-{600,960,1200,1536}.webp`

Each set uses a 3:2 aspect ratio and responsive `srcset`. Below-the-fold images load lazily; the verification/brand service hero uses the existing priority-image behavior. All variants are included as binary additions in the patch, so no separate image download is needed. They illustrate typical activities and are not photographs of actual client projects.

Modern and general trade tiles reuse the existing audit and QR deployment images. The attached reference informs the layout; its third-party figures, colors and labels are not copied.

## Apply and deploy

From the repository root:

```powershell
git apply --check zobhunger-home-scale-verification-branding.patch
git apply zobhunger-home-scale-verification-branding.patch
npm --prefix client run build
git add client/src client/public/images/execution docs/service-offerings-homepage.md
git commit -m "feat: showcase company scale and verification and branding services"
git push origin main
```

Deploy the frontend. This patch does not require a backend migration or restart.

## Validation

Production build/type checking, lint, generated-page content, service-selection compatibility and clean-baseline patch application are checked before delivery. New image references and all responsive variants are checked locally. Browser rendering on desktop/mobile and live enquiry submission were not verified in this environment.

## Image prompts

### verification

Use case: photorealistic-natural. Asset type: landscape 3:2 service photograph illustration for ZOBHUNGER workforce and business execution website. Scene: a professional Indian woman field verification executive wearing a neat dark red polo shirt embroidered with small white 'ZOBHUNGER' text and a plain ID lanyard, visiting an Indian small business office. She and an adult male business owner sit across a tidy desk; she respectfully compares a paper document with a checklist on her tablet while he points out a document detail. Show both faces and the document-checking interaction, natural anatomy and hands, approachable professional mood. Simple believable Indian market office, sunlight from a window, neutral walls, understated red accents, crisp editorial photography quality, natural skin textures. Medium-wide composition with complete upper bodies central and room around subjects for responsive cropping. Documents and tablet contain only indistinct forms, no legible personal details, no real government IDs or actual financial information. No overlays, no large title, no watermark, no frames, no extra branding.

### brand-deployment

Use case: photorealistic-natural. Asset type: landscape 3:2 service photograph illustration for ZOBHUNGER. Show a coordinated on-ground branding activity in a clean lively Indian neighbourhood shopping lane in natural morning light: a male field executive in a professional dark red polo with a small white 'ZOBHUNGER' chest wordmark neatly applies a promotional sticker to the outside of a shop glass panel with the shop owner's permission; nearby a female colleague in the same uniform hands one tasteful promotional leaflet to a willing adult shopper. Scene must clearly show sticker placement and leaflet distribution, credible restrained brand activation, friendly and professional faces, natural hands, realistic Indian market setting, medium-wide editorial photograph, subtle depth of field and rich natural textures. Central subjects and all important actions within middle 80 percent, ample crop room. Promotional artwork red and cream with simple abstract product graphics, no readable campaign claims, no real third party brand marks. No title, no infographic, no collage, no watermark.
