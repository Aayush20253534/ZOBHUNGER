import express, { Router } from "express";
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
import {
  createTechnicalStudentAdminController,
  getTechnicalStudentAdminController,
  importTechnicalStudentsAdminController,
  listTechnicalStudentsAdminController,
  publicTechnicalInstitutePartnerController,
  registerTechnicalStudentController,
  technicalStudentSummaryAdminController,
  updateTechnicalStudentAdminController,
  updateTechnicalStudentStatusAdminController,
} from "./technical-students.controller.js";
import {
  adminTechnicalStudentBodySchema,
  publicTechnicalStudentRegistrationSchema,
  technicalStudentAdminInstituteParamsSchema,
  technicalStudentAdminListQuerySchema,
  technicalStudentAdminParamsSchema,
  technicalStudentImportQuerySchema,
  technicalStudentPartnerParamsSchema,
  technicalStudentStatusSchema,
} from "./technical-students.schema.js";

export const technicalInstitutesRouter = Router();
technicalInstitutesRouter.get(
  "/partners/:partnershipCode",
  publicSubmissionRateLimiter,
  validate({ params: technicalStudentPartnerParamsSchema }),
  publicTechnicalInstitutePartnerController,
);
technicalInstitutesRouter.post(
  "/students",
  publicSubmissionRateLimiter,
  validate({ body: publicTechnicalStudentRegistrationSchema }),
  registerTechnicalStudentController,
);
technicalInstitutesRouter.post(
  "/",
  publicSubmissionRateLimiter,
  validate({ body: createTechnicalInstituteApplicationSchema }),
  createTechnicalInstituteApplicationController,
);

export const adminTechnicalInstitutesRouter = Router();
adminTechnicalInstitutesRouter.get("/summary", technicalInstituteAdminSummaryController);
adminTechnicalInstitutesRouter.get(
  "/:id/students",
  validate({ params: technicalStudentAdminInstituteParamsSchema, query: technicalStudentAdminListQuerySchema }),
  listTechnicalStudentsAdminController,
);
adminTechnicalInstitutesRouter.get(
  "/:id/students/summary",
  validate({ params: technicalStudentAdminInstituteParamsSchema }),
  technicalStudentSummaryAdminController,
);
adminTechnicalInstitutesRouter.get(
  "/:id/students/:studentId",
  validate({ params: technicalStudentAdminParamsSchema }),
  getTechnicalStudentAdminController,
);
adminTechnicalInstitutesRouter.post(
  "/:id/students",
  portalWrite,
  validate({ params: technicalStudentAdminInstituteParamsSchema, body: adminTechnicalStudentBodySchema }),
  createTechnicalStudentAdminController,
);
adminTechnicalInstitutesRouter.patch(
  "/:id/students/:studentId",
  portalWrite,
  validate({ params: technicalStudentAdminParamsSchema, body: adminTechnicalStudentBodySchema }),
  updateTechnicalStudentAdminController,
);
adminTechnicalInstitutesRouter.patch(
  "/:id/students/:studentId/status",
  portalWrite,
  validate({ params: technicalStudentAdminParamsSchema, body: technicalStudentStatusSchema }),
  updateTechnicalStudentStatusAdminController,
);
adminTechnicalInstitutesRouter.post(
  "/:id/students/import",
  portalWrite,
  validate({ params: technicalStudentAdminInstituteParamsSchema, query: technicalStudentImportQuerySchema }),
  express.raw({
    type: [
      "text/csv",
      "text/plain",
      "application/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    limit: "5mb",
  }),
  importTechnicalStudentsAdminController,
);
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
