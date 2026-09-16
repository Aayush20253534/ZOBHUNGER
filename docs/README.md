# ZOBHUNGER Documentation

This directory documents the **current platform**, not the order in which features were delivered. Historical phase notes, patch instructions and temporary implementation reports have been removed so maintainers have one source of truth.

## Start here

| Audience | Read first |
|---|---|
| Business/client stakeholders | [Product overview](01-product/PRODUCT_OVERVIEW.md) → [non-technical system flow](02-system/SYSTEM_FLOW.md) |
| Product/operations team | [Feature matrix](01-product/FEATURE_MATRIX.md) → feature documents in `05-features/` |
| Frontend/backend developers | [Technical flow](02-system/TECHNICAL_FLOW.md) → [project structure](03-technology/PROJECT_STRUCTURE.md) |
| Security/release reviewers | [Security architecture](07-security/SECURITY_ARCHITECTURE.md) → [production checklist](08-operations/PRODUCTION_CHECKLIST.md) |
| New contributors | [Local setup](09-development/LOCAL_SETUP.md) → [testing](09-development/TESTING.md) |

## Documentation map

### 01 Product
- [Product overview](01-product/PRODUCT_OVERVIEW.md)
- [User roles](01-product/USER_ROLES.md)
- [Feature matrix](01-product/FEATURE_MATRIX.md)

### 02 System
- [System flow, non-technical](02-system/SYSTEM_FLOW.md)
- [Technical flow](02-system/TECHNICAL_FLOW.md)
- [System architecture](02-system/SYSTEM_ARCHITECTURE.md)
- [Data model](02-system/DATA_MODEL.md)
- [Request lifecycle](02-system/REQUEST_LIFECYCLE.md)

### 03 Technology
- [Tech stack](03-technology/TECH_STACK.md)
- [Project structure](03-technology/PROJECT_STRUCTURE.md)
- [Environment configuration](03-technology/ENVIRONMENT_CONFIGURATION.md)
- [Caching and performance](03-technology/CACHING_AND_PERFORMANCE.md)
- [Storage and external services](03-technology/STORAGE_AND_EXTERNAL_SERVICES.md)

### 04 Design
- [Design system](04-design/DESIGN_SYSTEM.md)
- [UI/UX guidelines](04-design/UI_UX_GUIDELINES.md)
- [Responsive design and accessibility](04-design/RESPONSIVE_AND_ACCESSIBILITY.md)

### 05 Features
Documents cover the public website, authentication, each portal, workforce execution workflows, HR/compliance, payments, content and AI assistant.

### 06 API
- [API overview](06-api/API_OVERVIEW.md)
- [Authentication and security conventions](06-api/AUTH_AND_SECURITY_CONVENTIONS.md)
- [Errors, pagination and idempotency](06-api/ERROR_PAGINATION_IDEMPOTENCY.md)
- [Endpoint families](06-api/ENDPOINT_FAMILIES.md)

### 07 Security
Current authentication, authorization, PII, upload, payment, logging and release controls.

### 08 Operations
Deployment, health/observability, load testing and production release procedures.

### 09 Development
Local setup, Prisma/database workflow, tests, CI/CD and contribution rules.

## Documentation rules

1. Document **current behavior**. Do not create `PHASE_*`, `PART_*` or patch-note files for normal feature work.
2. Update the relevant feature document in the same change that alters user-visible workflow or security/operations behavior.
3. Never put API keys, passwords, tokens, production PII or copied `.env` values in documentation.
4. Runtime chatbot knowledge under `server/src/modules/chatbot/knowledge/` is application data and is **not** developer documentation. Do not move it here.
5. License/provenance files for fonts and media remain with the assets they describe.
