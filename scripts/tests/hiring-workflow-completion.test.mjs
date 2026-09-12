import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = async path => readFile(new URL(path, root), "utf8");

test("job lifecycle supports archive without deleting applications or history", async () => {
  const migration = await read("server/prisma/migrations/20260916100000_hiring_workflow_completion/migration.sql");
  const availability = await read("server/src/modules/jobs/job-availability.ts");
  const service = await read("server/src/modules/phase2/linked-jobs.service.ts");
  const routes = await read("server/src/modules/phase2/phase2.routes.ts");
  assert.match(migration, /ALTER TABLE "Job" ADD COLUMN "archivedAt"/);
  assert.doesNotMatch(migration, /DELETE FROM "Job"/);
  assert.match(availability, /archivedAt: null/);
  assert.match(routes, /requirement-jobs\/jobs\/:id\/archive/);
  assert.match(service, /status: "CLOSED"/);
  assert.match(service, /status: "DRAFT"/);
  assert.match(service, /Restore this archived opening before editing or publishing it/);
});

test("admin application desk includes public, worker and Placement Cell submissions", async () => {
  const schema = await read("server/src/modules/workers/worker-workflow.schema.ts");
  const service = await read("server/src/modules/workers/worker-applications.service.ts");
  assert.match(schema, /WORKER_PORTAL/);
  assert.match(schema, /PUBLIC_FORM/);
  assert.match(schema, /PLACEMENT_CELL/);
  assert.match(schema, /jobId: id\.optional\(\)/);
  assert.match(schema, /requirementId: id\.optional\(\)/);
  assert.match(service, /query\.source === "PLACEMENT_CELL"/);
  assert.match(service, /query\.source === "PUBLIC_FORM"/);
  assert.match(service, /admin \? \{\} : \{ workerUserId: userId \}/);
  assert.match(service, /source, isPortalApplicant/);
});

test("candidate sharing requires an application review before business handoff", async () => {
  const service = await read("server/src/modules/candidates/candidates.service.ts");
  assert.match(service, /status: \{ in: \["REVIEWED", "SHORTLISTED"\] \}/);
  assert.match(service, /workerUserId: true, placementCandidateId: true, placementCellApplicationId: true/);
  assert.match(service, /Review or shortlist the application before sharing it with a business requirement/);
});

test("admin hiring UI connects openings to applications, candidate review and archive controls", async () => {
  const jobs = await read("client/src/components/business/phase2/LinkedJobs.tsx");
  const apps = await read("client/src/components/worker/WorkerApplications.tsx");
  const candidate = await read("client/src/components/admin/AdminCandidateManagement.tsx");
  const nav = await read("client/src/data/admin-navigation.ts");
  const workerGate = await read("client/src/components/admin/AdminWorkerGate.tsx");
  assert.match(jobs, /Briefs, openings and applications\. One flow\./);
  assert.match(jobs, /Review .*applications/);
  assert.match(jobs, /setLinkedJobArchived/);
  assert.match(apps, /Review every applicant before the handoff\./);
  assert.match(apps, /Application source/);
  assert.match(apps, /Public Jobs form/);
  assert.match(candidate, /reviewed or shortlisted applications/);
  assert.match(nav, /label: "Applications"/);
  assert.match(workerGate, /permission: "WORKERS_MANAGE"/);
  assert.match(workerGate, /label: "Applications"/);
});

test("public applications keep a safe review surface without pretending they have a worker portal inbox", async () => {
  const app = await read("client/src/components/worker/WorkerApplications.tsx");
  const guards = await read("server/src/modules/workers/worker-workflow.guards.ts");
  assert.match(app, /Public-form applicants do not have a worker portal inbox/);
  assert.match(app, /safeExternalResume/);
  assert.match(guards, /workerApplicationEvent\.create/);
  assert.doesNotMatch(guards, /if \(application\?\.workerUserId\)/);
});
