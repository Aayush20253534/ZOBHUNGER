import express, { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { HttpError } from "../../utils/http-error.js";
import { deleteWorkerResume, getWorkerProfile, getWorkerResume, putWorkerResume, saveWorkerProfile, workerCompletion } from "./worker-profile.service.js";
import { removeWorkerJob, saveWorkerJob, workerJobDetail, workerJobFacets, workerJobs, workerSavedJobs } from "./worker-jobs.service.js";
import { resumeHeadersSchema, resumeRevisionSchema, savedJobsQuerySchema, workerJobIdSchema, workerJobsQuerySchema, workerJobSlugSchema, workerProfileSchema } from "./workers.schema.js";

export const workersRouter = Router();
workersRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
workersRouter.use(requireAuth, requireRole("WORKER"));
workersRouter.get("/workspace", async (_req, res) => {
  const user = res.locals.authUser;
  res.json(apiSuccessResponse("Worker workspace", { user, ...(user.emailVerifiedAt ? await getWorkerProfile(user.id) : { profile: null, completion: workerCompletion(null) }) }));
});
workersRouter.use((_req, res, next) => {
  if (!res.locals.authUser.emailVerifiedAt) return next(new HttpError(403, "Verify your email to open your worker profile and saved jobs", { code: "EMAIL_VERIFICATION_REQUIRED" }));
  next();
});
workersRouter.get("/profile", async (_req, res) => res.json(apiSuccessResponse("Worker profile", await getWorkerProfile(res.locals.authUser.id))));
workersRouter.put("/profile", portalWrite, validate({ body: workerProfileSchema }), async (_req, res) => res.json(apiSuccessResponse("Profile saved", await saveWorkerProfile(res.locals.authUser.id, res.locals.validated.body))));
workersRouter.put("/profile/resume", portalWrite, express.raw({ type: "application/pdf", limit: "2mb" }), async (req, res) => {
  const parsed = resumeHeadersSchema.safeParse({ revision: req.get("X-Resume-Revision") });
  if (!parsed.success) throw new HttpError(400, "Refresh your profile before uploading a resume", { code: "RESUME_REVISION_REQUIRED" });
  res.json(apiSuccessResponse("Resume saved", await putWorkerResume(res.locals.authUser.id, parsed.data.revision, req.body, req.get("Content-Type"), req.get("X-File-Name"))));
});
workersRouter.delete("/profile/resume", portalWrite, validate({ body: resumeRevisionSchema }), async (_req, res) => res.json(apiSuccessResponse("Resume removed", await deleteWorkerResume(res.locals.authUser.id, res.locals.validated.body.revision))));
workersRouter.get("/profile/resume", async (_req, res) => {
  const file = await getWorkerResume(res.locals.authUser.id);
  const name = encodeURIComponent(file.fileName).replace(/['()*]/g, value => `%${value.charCodeAt(0).toString(16).toUpperCase()}`);
  res.set({ "Content-Type": file.mimeType, "Content-Disposition": `attachment; filename="resume.pdf"; filename*=UTF-8''${name}`, "Content-Security-Policy": "sandbox", "X-Content-Type-Options": "nosniff" });
  res.send(Buffer.from(file.data));
});
workersRouter.get("/jobs", validate({ query: workerJobsQuerySchema }), async (_req, res) => res.json(apiSuccessResponse("Worker opportunities", await workerJobs(res.locals.authUser.id, res.locals.validated.query))));
workersRouter.get("/jobs/facets", async (_req, res) => res.json(apiSuccessResponse("Job filters", await workerJobFacets())));
workersRouter.get("/jobs/:slug", validate({ params: workerJobSlugSchema }), async (_req, res) => res.json(apiSuccessResponse("Job details", await workerJobDetail(res.locals.authUser.id, res.locals.validated.params.slug))));
workersRouter.get("/saved-jobs", validate({ query: savedJobsQuerySchema }), async (_req, res) => res.json(apiSuccessResponse("Saved jobs", await workerSavedJobs(res.locals.authUser.id, res.locals.validated.query.page))));
workersRouter.put("/saved-jobs/:jobId", portalWrite, validate({ params: workerJobIdSchema }), async (_req, res) => res.json(apiSuccessResponse("Job saved", await saveWorkerJob(res.locals.authUser.id, res.locals.validated.params.jobId))));
workersRouter.delete("/saved-jobs/:jobId", portalWrite, validate({ params: workerJobIdSchema }), async (_req, res) => res.json(apiSuccessResponse("Job removed", await removeWorkerJob(res.locals.authUser.id, res.locals.validated.params.jobId))));
