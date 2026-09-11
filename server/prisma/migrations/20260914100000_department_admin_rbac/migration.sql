-- Department-scoped administrator access. Existing ADMIN accounts become
-- protected Main Administration accounts so deployment never removes current access.
CREATE TYPE "AdminDepartment" AS ENUM ('MAIN_ADMIN', 'HR', 'TECHNICAL', 'PLACEMENT_CELL', 'LEGAL');
CREATE TYPE "AdminPermission" AS ENUM (
  'DASHBOARD_VIEW',
  'ENQUIRIES_MANAGE',
  'PARTNERS_MANAGE',
  'VENDORS_MANAGE',
  'CAREERS_MANAGE',
  'EMPLOYEE_JOINING_MANAGE',
  'WORKERS_MANAGE',
  'CANDIDATES_MANAGE',
  'REQUIREMENTS_MANAGE',
  'JOBS_MANAGE',
  'APPLICATIONS_MANAGE',
  'DEPLOYMENTS_MANAGE',
  'ATTENDANCE_MANAGE',
  'EARNINGS_MANAGE',
  'REPORTS_VIEW',
  'PLACEMENT_MANAGE',
  'TECHNICAL_MANAGE',
  'LEGAL_MANAGE',
  'BLOGS_MANAGE',
  'ADMIN_USERS_MANAGE'
);

ALTER TABLE "User"
  ADD COLUMN "adminDepartment" "AdminDepartment",
  ADD COLUMN "adminPermissions" "AdminPermission"[] NOT NULL DEFAULT ARRAY[]::"AdminPermission"[];

UPDATE "User"
SET
  "adminDepartment" = 'MAIN_ADMIN',
  "adminPermissions" = ARRAY[
    'DASHBOARD_VIEW',
    'ENQUIRIES_MANAGE',
    'PARTNERS_MANAGE',
    'VENDORS_MANAGE',
    'CAREERS_MANAGE',
    'EMPLOYEE_JOINING_MANAGE',
    'WORKERS_MANAGE',
    'CANDIDATES_MANAGE',
    'REQUIREMENTS_MANAGE',
    'JOBS_MANAGE',
    'APPLICATIONS_MANAGE',
    'DEPLOYMENTS_MANAGE',
    'ATTENDANCE_MANAGE',
    'EARNINGS_MANAGE',
    'REPORTS_VIEW',
    'PLACEMENT_MANAGE',
    'TECHNICAL_MANAGE',
    'LEGAL_MANAGE',
    'BLOGS_MANAGE',
    'ADMIN_USERS_MANAGE'
  ]::"AdminPermission"[]
WHERE "role" = 'ADMIN';

CREATE INDEX "User_role_adminDepartment_isActive_idx" ON "User"("role", "adminDepartment", "isActive");

CREATE TABLE "AdminInviteToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminInviteToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminInviteToken_userId_key" ON "AdminInviteToken"("userId");
CREATE UNIQUE INDEX "AdminInviteToken_tokenHash_key" ON "AdminInviteToken"("tokenHash");
CREATE INDEX "AdminInviteToken_expiresAt_idx" ON "AdminInviteToken"("expiresAt");
CREATE INDEX "AdminInviteToken_createdByUserId_createdAt_idx" ON "AdminInviteToken"("createdByUserId", "createdAt");

ALTER TABLE "AdminInviteToken" ADD CONSTRAINT "AdminInviteToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminInviteToken" ADD CONSTRAINT "AdminInviteToken_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
