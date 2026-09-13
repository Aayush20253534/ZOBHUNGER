-- Advanced ZOBHUNGER AI assistant: managed knowledge, server-side conversation memory,
-- lead capture/handover, analytics, and admin RBAC.
ALTER TYPE "AdminPermission" ADD VALUE IF NOT EXISTS 'AI_ASSISTANT_MANAGE';
ALTER TYPE "IntakeSourceType" ADD VALUE IF NOT EXISTS 'CHATBOT_LEAD';

CREATE TYPE "ChatbotAudience" AS ENUM ('UNKNOWN', 'JOB_SEEKER', 'BUSINESS', 'VENDOR_PARTNER', 'GENERAL');
CREATE TYPE "ChatbotLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED');
CREATE TYPE "ChatbotKnowledgeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ChatbotMessageRole" AS ENUM ('USER', 'ASSISTANT');

CREATE TABLE "ChatbotConversation" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "clientFingerprint" TEXT,
  "audience" "ChatbotAudience" NOT NULL DEFAULT 'UNKNOWN',
  "summary" TEXT,
  "currentPage" TEXT,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatbotConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatbotMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" "ChatbotMessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "grounded" BOOLEAN,
  "unanswered" BOOLEAN NOT NULL DEFAULT false,
  "sourceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "retrievalScore" DOUBLE PRECISION,
  "latencyMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatbotMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatbotLead" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT,
  "audience" "ChatbotAudience" NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "companyName" TEXT,
  "requirement" TEXT NOT NULL,
  "enquiryDetails" TEXT,
  "sourcePath" TEXT,
  "status" "ChatbotLeadStatus" NOT NULL DEFAULT 'NEW',
  "intakeCaseId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatbotLead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatbotKnowledgeDocument" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "description" TEXT,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "body" TEXT NOT NULL,
  "status" "ChatbotKnowledgeStatus" NOT NULL DEFAULT 'DRAFT',
  "revision" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT NOT NULL,
  "updatedByUserId" TEXT NOT NULL,
  "verifiedByUserId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatbotKnowledgeDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatbotConversation_publicId_key" ON "ChatbotConversation"("publicId");
CREATE INDEX "ChatbotConversation_audience_lastMessageAt_idx" ON "ChatbotConversation"("audience", "lastMessageAt");
CREATE INDEX "ChatbotConversation_lastMessageAt_idx" ON "ChatbotConversation"("lastMessageAt");
CREATE INDEX "ChatbotMessage_conversationId_createdAt_idx" ON "ChatbotMessage"("conversationId", "createdAt");
CREATE INDEX "ChatbotMessage_unanswered_createdAt_idx" ON "ChatbotMessage"("unanswered", "createdAt");
CREATE INDEX "ChatbotMessage_role_createdAt_idx" ON "ChatbotMessage"("role", "createdAt");
CREATE UNIQUE INDEX "ChatbotLead_intakeCaseId_key" ON "ChatbotLead"("intakeCaseId");
CREATE INDEX "ChatbotLead_audience_status_createdAt_idx" ON "ChatbotLead"("audience", "status", "createdAt");
CREATE INDEX "ChatbotLead_email_idx" ON "ChatbotLead"("email");
CREATE INDEX "ChatbotLead_phone_idx" ON "ChatbotLead"("phone");
CREATE UNIQUE INDEX "ChatbotKnowledgeDocument_slug_key" ON "ChatbotKnowledgeDocument"("slug");
CREATE INDEX "ChatbotKnowledgeDocument_status_updatedAt_idx" ON "ChatbotKnowledgeDocument"("status", "updatedAt");
CREATE INDEX "ChatbotKnowledgeDocument_category_status_idx" ON "ChatbotKnowledgeDocument"("category", "status");

ALTER TABLE "ChatbotMessage" ADD CONSTRAINT "ChatbotMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatbotConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatbotLead" ADD CONSTRAINT "ChatbotLead_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatbotConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChatbotKnowledgeDocument" ADD CONSTRAINT "ChatbotKnowledgeDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChatbotKnowledgeDocument" ADD CONSTRAINT "ChatbotKnowledgeDocument_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChatbotKnowledgeDocument" ADD CONSTRAINT "ChatbotKnowledgeDocument_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
