import { Router } from "express";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { publicSubmissionRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createTechnicalInstituteApplicationController,
  getTechnicalInstituteAdminController,
  listTechnicalInstitutesAdminController,
  reviewTechnicalInstituteAdminController,
  technicalInstituteAdminSummaryController,
} from "./technical-institutes.controller.js";
import {
  createTechnicalInstituteApplicationSchema,
  reviewTechnicalInstituteApplicationSchema,
  technicalInstituteAdminListQuerySchema,
  technicalInstituteAdminParamsSchema,
} from "./technical-institutes.schema.js";

export const technicalInstitutesRouter = Router();
technicalInstitutesRouter.post(
  "/",
  publicSubmissionRateLimiter,
  validate({ body: createTechnicalInstituteApplicationSchema }),
  createTechnicalInstituteApplicationController,
);

export const adminTechnicalInstitutesRouter = Router();
adminTechnicalInstitutesRouter.get("/summary", technicalInstituteAdminSummaryController);
adminTechnicalInstitutesRouter.get(
  "/",
  validate({ query: technicalInstituteAdminListQuerySchema }),
  listTechnicalInstitutesAdminController,
);
adminTechnicalInstitutesRouter.get(
  "/:id",
  validate({ params: technicalInstituteAdminParamsSchema }),
  getTechnicalInstituteAdminController,
);
adminTechnicalInstitutesRouter.patch(
  "/:id/review",
  portalWrite,
  validate({ params: technicalInstituteAdminParamsSchema, body: reviewTechnicalInstituteApplicationSchema }),
  reviewTechnicalInstituteAdminController,
);
