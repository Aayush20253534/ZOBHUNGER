import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { enquiriesRouter } from "../modules/enquiries/enquiries.routes.js";
import { requirementsRouter } from "../modules/requirements/requirements.routes.js";
import { jobsRouter } from "../modules/jobs/jobs.routes.js";
import { healthRouter } from "./health.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/jobs", jobsRouter);
apiRouter.use("/contact", enquiriesRouter);
apiRouter.use("/requirements", requirementsRouter);
