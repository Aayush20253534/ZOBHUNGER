# Design System

## Brand direction

The application uses a bright, corporate workforce-technology visual language rather than a generic dashboard theme. The primary brand family is red/burgundy on white with soft rose surfaces.

Current shared CSS tokens in `client/src/styles/brand.css` include:

| Token | Current value / purpose |
|---|---|
| `--zb-page` | `#fdfcfd` page background |
| `--zb-surface` | `#ffffff` cards/panels |
| `--zb-ink` | `#1f1e23` primary text |
| `--zb-panel` | `#6a2132` deep brand panel/sidebar family |
| `--zb-action` | `#d9273b` primary action red |
| `--zb-action-hover` | `#b91f31` action hover |
| `--zb-highlight` | `#ffe9ed` highlighted surface |
| `--zb-soft` | `#fff7f8` soft panel |
| `--zb-border` | `#ebe6e9` standard border |
| `--zb-radius` | `0.75rem` base brand radius |

Do not copy hex values into new feature CSS when an appropriate token exists.

## Typography

The global UI normalizes the product onto the configured ZOBHUNGER sans family. `brand.css` includes the packaged Manrope face for brand surfaces; global app tokens also expose the main sans variable. New components must inherit the established font instead of introducing arbitrary typefaces.

Headings use tighter letter spacing than body text. Body copy prioritizes readability over decorative styling.

## Core component behavior

- strong primary CTA in brand red;
- white cards with restrained borders/shadows;
- deep red/burgundy for high-authority navigation/panel surfaces;
- visible focus states;
- status colors used semantically and with text labels, not color alone;
- icons support labels rather than replacing critical text.

## Development preview

`/design-system` renders the internal `DesignSystemPreview` in development and returns not-found in production. Use it to inspect shared controls without creating a public design-demo route.

## Portal consistency

Business/admin/worker/institution portals may have feature-specific CSS, but they should share:

1. predictable page title/action region;
2. compact operational cards rather than oversized marketing panels;
3. readable data density;
4. consistent empty/loading/error states;
5. responsive tables/cards that do not require desktop-only interaction;
6. one visual hierarchy for primary, secondary and destructive actions.
