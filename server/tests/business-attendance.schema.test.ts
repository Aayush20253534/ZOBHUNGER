import assert from "node:assert/strict";
import test from "node:test";
import { createAssignmentSchema, dailyQuerySchema, recordAttendanceSchema, resolveCorrectionSchema } from "../src/modules/attendance/attendance.schema.js";
import { attendanceMinutes, istToday, monthDays, shiftWindow } from "../src/modules/attendance/attendance.utils.js";

test("attendance calendar handles IST date boundaries and leap years", () => {
  assert.equal(istToday(new Date("2026-09-08T18:29:59Z")), "2026-09-08");
  assert.equal(istToday(new Date("2026-09-08T18:30:00Z")), "2026-09-09");
  assert.equal(monthDays("2024-02").length, 29); assert.equal(monthDays("2026-02").length, 28);
  assert.equal(dailyQuerySchema.safeParse({ date: "2026-02-30" }).success, false);
});
const assignment = { candidateId: "candidate", location: "Delhi", supervisor: "Team lead", startDate: "2026-09-01", endDate: "2026-09-30",
  shiftStart: "22:00", shiftEnd: "06:00", graceMinutes: 10, workingDays: [7, 1, 1] };
test("assignment schedules validate dates, shifts and working days", () => {
  const result = createAssignmentSchema.parse(assignment);
  assert.deepEqual(result.workingDays, [1, 7]); assert.equal(result.shiftStart, 1320);
  for (const input of [{ shiftStart: "06:00" }, { endDate: "2026-08-31" }, { endDate: "2028-01-01" }, { workingDays: [] }, { workingDays: [0] }, { graceMinutes: -1 }, { shiftEnd: "25:00" }, { companyId: "foreign" }]) {
    assert.equal(createAssignmentSchema.safeParse({ ...assignment, ...input }).success, false);
  }
});
const shift = { shiftStart: 1320, shiftEnd: 360, graceMinutes: 10 };
const present = { status: "PRESENT" as const, checkInAt: new Date("2026-09-08T22:25:00+05:30"), checkOutAt: new Date("2026-09-09T06:00:00+05:30"), breakMinutes: 30 };
test("overnight hours, breaks and late arrival use the scheduled IST start date", () => {
  assert.equal(new Date(shiftWindow("2026-09-08", 1320, 360).end).toISOString(), "2026-09-09T00:30:00.000Z");
  assert.deepEqual(attendanceMinutes(shift, "2026-09-08", present, new Date("2026-09-10")), { workedMinutes: 425, lateMinutes: 15 });
  assert.deepEqual(attendanceMinutes(shift, "2026-09-08", { ...present, checkOutAt: null, breakMinutes: 0 }, new Date("2026-09-10")), { workedMinutes: null, lateMinutes: 15 });
  for (const changes of [{ checkInAt: null }, { checkOutAt: new Date("2026-09-08T21:00:00+05:30") }, { breakMinutes: 600 }, { checkOutAt: null }, { checkInAt: new Date("2026-09-08T08:00:00+05:30") }]) {
    assert.throws(() => attendanceMinutes(shift, "2026-09-08", { ...present, ...changes }, new Date("2026-09-10")));
  }
  assert.throws(() => attendanceMinutes(shift, "2026-09-08", present, new Date("2026-09-08T22:30:00+05:30")));
  assert.throws(() => attendanceMinutes(shift, "2026-09-11", present, new Date("2026-09-10")));
});
test("non-present entries have no fabricated hours; correction resolution requires a record revision", () => {
  assert.deepEqual(attendanceMinutes(shift, "2026-09-08", { status: "ABSENT", checkInAt: null, checkOutAt: null, breakMinutes: 0 }, new Date("2026-09-10")), { workedMinutes: null, lateMinutes: 0 });
  assert.throws(() => attendanceMinutes(shift, "2026-09-08", { ...present, status: "LEAVE" }, new Date("2026-09-10")));
  assert.equal(recordAttendanceSchema.safeParse({ date: "2026-09-08", revision: null, status: "PRESENT", checkInAt: "2026-09-08T10:00:00", checkOutAt: null, breakMinutes: 0, note: "Recorded" }).success, false);
  assert.equal(resolveCorrectionSchema.safeParse({ action: "RESOLVE", resolution: "Confirmed" }).success, false);
});
