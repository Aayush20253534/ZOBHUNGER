import { Router } from "express";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { addIntakeNoteController, exportIntakeController, getIntakeController, listIntakeController, updateIntakeController } from "./intake.controller.js";
import { addIntakeNoteSchema, intakeCaseParamsSchema, intakeListQuerySchema, updateIntakeCaseSchema } from "./intake.schema.js";

/** Mounted after ADMIN auth, MFA and the department-aware admin permission guard. */
export const adminIntakeRouter = Router();
adminIntakeRouter.get("/", validate({ query: intakeListQuerySchema }), listIntakeController);
adminIntakeRouter.get("/export.csv", validate({ query: intakeListQuerySchema }), exportIntakeController);
adminIntakeRouter.get("/:id", validate({ params: intakeCaseParamsSchema }), getIntakeController);
adminIntakeRouter.patch("/:id", portalWrite, validate({ params: intakeCaseParamsSchema, body: updateIntakeCaseSchema }), updateIntakeController);
adminIntakeRouter.post("/:id/notes", portalWrite, validate({ params: intakeCaseParamsSchema, body: addIntakeNoteSchema }), addIntakeNoteController);
