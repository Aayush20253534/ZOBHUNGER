import { Router } from "express";
import { pendingImplementation } from "./enquiries.controller.js";

export const enquiriesRouter = Router();
enquiriesRouter.post("/", pendingImplementation);
