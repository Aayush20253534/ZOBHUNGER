import { Router, type Response } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import * as schema from "./worker-workflow.schema.js";
import { applicationResume, reviewWorkerApplication, submitWorkerApplication, withdrawWorkerApplication, workerApplicationDetail, workerApplications } from "./worker-applications.service.js";
import { adminAttendanceRequest, reviewWorkerAttendance, submitWorkerAttendance, workerAssignmentDay, workerAssignmentMonth, workerAssignments, workerAttendanceRequests } from "./worker-attendance.service.js";

export function sendPrivateResume(res: Response, file: { fileName: string; mimeType: string; data: Uint8Array }) {
  const name = encodeURIComponent(file.fileName).replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  res.set({ "Cache-Control": "no-store", "Content-Type": file.mimeType, "Content-Disposition": `attachment; filename="resume.pdf"; filename*=UTF-8''${name}`, "Content-Security-Policy": "sandbox", "X-Content-Type-Options": "nosniff" });
  res.send(Buffer.from(file.data));
}
// Mounted after the verified WORKER guard in workers.routes.
export const workerWorkflowRouter = Router();
workerWorkflowRouter.post("/jobs/:jobId/applications", portalWrite, validate({ params: schema.workflowJobParams, body: schema.applyForJobSchema }), async (_req, res) => {
  const result = await submitWorkerApplication(res.locals.authUser.id, res.locals.validated.params.jobId, res.locals.validated.body);
  res.status(result.created ? 201 : 200).json(apiSuccessResponse("Application submitted", result));
});
workerWorkflowRouter.get("/applications", validate({ query: schema.workerApplicationsQuery }), async (_req, res) => res.json(apiSuccessResponse("Your applications", await workerApplications(res.locals.authUser.id, res.locals.validated.query))));
workerWorkflowRouter.get("/applications/:id", validate({ params: schema.workflowParams, query: schema.applicationHistoryQuery }), async (_req, res) => res.json(apiSuccessResponse("Application history", await workerApplicationDetail(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.query.historyPage))));
workerWorkflowRouter.get("/applications/:id/resume", validate({ params: schema.workflowParams }), async (_req, res) => sendPrivateResume(res, await applicationResume(res.locals.authUser.id, res.locals.validated.params.id)));
workerWorkflowRouter.post("/applications/:id/withdraw", portalWrite, validate({ params: schema.workflowParams, body: schema.withdrawApplicationSchema }), async (_req, res) => res.json(apiSuccessResponse("Application withdrawn", await withdrawWorkerApplication(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
workerWorkflowRouter.get("/assignments", validate({ query: schema.assignmentQuery }), async (_req, res) => res.json(apiSuccessResponse("Confirmed assignments", await workerAssignments(res.locals.authUser.id, res.locals.validated.query))));
workerWorkflowRouter.get("/assignments/:id", validate({ params: schema.workflowParams, query: schema.workerAssignmentQuery }), async (_req, res) => res.json(apiSuccessResponse("Assignment and attendance", await workerAssignmentDay(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.query.date, res.locals.validated.query.historyPage))));
workerWorkflowRouter.get("/assignments/:id/calendar", validate({ params: schema.workflowParams, query: schema.attendanceMonthQuery }), async (_req, res) => res.json(apiSuccessResponse("Monthly attendance", await workerAssignmentMonth(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.query.month))));
workerWorkflowRouter.post("/assignments/:id/attendance", portalWrite, validate({ params: schema.workflowParams, body: schema.workerAttendanceSchema }), async (_req, res) => {
  const result = await submitWorkerAttendance(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body);
  res.status(result.created ? 201 : 200).json(apiSuccessResponse("Attendance sent for operations review", result));
});
workerWorkflowRouter.get("/attendance", validate({ query: schema.workerAttendanceQuery }), async (_req, res) => res.json(apiSuccessResponse("Attendance requests", await workerAttendanceRequests(res.locals.authUser.id, res.locals.validated.query))));

// Mounted after ADMIN authentication. Writes require the portal request header.
export const adminWorkerWorkflowRouter = Router();
adminWorkerWorkflowRouter.get("/worker-applications", validate({ query: schema.workerApplicationsQuery }), async (_req, res) => res.json(apiSuccessResponse("Worker applications", await workerApplications(res.locals.authUser.id, res.locals.validated.query, true))));
adminWorkerWorkflowRouter.get("/worker-applications/:id", validate({ params: schema.workflowParams, query: schema.applicationHistoryQuery }), async (_req, res) => res.json(apiSuccessResponse("Submitted worker profile", await workerApplicationDetail(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.query.historyPage, true))));
adminWorkerWorkflowRouter.get("/worker-applications/:id/resume", validate({ params: schema.workflowParams }), async (_req, res) => sendPrivateResume(res, await applicationResume(res.locals.authUser.id, res.locals.validated.params.id, true)));
adminWorkerWorkflowRouter.post("/worker-applications/:id/review", portalWrite, validate({ params: schema.workflowParams, body: schema.adminApplicationReviewSchema }), async (_req, res) => res.json(apiSuccessResponse("Application reviewed", await reviewWorkerApplication(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
adminWorkerWorkflowRouter.get("/worker-attendance", validate({ query: schema.workerAttendanceQuery }), async (_req, res) => res.json(apiSuccessResponse("Worker attendance queue", await workerAttendanceRequests(res.locals.authUser.id, res.locals.validated.query, true))));
adminWorkerWorkflowRouter.get("/worker-attendance/:id", validate({ params: schema.workflowParams }), async (_req, res) => res.json(apiSuccessResponse("Attendance review", await adminAttendanceRequest(res.locals.validated.params.id))));
adminWorkerWorkflowRouter.post("/worker-attendance/:id/review", portalWrite, validate({ params: schema.workflowParams, body: schema.reviewWorkerAttendanceSchema }), async (_req, res) => res.json(apiSuccessResponse("Attendance decision saved", await reviewWorkerAttendance(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
