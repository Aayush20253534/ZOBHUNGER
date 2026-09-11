import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = async path => readFile(new URL(path, root), "utf8");

test("intake migration captures every agreed submission source without copying sensitive HR fields", async () => {
  const migration = await read("server/prisma/migrations/20260915100000_operations_intake/migration.sql");
  for (const source of ["ContactEnquiry", "WorkforceRequirement", "PartnerApplication", "VendorApplication", "CareerApplication", "PlacementCellApplication", "EmployeeJoining", "JobApplication"]) {
    assert.match(migration, new RegExp(`${source}_intake_capture`));
  }
  assert.match(migration, /sourceType.*sourceId_key/);
  assert.match(migration, /legal-privacy-compliance/);
  assert.match(migration, /website-application-development/);
  assert.doesNotMatch(migration, /aadhaarEncrypted|panEncrypted|bankAccountEncrypted|uanEncrypted|resumeData/);
});

test("intake API is MFA protected and department scoped through the admin router", async () => {
  const routes = await read("server/src/modules/admin/admin.routes.ts");
  const permissions = await read("server/src/middlewares/admin-permission.middleware.ts");
  const service = await read("server/src/modules/intake/intake.service.ts");
  assert.match(routes, /requireAuth, requireRole\("ADMIN"\), requireAdminMfa/);
  assert.match(routes, /adminRouter\.use\("\/intake", adminIntakeRouter\)/);
  assert.match(permissions, /\/intake.*DASHBOARD_VIEW/);
  assert.match(service, /department === AdminDepartment\.MAIN_ADMIN \? \{\} : \{ department \}/);
  assert.match(service, /Only Main Administration can reroute a case/);
  assert.match(service, /INTAKE_ASSIGNEE_DEPARTMENT_MISMATCH/);
});

test("intake writes use optimistic concurrency, audit logs and internal notes", async () => {
  const service = await read("server/src/modules/intake/intake.service.ts");
  assert.match(service, /revision: input\.expectedRevision/);
  assert.match(service, /revision: \{ increment: 1 \}/);
  assert.match(service, /intake\.case_updated/);
  assert.match(service, /intake\.note_added/);
  assert.match(service, /intake\.exported/);
});

test("admin UI exposes one responsive intake desk instead of separate department dashboards", async () => {
  const nav = await read("client/src/data/admin-navigation.ts");
  const component = await read("client/src/components/admin/AdminOperationsIntake.tsx");
  const styles = await read("client/src/styles/admin-operations-intake.css");
  assert.match(nav, /href: "\/admin\/intake"/);
  assert.match(component, /Every request\. One accountable queue\./);
  assert.match(component, /Assign to me/);
  assert.match(component, /Internal notes/);
  assert.match(component, /Export CSV/);
  assert.match(styles, /@media\(max-width:720px\)/);
  assert.match(styles, /grid-template-columns:1fr/);
});

test("contact intake includes explicit Legal routing while preserving Technical routing", async () => {
  const form = await read("client/src/components/forms/ContactForm.tsx");
  const schema = await read("client/src/schemas/enquiry.schema.ts");
  assert.match(form, /legal-privacy-compliance/);
  assert.match(form, /Legal, privacy & compliance/);
  assert.match(schema, /legal-privacy-compliance/);
});
