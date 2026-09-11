-- Unified department-scoped operational intake for public and authenticated submissions.
-- Intake snapshots intentionally exclude uploaded files and encrypted HR/financial identity data.
CREATE TYPE "IntakeCaseStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'CONTACTED', 'RESOLVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "IntakeSourceType" AS ENUM (
  'CONTACT_ENQUIRY',
  'WORKFORCE_REQUIREMENT',
  'PARTNER_APPLICATION',
  'VENDOR_APPLICATION',
  'CAREER_APPLICATION',
  'PLACEMENT_CELL_APPLICATION',
  'EMPLOYEE_JOINING',
  'JOB_APPLICATION'
);

CREATE TABLE "IntakeCase" (
  "id" TEXT NOT NULL,
  "sourceType" "IntakeSourceType" NOT NULL,
  "sourceId" TEXT NOT NULL,
  "department" "AdminDepartment" NOT NULL,
  "status" "IntakeCaseStatus" NOT NULL DEFAULT 'SUBMITTED',
  "sourceStatus" TEXT,
  "subject" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "organizationName" TEXT,
  "city" TEXT,
  "summary" TEXT,
  "details" JSONB,
  "assignedAdminId" TEXT,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "submittedAt" TIMESTAMP(3) NOT NULL,
  "sourceUpdatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntakeCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntakeNote" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntakeNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntakeCase_sourceType_sourceId_key" ON "IntakeCase"("sourceType", "sourceId");
CREATE INDEX "IntakeCase_department_status_submittedAt_idx" ON "IntakeCase"("department", "status", "submittedAt");
CREATE INDEX "IntakeCase_assignedAdminId_status_submittedAt_idx" ON "IntakeCase"("assignedAdminId", "status", "submittedAt");
CREATE INDEX "IntakeCase_sourceType_submittedAt_idx" ON "IntakeCase"("sourceType", "submittedAt");
CREATE INDEX "IntakeCase_contactEmail_idx" ON "IntakeCase"("contactEmail");
CREATE INDEX "IntakeNote_caseId_createdAt_idx" ON "IntakeNote"("caseId", "createdAt");
CREATE INDEX "IntakeNote_authorUserId_createdAt_idx" ON "IntakeNote"("authorUserId", "createdAt");

ALTER TABLE "IntakeCase" ADD CONSTRAINT "IntakeCase_assignedAdminId_fkey"
  FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IntakeNote" ADD CONSTRAINT "IntakeNote_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "IntakeCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntakeNote" ADD CONSTRAINT "IntakeNote_authorUserId_fkey"
  FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prisma normally manages updatedAt in application writes. Capture triggers write directly,
-- so this helper explicitly maintains timestamps and advances source-derived workflow states
-- without overwriting terminal decisions made by an administrator.
CREATE OR REPLACE FUNCTION zobhunger_upsert_intake(
  p_source_type "IntakeSourceType",
  p_source_id TEXT,
  p_department "AdminDepartment",
  p_status "IntakeCaseStatus",
  p_source_status TEXT,
  p_subject TEXT,
  p_contact_name TEXT,
  p_contact_email TEXT,
  p_contact_phone TEXT,
  p_organization_name TEXT,
  p_city TEXT,
  p_summary TEXT,
  p_details JSONB,
  p_submitted_at TIMESTAMP(3),
  p_source_updated_at TIMESTAMP(3)
) RETURNS VOID AS $$
BEGIN
  INSERT INTO "IntakeCase" (
    "id", "sourceType", "sourceId", "department", "status", "sourceStatus",
    "subject", "contactName", "contactEmail", "contactPhone", "organizationName",
    "city", "summary", "details", "submittedAt", "sourceUpdatedAt", "createdAt", "updatedAt"
  ) VALUES (
    'intake_' || md5(p_source_type::text || ':' || p_source_id),
    p_source_type, p_source_id, p_department, p_status, p_source_status,
    p_subject, p_contact_name, p_contact_email, p_contact_phone, p_organization_name,
    p_city, p_summary, p_details, p_submitted_at, p_source_updated_at, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
  ON CONFLICT ("sourceType", "sourceId") DO UPDATE SET
    "department" = EXCLUDED."department",
    "sourceStatus" = EXCLUDED."sourceStatus",
    "subject" = EXCLUDED."subject",
    "contactName" = EXCLUDED."contactName",
    "contactEmail" = EXCLUDED."contactEmail",
    "contactPhone" = EXCLUDED."contactPhone",
    "organizationName" = EXCLUDED."organizationName",
    "city" = EXCLUDED."city",
    "summary" = EXCLUDED."summary",
    "details" = EXCLUDED."details",
    "sourceUpdatedAt" = EXCLUDED."sourceUpdatedAt",
    "updatedAt" = CURRENT_TIMESTAMP,
    "status" = CASE
      WHEN "IntakeCase"."status" IN ('RESOLVED', 'REJECTED', 'ARCHIVED') THEN "IntakeCase"."status"
      WHEN EXCLUDED."status" IN ('RESOLVED', 'REJECTED', 'ARCHIVED') THEN EXCLUDED."status"
      WHEN "IntakeCase"."status" = 'SUBMITTED' AND EXCLUDED."status" IN ('IN_REVIEW', 'CONTACTED') THEN EXCLUDED."status"
      WHEN "IntakeCase"."status" = 'IN_REVIEW' AND EXCLUDED."status" = 'CONTACTED' THEN EXCLUDED."status"
      ELSE "IntakeCase"."status"
    END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION zobhunger_capture_intake() RETURNS TRIGGER AS $$
DECLARE
  mapped_status "IntakeCaseStatus" := 'SUBMITTED';
  mapped_department "AdminDepartment" := 'MAIN_ADMIN';
  job_title TEXT;
BEGIN
  IF TG_TABLE_NAME = 'ContactEnquiry' THEN
    mapped_department := CASE
      WHEN NEW."serviceRequired" = 'website-application-development' THEN 'TECHNICAL'::"AdminDepartment"
      WHEN NEW."serviceRequired" = 'legal-privacy-compliance' THEN 'LEGAL'::"AdminDepartment"
      ELSE 'MAIN_ADMIN'::"AdminDepartment"
    END;
    PERFORM zobhunger_upsert_intake('CONTACT_ENQUIRY', NEW."id", mapped_department, 'SUBMITTED', NULL,
      COALESCE(NULLIF(NEW."serviceRequired", ''), 'Website enquiry'), NEW."name", NEW."email", NEW."phone", NEW."companyName", NEW."city",
      LEFT(NEW."message", 320), jsonb_build_object('serviceRequired', NEW."serviceRequired", 'message', NEW."message"), NEW."createdAt", NEW."updatedAt");

  ELSIF TG_TABLE_NAME = 'WorkforceRequirement' THEN
    mapped_status := CASE NEW."status"::text WHEN 'CONTACTED' THEN 'CONTACTED' WHEN 'QUALIFIED' THEN 'IN_REVIEW' WHEN 'CLOSED' THEN 'RESOLVED' ELSE 'SUBMITTED' END;
    PERFORM zobhunger_upsert_intake('WORKFORCE_REQUIREMENT', NEW."id", 'MAIN_ADMIN', mapped_status, NEW."status"::text,
      COALESCE(NULLIF(NEW."serviceRequired", ''), 'Workforce requirement'), NEW."contactPerson", NEW."businessEmail", NEW."mobileNumber", NEW."companyName", NEW."jobLocation",
      LEFT(NEW."details", 320), jsonb_build_object('industry', NEW."industry", 'serviceRequired', NEW."serviceRequired", 'workforceCount', NEW."workforceCount", 'jobLocation', NEW."jobLocation", 'projectDuration', NEW."projectDuration"), NEW."createdAt", NEW."updatedAt");

  ELSIF TG_TABLE_NAME = 'PartnerApplication' THEN
    mapped_status := CASE NEW."status"::text WHEN 'REVIEWED' THEN 'IN_REVIEW' WHEN 'CONTACTED' THEN 'CONTACTED' WHEN 'APPROVED' THEN 'RESOLVED' WHEN 'REJECTED' THEN 'REJECTED' WHEN 'CLOSED' THEN 'ARCHIVED' ELSE 'SUBMITTED' END;
    PERFORM zobhunger_upsert_intake('PARTNER_APPLICATION', NEW."id", 'MAIN_ADMIN', mapped_status, NEW."status"::text,
      'Partner application · ' || NEW."companyName", NEW."fullName", NEW."email", NEW."mobileNumber", NEW."companyName", NEW."currentCity",
      LEFT(NEW."expertiseDescription", 320), jsonb_build_object('currentProfession', NEW."currentProfession", 'specialization', NEW."specialization", 'preferredPartnershipArea', NEW."preferredPartnershipArea", 'totalExperienceYears', NEW."totalExperienceYears"), NEW."createdAt", NEW."updatedAt");

  ELSIF TG_TABLE_NAME = 'VendorApplication' THEN
    IF NEW."status"::text = 'DRAFT' THEN RETURN NEW; END IF;
    mapped_status := CASE NEW."status"::text WHEN 'UNDER_REVIEW' THEN 'IN_REVIEW' WHEN 'APPROVED' THEN 'RESOLVED' WHEN 'REJECTED' THEN 'REJECTED' WHEN 'SUSPENDED' THEN 'ARCHIVED' ELSE 'SUBMITTED' END;
    PERFORM zobhunger_upsert_intake('VENDOR_APPLICATION', NEW."id", 'MAIN_ADMIN', mapped_status, NEW."status"::text,
      'Vendor empanelment · ' || NEW."companyName", NEW."contactName", NEW."email", NEW."phone", NEW."companyName", NEW."city",
      LEFT(NEW."serviceDescription", 320), jsonb_build_object('organizationType', NEW."organizationType", 'serviceCategories', NEW."serviceCategories", 'yearsExperience', NEW."yearsExperience", 'teamSize', NEW."teamSize"), COALESCE(NEW."submittedAt", NEW."createdAt"), NEW."updatedAt");

  ELSIF TG_TABLE_NAME = 'CareerApplication' THEN
    mapped_status := CASE NEW."status"::text WHEN 'REVIEWED' THEN 'IN_REVIEW' WHEN 'SHORTLISTED' THEN 'IN_REVIEW' WHEN 'CONTACTED' THEN 'CONTACTED' WHEN 'HIRED' THEN 'RESOLVED' WHEN 'REJECTED' THEN 'REJECTED' ELSE 'SUBMITTED' END;
    PERFORM zobhunger_upsert_intake('CAREER_APPLICATION', NEW."id", 'HR', mapped_status, NEW."status"::text,
      'Career profile · ' || NEW."preferredRole", NEW."fullName", NEW."email", NEW."phone", NULL, NEW."city",
      LEFT(COALESCE(NEW."coverNote", NEW."availability"), 320), jsonb_build_object('preferredRole', NEW."preferredRole", 'experienceYears', NEW."experienceYears", 'skills', NEW."skills", 'preferredLocations', NEW."preferredLocations", 'availability', NEW."availability"), NEW."createdAt", NEW."updatedAt");

  ELSIF TG_TABLE_NAME = 'PlacementCellApplication' THEN
    mapped_status := CASE NEW."status"::text WHEN 'UNDER_REVIEW' THEN 'IN_REVIEW' WHEN 'APPROVED' THEN 'RESOLVED' WHEN 'REJECTED' THEN 'REJECTED' ELSE 'SUBMITTED' END;
    PERFORM zobhunger_upsert_intake('PLACEMENT_CELL_APPLICATION', NEW."id", 'PLACEMENT_CELL', mapped_status, NEW."status"::text,
      'Institution partnership · ' || NEW."institutionName", NEW."contactPersonName", NEW."officialEmail", NEW."mobileNumber", NEW."institutionName", NEW."city",
      LEFT(NEW."coursesDepartments", 320), jsonb_build_object('institutionType', NEW."institutionType", 'numberOfStudents', NEW."numberOfStudents", 'preferredOpportunityTypes', NEW."preferredOpportunityTypes", 'state', NEW."state"), NEW."createdAt", NEW."updatedAt");

  ELSIF TG_TABLE_NAME = 'EmployeeJoining' THEN
    IF NEW."status"::text = 'DRAFT' THEN RETURN NEW; END IF;
    mapped_status := CASE NEW."status"::text WHEN 'UNDER_REVIEW' THEN 'IN_REVIEW' WHEN 'APPROVED' THEN 'RESOLVED' WHEN 'REJECTED' THEN 'REJECTED' ELSE 'SUBMITTED' END;
    PERFORM zobhunger_upsert_intake('EMPLOYEE_JOINING', NEW."id", 'HR', mapped_status, NEW."status"::text,
      'Employee joining · ' || NEW."projectCode", NEW."fullName", NEW."personalEmail", NEW."phone", NULL, NEW."currentCity",
      NEW."projectAssignment", jsonb_build_object('projectCode', NEW."projectCode", 'projectAssignment', NEW."projectAssignment", 'highestQualification', NEW."highestQualification", 'employeeNumber', NEW."employeeNumber"), COALESCE(NEW."submittedAt", NEW."createdAt"), NEW."updatedAt");

  ELSIF TG_TABLE_NAME = 'JobApplication' THEN
    SELECT "title" INTO job_title FROM "Job" WHERE "id" = NEW."jobId";
    mapped_status := CASE NEW."status"::text WHEN 'REVIEWED' THEN 'IN_REVIEW' WHEN 'SHORTLISTED' THEN 'IN_REVIEW' WHEN 'REJECTED' THEN 'REJECTED' ELSE 'SUBMITTED' END;
    mapped_department := CASE WHEN NEW."placementCellApplicationId" IS NOT NULL THEN 'PLACEMENT_CELL'::"AdminDepartment" ELSE 'HR'::"AdminDepartment" END;
    PERFORM zobhunger_upsert_intake('JOB_APPLICATION', NEW."id", mapped_department, mapped_status, NEW."status"::text,
      'Job application · ' || COALESCE(job_title, 'Job opening'), NEW."name", NEW."email", NEW."phone", NULL, NEW."city",
      LEFT(COALESCE(NEW."message", NEW."experience", ''), 320), jsonb_build_object('jobId', NEW."jobId", 'jobTitle', job_title, 'experience', NEW."experience", 'placementManaged', NEW."placementCellApplicationId" IS NOT NULL, 'withdrawnAt', NEW."withdrawnAt"), NEW."createdAt", NEW."updatedAt");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ContactEnquiry_intake_capture" AFTER INSERT OR UPDATE ON "ContactEnquiry" FOR EACH ROW EXECUTE FUNCTION zobhunger_capture_intake();
CREATE TRIGGER "WorkforceRequirement_intake_capture" AFTER INSERT OR UPDATE ON "WorkforceRequirement" FOR EACH ROW EXECUTE FUNCTION zobhunger_capture_intake();
CREATE TRIGGER "PartnerApplication_intake_capture" AFTER INSERT OR UPDATE ON "PartnerApplication" FOR EACH ROW EXECUTE FUNCTION zobhunger_capture_intake();
CREATE TRIGGER "VendorApplication_intake_capture" AFTER INSERT OR UPDATE ON "VendorApplication" FOR EACH ROW EXECUTE FUNCTION zobhunger_capture_intake();
CREATE TRIGGER "CareerApplication_intake_capture" AFTER INSERT OR UPDATE ON "CareerApplication" FOR EACH ROW EXECUTE FUNCTION zobhunger_capture_intake();
CREATE TRIGGER "PlacementCellApplication_intake_capture" AFTER INSERT OR UPDATE ON "PlacementCellApplication" FOR EACH ROW EXECUTE FUNCTION zobhunger_capture_intake();
CREATE TRIGGER "EmployeeJoining_intake_capture" AFTER INSERT OR UPDATE ON "EmployeeJoining" FOR EACH ROW EXECUTE FUNCTION zobhunger_capture_intake();
CREATE TRIGGER "JobApplication_intake_capture" AFTER INSERT OR UPDATE ON "JobApplication" FOR EACH ROW EXECUTE FUNCTION zobhunger_capture_intake();

-- Backfill existing operational records by touching each eligible row. The trigger captures a
-- privacy-minimised snapshot and is idempotent because sourceType + sourceId is unique.
UPDATE "ContactEnquiry" SET "updatedAt" = "updatedAt";
UPDATE "WorkforceRequirement" SET "updatedAt" = "updatedAt";
UPDATE "PartnerApplication" SET "updatedAt" = "updatedAt";
UPDATE "VendorApplication" SET "updatedAt" = "updatedAt" WHERE "status" <> 'DRAFT';
UPDATE "CareerApplication" SET "updatedAt" = "updatedAt";
UPDATE "PlacementCellApplication" SET "updatedAt" = "updatedAt";
UPDATE "EmployeeJoining" SET "updatedAt" = "updatedAt" WHERE "status" <> 'DRAFT';
UPDATE "JobApplication" SET "updatedAt" = "updatedAt";
