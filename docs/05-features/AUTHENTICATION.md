# Authentication

## Browser session model

Portal authentication uses signed JWT access tokens carried by an HttpOnly cookie. Production cookies are Secure and use SameSite controls. The JWT verifier constrains issuer/audience/algorithm according to server configuration.

Passwords are hashed with Argon2id. Authentication code performs a dummy Argon2 verification in relevant lookup-failure paths to reduce account-enumeration timing differences.

## Login families

The API exposes role-specific login flows for ordinary/admin, business, placement cell and technical institute access. Worker access has its own workflow routes and recovery/verification behavior.

## Password recovery

Recovery tokens are single-use, hashed at rest and expire. Reset links place the raw recovery token in the URL fragment rather than a query parameter. Successful password changes/reset increment session version so older sessions can be invalidated.

## Admin MFA

In production every admin is required to complete MFA. An admin without configured MFA receives only the limited state necessary to enroll/confirm MFA and cannot use normal `/admin/*` APIs.

TOTP secrets are encrypted. Recovery codes are one-time material. Disabling production administrator MFA is rejected; rotation requires completion of the replacement setup.

## Session safety

Private API responses are `no-store`. Write requests use portal-write checks in addition to authentication/authorization. Logout clears the authentication state.

See [RBAC and MFA](../07-security/RBAC_AND_MFA.md) for admin authorization details.
