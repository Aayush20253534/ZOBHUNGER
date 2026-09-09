import type { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";

// Application -> requirement -> assignment is the shared lock order for
// withdrawal, sharing, selection and assignment creation.
export async function lockApplication(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM "JobApplication" WHERE id = ${id} FOR UPDATE`;
}
export async function assertApplicationActive(tx: Prisma.TransactionClient, id: string) {
  const row = await tx.jobApplication.findUnique({ where: { id }, select: { id: true, withdrawnAt: true } });
  if (!row) throw new HttpError(404, "Application unavailable.", { code: "APPLICATION_NOT_FOUND" });
  if (row.withdrawnAt) throw new HttpError(409, "This application has been withdrawn and cannot be progressed.", { code: "APPLICATION_WITHDRAWN" });
}
export async function applicationEvent(tx: Prisma.TransactionClient, applicationId: string, event: { kind: string; stage: string; title: string; message?: string | null; interviewAt?: Date | null; interviewMode?: string | null }) {
  const application = await tx.jobApplication.findUnique({ where: { id: applicationId }, select: { workerUserId: true } });
  if (application?.workerUserId) await tx.workerApplicationEvent.create({ data: { applicationId, ...event } });
}
