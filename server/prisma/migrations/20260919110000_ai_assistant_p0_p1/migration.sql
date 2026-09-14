CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "ChatbotKnowledgeDocument"
  ADD COLUMN "validFrom" TIMESTAMP(3),
  ADD COLUMN "validUntil" TIMESTAMP(3),
  ADD COLUMN "reviewDueAt" TIMESTAMP(3),
  ADD COLUMN "sourceVersion" TEXT NOT NULL DEFAULT '1',
  ADD COLUMN "ownerDepartment" TEXT,
  ADD COLUMN "supersedesDocumentId" TEXT;

CREATE INDEX "ChatbotKnowledgeDocument_status_reviewDueAt_idx"
  ON "ChatbotKnowledgeDocument"("status", "reviewDueAt");
CREATE INDEX "ChatbotKnowledgeDocument_status_validUntil_idx"
  ON "ChatbotKnowledgeDocument"("status", "validUntil");

CREATE TABLE "ChatbotKnowledgeEmbedding" (
  "chunkId" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "knowledgeFingerprint" TEXT NOT NULL,
  "embedding" vector(1536) NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ChatbotKnowledgeEmbedding_documentId_idx"
  ON "ChatbotKnowledgeEmbedding"("documentId");
CREATE INDEX "ChatbotKnowledgeEmbedding_embedding_hnsw_idx"
  ON "ChatbotKnowledgeEmbedding"
  USING hnsw ("embedding" vector_cosine_ops);
