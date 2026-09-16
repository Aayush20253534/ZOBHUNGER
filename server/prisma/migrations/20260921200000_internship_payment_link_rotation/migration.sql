-- Remove bearer checkout URLs that older releases placed in audit metadata.
-- The canonical/current URL remains on InternshipDocumentPayment for the admin UI.
UPDATE "AuditLog"
SET "metadata" = "metadata" - 'paymentUrl'
WHERE "action" = 'internship.document_payment_request_created'
  AND "metadata" IS NOT NULL
  AND "metadata" ? 'paymentUrl';
