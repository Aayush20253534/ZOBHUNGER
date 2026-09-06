import { Router } from "express";
import { pendingImplementation } from "./jobs.controller.js";

export const jobsRouter = Router();
jobsRouter.get("/", pendingImplementation);
jobsRouter.get("/:slug", pendingImplementation);
