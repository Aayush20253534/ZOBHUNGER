# Responsive Design and Accessibility

## Supported responsive behavior

The application has dedicated mobile styling and route-specific responsive rules. New work must be reviewed at narrow phone, typical phone, tablet and desktop widths; do not treat “CSS compiles” as responsive verification.

### Required checks

- no horizontal page overflow at common mobile widths;
- sticky/fixed UI does not cover content or actions;
- navigation/drawers are keyboard operable;
- long names/emails/status text wrap safely;
- tables have a mobile strategy (scroll, cards or responsive columns);
- forms remain readable and controls retain usable touch targets;
- modals/sheets fit the viewport and expose close controls.

## Accessibility conventions

The shared brand CSS includes focus-visible behavior and a skip link. Continue using semantic HTML, real buttons/links, associated labels and ARIA only when native semantics are insufficient.

### Baseline expectations

- keyboard access to every interactive operation;
- visible focus indicator;
- meaningful page/section headings;
- status not communicated by color alone;
- decorative icons marked appropriately;
- loading regions use status semantics where useful;
- form errors are associated with the affected input;
- reduced-motion preferences are respected for non-essential animation.

## Search/index accessibility boundary

Authenticated/private portal pages are not public SEO content. Production configuration applies no-index/no-store behavior to private route families; public pages remain indexable according to route metadata and sitemap policy.
