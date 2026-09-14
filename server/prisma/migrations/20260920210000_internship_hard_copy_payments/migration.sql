CREATE TYPE "InternshipDocumentPaymentStatus" AS ENUM ('ACTIVE', 'PAID', 'EXPIRED', 'CANCELLED');

CREATE TABLE "InternshipDocumentPayment" (
    "id" TEXT NOT NULL,
    "careerApplicationId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "documentDescription" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "courierNote" TEXT,
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "cashfreeLinkId" TEXT NOT NULL,
    "cashfreeCfLinkId" TEXT,
    "cashfreeLinkUrl" TEXT NOT NULL,
    "cashfreeStatus" TEXT NOT NULL,
    "linkExpiresAt" TIMESTAMP(3),
    "status" "InternshipDocumentPaymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "amountPaidPaise" INTEGER,
    "cashfreeOrderId" TEXT,
    "cashfreeTransactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "receiptNumber" TEXT,
    "receiptIssuedAt" TIMESTAMP(3),
    "receiptEmailStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InternshipDocumentPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InternshipDocumentPayment_careerApplicationId_key" ON "InternshipDocumentPayment"("careerApplicationId");
CREATE UNIQUE INDEX "InternshipDocumentPayment_requestKey_key" ON "InternshipDocumentPayment"("requestKey");
CREATE UNIQUE INDEX "InternshipDocumentPayment_cashfreeLinkId_key" ON "InternshipDocumentPayment"("cashfreeLinkId");
CREATE UNIQUE INDEX "InternshipDocumentPayment_cashfreeCfLinkId_key" ON "InternshipDocumentPayment"("cashfreeCfLinkId");
CREATE UNIQUE INDEX "InternshipDocumentPayment_receiptNumber_key" ON "InternshipDocumentPayment"("receiptNumber");
CREATE INDEX "InternshipDocumentPayment_status_createdAt_idx" ON "InternshipDocumentPayment"("status", "createdAt");
CREATE INDEX "InternshipDocumentPayment_customerEmail_idx" ON "InternshipDocumentPayment"("customerEmail");

ALTER TABLE "InternshipDocumentPayment"
ADD CONSTRAINT "InternshipDocumentPayment_careerApplicationId_fkey"
FOREIGN KEY ("careerApplicationId") REFERENCES "CareerApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
