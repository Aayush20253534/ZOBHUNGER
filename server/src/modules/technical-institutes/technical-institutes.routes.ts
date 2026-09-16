import express, { Router } from "express";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { authRateLimiter, publicSubmissionRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { activateTechnicalInstituteController, technicalInstitutePortalProfileController } from "./technical-institute-access.controller.js";
import { activateTechnicalInstituteSchema } from "./technical-institute-access.schema.js";
import {
  createTechnicalInstituteApplicationController,
  getTechnicalInstituteAdminController,
  listTechnicalInstitutesAdminController,
  issueTechnicalInstitutePortalAccessAdminController,
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


import {
  createTechnicalInstitutePortalStudentController,
  importTechnicalInstitutePortalStudentsController,
  submitTechnicalInstitutePortalCandidateController,
  technicalInstitutePortalApplicationsController,
  technicalInstitutePortalDashboardController,
  technicalInstitutePortalOpportunitiesController,
  technicalInstitutePortalOpportunityMatchesController,
  technicalInstitutePortalReportExportController,
  technicalInstitutePortalReportsController,
  technicalInstitutePortalStudentsController,
  updateTechnicalInstitutePortalStudentController,
  updateTechnicalInstitutePortalStudentStatusController,
} from "./technical-institute-portal.controller.js";
import {
  technicalInstitutePortalApplicationQuerySchema,
  technicalInstitutePortalMatchQuerySchema,
  technicalInstitutePortalOpportunityParamsSchema,
  technicalInstitutePortalOpportunityQuerySchema,
  technicalInstitutePortalStudentParamsSchema,
  technicalInstitutePortalSubmitSchema,
} from "./technical-institute-portal.schema.js";

export const technicalInstitutesRouter = Router();
technicalInstitutesRouter.post(
  "/activate",
  authRateLimiter,
  validate({ body: activateTechnicalInstituteSchema }),
  activateTechnicalInstituteController,
);
technicalInstitutesRouter.get(
  "/portal/profile",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  technicalInstitutePortalProfileController,
);
technicalInstitutesRouter.get(
  "/portal/dashboard",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  technicalInstitutePortalDashboardController,
);
technicalInstitutesRouter.get(
  "/portal/students",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  validate({ query: technicalStudentAdminListQuerySchema }),
  technicalInstitutePortalStudentsController,
);
technicalInstitutesRouter.post(
  "/portal/students",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  portalWrite,
  validate({ body: adminTechnicalStudentBodySchema }),
  createTechnicalInstitutePortalStudentController,
);
technicalInstitutesRouter.patch(
  "/portal/students/:studentId",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  portalWrite,
  validate({ params: technicalInstitutePortalStudentParamsSchema, body: adminTechnicalStudentBodySchema }),
  updateTechnicalInstitutePortalStudentController,
);
technicalInstitutesRouter.patch(
  "/portal/students/:studentId/status",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  portalWrite,
  validate({ params: technicalInstitutePortalStudentParamsSchema, body: technicalStudentStatusSchema }),
  updateTechnicalInstitutePortalStudentStatusController,
);
technicalInstitutesRouter.post(
  "/portal/students/import",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  portalWrite,
  validate({ query: technicalStudentImportQuerySchema }),
  express.raw({
    type: [
      "text/csv",
      "text/plain",
      "application/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    limit: "5mb",
  }),
  importTechnicalInstitutePortalStudentsController,
);
technicalInstitutesRouter.get(
  "/portal/opportunities",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  validate({ query: technicalInstitutePortalOpportunityQuerySchema }),
  technicalInstitutePortalOpportunitiesController,
);
technicalInstitutesRouter.get(
  "/portal/opportunities/:opportunityId/matches",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  validate({ params: technicalInstitutePortalOpportunityParamsSchema, query: technicalInstitutePortalMatchQuerySchema }),
  technicalInstitutePortalOpportunityMatchesController,
);
technicalInstitutesRouter.post(
  "/portal/opportunities/:opportunityId/applications",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  portalWrite,
  validate({ params: technicalInstitutePortalOpportunityParamsSchema, body: technicalInstitutePortalSubmitSchema }),
  submitTechnicalInstitutePortalCandidateController,
);
technicalInstitutesRouter.get(
  "/portal/applications",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  validate({ query: technicalInstitutePortalApplicationQuerySchema }),
  technicalInstitutePortalApplicationsController,
);
technicalInstitutesRouter.get(
  "/portal/reports",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  technicalInstitutePortalReportsController,
);
technicalInstitutesRouter.get(
  "/portal/reports/export",
  requireAuth,
  requireRole("TECHNICAL_INSTITUTE"),
  technicalInstitutePortalReportExportController,
);
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
adminTechnicalInstitutesRouter.post(
  "/:id/portal-access",
  portalWrite,
  validate({ params: technicalInstituteAdminParamsSchema }),
  issueTechnicalInstitutePortalAccessAdminController,
);
