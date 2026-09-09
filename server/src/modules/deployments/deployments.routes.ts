import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { Router, type RequestHandler } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { HttpError } from "../../utils/http-error.js";
import { assignmentQuerySchema, cancelAssignmentSchema, createAssignmentSchema, endAssignmentSchema, updateAssignmentSchema } from "../attendance/attendance.schema.js";
import { selectedCandidateOptions } from "../attendance/attendance.read.js";
import { cancelAssignment, createAssignment, endAssignment, updateAssignment } from "../attendance/attendance.write.js";
import { deploymentDetailSchema, deploymentParams, progressQuerySchema, rosterQuerySchema } from "./deployments.schema.js";
import { deploymentDetail, deploymentRoster, requirementDeploymentProgress } from "./deployments.read.js";

function deploymentsRouter(admin: boolean) {
  const router = Router();
  router.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  const access = [requireAuth, requireRole(admin ? "ADMIN" : "BUSINESS")];
  router.get("/", ...access, validate({ query: rosterQuerySchema }), async (_req, res) => {
    res.json(apiSuccessResponse("Team roster retrieved", await deploymentRoster({ userId: res.locals.authUser.id, admin }, res.locals.validated.query)));
  });
  router.get("/progress", ...access, validate({ query: progressQuerySchema }), async (_req, res) => {
    res.json(apiSuccessResponse("Deployment progress retrieved", await requirementDeploymentProgress({ userId: res.locals.authUser.id, admin }, res.locals.validated.query)));
  });
  router.get("/assignments/:id", ...access, validate({ params: deploymentParams, query: deploymentDetailSchema }), async (_req, res) => {
    res.json(apiSuccessResponse("Assignment retrieved", await deploymentDetail({ userId: res.locals.authUser.id, admin }, res.locals.validated.params.id, res.locals.validated.query.date, res.locals.validated.query.historyPage)));
  });
  if (admin) {
    // These routes share the same transactions, selection guards and history
    // rules as the already-delivered attendance assignment endpoints.
    router.get("/selected-candidates", ...access, validate({ query: assignmentQuerySchema }), async (_req, res) => {
      res.json(apiSuccessResponse("Selected candidates retrieved", await selectedCandidateOptions(res.locals.validated.query)));
    });
    router.post("/assignments", ...access, portalWrite, validate({ body: createAssignmentSchema }), async (_req, res) => {
      const result = await createAssignment(res.locals.authUser.id, res.locals.validated.body);
      res.status(result.created ? 201 : 200).json(apiSuccessResponse(result.created ? "Assignment created" : "Assignment already exists", result));
    });
    router.put("/assignments/:id", ...access, portalWrite, validate({ params: deploymentParams, body: updateAssignmentSchema }), async (_req, res) => {
      res.json(apiSuccessResponse("Assignment updated", await updateAssignment(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body)));
    });
    router.post("/assignments/:id/end", ...access, portalWrite, validate({ params: deploymentParams, body: endAssignmentSchema }), async (_req, res) => {
      res.json(apiSuccessResponse("Assignment ended", await endAssignment(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body)));
    });
    router.post("/assignments/:id/cancel", ...access, portalWrite, validate({ params: deploymentParams, body: cancelAssignmentSchema }), async (_req, res) => {
      res.json(apiSuccessResponse("Assignment cancelled", await cancelAssignment(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body)));
    });
  }
  return router;
}
export const businessDeploymentsRouter = deploymentsRouter(false);
export const adminDeploymentsRouter = deploymentsRouter(true);
