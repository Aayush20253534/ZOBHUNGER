# Service cards and phone layouts

This patch is based on the latest NZH91 code, with the corrected Part 8 and Careers changes retained. It contains no new dependencies or environment settings.

## Where the changes appear

All seven service detail pages use the compact preview: `/workforce-solutions`, `/sales-force`, `/promoter-solutions`, `/retail-execution`, `/brand-activation`, `/business-operations`, and `/gig-workforce`.

- Each preview combines a relevant existing AI service image, a four-step icon flow and engagement modes. The desktop card has a narrower column and a shorter photo on short laptop screens. Its text uses natural height, with no internal scrolling or clipped details.
- Suitability, the supporting description and all service facts now appear in the full-width “At a glance” section below the hero. The section navigation links directly to it.
- All 56 service activities have relevant icons. The service-specific enquiry links and all original descriptions remain available.

The shared phone stylesheet loads from the root layout. It improves page gutters, hero typography, actions, service/blog/case-study grids, nested process panels, forms, dropdown labels and footer columns. Existing responsive rules continue to handle the other sections, including Careers.

The mobile/tablet navigation includes an expandable list of the seven services and a Find Work action. The drawer uses the available screen height, scrolls internally when necessary, and closes on route changes. The close button has a larger touch target.

Home and Presence include a readable location key below the map on phones. The India outline and marker positions are unchanged. Existing marquee motion, home hero animation and reduced-motion behaviour remain intact.

On phones the hero copy and visual stack vertically. The compact card is not designed to force the entire page introduction into one screen at every browser zoom or screen height.

## Validation

- Production build succeeded, including TypeScript and 68 generated routes.
- ESLint reported no errors. The two existing unused-variable warnings in `BrandMarqueeMotion.tsx` remain.
- HTTP checks passed for 60 page routes using mock data, including public pages and unauthenticated portal states. Every response includes the shared responsive stylesheet and viewport configuration.
- All seven distinct hero covers and their WebP variants load. All 28 stage icons, 56 activity icons, original service descriptions, suitability text, facts, section anchors and enquiry preselection links were checked.
- CSS syntax and class references were checked. The patch was checked and applied to a fresh copy of NZH91, and to NZH91 with the corrected Part 8 and Careers patches.
- Browser review of the current service page was blocked by the preview environment (`net::ERR_BLOCKED_BY_CLIENT`). Pixel layout, touch interaction and authenticated portal screens have not been visually verified here. Review on real devices at 320, 375, 390 and 430 px, in landscape, and on a 1366 × 768 laptop before release.

## Apply and commit

Run these from the repository root. Stop if the check reports a conflict.

```powershell
git apply --check zobhunger-services-mobile-responsive.patch
git apply zobhunger-services-mobile-responsive.patch
git add client/src/app/layout.tsx client/src/components/ui/select.tsx
git add client/src/components/solutions/SolutionDetail.tsx client/src/components/solutions/SolutionExecutionVisual.tsx client/src/components/solutions/solution-icons.ts
git add client/src/components/layout/MobileMenu.tsx client/src/components/layout/Navbar.tsx
git add client/src/components/presence/OperatingFootprintMap.tsx client/src/components/presence/OperatingFootprintPanel.tsx
git add client/src/styles/mobile.css client/src/styles/service-hero.css docs/services-mobile-responsive.md
git commit -m "fix: compact service cards and improve mobile layouts"
git push
```
