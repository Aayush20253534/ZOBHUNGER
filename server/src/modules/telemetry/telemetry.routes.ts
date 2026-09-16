import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { telemetryRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { reportClientErrorController } from "./telemetry.controller.js";
import { clientErrorSchema } from "./telemetry.schema.js";

export const telemetryRouter = Router();
telemetryRouter.post("/client-error", telemetryRateLimiter, validate({ body: clientErrorSchema }), reportClientErrorController);
