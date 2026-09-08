import { addDays, dateKey, isoWeekday, shiftWindow } from "../attendance/attendance.utils.js";

export const deploymentStates = ["ACTIVE", "UPCOMING", "ENDED", "CANCELLED"] as const;
export type DeploymentState = typeof deploymentStates[number];
export function deploymentState(assignment: { startDate: Date; endDate: Date; cancelledAt: Date | null }, date: string): DeploymentState {
  return assignment.cancelledAt ? "CANCELLED" : date < dateKey(assignment.startDate) ? "UPCOMING" : date > dateKey(assignment.endDate) ? "ENDED" : "ACTIVE";
}
export function weekDates(date: string) {
  const monday = addDays(date, 1 - isoWeekday(date));
  return Array.from({ length: 7 }, (_, day) => addDays(monday, day));
}
export function assignmentSchedule(assignment: { startDate: Date; endDate: Date; cancelledAt: Date | null; workingDays: number[]; shiftStart: number; shiftEnd: number }, dates: string[]) {
  return dates.map(date => {
    const state = assignment.cancelledAt ? "CANCELLED" : date < dateKey(assignment.startDate) || date > dateKey(assignment.endDate) ? "OUTSIDE" : assignment.workingDays.includes(isoWeekday(date)) ? "WORKING" : "OFF";
    const window = shiftWindow(date, assignment.shiftStart, assignment.shiftEnd);
    return { date, state, startAt: state === "WORKING" ? new Date(window.start).toISOString() : null, endAt: state === "WORKING" ? new Date(window.end).toISOString() : null };
  });
}
export function deploymentProgress(requested: number, active: number) {
  return { remaining: Math.max(0, requested - active), overTarget: Math.max(0, active - requested),
    coverage: requested > 0 ? Math.round(active * 100 / requested) : null };
}
