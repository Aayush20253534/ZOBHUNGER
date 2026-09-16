# API Authentication and Security Conventions

## Authentication

Authenticated web requests carry the signed access token in the configured HttpOnly cookie. Handlers read the authenticated identity from server request locals after `requireAuth` succeeds.

## Role checks

Use backend role middleware (`requireRole`) for portal authorization. Never infer authorization from a request body role, frontend route or hidden navigation item.

## Admin permissions

All protected admin route families pass through `requireMappedAdminPermission`. A new admin route family must be added to the permission mapping; unknown protected families are denied by default.

## Admin MFA

Normal admin APIs require completed MFA in production. MFA setup/confirmation routes operate through the deliberately limited enrollment session.

## Portal writes

State-changing portal routes use `portalWrite` and appropriate CORS/origin controls. The frontend shared client adds the expected request header for these mutations.

## Validation

Path, query and body inputs use Zod schemas through the shared validation middleware. Validation belongs on the server even when the client has an equivalent form schema.

## Rate limits

There is a global API rate limiter plus stricter authentication, public-submission and chatbot limits. Add a dedicated limiter to a high-abuse public endpoint rather than globally lowering limits for authenticated operational work.

## Cache policy

Private portal responses are `no-store`. Do not make an authenticated response cacheable merely because it is a GET request.
