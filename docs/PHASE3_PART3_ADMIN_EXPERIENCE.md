# Phase 3 · Part 3 — Department-aware Admin Experience

Part 3 keeps one ZOBHUNGER Operations application and makes the complete admin experience adapt to the administrator's database-backed department permissions introduced in Part 2.

## What changed

- The sidebar remains one shared corporate navigation surface, but only permitted workspaces are rendered.
- Direct navigation to a registered workspace is checked against the same permission attached to its navigation entry. Unknown department routes fail closed for department administrators; Main Administration can still receive the application's normal not-found state.
- The collapsed sidebar preference persists locally on the administrator's device and expands into the normal mobile drawer on small screens. The shell fails closed for unauthorized direct URLs while Main Administration retains the normal application not-found behavior.
- The ZOBHUNGER sidebar wordmark now renders `ZOB` and `HUNGER` on one baseline at the same size, reserves its own inline space beside the collapse control, and cannot be clipped by the brand row. The previous descendant CSS rule was shrinking `HUNGER` because it also matched the department-caption typography.
- Sidebar color/highlight treatment is synchronized with the public footer's crimson gradient and top highlight.
- The overview uses department-specific hierarchy for Main Administration, Career & HR, Technical, Placement Cell and Legal while reusing one dashboard component.
- KPI links and review-queue actions are only rendered when the linked workspace is actually permitted. If an administrator has read data without the companion workflow permission, the KPI falls back to a safe in-dashboard record anchor instead of sending them to a 403 page.
- Placement Cell onboarding is surfaced as an actionable queue when that department has submissions.
- Narrow-scope departments receive an intentional least-privilege state instead of a broken or mostly empty Main Admin dashboard.
- Route-level loading, error and not-found states are branded and rendered inside the secure admin shell.
- Existing admin empty/loading/error surfaces receive compact shared visual normalization without replacing their working business logic.

## Security boundary

Part 3 is presentation and route-experience hardening on top of Part 2. Server-side API authorization remains enforced by the Part 2 administrator permission middleware. Client-side hiding is never treated as the security boundary.

## Validation

Run:

```bash
npm run test:admin-experience
npm run verify
```

The dedicated source-contract test checks that every existing admin page maps to a registered permission-aware workspace, that the shell fails closed for department routes, that collapse state persists, that all five department profiles exist, that route states are present, and that the sidebar wordmark/footer color contract remains intact.
