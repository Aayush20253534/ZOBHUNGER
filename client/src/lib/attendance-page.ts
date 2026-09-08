// Server-side URL parsing keeps malformed dates out of calendar rendering.
export function attendancePageDate(value: string | string[] | undefined) {
  if (typeof value !== "string" || !/^20\d{2}-(0[1-9]|1[0-2])-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined;
}
