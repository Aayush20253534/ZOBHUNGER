-- CreateEnum
CREATE TYPE "PartnerApplicationStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'CONTACTED', 'CLOSED');

-- CreateTable
CREATE TABLE "PartnerApplication" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "currentCity" TEXT NOT NULL,
    "currentProfession" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "totalExperienceYears" INTEGER NOT NULL,
    "specialization" TEXT NOT NULL,
    "industryExperience" TEXT NOT NULL,
    "linkedInUrl" TEXT,
    "contributionPreference" TEXT NOT NULL,
    "expertiseDescription" TEXT NOT NULL,
    "professionalNetwork" TEXT,
    "preferredPartnershipArea" TEXT NOT NULL,
    "resumeFileName" TEXT,
    "resumeMimeType" TEXT,
    "resumeData" BYTEA,
    "resumeUploadToken" TEXT,
    "status" "PartnerApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerApplication_resumeUploadToken_key" ON "PartnerApplication"("resumeUploadToken");
CREATE INDEX "PartnerApplication_status_createdAt_idx" ON "PartnerApplication"("status", "createdAt");
CREATE INDEX "PartnerApplication_email_idx" ON "PartnerApplication"("email");
CREATE INDEX "PartnerApplication_currentCity_idx" ON "PartnerApplication"("currentCity");
CREATE INDEX "PartnerApplication_specialization_idx" ON "PartnerApplication"("specialization");
