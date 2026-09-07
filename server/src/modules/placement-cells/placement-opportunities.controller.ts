import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { getPlacementOpportunities, getPlacementOpportunityApplications, submitPlacementCandidateToOpportunity } from "./placement-opportunities.service.js";
import type { PlacementApplicationQuery, PlacementOpportunityApplicationInput, PlacementOpportunityQuery } from "./placement-opportunities.schema.js";

const userId = (res: any) => (res.locals.authUser as { id: string }).id;

export const listPlacementOpportunitiesController: RequestHandler = async (_req, res) => {
  const opportunities = await getPlacementOpportunities(userId(res), res.locals.validated.query as PlacementOpportunityQuery);
  res.json(apiSuccessResponse("Placement opportunities retrieved", { opportunities }));
};

export const submitPlacementOpportunityApplicationController: RequestHandler = async (_req, res) => {
  const { jobId } = res.locals.validated.params as { jobId: string };
  const application = await submitPlacementCandidateToOpportunity(userId(res), jobId, res.locals.validated.body as PlacementOpportunityApplicationInput);
  res.status(201).json(apiSuccessResponse("Candidate submitted for opportunity", { application }));
};

export const listPlacementOpportunityApplicationsController: RequestHandler = async (_req, res) => {
  const applications = await getPlacementOpportunityApplications(userId(res), res.locals.validated.query as PlacementApplicationQuery);
  res.json(apiSuccessResponse("Placement applications retrieved", { applications }));
};
