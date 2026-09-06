import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  listApplicationsController,
  listEnquiriesController,
  listJobsController,
  listRequirementsController,
  updateApplicationStatusController,
  updateJobStatusController,
  updateRequirementStatusController,
} from "./admin.controller.js";
import {
  entityIdParamsSchema,
  listAdminJobsQuerySchema,
  listApplicationsQuerySchema,
  listEnquiriesQuerySchema,
  listRequirementsQuerySchema,
  updateApplicationStatusSchema,
  updateJobStatusSchema,
  updateRequirementStatusSchema,
} from "./admin.schema.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

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

adminRouter.patch(
  "/requirements/:id/status",
  validate({ params: entityIdParamsSchema, body: updateRequirementStatusSchema }),
  updateRequirementStatusController,
);

adminRouter.patch(
  "/jobs/:id/status",
  validate({ params: entityIdParamsSchema, body: updateJobStatusSchema }),
  updateJobStatusController,
);

adminRouter.patch(
  "/applications/:id/status",
  validate({ params: entityIdParamsSchema, body: updateApplicationStatusSchema }),
  updateApplicationStatusController,
);
