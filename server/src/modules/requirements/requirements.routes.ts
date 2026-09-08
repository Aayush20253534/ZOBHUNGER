import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { publicSubmissionRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { optionalAuth } from "../../middlewares/auth.middleware.js";
import { createRequirementController } from "./requirements.controller.js";
import { createRequirementSchema } from "./requirements.schema.js";

export const requirementsRouter = Router();
requirementsRouter.post("/", publicSubmissionRateLimiter, optionalAuth, validate({ body: createRequirementSchema }), createRequirementController);
