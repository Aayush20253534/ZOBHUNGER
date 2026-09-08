import { HttpError } from "../../utils/http-error.js";

export const DAY_MS = 86_400_000;
export const IST_OFFSET_MS = 330 * 60_000;
export const attendanceStatuses = ["PRESENT", "ABSENT", "LEAVE", "OFF"] as const;
export const displayStatuses = [...attendanceStatuses, "NOT_RECORDED", "SCHEDULED_OFF", "UPCOMING"] as const;
export function istToday(now = new Date()) { return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10); }
export function dateValue(date: string) { return new Date(`${date}T00:00:00.000Z`); }
export function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
export function addDays(date: string, days: number) { return dateKey(new Date(dateValue(date).getTime() + days * DAY_MS)); }
export function isoWeekday(date: string) { return dateValue(date).getUTCDay() || 7; }
export function monthDays(month: string) {
  const first = `${month}-01`; const [year, number] = month.split("-").map(Number);
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => addDays(first, i));
}
export function minuteOfDay(value: string) { const [hour, minute] = value.split(":").map(Number); return hour * 60 + minute; }
export function clockTime(minutes: number) { return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; }
export function shiftWindow(date: string, start: number, end: number) {
  const midnight = dateValue(date).getTime() - IST_OFFSET_MS;
  return { start: midnight + start * 60_000, end: midnight + (end + (end < start ? 1440 : 0)) * 60_000 };
}
interface AttendanceValues { status: typeof attendanceStatuses[number]; checkInAt: Date | null; checkOutAt: Date | null; breakMinutes: number }
export function attendanceMinutes(assignment: { shiftStart: number; shiftEnd: number; graceMinutes: number }, date: string, input: AttendanceValues, now = new Date()) {
  const fail = (message: string): never => { throw new HttpError(400, message, { code: "INVALID_ATTENDANCE_TIMES" }); };
  if (date > istToday(now)) fail("Attendance cannot be recorded for a future date.");
  if (input.status !== "PRESENT") {
    if (input.checkInAt || input.checkOutAt || input.breakMinutes) fail("Check-in, check-out and breaks apply only to Present entries.");
    return { workedMinutes: null, lateMinutes: 0 };
  }
  if (!input.checkInAt) return fail("A Present entry needs a check-in time.");
  const checkIn = input.checkInAt.getTime(), checkOut = input.checkOutAt?.getTime();
  const window = shiftWindow(date, assignment.shiftStart, assignment.shiftEnd);
  if (checkIn < window.start - 4 * 3600_000 || checkIn > window.end || checkIn > now.getTime()) fail("Check-in must be within this shift's date window and cannot be in the future.");
  if (checkOut !== undefined && (checkOut <= checkIn || checkOut > now.getTime() || checkOut > window.end + 4 * 3600_000 || checkOut - checkIn > 20 * 3600_000)) fail("Check-out must follow check-in, be in the past and stay within the shift window (maximum 20 hours).");
  if (checkOut === undefined && input.breakMinutes) fail("Add break minutes when a check-out time is available.");
  const grossMinutes = checkOut === undefined ? null : Math.floor((checkOut - checkIn) / 60_000);
  if (grossMinutes !== null && input.breakMinutes > grossMinutes) fail("Break minutes cannot exceed the recorded shift duration.");
  return { workedMinutes: grossMinutes === null ? null : grossMinutes - input.breakMinutes,
    lateMinutes: Math.max(0, Math.ceil((checkIn - window.start) / 60_000) - assignment.graceMinutes) };
}
