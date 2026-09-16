# UI/UX Guidelines

## Public pages

Public pages are persuasive and explanatory. Use large but controlled editorial sections, real service/industry context, clear CTAs and the shared ZOBHUNGER brand palette. Avoid turning every section into an identical rounded card grid.

## Operational portals

Portals optimize for task completion:

- put the current task/status before decorative content;
- keep primary actions visible but not duplicated;
- show filters near the data they affect;
- display pagination and result counts for bounded lists;
- confirm consequential state changes;
- preserve user-entered form data across recoverable errors where practical;
- use explicit empty states that explain what creates the first record.

## Loading/error states

Major portal route families have route-level `loading.tsx` and `error.tsx` boundaries. Reuse `LoadingState`/`PortalRouteError` rather than inventing feature-specific full-page failures.

Errors should tell the user what can be retried without exposing stack traces, request tokens or provider messages.

## Forms

- labels remain visible when fields contain text;
- required/optional meaning is explicit;
- server validation is authoritative even when client validation exists;
- file size/type expectations are shown before upload;
- submit buttons show pending state and prevent accidental duplicate interaction;
- success state should make the next action clear.

## Tables and large datasets

Do not fetch an entire database table to make frontend filtering easier. Use server-side search/filter/pagination and show total/result context.

## Destructive actions

Withdrawal, archive, revoke, cancel, void and status-degrading actions need visually distinct treatment and, where the workflow is materially consequential, explicit confirmation/reason collection.
