import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";

// Legacy openings remain available; linked openings require a qualified, active owner.
export const availableJobWhere: Prisma.JobWhereInput = { status: "OPEN", archivedAt: null, OR: [
  { requirementId: null },
  { requirement: { is: { status: "QUALIFIED", OR: [
    { businessProfile: { is: { user: { is: { role: "BUSINESS", isActive: true, businessAccessApproved: true } } } } },
    { businessProfileId: null, submittedBy: { is: { role: "BUSINESS", isActive: true, businessAccessApproved: true } } },
  ] } } },
] };
export async function lockAvailableJob(tx: Prisma.TransactionClient, id: string) {
  const ref = await tx.job.findUnique({ where: { id }, select: { requirementId: true } });
  if (ref?.requirementId) await tx.$queryRaw(Prisma.sql`SELECT id FROM "WorkforceRequirement" WHERE id = ${ref.requirementId} FOR UPDATE`);
  await tx.$queryRaw(Prisma.sql`SELECT id FROM "Job" WHERE id = ${id} FOR UPDATE`);
  const row = await tx.job.findFirst({ where: { id, AND: [availableJobWhere] }, select: { id: true } });
  if (!row) throw new HttpError(404, "This role is no longer available", { code: "JOB_NOT_FOUND" });
}
