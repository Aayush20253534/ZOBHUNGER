import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  listApplicationsController,
  listEnquiriesController,
  listJobsController,
  listPartnerApplicationsController,
  downloadPartnerResumeController,
  listRequirementsController,
  updateApplicationStatusController,
  updatePartnerApplicationStatusController,
  updateJobStatusController,
  updateRequirementStatusController,
} from "./admin.controller.js";
import {
  entityIdParamsSchema,
  listAdminJobsQuerySchema,
  listApplicationsQuerySchema,
  listPartnerApplicationsQuerySchema,
  listEnquiriesQuerySchema,
  listRequirementsQuerySchema,
  updateApplicationStatusSchema,
  updatePartnerApplicationStatusSchema,
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

adminRouter.get(
  "/partner-applications",
  validate({ query: listPartnerApplicationsQuerySchema }),
  listPartnerApplicationsController,
);

adminRouter.get(
  "/partner-applications/:id/resume",
  validate({ params: entityIdParamsSchema }),
  downloadPartnerResumeController,
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


adminRouter.patch(
  "/partner-applications/:id/status",
  validate({ params: entityIdParamsSchema, body: updatePartnerApplicationStatusSchema }),
  updatePartnerApplicationStatusController,
);
