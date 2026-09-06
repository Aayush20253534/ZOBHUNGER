import { Router } from "express";
import { pendingImplementation } from "./requirements.controller.js";

export const requirementsRouter = Router();
requirementsRouter.post("/", pendingImplementation);
