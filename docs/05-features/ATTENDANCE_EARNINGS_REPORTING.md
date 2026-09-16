# Attendance, Earnings and Reporting

## Attendance

Attendance is tied to workforce assignments. The API supports daily/month assignment views, records, corrections and status/history events.

Business and admin route families expose the actions appropriate to their role. Worker attendance requests form a separate worker-facing queue that admins can review.

## Attendance approvals

The phase-2 operational workflow includes approval queues/details and business-side decisions where applicable. Decision history is preserved and paginated.

## Earnings

Admins manage earnings statements for eligible worker assignments, including:

- draft creation/update;
- line items/context;
- approval;
- adjustments;
- payment records and payment voiding.

Workers only receive the worker-facing approved earnings views exposed by the service.

## Reporting

Business/admin operational reports support filtered read, print-oriented output and CSV export. Technical-institute and compliance exports have independent bounded implementations.

## Scaling rule

Do not build a report by selecting an unbounded table and decrypting/rendering everything in memory. Count/filter first, enforce domain caps, then load only the permitted dataset.
