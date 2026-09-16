# Requirements, Candidates and Deployments

These three domains form the core business-execution chain.

## Requirements

A workforce requirement captures a company's requested service/workforce need. It can originate from public intake or the authenticated business workflow. Business-side drafts support save/edit/delete/submit before a formal requirement is created.

Admin operations can qualify a requirement and create/manage linked job openings.

## Candidates

Candidate records connect people/applications to the requirement/job context and preserve status/event history. Business candidate access is ownership scoped. Admin candidate-management APIs provide broader operational control.

Placement candidates and technical students are separate institutional concepts and should not be collapsed into the business-candidate table merely for UI convenience.

## Deployments

Selected candidates become workforce assignments/deployments. Deployment routes support lifecycle operations while preserving history rather than overwriting every event into one opaque status.

## Concurrency and duplicate safety

Important write flows use revision/idempotency/unique-constraint strategies where appropriate. When extending these domains, preserve race-aware handling rather than relying only on disabled frontend buttons.

## Cache invalidation

When requirement/job changes affect public/read-heavy job data, related job-cache generations are invalidated. PostgreSQL remains authoritative if cache invalidation or Redis availability fails.
