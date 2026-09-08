import assert from "node:assert/strict";
import test from "node:test";
import { deploymentDetailSchema, progressQuerySchema, rosterQuerySchema } from "../src/modules/deployments/deployments.schema.js";
import { assignmentSchedule, deploymentProgress, deploymentState, weekDates } from "../src/modules/deployments/deployments.utils.js";

test("deployment filters reject invalid dates, ownership overrides and unbounded pages", () => {
  assert.equal(rosterQuerySchema.parse({}).view, "roster");
  for (const query of [{ date: "2026-02-30" }, { page: 0 }, { page: 100001 }, { page: 1.5 }, { status: "PRESENT" }, { view: "unknown" }, { requirementId: "../other" }, { userId: "other" }, { query: "x".repeat(101) }]) {
    assert.equal(rosterQuerySchema.safeParse(query).success, false);
  }
  assert.equal(progressQuerySchema.safeParse({ scope: "private" }).success, false);
  assert.equal(deploymentDetailSchema.safeParse({ historyPage: -1 }).success, false);
});
test("the weekly roster spans Monday to Sunday across a year and leap day", () => {
  assert.deepEqual(weekDates("2027-01-01"), ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
  assert.ok(weekDates("2024-03-01").includes("2024-02-29"));
});
const assignment = { startDate: new Date("2026-09-08"), endDate: new Date("2026-09-11"), cancelledAt: null, workingDays: [2, 4, 5], shiftStart: 1320, shiftEnd: 360 };
test("schedules distinguish rest days and dates outside the assignment, including overnight shifts", () => {
  const days = assignmentSchedule(assignment, weekDates("2026-09-08"));
  assert.deepEqual(days.map(day => day.state), ["OUTSIDE", "WORKING", "OFF", "WORKING", "WORKING", "OUTSIDE", "OUTSIDE"]);
  assert.equal(days[1].startAt, "2026-09-08T16:30:00.000Z");
  assert.equal(days[1].endAt, "2026-09-09T00:30:00.000Z");
  assert.ok(days.filter(day => day.state !== "WORKING").every(day => day.startAt === null && day.endAt === null));
  assert.ok(assignmentSchedule({ ...assignment, cancelledAt: new Date() }, weekDates("2026-09-08")).every(day => day.state === "CANCELLED" && day.startAt === null));
});
test("assignment coverage uses inclusive dates and keeps excess coverage visible", () => {
  assert.equal(deploymentState(assignment, "2026-09-07"), "UPCOMING");
  assert.equal(deploymentState(assignment, "2026-09-08"), "ACTIVE");
  assert.equal(deploymentState(assignment, "2026-09-11"), "ACTIVE");
  assert.equal(deploymentState(assignment, "2026-09-12"), "ENDED");
  assert.equal(deploymentState({ ...assignment, cancelledAt: new Date() }, "2026-09-07"), "CANCELLED");
  assert.deepEqual(deploymentProgress(10, 4), { remaining: 6, overTarget: 0, coverage: 40 });
  assert.deepEqual(deploymentProgress(2, 3), { remaining: 0, overTarget: 1, coverage: 150 });
  assert.deepEqual(deploymentProgress(0, 0), { remaining: 0, overTarget: 0, coverage: null });
});
