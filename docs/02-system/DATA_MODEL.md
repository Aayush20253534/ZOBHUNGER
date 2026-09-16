# Data Model

The canonical schema is `server/prisma/schema.prisma`. This document groups models by business purpose rather than reproducing every column.

## Identity and access

- `User`
- `BusinessProfile`
- `WorkerProfile`
- `WorkerAccessToken`
- `AdminInviteToken`
- `PasswordResetToken`

User roles are `ADMIN`, `BUSINESS`, `WORKER`, `PLACEMENT_CELL`, and `TECHNICAL_INSTITUTE`. Admin users additionally use department and permission enums.

## Workforce demand and hiring

- `WorkforceRequirement`
- `RequirementDraft`
- `Job`
- `JobApplication`
- `BusinessCandidate`
- `PlacementCandidate`
- `CandidateEvent`
- `JobApplicationResume`

These models connect demand, published/linked openings, applications and candidate review history.

## Deployment and attendance

- `WorkforceAssignment`
- `AttendanceRecord`
- `AttendanceEvent`
- `AttendanceCorrection`
- `AttendanceApprovalEvent`
- `WorkerAttendanceRequest`

## Worker finance

- `EarningsStatement`
- `EarningsLine`
- `EarningsAdjustment`
- `PaymentRecord`

## Institutional partners

- `PlacementCellApplication`
- `TechnicalInstituteApplication`
- `TechnicalStudent`
- `TechnicalOpportunity`
- `TechnicalOpportunityApplication`

## Public/business intake

- `ContactEnquiry`
- `PartnerApplication`
- `VendorApplication`
- `VendorDocument`
- `CareerApplication`
- `IntakeCase`
- `IntakeNote`

`IntakeCase` provides a shared operational intake layer while source records remain in their domain tables.

## HR and compliance

- `EmployeeJoining`
- `EmployeeJoiningDocument`
- `EmployeeNumberSequence`
- `EmployeeOfferLetter`
- `EmployeePfCompliance`
- `EmployeeEsicCompliance`
- `EmployeeEsicFamilyMember`
- `EmployeeComplianceDocument`

Sensitive identifiers in these workflows are encrypted by application services before persistence where configured by the HR PII controls.

## Content and AI assistant

- `Article`
- `ArticleDraft`
- `ChatbotConversation`
- `ChatbotMessage`
- `ChatbotLead`
- `ChatbotKnowledgeDocument`
- `ChatbotKnowledgeEmbedding`

## Payment and audit

- `InternshipDocumentPayment`
- `AuditLog`

## Schema-change rule

Never use `prisma db push` as a substitute for committed production migrations. Update `schema.prisma`, create/review a migration, run tests against a disposable PostgreSQL database, then deploy migrations through the release process. See [Database and Prisma](../09-development/DATABASE_AND_PRISMA.md).
