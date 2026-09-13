-- Department-scoped PF/EPFO, ESIC and Accounts access. These values are added
-- separately so PostgreSQL can safely use them in the following migration.
ALTER TYPE "AdminDepartment" ADD VALUE IF NOT EXISTS 'PF_EPFO';
ALTER TYPE "AdminDepartment" ADD VALUE IF NOT EXISTS 'ESIC';
ALTER TYPE "AdminDepartment" ADD VALUE IF NOT EXISTS 'ACCOUNTS';

ALTER TYPE "AdminPermission" ADD VALUE IF NOT EXISTS 'PF_VIEW';
ALTER TYPE "AdminPermission" ADD VALUE IF NOT EXISTS 'PF_VERIFY';
ALTER TYPE "AdminPermission" ADD VALUE IF NOT EXISTS 'PF_UPDATE';
ALTER TYPE "AdminPermission" ADD VALUE IF NOT EXISTS 'PF_EXPORT';
ALTER TYPE "AdminPermission" ADD VALUE IF NOT EXISTS 'ESIC_VIEW';
ALTER TYPE "AdminPermission" ADD VALUE IF NOT EXISTS 'ESIC_VERIFY';
ALTER TYPE "AdminPermission" ADD VALUE IF NOT EXISTS 'ESIC_UPDATE';
ALTER TYPE "AdminPermission" ADD VALUE IF NOT EXISTS 'ESIC_EXPORT';
