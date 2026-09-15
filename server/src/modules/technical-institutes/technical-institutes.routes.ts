import { Router } from "express";
import { publicSubmissionRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createTechnicalInstituteApplicationController } from "./technical-institutes.controller.js";
import { createTechnicalInstituteApplicationSchema } from "./technical-institutes.schema.js";

export const technicalInstitutesRouter = Router();

technicalInstitutesRouter.post(
  "/",
  publicSubmissionRateLimiter,
  validate({ body: createTechnicalInstituteApplicationSchema }),
  createTechnicalInstituteApplicationController,
);
