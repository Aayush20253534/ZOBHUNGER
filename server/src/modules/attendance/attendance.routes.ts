import { Router, type RequestHandler } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { HttpError } from "../../utils/http-error.js";
import * as schema from "./attendance.schema.js";
import { assignmentMonth, attendanceDay, attendanceOverview, listAssignments, listCorrections, selectedCandidateOptions } from "./attendance.read.js";
import { cancelAssignment, createAssignment, endAssignment, recordAttendance, requestCorrection, resolveCorrection, updateAssignment } from "./attendance.write.js";

const portalWrite: RequestHandler = (req, _res, next) => {
  if (req.get("X-Requested-With") !== "XMLHttpRequest") return next(new HttpError(403, "Submit this change from the portal.", { code: "PORTAL_REQUEST_REQUIRED" }));
  next();
};
function attendanceRouter(admin: boolean) {
  const router = Router();
  router.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  // Protect each real endpoint; unknown URLs continue to return 404.
  const access = [requireAuth, requireRole(admin ? "ADMIN" : "BUSINESS")];
  router.get("/", ...access, validate({ query: schema.dailyQuerySchema }), async (_req, res) => {
    res.json(apiSuccessResponse("Attendance retrieved", await attendanceOverview({ userId: res.locals.authUser.id, admin }, res.locals.validated.query)));
  });
  router.get("/corrections", ...access, validate({ query: schema.correctionListSchema }), async (_req, res) => {
    res.json(apiSuccessResponse("Corrections retrieved", await listCorrections({ userId: res.locals.authUser.id, admin }, res.locals.validated.query)));
  });
  router.get("/assignments/:id", ...access, validate({ params: schema.attendanceParams, query: schema.assignmentMonthSchema }), async (_req, res) => {
    res.json(apiSuccessResponse("Assignment calendar retrieved", await assignmentMonth({ userId: res.locals.authUser.id, admin }, res.locals.validated.params.id, res.locals.validated.query.month)));
  });
  router.get("/assignments/:id/day", ...access, validate({ params: schema.attendanceParams, query: schema.attendanceDaySchema }), async (_req, res) => {
    res.json(apiSuccessResponse("Attendance history retrieved", await attendanceDay({ userId: res.locals.authUser.id, admin }, res.locals.validated.params.id, res.locals.validated.query.date, res.locals.validated.query.historyPage)));
  });
  if (!admin) {
    router.post("/assignments/:id/corrections", ...access, portalWrite, validate({ params: schema.attendanceParams, body: schema.requestCorrectionSchema }), async (_req, res) => {
      const result = await requestCorrection({ userId: res.locals.authUser.id, admin: false }, res.locals.validated.params.id, res.locals.validated.body);
      res.status(result.created ? 201 : 200).json(apiSuccessResponse("Correction requested", result));
    });
  } else {
    router.get("/assignments", ...access, validate({ query: schema.assignmentQuerySchema }), async (_req, res) => {
      res.json(apiSuccessResponse("Assignments retrieved", await listAssignments(res.locals.validated.query)));
    });
    router.get("/selected-candidates", ...access, validate({ query: schema.assignmentQuerySchema }), async (_req, res) => {
      res.json(apiSuccessResponse("Selected candidates retrieved", await selectedCandidateOptions(res.locals.validated.query)));
    });
    router.post("/assignments", ...access, portalWrite, validate({ body: schema.createAssignmentSchema }), async (_req, res) => {
      const result = await createAssignment(res.locals.authUser.id, res.locals.validated.body);
      res.status(result.created ? 201 : 200).json(apiSuccessResponse(result.created ? "Assignment created" : "Assignment already exists", result));
    });
    router.put("/assignments/:id", ...access, portalWrite, validate({ params: schema.attendanceParams, body: schema.updateAssignmentSchema }), async (_req, res) => {
      res.json(apiSuccessResponse("Assignment updated", await updateAssignment(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body)));
    });
    router.post("/assignments/:id/end", ...access, portalWrite, validate({ params: schema.attendanceParams, body: schema.endAssignmentSchema }), async (_req, res) => {
      res.json(apiSuccessResponse("Assignment ended", await endAssignment(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body)));
    });
    router.post("/assignments/:id/cancel", ...access, portalWrite, validate({ params: schema.attendanceParams, body: schema.cancelAssignmentSchema }), async (_req, res) => {
      res.json(apiSuccessResponse("Assignment cancelled", await cancelAssignment(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body)));
    });
    router.put("/assignments/:id/records", ...access, portalWrite, validate({ params: schema.attendanceParams, body: schema.recordAttendanceSchema }), async (_req, res) => {
      res.json(apiSuccessResponse("Attendance saved", await recordAttendance(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body)));
    });
    router.post("/corrections/:id/resolve", ...access, portalWrite, validate({ params: schema.attendanceParams, body: schema.resolveCorrectionSchema }), async (_req, res) => {
      res.json(apiSuccessResponse("Correction reviewed", await resolveCorrection(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body)));
    });
  }
  return router;
}
export const businessAttendanceRouter = attendanceRouter(false);
export const adminAttendanceRouter = attendanceRouter(true);
