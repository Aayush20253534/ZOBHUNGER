import type { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { dateValue, istToday } from "./attendance.utils.js";

// Call while holding the requirement row lock, also used by assignment writes.
export async function guardAssignedCandidate(tx: Prisma.TransactionClient, candidateId: string) {
  if (await tx.workforceAssignment.count({ where: { candidateId, cancelledAt: null, endDate: { gte: dateValue(istToday()) } } })) {
    throw new HttpError(409, "This person has a current or upcoming assignment. End the assignment before changing the selection or revoking access.", { code: "CANDIDATE_ASSIGNED" });
  }
}
export async function guardRequirementAssignments(tx: Prisma.TransactionClient, requirementId: string) {
  if (await tx.workforceAssignment.count({ where: { requirementId, cancelledAt: null, endDate: { gt: dateValue(istToday()) } } })) {
    throw new HttpError(409, "This requirement has assignments continuing after today. Ask the operations team to end them before closing the requirement.", { code: "REQUIREMENT_HAS_ASSIGNMENTS" });
  }
}
