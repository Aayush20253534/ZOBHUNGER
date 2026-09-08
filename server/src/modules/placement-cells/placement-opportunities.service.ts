import { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { jobCache } from "../../services/job-cache.service.js";
import { findOwnedPlacementCandidate } from "./placement-candidates.repository.js";
import { findPlacementCellPortalProfile } from "./placement-cells.repository.js";
import {
  createPlacementOpportunityApplication,
  findOpenPlacementOpportunity,
  findPlacementApplicationByJobAndCandidate,
  listPlacementOpportunities,
  listPlacementOpportunityApplications,
} from "./placement-opportunities.repository.js";
import type { PlacementApplicationQuery, PlacementOpportunityApplicationInput, PlacementOpportunityQuery } from "./placement-opportunities.schema.js";

async function approvedPlacementCellForUser(userId: string) {
  const profile = await findPlacementCellPortalProfile(userId);
  if (!profile || profile.status !== "APPROVED") {
    throw new HttpError(403, "Approved institution partner access is required", { code: "PLACEMENT_CELL_ACCESS_REQUIRED" });
  }
  return profile;
}

export async function getPlacementOpportunities(userId: string, query: PlacementOpportunityQuery) {
  await approvedPlacementCellForUser(userId);
  // Only the common job catalogue is cached, after checking current access.
  return jobCache.remember("placement-list", query, () => listPlacementOpportunities(query));
}

export async function submitPlacementCandidateToOpportunity(userId: string, jobReference: string, input: PlacementOpportunityApplicationInput) {
  const placementCell = await approvedPlacementCellForUser(userId);
  const candidate = await findOwnedPlacementCandidate(input.candidateId, placementCell.id);
  if (!candidate) throw new HttpError(404, "Candidate not found in your institution", { code: "PLACEMENT_CANDIDATE_NOT_FOUND" });

  const job = await findOpenPlacementOpportunity(jobReference);
  if (!job) throw new HttpError(404, "This opportunity is no longer available", { code: "PLACEMENT_OPPORTUNITY_NOT_FOUND" });

  if (await findPlacementApplicationByJobAndCandidate(job.id, candidate.id)) {
    throw new HttpError(409, "This candidate has already been submitted for this opportunity", { code: "PLACEMENT_APPLICATION_EXISTS" });
  }

  try {
    return await createPlacementOpportunityApplication({
      jobId: job.id,
      placementCellApplicationId: placementCell.id,
      placementCandidateId: candidate.id,
      name: candidate.fullName,
      email: candidate.email,
      phone: candidate.mobileNumber,
      city: candidate.city,
      experience: candidate.experience,
      message: input.message,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "An application already exists for this candidate email and opportunity", { code: "DUPLICATE_APPLICATION" });
    }
    throw error;
  }
}

export async function getPlacementOpportunityApplications(userId: string, query: PlacementApplicationQuery) {
  const placementCell = await approvedPlacementCellForUser(userId);
  return listPlacementOpportunityApplications(placementCell.id, query);
}
