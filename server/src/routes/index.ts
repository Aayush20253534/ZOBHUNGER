import { Router } from "express";
import { jobsRouter } from "../modules/jobs/jobs.routes.js";
import { requirementsRouter } from "../modules/requirements/requirements.routes.js";
import { enquiriesRouter } from "../modules/enquiries/enquiries.routes.js";

export const apiRouter = Router();
apiRouter.get("/health", (_req, res) => { res.json({ status: "ok", service: "zobhunger-api" }); });
apiRouter.use("/jobs", jobsRouter);
apiRouter.use("/requirements", requirementsRouter);
apiRouter.use("/enquiries", enquiriesRouter);
