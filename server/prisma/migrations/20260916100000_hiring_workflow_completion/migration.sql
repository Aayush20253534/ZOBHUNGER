-- Phase 5 hiring completion: preserve closed openings as an auditable archive
ALTER TABLE "Job" ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "Job_archivedAt_status_idx" ON "Job"("archivedAt", "status");
