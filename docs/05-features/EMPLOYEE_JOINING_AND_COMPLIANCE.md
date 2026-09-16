# Employee Joining and Compliance

## Employee joining

The employee-joining domain captures private onboarding information and documents, supports HR review/status progression, assigns employee numbers through a controlled sequence and manages offer-letter records.

Offer workflow includes preparation/approval/issuance behavior and uses operational email/private-file infrastructure where required.

## Sensitive data

Joining information can include Aadhaar, PAN, bank details and UAN. Sensitive fields are encrypted using the dedicated HR PII encryption key before durable storage through the domain's encryption helpers.

The encryption key is operationally different from the JWT and MFA keys and must not be reused.

## PF and ESIC

PF and ESIC are separate compliance areas with independent admin permissions (`PF_*`, `ESIC_*`). This permits departmental separation between viewing, verification, updates and exports.

ESIC supports family-member records in addition to the primary compliance record.

## Documents

Joining/compliance documents use protected file handling and private storage. Production scanning is required for supported external uploads before they become available to staff.

## Export safety

`COMPLIANCE_EXPORT_MAX_ROWS` limits PF/ESIC exports. The service checks the matched row count **before** loading and decrypting a large sensitive dataset.

## Audit/review principle

Compliance corrections and verification should preserve who changed/reviewed a record and the resulting status rather than providing direct unrestricted spreadsheet-style mutation.
