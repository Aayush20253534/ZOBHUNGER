import { createHash } from "node:crypto";
import { guardRequirementAssignments } from "../attendance/attendance.guards.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import { HttpError } from "../../utils/http-error.js";
import { editableRequirementFields, ownedRequirements, ownedRequirementSql, requirementSummarySelect } from "./business-requirement-access.js";
import { requirementStatuses } from "./business-dashboard.utils.js";
import type { CreateBusinessRequirement, UpdateBusinessRequirement, WithdrawBusinessRequirement, ListBusinessRequirements } from "./business-requirements.schema.js";

const missing = () => new HttpError(404, "This requirement is not available in your business account.", { code: "REQUIREMENT_NOT_FOUND" });
const conflict = () => new HttpError(409, "This requirement changed while you were working. Open the latest brief before making another change.", { code: "REQUIREMENT_CHANGED" });
const closed = () => new HttpError(409, "Closed requirements are read-only. Create a new requirement or contact our team.", { code: "REQUIREMENT_CLOSED" });
const PAGE_SIZE = 9;

export async function listBusinessRequirements(userId: string, query: ListBusinessRequirements) {
  const now = new Date();
  const pattern = `%${query.query.replace(/[\\%_]/g, "\\$&")}%`;
  const search = query.query ? Prisma.sql`AND (
    r.id ILIKE ${pattern} OR r."serviceRequired" ILIKE ${pattern} OR r."companyName" ILIKE ${pattern}
    OR r."jobLocation" ILIKE ${pattern}
    OR EXISTS (SELECT 1 FROM unnest(r.locations) AS place(name) WHERE place.name ILIKE ${pattern})
  )` : Prisma.empty;
  const status = query.status === "ALL" ? Prisma.empty : Prisma.sql`AND r.status::text = ${query.status}`;
  const from = Prisma.sql`FROM "WorkforceRequirement" r LEFT JOIN "BusinessProfile" b ON b.id = r."businessProfileId"
    WHERE ${ownedRequirementSql(userId)} AND r."createdAt" <= ${now} ${search} ${status}`;
  return prisma.$transaction(async tx => {
    const [totals, groups] = await Promise.all([
      tx.$queryRaw<{ count: number }[]>(Prisma.sql`SELECT COUNT(*)::int AS count ${from}`),
      tx.workforceRequirement.groupBy({ by: ["status"], where: { ...ownedRequirements(userId), createdAt: { lte: now } }, _count: { _all: true } }),
    ]);
    const total = totals[0].count;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(query.page, totalPages);
    const direction = query.sort === "oldest" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const ids = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`SELECT r.id ${from}
      ORDER BY r."createdAt" ${direction}, r.id ${direction} LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`);
    const order = query.sort === "oldest" ? "asc" : "desc";
    const items = await tx.workforceRequirement.findMany({
      where: { ...ownedRequirements(userId), id: { in: ids.map(row => row.id) } },
      select: requirementSummarySelect, orderBy: [{ createdAt: order }, { id: order }],
    });
    const counts = requirementStatuses.map(value => ({ status: value, count: groups.find(group => group.status === value)?._count._all ?? 0 }));
    return { items, total, page, pageSize: PAGE_SIZE, totalPages, query: query.query, status: query.status, sort: query.sort,
      counts, totalRequirements: counts.reduce((sum, row) => sum + row.count, 0) };
  }, { isolationLevel: "RepeatableRead", timeout: 15000 });
}

export async function createBusinessRequirement(userId: string, input: CreateBusinessRequirement) {
  const { requestKey, ...brief } = input;
  const submissionKey = `${userId}:${requestKey}`;
  const submissionHash = createHash("sha256").update(JSON.stringify(brief)).digest("hex");
  return prisma.$transaction(async tx => {
    const profile = await tx.businessProfile.findUnique({ where: { userId }, select: { id: true } });
    // PostgreSQL's unique key arbitrates simultaneous retries. ON CONFLICT DO
    // NOTHING keeps the transaction usable for reading the winning submission.
    const inserted = await tx.workforceRequirement.createMany({ data: [{
      ...brief, submittedByUserId: userId, businessProfileId: profile?.id ?? null, submissionKey, submissionHash,
    }], skipDuplicates: true });
    const requirement = await tx.workforceRequirement.findFirst({ where: { ...ownedRequirements(userId), submissionKey } });
    if (!requirement) throw missing();
    if (requirement.submissionHash !== submissionHash) throw new HttpError(409,
      "This submission was already received with different details. Open your requirements to review it before starting another.", { code: "SUBMISSION_KEY_REUSED" });
    if (inserted.count === 1) {
      await tx.auditLog.create({ data: { actorUserId: userId, action: "WORKFORCE_REQUIREMENT_CREATED",
        entityType: "WorkforceRequirement", entityId: requirement.id, metadata: { source: "BUSINESS" } } });
    }
    return { requirement, created: inserted.count === 1 };
  }, { isolationLevel: "ReadCommitted" });
}

export async function updateBusinessRequirement(userId: string, id: string, input: UpdateBusinessRequirement) {
  const { revision, ...brief } = input;
  return prisma.$transaction(async tx => {
    const current = await tx.workforceRequirement.findFirst({ where: { ...ownedRequirements(userId), id } });
    if (!current) throw missing();
    if (current.status === "CLOSED") throw closed();
    if (current.revision !== revision) throw conflict();
    const fields = editableRequirementFields.filter(field => JSON.stringify(current[field]) !== JSON.stringify(brief[field]));
    if (!fields.length) return { id, revision: current.revision, status: current.status, changed: false };
    const updated = await tx.workforceRequirement.updateMany({
      where: { ...ownedRequirements(userId), id, revision, status: current.status },
      data: { ...brief, status: "NEW", revision: { increment: 1 } },
    });
    if (updated.count !== 1) throw conflict();
    await tx.auditLog.create({ data: {
      actorUserId: userId, action: "WORKFORCE_REQUIREMENT_UPDATED", entityType: "WorkforceRequirement", entityId: id,
      metadata: { fields, revision: revision + 1, source: "BUSINESS" },
    } });
    if (current.status !== "NEW") await tx.auditLog.create({ data: {
      actorUserId: userId, action: "WORKFORCE_REQUIREMENT_STATUS_CHANGED", entityType: "WorkforceRequirement", entityId: id,
      metadata: { from: current.status, to: "NEW", source: "BUSINESS_EDIT" },
    } });
    return { id, revision: revision + 1, status: "NEW" as const, changed: true };
  });
}

export async function withdrawBusinessRequirement(userId: string, id: string, input: WithdrawBusinessRequirement) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "WorkforceRequirement" WHERE "id" = ${id} FOR UPDATE`);
    const current = await tx.workforceRequirement.findFirst({ where: { ...ownedRequirements(userId), id } });
    if (!current) throw missing();
    if (current.status === "CLOSED") throw closed();
    if (current.revision !== input.revision) throw conflict();
    await guardRequirementAssignments(tx, id);
    const changed = await tx.workforceRequirement.updateMany({
      where: { ...ownedRequirements(userId), id, revision: input.revision, status: current.status },
      data: { status: "CLOSED", revision: { increment: 1 } },
    });
    if (changed.count !== 1) throw conflict();
    await tx.auditLog.create({ data: {
      actorUserId: userId, action: "WORKFORCE_REQUIREMENT_STATUS_CHANGED", entityType: "WorkforceRequirement", entityId: id,
      metadata: { from: current.status, to: "CLOSED", source: "BUSINESS_WITHDRAWAL", reason: input.reason },
    } });
    return { id, revision: input.revision + 1, status: "CLOSED" as const };
  });
}
