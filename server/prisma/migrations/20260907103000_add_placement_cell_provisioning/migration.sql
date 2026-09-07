ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PLACEMENT_CELL';

ALTER TABLE "PlacementCellApplication"
ADD COLUMN "provisionedUserId" TEXT,
ADD COLUMN "activationTokenHash" TEXT,
ADD COLUMN "activationExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "PlacementCellApplication_provisionedUserId_key" ON "PlacementCellApplication"("provisionedUserId");
CREATE UNIQUE INDEX "PlacementCellApplication_activationTokenHash_key" ON "PlacementCellApplication"("activationTokenHash");
