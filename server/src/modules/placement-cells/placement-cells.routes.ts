import { Router } from "express";
import { publicSubmissionRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createPlacementCellApplicationController } from "./placement-cells.controller.js";
import { createPlacementCellApplicationSchema } from "./placement-cells.schema.js";

export const placementCellsRouter = Router();
placementCellsRouter.post(
  "/",
  publicSubmissionRateLimiter,
  validate({ body: createPlacementCellApplicationSchema }),
  createPlacementCellApplicationController,
);
