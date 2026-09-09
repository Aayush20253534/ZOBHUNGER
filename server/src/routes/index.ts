import { vendorsRouter } from "../modules/vendors/vendors.routes.js";
import { Router } from "express";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { businessRouter } from "../modules/business/business.routes.js";
import { articlesRouter } from "../modules/articles/articles.routes.js";
import { enquiriesRouter } from "../modules/enquiries/enquiries.routes.js";
import { requirementsRouter } from "../modules/requirements/requirements.routes.js";
import { jobsRouter } from "../modules/jobs/jobs.routes.js";
import { partnersRouter } from "../modules/partners/partners.routes.js";
import { placementCellsRouter } from "../modules/placement-cells/placement-cells.routes.js";
import { healthRouter } from "./health.routes.js";

import { careersRouter } from "../modules/careers/careers.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/business", businessRouter);
apiRouter.use("/articles", articlesRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/jobs", jobsRouter);
apiRouter.use("/contact", enquiriesRouter);
apiRouter.use("/requirements", requirementsRouter);
apiRouter.use("/partner-applications", partnersRouter);
apiRouter.use("/placement-cell-applications", placementCellsRouter);

apiRouter.use("/career-applications", careersRouter);

apiRouter.use("/vendor-applications", vendorsRouter);
