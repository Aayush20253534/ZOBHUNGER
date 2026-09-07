import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { publicSubmissionRateLimiter, authRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { activatePlacementCellController, placementCellPortalProfileController } from "./placement-cell-access.controller.js";
import { activatePlacementCellSchema } from "./placement-cell-access.schema.js";
import { createPlacementCellApplicationController } from "./placement-cells.controller.js";
import { createPlacementCellApplicationSchema } from "./placement-cells.schema.js";
import { createPlacementCandidateController, deletePlacementCandidateController, listPlacementCandidatesController, updatePlacementCandidateController } from "./placement-candidates.controller.js";
import { placementCandidateBodySchema, placementCandidateParamsSchema, placementCandidateQuerySchema } from "./placement-candidates.schema.js";
import { listPlacementOpportunitiesController, listPlacementOpportunityApplicationsController, submitPlacementOpportunityApplicationController } from "./placement-opportunities.controller.js";
import { placementApplicationQuerySchema, placementOpportunityApplicationSchema, placementOpportunityParamsSchema, placementOpportunityQuerySchema } from "./placement-opportunities.schema.js";

export const placementCellsRouter = Router();
placementCellsRouter.post("/", publicSubmissionRateLimiter, validate({ body: createPlacementCellApplicationSchema }), createPlacementCellApplicationController);
placementCellsRouter.post("/activate", authRateLimiter, validate({ body: activatePlacementCellSchema }), activatePlacementCellController);
placementCellsRouter.get("/portal/profile", requireAuth, requireRole("PLACEMENT_CELL"), placementCellPortalProfileController);

placementCellsRouter.get("/portal/candidates", requireAuth, requireRole("PLACEMENT_CELL"), validate({ query: placementCandidateQuerySchema }), listPlacementCandidatesController);
placementCellsRouter.post("/portal/candidates", requireAuth, requireRole("PLACEMENT_CELL"), validate({ body: placementCandidateBodySchema }), createPlacementCandidateController);
placementCellsRouter.put("/portal/candidates/:id", requireAuth, requireRole("PLACEMENT_CELL"), validate({ params: placementCandidateParamsSchema, body: placementCandidateBodySchema }), updatePlacementCandidateController);
placementCellsRouter.delete("/portal/candidates/:id", requireAuth, requireRole("PLACEMENT_CELL"), validate({ params: placementCandidateParamsSchema }), deletePlacementCandidateController);

placementCellsRouter.get("/portal/opportunities", requireAuth, requireRole("PLACEMENT_CELL"), validate({ query: placementOpportunityQuerySchema }), listPlacementOpportunitiesController);
placementCellsRouter.post("/portal/opportunities/:jobId/applications", requireAuth, requireRole("PLACEMENT_CELL"), validate({ params: placementOpportunityParamsSchema, body: placementOpportunityApplicationSchema }), submitPlacementOpportunityApplicationController);
placementCellsRouter.get("/portal/applications", requireAuth, requireRole("PLACEMENT_CELL"), validate({ query: placementApplicationQuerySchema }), listPlacementOpportunityApplicationsController);
