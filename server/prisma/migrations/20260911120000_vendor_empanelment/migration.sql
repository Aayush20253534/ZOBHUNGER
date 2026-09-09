-- CreateEnum
CREATE TYPE "VendorApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VendorDocumentKind" AS ENUM ('COMPANY_PROFILE', 'REGISTRATION', 'TAX', 'MSME', 'OTHER');

-- CreateTable
CREATE TABLE "VendorApplication" (
    "id" TEXT NOT NULL,
    "submissionKey" TEXT NOT NULL,
    "submissionHash" TEXT NOT NULL,
    "uploadTokenHash" TEXT NOT NULL,
    "uploadExpiresAt" TIMESTAMP(3) NOT NULL,
    "companyName" TEXT NOT NULL,
    "organizationType" TEXT NOT NULL,
    "establishedYear" INTEGER,
    "registrationNumber" TEXT,
    "gstNumber" TEXT,
    "msmeNumber" TEXT,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactRole" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "website" TEXT,
    "serviceCategories" TEXT[],
    "specializedServices" TEXT,
    "serviceDescription" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "teamSize" INTEGER NOT NULL,
    "coverage" TEXT[],
    "industries" TEXT[],
    "projectExperience" TEXT NOT NULL,
    "notableClients" TEXT,
    "capacityNotes" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "VendorApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "vendorCode" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewNotes" TEXT,
    "accountManager" TEXT,
    "internalNotes" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" "VendorDocumentKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorApplication_submissionKey_key" ON "VendorApplication"("submissionKey");

-- CreateIndex
CREATE UNIQUE INDEX "VendorApplication_uploadTokenHash_key" ON "VendorApplication"("uploadTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "VendorApplication_vendorCode_key" ON "VendorApplication"("vendorCode");

-- CreateIndex
CREATE INDEX "VendorApplication_status_submittedAt_idx" ON "VendorApplication"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "VendorApplication_email_idx" ON "VendorApplication"("email");

-- CreateIndex
CREATE INDEX "VendorApplication_city_idx" ON "VendorApplication"("city");

-- CreateIndex
CREATE UNIQUE INDEX "VendorDocument_applicationId_kind_key" ON "VendorDocument"("applicationId", "kind");

-- AddForeignKey
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "VendorApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
