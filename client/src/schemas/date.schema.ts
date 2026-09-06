import { z } from "zod";

// Keep public forms compatible with both Zod 3 and Zod 4. Native date inputs
// provide strings; checking the calendar also rejects dates such as February 31.
function isCalendarDate(value: string): boolean {
  if (value.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const leapYear = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
}

export const isoDateSchema = z
  .string()
  .refine(isCalendarDate, "Enter a valid date (YYYY-MM-DD).");

// Preserve the existing requirement payload's UTC timestamp support. Seconds
// are optional; fractional seconds must follow whole seconds. Offsets and local
// timestamps remain excluded, matching the previous default ISO validator.
export const isoDateTimeSchema = z
  .string()
  .refine(
    (value) =>
      value.endsWith("Z") &&
      /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?Z$/.test(
        value,
      ) &&
      isCalendarDate(value.slice(0, 10)),
    "Enter a valid UTC date and time.",
  );
