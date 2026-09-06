import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createJobApplicationController,
  getJobController,
  listJobsController,
} from "./jobs.controller.js";
import {
  createJobApplicationSchema,
  jobApplicationParamsSchema,
  jobSlugParamsSchema,
  listJobsQuerySchema,
} from "./jobs.schema.js";

export const jobsRouter = Router();

jobsRouter.get(
  "/",
  validate({ query: listJobsQuerySchema }),
  listJobsController,
);

jobsRouter.get(
  "/:slug",
  validate({ params: jobSlugParamsSchema }),
  getJobController,
);

jobsRouter.post(
  "/:jobId/applications",
  validate({
    params: jobApplicationParamsSchema,
    body: createJobApplicationSchema,
  }),
  createJobApplicationController,
);
