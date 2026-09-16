# Technical Institute Portal

## Purpose

The technical-institute workflow supports ITI/polytechnic-style institutional partners, their student roster and institution-specific opportunities.

## Student management

Institutes can manage students through portal APIs, including supported import flows. Spreadsheet imports are malware-scanned before parsing in production security configurations.

Student records have verification/status concepts rather than being treated as anonymous job-board applicants.

## Opportunities and matching

Opportunity lists are paginated. The system does **not** fetch every verified student each time the opportunity list loads.

When matching is requested, database prefilters narrow students by relevant eligibility dimensions before scoring/selection logic. `TECHNICAL_MATCH_SCAN_LIMIT` provides an explicit upper bound. If the bound truncates the possible set, the response/UI can surface that limitation instead of pretending results are exhaustive.

## Applications and reports

Institutes create/track technical opportunity applications and can use reporting routes. Report/export work is bounded with `TECHNICAL_REPORT_EXPORT_MAX_ROWS` to avoid unbounded memory work.

## Administration

Admin technical-institute and technical-opportunity route families allow appropriately permitted technical/placement administrators to review institutions, students and opportunities.
