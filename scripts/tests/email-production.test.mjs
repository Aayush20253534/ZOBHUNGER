import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../../", import.meta.url);
const read = async path => readFile(new URL(path, root), "utf8");

test("production email configuration exposes Resend, reply-to and department inboxes", async () => {
  const [env, example, resend] = await Promise.all([
    read("server/src/config/env.ts"),
    read("server/.env.example"),
    read("server/src/services/resend.client.ts"),
  ]);
  for (const key of ["RESEND_API_KEY", "MAIL_FROM_EMAIL", "MAIL_REPLY_TO_EMAIL", "SALES_TEAM_EMAIL", "HR_TEAM_EMAIL", "TECH_TEAM_EMAIL", "PLACEMENT_TEAM_EMAIL", "LEGAL_TEAM_EMAIL"]) {
    assert.match(env, new RegExp(`\\b${key}\\b`), `${key} is missing from runtime env`);
    assert.match(example, new RegExp(`^${key}=`, "m"), `${key} is missing from .env.example`);
  }
  assert.match(resend, /reply_to:/);
  assert.match(resend, /Idempotency-Key/);
  assert.match(resend, /departmentNotifications/);
});

test("all customer mail uses one branded corporate email system", async () => {
  const [template, email, worker, offer, partner] = await Promise.all([
    read("server/src/services/email-template.ts"),
    read("server/src/services/email.service.ts"),
    read("server/src/services/worker-email.service.ts"),
    read("server/src/modules/employee-joining/employee-joining.service.ts"),
    read("server/src/modules/partner-access/partner-access.service.ts"),
  ]);
  assert.match(template, /Integrated Workforce, Sales &amp; Business Execution Platform/);
  assert.match(template, /linear-gradient\(138deg,#f42642 0%,#e21d36 46%,#c91530 100%\)/);
  assert.match(email, /corporateEmail/);
  assert.match(worker, /corporateEmail/);
  assert.match(offer, /corporateEmail/);
  assert.match(partner, /sendCorporateEmail/);
  assert.doesNotMatch(partner, /sendOperationalEmail/);
});

test("submission receipts and status updates cover the Phase 1-3 workflows", async () => {
  const notifications = await read("server/src/services/notification.service.ts");
  for (const fn of [
    "notifyNewEnquiry", "notifyNewRequirement", "notifyRequirementStatus", "notifyNewApplication", "notifyJobApplicationStatus",
    "notifyNewPartnerApplication", "notifyPartnerApplicationStatus", "notifyNewPlacementCellApplication", "notifyPlacementCellStatus",
    "notifyCareerProfileSubmitted", "notifyCareerProfileStatus", "notifyVendorSubmitted", "notifyVendorStatus",
    "notifyEmployeeJoiningSubmitted", "notifyEmployeeJoiningStatus", "notifyIntakeAssignment",
  ]) assert.match(notifications, new RegExp(`export function ${fn}\\b`), `${fn} is missing`);

  assert.match(notifications, /case "HR": return env\.HR_TEAM_EMAIL/);
  assert.match(notifications, /case "TECHNICAL": return env\.TECH_TEAM_EMAIL/);
  assert.match(notifications, /case "PLACEMENT_CELL": return env\.PLACEMENT_TEAM_EMAIL/);
  assert.match(notifications, /case "LEGAL": return env\.LEGAL_TEAM_EMAIL/);
  assert.match(notifications, /legal-privacy-compliance/);
  assert.match(notifications, /website-application-development/);
});

test("workflow services trigger email only after committed operational changes", async () => {
  const [admin, careers, vendors, workers, placement, intake] = await Promise.all([
    read("server/src/modules/admin/admin.service.ts"),
    read("server/src/modules/careers/careers.routes.ts"),
    read("server/src/modules/vendors/vendors.routes.ts"),
    read("server/src/modules/workers/worker-applications.service.ts"),
    read("server/src/modules/placement-cells/placement-opportunities.service.ts"),
    read("server/src/modules/intake/intake.service.ts"),
  ]);
  assert.match(admin, /notifyRequirementStatus/);
  assert.match(admin, /notifyJobApplicationStatus/);
  assert.match(admin, /notifyPlacementCellStatus/);
  assert.match(careers, /notifyCareerProfileSubmitted/);
  assert.match(careers, /notifyCareerProfileStatus/);
  assert.match(vendors, /notifyVendorSubmitted/);
  assert.match(vendors, /notifyVendorStatus/);
  assert.match(workers, /notifyNewApplication/);
  assert.match(workers, /notifyJobApplicationStatus/);
  assert.match(placement, /source: "PLACEMENT_CELL"/);
  assert.match(intake, /notifyIntakeAssignment/);
});

test("employee emails do not duplicate protected HR fields", async () => {
  const notifications = await read("server/src/services/notification.service.ts");
  const employeeSection = notifications.slice(notifications.indexOf("export function notifyEmployeeJoiningSubmitted"), notifications.indexOf("export function notifyIntakeAssignment"));
  for (const field of ["aadhaarEncrypted", "panEncrypted", "bankAccountEncrypted", "uanEncrypted", "bankAccountNumber", "panNumber", "uanNumber"]) {
    assert.equal(employeeSection.includes(field), false, `protected field leaked into employee email code: ${field}`);
  }
  assert.match(employeeSection, /does not repeat Aadhaar, PAN, bank account/);
});
