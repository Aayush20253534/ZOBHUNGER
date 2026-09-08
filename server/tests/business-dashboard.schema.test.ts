import assert from "node:assert/strict";
import test from "node:test";
import { dashboardQuerySchema, requirementIdSchema } from "../src/modules/business/business-dashboard.schema.js";
import { dashboardPeriod, statusChange } from "../src/modules/business/business-dashboard.utils.js";

test("dashboard filters have bounded defaults and reject owner selection", () => {
  assert.deepEqual(dashboardQuerySchema.parse({}), { range: 30, status: "ALL", page: 1 });
  assert.deepEqual(dashboardQuerySchema.parse({ range: "7", status: "CLOSED", page: "2" }), { range: 7, status: "CLOSED", page: 2 });
  for (const query of [{ range: "8" }, { range: ["7", "30"] }, { status: "DEPLOYED" }, { page: "0" },
    { page: "-1" }, { page: "1.5" }, { page: "1e3" }, { page: "10001" }, { page: "0001" },
    { userId: "another-company" }, { businessProfileId: "another-company" }]) {
    assert.equal(dashboardQuerySchema.safeParse(query).success, false, JSON.stringify(query));
  }
  assert.equal(requirementIdSchema.safeParse({ id: "req_123-abc" }).success, true);
  for (const id of ["", "../profile", "a".repeat(65), "x?userId=other"]) assert.equal(requirementIdSchema.safeParse({ id }).success, false);
});

test("activity windows include today in IST across UTC day, month and leap-year boundaries", () => {
  const period = dashboardPeriod(7, new Date("2024-03-01T18:30:00.000Z"));
  assert.equal(period.start.toISOString(), "2024-02-24T18:30:00.000Z");
  assert.deepEqual(period.dates, ["2024-02-25", "2024-02-26", "2024-02-27", "2024-02-28", "2024-02-29", "2024-03-01", "2024-03-02"]);
  assert.equal(dashboardPeriod(7, new Date("2024-03-01T18:29:59.999Z")).dates.at(-1), "2024-03-01");
  assert.equal(dashboardPeriod(90, new Date("2026-01-01T00:00:00Z")).dates.length, 90);
});

test("client-visible history contains only real, recognized status changes", () => {
  assert.deepEqual(statusChange({ from: "NEW", to: "CLOSED", email: "internal", note: "private" }), { from: "NEW", to: "CLOSED" });
  for (const value of [null, [], "NEW", { from: "NEW", to: "NEW" }, { from: "NEW", to: "DEPLOYED" }, { to: "CLOSED" }]) assert.equal(statusChange(value), null);
});
