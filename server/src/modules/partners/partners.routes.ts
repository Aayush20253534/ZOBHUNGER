import express, { Router } from "express";
import { publicSubmissionRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createPartnerApplicationController,
  uploadPartnerResumeController,
} from "./partners.controller.js";
import {
  createPartnerApplicationSchema,
  partnerResumeParamsSchema,
} from "./partners.schema.js";

export const partnersRouter = Router();

partnersRouter.post(
  "/",
  publicSubmissionRateLimiter,
  validate({ body: createPartnerApplicationSchema }),
  createPartnerApplicationController,
);

partnersRouter.put(
  "/:id/resume",
  publicSubmissionRateLimiter,
  validate({ params: partnerResumeParamsSchema }),
  express.raw({
    type: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    limit: "2mb",
  }),
  uploadPartnerResumeController,
);
