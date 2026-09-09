import express, { Router } from "express";
import { publicSubmissionRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { entityIdParamsSchema } from "../admin/admin.schema.js";
import { careerSubmissionSchema, careerQuerySchema, careerReviewSchema } from "./careers.schema.js";
import { getCareerApplication, getCareerResume, listCareerApplications, reviewCareerApplication, submitCareerProfile, uploadCareerResume } from "./careers.service.js";

export const careersRouter = Router();
careersRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
careersRouter.post("/", publicSubmissionRateLimiter, validate({ body: careerSubmissionSchema }), async (_req, res) => {
  res.status(201).json(apiSuccessResponse("Your profile is saved for HR review", await submitCareerProfile(res.locals.validated.body)));
});
careersRouter.put("/:id/resume", publicSubmissionRateLimiter, validate({ params: entityIdParamsSchema }), express.raw({ type: "application/pdf", limit: "2mb" }), async (req, res) => {
  res.json(apiSuccessResponse("Resume attached", await uploadCareerResume(res.locals.validated.params.id, req.get("X-Upload-Token"), req.body, req.get("Content-Type"), req.get("X-File-Name"))));
});

// These routes are mounted only inside the authenticated ADMIN router.
export const adminCareersRouter = Router();
adminCareersRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
adminCareersRouter.get("/", validate({ query: careerQuerySchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Career applications", await listCareerApplications(res.locals.validated.query)));
});
adminCareersRouter.get("/:id", validate({ params: entityIdParamsSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Career profile", await getCareerApplication(res.locals.validated.params.id)));
});
adminCareersRouter.post("/:id/review", portalWrite, validate({ params: entityIdParamsSchema, body: careerReviewSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("HR review saved", await reviewCareerApplication(res.locals.validated.params.id, res.locals.authUser.id, res.locals.validated.body)));
});
adminCareersRouter.get("/:id/resume", validate({ params: entityIdParamsSchema }), async (_req, res) => {
  const file = await getCareerResume(res.locals.validated.params.id, res.locals.authUser.id);
  res.set({ "Content-Type": file.resumeMimeType, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.resumeFileName)}`, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox", "Cache-Control": "private, no-store" });
  res.send(file.bytes);
});
