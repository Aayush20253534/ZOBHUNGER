const DAY = 86_400_000;
const IST_OFFSET = 330 * 60_000;

export const requirementStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED"] as const;

/** India has no daylight-saving transitions. Dates represent IST calendar days. */
export function dashboardPeriod(days: number, now: Date) {
  const local = new Date(now.getTime() + IST_OFFSET);
  const today = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - IST_OFFSET;
  const start = new Date(today - (days - 1) * DAY);
  const dates = Array.from({ length: days }, (_, i) =>
    new Date(start.getTime() + i * DAY + IST_OFFSET).toISOString().slice(0, 10));
  return { start, end: now, dates };
}

export function statusChange(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const { from, to } = metadata as Record<string, unknown>;
  const valid = (value: unknown): value is typeof requirementStatuses[number] =>
    typeof value === "string" && requirementStatuses.some(status => status === value);
  return valid(from) && valid(to) && from !== to ? { from, to } : null;
}
