import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

const [schema, enumMigration, dataMigration, routes, service, accessPolicy, navigation, accessUi, pfPage, esicPage, xlsx] = await Promise.all([
  read("server/prisma/schema.prisma"),
  read("server/prisma/migrations/20260918110000_compliance_rbac_enums/migration.sql"),
  read("server/prisma/migrations/20260918120000_employee_compliance/migration.sql"),
  read("server/src/modules/compliance/compliance.routes.ts"),
  read("server/src/modules/compliance/compliance.service.ts"),
  read("server/src/modules/admin-access/admin-access.policy.ts"),
  read("client/src/data/admin-navigation.ts"),
  read("client/src/components/admin/AdminAccessManagement.tsx"),
  read("client/src/app/employee-compliance/pf/page.tsx"),
  read("client/src/app/employee-compliance/esic/page.tsx"),
  read("server/src/utils/xlsx.ts"),
]);

test("compliance schema is additive, relational and linked to the existing employee joining record", () => {
  for (const token of [
    "enum ComplianceStatus", "enum ComplianceArea", "model EmployeePfCompliance", "model EmployeeEsicCompliance",
    "model EmployeeEsicFamilyMember", "model EmployeeComplianceDocument", "joiningId",
  ]) assert.match(schema, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(enumMigration, /PF_EPFO/);
  assert.match(enumMigration, /ESIC/);
  assert.match(dataMigration, /EmployeePfCompliance/);
  assert.match(dataMigration, /EmployeeEsicCompliance/);
  assert.match(dataMigration, /EmployeeEsicFamilyMember/);
  assert.match(dataMigration, /EmployeeComplianceDocument/);
  assert.match(dataMigration, /MAIN_ADMIN/);
});

test("PF and ESIC use independent capabilities and backend guards", () => {
  for (const permission of ["PF_VIEW", "PF_VERIFY", "PF_UPDATE", "PF_EXPORT", "ESIC_VIEW", "ESIC_VERIFY", "ESIC_UPDATE", "ESIC_EXPORT"]) {
    assert.match(accessPolicy, new RegExp(permission));
  }
  assert.match(routes, /requireAdminPermission\(AdminPermission\.PF_VIEW\)/);
  assert.match(routes, /requireAdminPermission\(AdminPermission\.PF_UPDATE\)/);
  assert.match(routes, /requireAdminPermission\(AdminPermission\.PF_VERIFY\)/);
  assert.match(routes, /requireAdminPermission\(AdminPermission\.PF_EXPORT\)/);
  assert.match(routes, /requireAdminPermission\(AdminPermission\.ESIC_VIEW\)/);
  assert.match(routes, /requireAdminPermission\(AdminPermission\.ESIC_UPDATE\)/);
  assert.match(routes, /requireAdminPermission\(AdminPermission\.ESIC_VERIFY\)/);
  assert.match(routes, /requireAdminPermission\(AdminPermission\.ESIC_EXPORT\)/);
});

test("employee compliance preserves department data separation", () => {
  assert.match(service, /adminMasterProfile\(joining, ComplianceArea\.PF_EPFO\)/);
  assert.match(service, /adminMasterProfile\(joining, ComplianceArea\.ESIC\)/);
  assert.match(service, /PF users should not receive ESIC nominee\/insurance/);
  assert.doesNotMatch(service.match(/exportPfCompliance[\s\S]*?exportEsicCompliance/)?.[0] ?? "", /esicCompliance:\s*\{/);
  assert.match(service, /employee_compliance\.pf_viewed/);
  assert.match(service, /employee_compliance\.esic_viewed/);
});

test("sensitive compliance identifiers reuse encryption and private file storage", () => {
  assert.match(service, /encryptHrPii\(input\.existingUanNumber\)/);
  assert.match(service, /encryptHrPii\(input\.esiNumber\)/);
  assert.match(service, /encryptHrPii\(member\.aadhaarNumber\)/);
  assert.match(service, /uploadPrivate/);
  assert.match(service, /downloadPrivateFile/);
  assert.doesNotMatch(service, /console\.(?:log|info|warn|error)\([^\n]*(?:aadhaar|uan|esiNumber|bankAccount)/i);
});

test("Excel exports retain PF legacy shape and ESIC family workbook", () => {
  assert.match(service, /PF New Employee Basic Details/);
  assert.match(service, /ESIC Employee Details/);
  assert.match(service, /Family details-ESI Eligible Emp/);
  assert.match(service, /filtered:\s*Boolean\(query\.query \|\| query\.status \|\| query\.department\)/);
  assert.match(xlsx, /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
});

test("employee UI has separate PF and ESIC routes using the shared compliance components", () => {
  assert.match(pfPage, /PfComplianceForm/);
  assert.match(esicPage, /EsicComplianceForm/);
  assert.match(navigation, /Compliance Management/);
  assert.match(navigation, /\/admin\/compliance\/pf/);
  assert.match(navigation, /\/admin\/compliance\/esic/);
});

test("department access setup does not hard-code PF, ESIC or Accounts credentials", () => {
  assert.doesNotMatch(accessUi, /pf@/i);
  assert.doesNotMatch(accessUi, /esic@/i);
  assert.doesNotMatch(accessUi, /accounts@/i);
  assert.doesNotMatch(accessUi, /password\s*[:=]\s*["'][^"']+["']/i);
});

test("compliance workflows include history, correction, verification and processing", () => {
  for (const status of ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEEDS_CORRECTION", "RESUBMITTED", "VERIFIED", "PROCESSED"]) {
    assert.match(schema, new RegExp(`\\b${status}\\b`));
  }
  assert.match(service, /complianceHistory/);
  assert.match(service, /COMPLIANCE_STATUS_TRANSITION/);
  assert.match(service, /correctionRemarks/);
  assert.match(service, /employee_compliance\.pf_department_updated/);
  assert.match(service, /employee_compliance\.esic_department_updated/);
});
