import { adminIntakeRouter } from "../intake/intake.routes.js";
import { adminAccessRouter } from "../admin-access/admin-access.routes.js";
import { adminEmployeeJoiningRouter } from "../employee-joining/employee-joining.routes.js";
import { adminWorkerWorkflowRouter } from "../workers/worker-workflow.routes.js";
import { adminVendorsRouter } from "../vendors/vendors.routes.js";
import { adminPartnerAccessRouter } from "../partner-access/partner-access.routes.js";
import { adminCareersRouter } from "../careers/careers.routes.js";
import { adminCandidatesRouter } from "../candidates/candidates.routes.js";
import { adminPhase2Router } from "../phase2/phase2.routes.js";
import { adminAttendanceRouter } from "../attendance/attendance.routes.js";
import { adminDeploymentsRouter } from "../deployments/deployments.routes.js";
import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { requireAdminMfa } from "../../middlewares/admin-mfa.middleware.js";
import { requireMappedAdminPermission } from "../../middlewares/admin-permission.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  adminOverviewController,
  listApplicationsController,
  listEnquiriesController,
  listJobsController,
  listPartnerApplicationsController,
  listPlacementCellApplicationsController,
  downloadPartnerResumeController,
  listRequirementsController,
  updateApplicationStatusController,
  updatePartnerApplicationStatusController,
  updatePlacementCellApplicationStatusController,
  updateJobStatusController,
  updateRequirementStatusController,
} from "./admin.controller.js";
import {
  entityIdParamsSchema,
  listAdminJobsQuerySchema,
  listApplicationsQuerySchema,
  listPartnerApplicationsQuerySchema,
  listPlacementCellApplicationsQuerySchema,
  listEnquiriesQuerySchema,
  listRequirementsQuerySchema,
  updateApplicationStatusSchema,
  updatePartnerApplicationStatusSchema,
  updatePlacementCellApplicationStatusSchema,
  updateJobStatusSchema,
  updateRequirementStatusSchema,
} from "./admin.schema.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"), requireAdminMfa);
adminRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
adminRouter.use(requireMappedAdminPermission);
adminRouter.use("/access", adminAccessRouter);
adminRouter.use("/intake", adminIntakeRouter);
adminRouter.use("/vendors", adminVendorsRouter);
adminRouter.use("/partners", adminPartnerAccessRouter);
adminRouter.use("/careers", adminCareersRouter);
adminRouter.use("/employee-joining", adminEmployeeJoiningRouter);
adminRouter.use(adminPhase2Router);
adminRouter.use(adminWorkerWorkflowRouter);
adminRouter.use("/attendance", adminAttendanceRouter);
adminRouter.use("/deployments", adminDeploymentsRouter);
adminRouter.use("/candidate-management", adminCandidatesRouter);

adminRouter.get("/overview", adminOverviewController);

adminRouter.get(
  "/enquiries",
  validate({ query: listEnquiriesQuerySchema }),
  listEnquiriesController,
);

adminRouter.get(
  "/requirements",
  validate({ query: listRequirementsQuerySchema }),
  listRequirementsController,
);

adminRouter.get(
  "/jobs",
  validate({ query: listAdminJobsQuerySchema }),
  listJobsController,
);

adminRouter.get(
  "/applications",
  validate({ query: listApplicationsQuerySchema }),
  listApplicationsController,
);

adminRouter.get(
  "/partner-applications",
  validate({ query: listPartnerApplicationsQuerySchema }),
  listPartnerApplicationsController,
);

adminRouter.get(
  "/placement-cell-applications",
  validate({ query: listPlacementCellApplicationsQuerySchema }),
  listPlacementCellApplicationsController,
);

adminRouter.get(
  "/partner-applications/:id/resume",
  validate({ params: entityIdParamsSchema }),
  downloadPartnerResumeController,
);

adminRouter.patch(
  "/requirements/:id/status",
  portalWrite,
  validate({ params: entityIdParamsSchema, body: updateRequirementStatusSchema }),
  updateRequirementStatusController,
);

adminRouter.patch(
  "/jobs/:id/status",
  portalWrite,
  validate({ params: entityIdParamsSchema, body: updateJobStatusSchema }),
  updateJobStatusController,
);

adminRouter.patch(
  "/applications/:id/status",
  portalWrite,
  validate({ params: entityIdParamsSchema, body: updateApplicationStatusSchema }),
  updateApplicationStatusController,
);


adminRouter.patch(
  "/partner-applications/:id/status",
  portalWrite,
  validate({ params: entityIdParamsSchema, body: updatePartnerApplicationStatusSchema }),
  updatePartnerApplicationStatusController,
);

adminRouter.patch(
  "/placement-cell-applications/:id/status",
  portalWrite,
  validate({ params: entityIdParamsSchema, body: updatePlacementCellApplicationStatusSchema }),
  updatePlacementCellApplicationStatusController,
);
