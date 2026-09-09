import { prisma } from "../../config/db.js";
import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { ownedRequirementSql, ownedRequirements } from "../business/business-requirement-access.js";
import { addDays, istToday } from "../attendance/attendance.utils.js";
import type { AttendanceAccess } from "../attendance/attendance.read.js";
import { checkRequirementScope } from "./approvals.service.js";
import type { z } from "zod";
import type { reportQuerySchema } from "./phase2.schema.js";
export type ReportQuery = z.infer<typeof reportQuerySchema>;
type Row = Record<string, string | number | null>;
const columnSets = {
  requirements: [["id", "Requirement"], ["company", "Company"], ["service", "Service"], ["location", "Requested locations"], ["requested", "People requested"], ["status", "Status"], ["selected", "Selected profiles"], ["active", "Active assignments at period end"]],
  candidates: [["id", "Candidate"], ["name", "Name"], ["role", "Role"], ["location", "City"], ["status", "Current stage"], ["requirementId", "Requirement"], ["shared", "Shared date (IST)"]],
  deployments: [["id", "Assignment"], ["name", "Name"], ["role", "Role"], ["location", "Work location"], ["supervisor", "Supervisor"], ["start", "Starts"], ["end", "Ends"], ["state", "Status at period end"], ["requirementId", "Requirement"]],
  attendance: [["id", "Record"], ["name", "Name"], ["location", "Work location"], ["date", "Work date (IST)"], ["status", "Attendance"], ["checkIn", "Check-in (IST)"], ["checkOut", "Check-out (IST)"], ["minutes", "Recorded minutes"], ["approval", "Approval"], ["assignmentId", "Assignment"]],
} as const;
export function csvCell(value: string | number | null) {
  if (typeof value === "number") return String(value);
  let text = value ?? "";
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function reportCsv(report: { columns: { key: string; label: string }[]; rows: Row[] }) {
  return "\uFEFF" + [report.columns.map(col => csvCell(col.label)).join(","), ...report.rows.map(row => report.columns.map(col => csvCell(row[col.key])).join(","))].join("\r\n") + "\r\n";
}
function fragments(access: AttendanceAccess, query: ReportQuery) {
  const pattern = `%${query.location.replace(/[\\%_]/g, "\\$&")}%`;
  const owner = access.admin ? Prisma.sql`EXISTS (SELECT 1 FROM "User" u WHERE u.id = CASE WHEN r."businessProfileId" IS NULL THEN r."submittedByUserId" ELSE b."userId" END AND u.role = 'BUSINESS')` : ownedRequirementSql(access.userId);
  const scope = Prisma.sql`WITH scope AS (SELECT r.* FROM "WorkforceRequirement" r LEFT JOIN "BusinessProfile" b ON b.id = r."businessProfileId" WHERE ${owner} AND ${query.requirementId ? Prisma.sql`r.id = ${query.requirementId}` : Prisma.sql`TRUE`})`;
  const requestedSite = query.location ? Prisma.sql`(r."jobLocation" ILIKE ${pattern} OR EXISTS (SELECT 1 FROM unnest(r.locations) p WHERE p ILIKE ${pattern}))` : Prisma.sql`TRUE`;
  const site = query.location ? Prisma.sql`a.location ILIKE ${pattern}` : Prisma.sql`TRUE`;
  const start = new Date(`${query.from}T00:00:00+05:30`), until = new Date(`${addDays(query.to, 1)}T00:00:00+05:30`);
  const requirementPeriod = Prisma.sql`r."createdAt" >= ${start} AND r."createdAt" < ${until}`;
  const assignmentPeriod = Prisma.sql`a."startDate" <= ${query.to}::date AND a."endDate" >= ${query.from}::date`;
  const attendancePeriod = Prisma.sql`t.date >= ${query.from}::date AND t.date <= ${query.to}::date`;
  return { scope, requestedSite, site, start, until, requirementPeriod, assignmentPeriod, attendancePeriod };
}
export async function getReport(access: AttendanceAccess, query: ReportQuery, mode: "page" | "csv" | "print" = "page") {
  const f = fragments(access, query);
  return prisma.$transaction(async tx => {
    await checkRequirementScope(tx, access, query.requirementId);
    const definitions = {
      requirements: { select: Prisma.sql`r.id, r."companyName" AS company, r."serviceRequired" AS service, (SELECT string_agg(p, ', ' ORDER BY p) FROM (SELECT DISTINCT unnest(array_append(r.locations, r."jobLocation")) AS p) sites) AS location,
        r."workforceCount" AS requested, r.status::text, (SELECT COUNT(*)::int FROM "BusinessCandidate" c WHERE c."requirementId" = r.id AND c.status = 'SELECTED' AND c."revokedAt" IS NULL) AS selected,
        (SELECT COUNT(*)::int FROM "WorkforceAssignment" a WHERE a."requirementId" = r.id AND a."cancelledAt" IS NULL AND a."startDate" <= ${query.to}::date AND a."endDate" >= ${query.to}::date) AS active`,
        from: Prisma.sql`FROM scope r WHERE ${f.requirementPeriod} AND ${f.requestedSite}`, order: Prisma.sql`r."createdAt" DESC, r.id DESC` },
      candidates: { select: Prisma.sql`c.id, c.name, c."jobTitle" AS role, c.city AS location, c.status::text, c."requirementId", to_char(c."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS shared`,
        from: Prisma.sql`FROM "BusinessCandidate" c JOIN scope r ON r.id = c."requirementId" WHERE c."revokedAt" IS NULL AND c."createdAt" >= ${f.start} AND c."createdAt" < ${f.until} AND ${f.requestedSite}`, order: Prisma.sql`c."createdAt" DESC, c.id DESC` },
      deployments: { select: Prisma.sql`a.id, a.name, a.role, a.location, a.supervisor, to_char(a."startDate", 'YYYY-MM-DD') AS start, to_char(a."endDate", 'YYYY-MM-DD') AS "end",
        CASE WHEN a."cancelledAt" IS NOT NULL THEN 'CANCELLED' WHEN a."startDate" > ${query.to}::date THEN 'UPCOMING' WHEN a."endDate" < ${query.to}::date THEN 'ENDED' ELSE 'ACTIVE' END AS state, a."requirementId"`,
        from: Prisma.sql`FROM "WorkforceAssignment" a JOIN scope r ON r.id = a."requirementId" WHERE ${f.assignmentPeriod} AND ${f.site}`, order: Prisma.sql`a."startDate" DESC, a.id DESC` },
      attendance: { select: Prisma.sql`t.id, a.name, a.location, to_char(t.date, 'YYYY-MM-DD') AS date, t.status::text,
        to_char(t."checkInAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI') AS "checkIn", to_char(t."checkOutAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI') AS "checkOut",
        t."workedMinutes" AS minutes, t."approvalStatus"::text AS approval, t."assignmentId"`,
        from: Prisma.sql`FROM "AttendanceRecord" t JOIN "WorkforceAssignment" a ON a.id = t."assignmentId" JOIN scope r ON r.id = a."requirementId" WHERE ${f.attendancePeriod} AND ${f.site}`, order: Prisma.sql`t.date DESC, t.id DESC` },
    };
    const definition = definitions[query.type];
    const [{ total }] = await tx.$queryRaw<{ total: number }[]>(Prisma.sql`${f.scope} SELECT COUNT(*)::int AS total ${definition.from}`);
    const limit = mode === "csv" ? 10000 : mode === "print" ? 1000 : 12;
    if (mode !== "page" && total > limit) throw new HttpError(413, `This ${mode === "csv" ? "export" : "printout"} exceeds ${limit} rows. Narrow the dates or location and try again.`, { code: "REPORT_TOO_LARGE" });
    const totalPages = Math.max(1, Math.ceil(total / 12)), page = mode === "page" ? Math.min(query.page, totalPages) : 1;
    const rows = await tx.$queryRaw<Row[]>(Prisma.sql`${f.scope} SELECT ${definition.select} ${definition.from} ORDER BY ${definition.order} LIMIT ${limit} OFFSET ${(page - 1) * 12}`);
    // Exports use the exact same filters and a consistent snapshot; no silent truncation.
    const columns = columnSets[query.type].map(([key, label]) => ({ key, label }));
    if (mode === "csv") return { type: query.type, from: query.from, to: query.to, location: query.location, generatedAt: new Date().toISOString(), columns, rows, total, page, totalPages, charts: null };
    const requirements = await tx.$queryRaw<{ status: string; count: number; people: number }[]>(Prisma.sql`${f.scope} SELECT r.status::text, COUNT(*)::int AS count, COALESCE(SUM(r."workforceCount"), 0)::int AS people ${definitions.requirements.from} GROUP BY r.status`);
    const candidates = await tx.$queryRaw<{ status: string; count: number }[]>(Prisma.sql`${f.scope} SELECT c.status::text, COUNT(*)::int AS count ${definitions.candidates.from} GROUP BY c.status`);
    const deployments = await tx.$queryRaw<{ state: string; count: number }[]>(Prisma.sql`${f.scope} SELECT CASE WHEN a."cancelledAt" IS NOT NULL THEN 'CANCELLED' WHEN a."endDate" < ${query.to}::date THEN 'ENDED' ELSE 'ACTIVE' END AS state, COUNT(*)::int AS count ${definitions.deployments.from} GROUP BY 1`);
    const attendance = await tx.$queryRaw<{ status: string; count: number; approved: number; pending: number; changes: number; minutes: number; approvedMinutes: number }[]>(Prisma.sql`${f.scope} SELECT t.status::text, COUNT(*)::int AS count,
      COUNT(*) FILTER (WHERE t."approvalStatus" = 'APPROVED')::int AS approved, COUNT(*) FILTER (WHERE t."approvalStatus" = 'PENDING')::int AS pending,
      COUNT(*) FILTER (WHERE t."approvalStatus" = 'CHANGES_REQUESTED')::int AS changes, COALESCE(SUM(t."workedMinutes"),0)::int AS minutes,
      COALESCE(SUM(t."workedMinutes") FILTER (WHERE t."approvalStatus" = 'APPROVED'),0)::int AS "approvedMinutes" ${definitions.attendance.from} GROUP BY t.status`);
    const trend = await tx.$queryRaw<{ date: string; expected: number; missing: number; present: number; recorded: number }[]>(Prisma.sql`${f.scope}, days AS (SELECT generate_series(${query.from}::date, ${query.to}::date, '1 day'::interval)::date AS day),
      planned AS (SELECT d.day, COUNT(*)::int AS expected, COUNT(*) FILTER (WHERE t.id IS NULL)::int AS missing FROM days d
        JOIN "WorkforceAssignment" a ON a."startDate" <= d.day AND a."endDate" >= d.day AND a."cancelledAt" IS NULL AND extract(isodow from d.day)::int = ANY(a."workingDays")
        JOIN scope r ON r.id = a."requirementId" LEFT JOIN "AttendanceRecord" t ON t."assignmentId" = a.id AND t.date = d.day WHERE ${f.site} GROUP BY d.day),
      recorded AS (SELECT t.date AS day, COUNT(*)::int AS recorded, COUNT(*) FILTER (WHERE t.status = 'PRESENT')::int AS present ${definitions.attendance.from} GROUP BY t.date)
      SELECT to_char(d.day,'YYYY-MM-DD') AS date, COALESCE(p.expected,0)::int AS expected, COALESCE(p.missing,0)::int AS missing, COALESCE(t.present,0)::int AS present, COALESCE(t.recorded,0)::int AS recorded
      FROM days d LEFT JOIN planned p ON p.day = d.day LEFT JOIN recorded t ON t.day = d.day ORDER BY d.day`);
    return { type: query.type, from: query.from, to: query.to, location: query.location, generatedAt: new Date().toISOString(), columns, rows, total, page, totalPages, charts: { requirements, candidates, deployments, attendance, trend } };
  }, { isolationLevel: "RepeatableRead", timeout: 25000 });
}
export async function operationsSummary(userId: string) {
  const date = istToday();
  return prisma.$transaction(async tx => {
    const requirement = ownedRequirements(userId), assignment = { requirement };
    const candidates = await tx.businessCandidate.groupBy({ by: ["status"], where: { requirement, revokedAt: null }, _count: { _all: true } });
    const active = await tx.workforceAssignment.count({ where: { ...assignment, cancelledAt: null, startDate: { lte: new Date(date) }, endDate: { gte: new Date(date) } } });
    const upcoming = await tx.workforceAssignment.count({ where: { ...assignment, cancelledAt: null, startDate: { gt: new Date(date) } } });
    const approvals = await tx.attendanceRecord.count({ where: { assignment, approvalStatus: "PENDING" } });
    const oldestPending = await tx.attendanceRecord.findFirst({ where: { assignment, approvalStatus: "PENDING" }, select: { id: true }, orderBy: [{ date: "asc" }, { id: "asc" }] });
    const corrections = await tx.attendanceCorrection.count({ where: { assignment, status: "OPEN" } });
    const drafts = await tx.requirementDraft.count({ where: { userId, submittedAt: null } });
    const jobs = await tx.job.count({ where: { requirement, status: "OPEN" } });
    return { date, active, upcoming, approvals, oldestPendingId: oldestPending?.id ?? null, corrections, drafts, jobs, candidates: candidates.map(row => ({ status: row.status, count: row._count._all })) };
  }, { isolationLevel: "RepeatableRead" });
}
