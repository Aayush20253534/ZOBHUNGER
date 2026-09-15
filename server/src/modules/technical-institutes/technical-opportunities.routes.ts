import { Router } from "express";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createTechnicalOpportunityAdminController,
  getTechnicalOpportunityAdminController,
  listTechnicalOpportunitiesAdminController,
  submitTechnicalOpportunityCandidateAdminController,
  technicalOpportunityMatchesAdminController,
  technicalOpportunitySummaryAdminController,
  updateTechnicalOpportunityAdminController,
  updateTechnicalOpportunityApplicationStatusAdminController,
} from "./technical-opportunities.controller.js";
import {
  technicalOpportunityApplicationParamsSchema,
  technicalOpportunityApplicationStatusSchema,
  technicalOpportunityBodySchema,
  technicalOpportunityListQuerySchema,
  technicalOpportunityMatchQuerySchema,
  technicalOpportunityParamsSchema,
  technicalOpportunitySubmitSchema,
} from "./technical-opportunities.schema.js";

export const adminTechnicalOpportunitiesRouter = Router();

adminTechnicalOpportunitiesRouter.get("/summary", technicalOpportunitySummaryAdminController);
adminTechnicalOpportunitiesRouter.get("/", validate({ query: technicalOpportunityListQuerySchema }), listTechnicalOpportunitiesAdminController);
adminTechnicalOpportunitiesRouter.post("/", portalWrite, validate({ body: technicalOpportunityBodySchema }), createTechnicalOpportunityAdminController);
adminTechnicalOpportunitiesRouter.get("/:id", validate({ params: technicalOpportunityParamsSchema }), getTechnicalOpportunityAdminController);
adminTechnicalOpportunitiesRouter.patch("/:id", portalWrite, validate({ params: technicalOpportunityParamsSchema, body: technicalOpportunityBodySchema }), updateTechnicalOpportunityAdminController);
adminTechnicalOpportunitiesRouter.get("/:id/matches", validate({ params: technicalOpportunityParamsSchema, query: technicalOpportunityMatchQuerySchema }), technicalOpportunityMatchesAdminController);
adminTechnicalOpportunitiesRouter.post("/:id/applications", portalWrite, validate({ params: technicalOpportunityParamsSchema, body: technicalOpportunitySubmitSchema }), submitTechnicalOpportunityCandidateAdminController);
adminTechnicalOpportunitiesRouter.patch("/:id/applications/:applicationId/status", portalWrite, validate({ params: technicalOpportunityApplicationParamsSchema, body: technicalOpportunityApplicationStatusSchema }), updateTechnicalOpportunityApplicationStatusAdminController);
