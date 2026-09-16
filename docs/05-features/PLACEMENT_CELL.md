# Placement Cell

## Partnership and activation

Placement institutions apply through the public placement-cell partnership flow. Approved institutions use the placement login/portal.

## Candidate roster

Placement candidates are stored as managed institution candidates. Listing is server-paginated and searchable; the portal must not load the whole roster merely to implement a selector.

## Opportunities

The portal exposes available jobs/opportunities with server-side pagination, filters and dynamic opportunity-type values derived from actual data.

## Applications

A placement cell can search its candidate API while working on an opportunity, choose the intended managed candidate and submit an application. The candidate selector therefore works beyond page one of the roster.

Application tracking is also server-paginated and filtered rather than capped at a hard-coded first N records.

## Admin relationship

Admins review placement-cell applications and can perform broader candidate/operational administration according to `PLACEMENT_MANAGE` and related permissions.
