import { prisma } from "../../config/db.js";
import { isDeepStrictEqual } from "node:util";
import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { createBusinessRequirementTx } from "../business/business-requirements.service.js";
import { ownedRequirements } from "../business/business-requirement-access.js";
import type { CreateBusinessRequirement } from "../business/business-requirements.schema.js";
import type { z } from "zod";
import type { saveDraftSchema } from "./phase2.schema.js";

const missing = () => new HttpError(404, "Draft not available in your workspace.", { code: "DRAFT_NOT_FOUND" });
const changed = () => new HttpError(409, "This draft has changed or was submitted. Reload the saved draft before continuing.", { code: "DRAFT_CHANGED" });
export async function listDrafts(userId: string, page: number) {
  return prisma.$transaction(async tx => {
    const where = { userId, submittedAt: null }; const total = await tx.requirementDraft.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / 9)); page = Math.min(page, totalPages);
    const items = await tx.requirementDraft.findMany({ where, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: 9, skip: (page - 1) * 9,
      select: { id: true, data: true, revision: true, updatedAt: true } });
    return { items, total, page, totalPages };
  }, { isolationLevel: "RepeatableRead" });
}
export async function getDraft(userId: string, id: string) {
  const row = await prisma.requirementDraft.findFirst({ where: { id, userId }, select: { id: true, data: true, revision: true, updatedAt: true, submittedRequirementId: true, submittedAt: true } });
  if (!row) throw missing(); return row;
}
export async function saveDraft(userId: string, id: string, input: z.infer<typeof saveDraftSchema>) {
  return prisma.$transaction(async tx => {
    // Serializes initial retries and the per-account draft limit, without email ownership.
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`);
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "RequirementDraft" WHERE id = ${id} AND "userId" = ${userId} FOR UPDATE`);
    const row = await tx.requirementDraft.findUnique({ where: { id } });
    if (row && row.userId !== userId) throw missing();
    if (row?.submittedAt) throw changed();
    if (!row) {
      if (input.revision !== null) throw missing();
      if (await tx.requirementDraft.count({ where: { userId, submittedAt: null } }) >= 100) throw new HttpError(409, "Submit or remove an existing draft before saving another.", { code: "DRAFT_LIMIT" });
      return tx.requirementDraft.create({ data: { id, userId, data: input.data }, select: { id: true, data: true, revision: true, updatedAt: true } });
    }
    if (row.revision !== input.revision) {
      if (input.revision === null && isDeepStrictEqual(row.data, input.data)) return { id, data: row.data, revision: row.revision, updatedAt: row.updatedAt };
      throw changed();
    }
    return tx.requirementDraft.update({ where: { id }, data: { data: input.data, revision: { increment: 1 } }, select: { id: true, data: true, revision: true, updatedAt: true } });
  });
}
export async function removeDraft(userId: string, id: string, revision: number) {
  const found = await getDraft(userId, id);
  if (found.submittedAt || found.revision !== revision) throw changed();
  const result = await prisma.requirementDraft.deleteMany({ where: { id, userId, revision, submittedAt: null } });
  if (!result.count) throw changed(); return { removed: true };
}
export async function submitDraft(userId: string, id: string, revision: number, input: CreateBusinessRequirement) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "RequirementDraft" WHERE id = ${id} AND "userId" = ${userId} FOR UPDATE`);
    const row = await tx.requirementDraft.findFirst({ where: { id, userId } });
    if (!row) throw missing();
    if (row.submittedAt) {
      const requirement = row.submittedRequirementId ? await tx.workforceRequirement.findFirst({ where: { id: row.submittedRequirementId, ...ownedRequirements(userId) } }) : null;
      if (!requirement) throw changed(); return { requirement, created: false };
    }
    if (row.revision !== revision) throw changed();
    const result = await createBusinessRequirementTx(tx, userId, { ...input, requestKey: id });
    await tx.requirementDraft.update({ where: { id }, data: { submittedAt: new Date(), submittedRequirementId: result.requirement.id, revision: { increment: 1 } } });
    return result;
  });
}
