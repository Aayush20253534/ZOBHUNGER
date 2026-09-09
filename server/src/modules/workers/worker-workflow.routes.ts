import { Router, type Response } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import * as schema from "./worker-workflow.schema.js";
import * as earningsSchema from "./worker-earnings.schema.js";
import { applicationResume, reviewWorkerApplication, submitWorkerApplication, withdrawWorkerApplication, workerApplicationDetail, workerApplications } from "./worker-applications.service.js";
import { adminAttendanceRequest, reviewWorkerAttendance, submitWorkerAttendance, workerAssignmentDay, workerAssignmentMonth, workerAssignments, workerAttendanceRequests } from "./worker-attendance.service.js";
import { addEarningsAdjustment, adminEarnings, adminEarningsDetail, approveEarningsStatement, createEarningsStatement, earningsAssignmentContext, earningsAssignmentOptions, recordEarningsPayment, updateEarningsDraft, voidEarningsPayment, workerEarnings, workerEarningsDetail, workerStatementCsv } from "./worker-earnings.service.js";
import { workerDashboard } from "./worker-dashboard.service.js";

export function sendPrivateResume(res: Response, file: { fileName: string; mimeType: string; bytes: Buffer }) {
  const name = encodeURIComponent(file.fileName).replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  res.set({ "Cache-Control": "private, no-store", "Content-Type": file.mimeType, "Content-Disposition": `attachment; filename="resume.pdf"; filename*=UTF-8''${name}`, "Content-Security-Policy": "sandbox", "X-Content-Type-Options": "nosniff" });
  res.send(file.bytes);
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
workerWorkflowRouter.get("/dashboard", async (_req, res) => res.json(apiSuccessResponse("Worker dashboard", await workerDashboard(res.locals.authUser.id))));
workerWorkflowRouter.get("/earnings", validate({ query: earningsSchema.earningsListQuery }), async (_req, res) => res.json(apiSuccessResponse("Approved earnings", await workerEarnings(res.locals.authUser.id, res.locals.validated.query))));
workerWorkflowRouter.get("/earnings/:id", validate({ params: earningsSchema.earningsParams }), async (_req, res) => res.json(apiSuccessResponse("Earnings statement", await workerEarningsDetail(res.locals.authUser.id, res.locals.validated.params.id))));
workerWorkflowRouter.get("/earnings/:id/csv", validate({ params: earningsSchema.earningsParams }), async (_req, res) => {
  const csv = await workerStatementCsv(res.locals.authUser.id, res.locals.validated.params.id);
  res.set({ "Cache-Control": "private, no-store", "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="earnings-${res.locals.validated.params.id}.csv"`, "X-Content-Type-Options": "nosniff" });
  res.send(csv);
});

// Mounted after ADMIN authentication. Writes require the portal request header.
export const adminWorkerWorkflowRouter = Router();
adminWorkerWorkflowRouter.get("/worker-applications", validate({ query: schema.workerApplicationsQuery }), async (_req, res) => res.json(apiSuccessResponse("Worker applications", await workerApplications(res.locals.authUser.id, res.locals.validated.query, true))));
adminWorkerWorkflowRouter.get("/worker-applications/:id", validate({ params: schema.workflowParams, query: schema.applicationHistoryQuery }), async (_req, res) => res.json(apiSuccessResponse("Submitted worker profile", await workerApplicationDetail(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.query.historyPage, true))));
adminWorkerWorkflowRouter.get("/worker-applications/:id/resume", validate({ params: schema.workflowParams }), async (_req, res) => sendPrivateResume(res, await applicationResume(res.locals.authUser.id, res.locals.validated.params.id, true)));
adminWorkerWorkflowRouter.post("/worker-applications/:id/review", portalWrite, validate({ params: schema.workflowParams, body: schema.adminApplicationReviewSchema }), async (_req, res) => res.json(apiSuccessResponse("Application reviewed", await reviewWorkerApplication(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
adminWorkerWorkflowRouter.get("/worker-attendance", validate({ query: schema.workerAttendanceQuery }), async (_req, res) => res.json(apiSuccessResponse("Worker attendance queue", await workerAttendanceRequests(res.locals.authUser.id, res.locals.validated.query, true))));
adminWorkerWorkflowRouter.get("/worker-attendance/:id", validate({ params: schema.workflowParams }), async (_req, res) => res.json(apiSuccessResponse("Attendance review", await adminAttendanceRequest(res.locals.validated.params.id))));
adminWorkerWorkflowRouter.post("/worker-attendance/:id/review", portalWrite, validate({ params: schema.workflowParams, body: schema.reviewWorkerAttendanceSchema }), async (_req, res) => res.json(apiSuccessResponse("Attendance decision saved", await reviewWorkerAttendance(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
adminWorkerWorkflowRouter.get("/earnings", validate({ query: earningsSchema.adminEarningsListQuery }), async (_req, res) => res.json(apiSuccessResponse("Earnings management", await adminEarnings(res.locals.validated.query))));
adminWorkerWorkflowRouter.get("/earnings/assignments", validate({ query: earningsSchema.earningsAssignmentQuery }), async (_req, res) => res.json(apiSuccessResponse("Eligible worker assignments", await earningsAssignmentOptions(res.locals.validated.query))));
adminWorkerWorkflowRouter.get("/earnings/assignments/:id/context", validate({ params: earningsSchema.earningsParams, query: earningsSchema.earningsContextQuery }), async (_req, res) => res.json(apiSuccessResponse("Assignment earnings context", await earningsAssignmentContext(res.locals.validated.params.id, res.locals.validated.query.periodStart, res.locals.validated.query.periodEnd))));
adminWorkerWorkflowRouter.post("/earnings", portalWrite, validate({ body: earningsSchema.createEarningsSchema }), async (_req, res) => { const result = await createEarningsStatement(res.locals.authUser.id, res.locals.validated.body); res.status(result.created ? 201 : 200).json(apiSuccessResponse("Earnings draft saved", result)); });
adminWorkerWorkflowRouter.get("/earnings/:id", validate({ params: earningsSchema.earningsParams }), async (_req, res) => res.json(apiSuccessResponse("Earnings statement review", await adminEarningsDetail(res.locals.validated.params.id))));
adminWorkerWorkflowRouter.put("/earnings/:id/draft", portalWrite, validate({ params: earningsSchema.earningsParams, body: earningsSchema.updateEarningsDraftSchema }), async (_req, res) => res.json(apiSuccessResponse("Earnings draft updated", await updateEarningsDraft(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
adminWorkerWorkflowRouter.post("/earnings/:id/approve", portalWrite, validate({ params: earningsSchema.earningsParams, body: earningsSchema.approveEarningsSchema }), async (_req, res) => res.json(apiSuccessResponse("Earnings statement approved", await approveEarningsStatement(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
adminWorkerWorkflowRouter.post("/earnings/:id/adjustments", portalWrite, validate({ params: earningsSchema.earningsParams, body: earningsSchema.addEarningsAdjustmentSchema }), async (_req, res) => res.status(201).json(apiSuccessResponse("Earnings adjustment recorded", await addEarningsAdjustment(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
adminWorkerWorkflowRouter.post("/earnings/:id/payments", portalWrite, validate({ params: earningsSchema.earningsParams, body: earningsSchema.recordPaymentSchema }), async (_req, res) => res.status(201).json(apiSuccessResponse("Payment record added", await recordEarningsPayment(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
adminWorkerWorkflowRouter.post("/earnings/:id/payments/:paymentId/void", portalWrite, validate({ params: earningsSchema.earningsPaymentParams, body: earningsSchema.voidPaymentSchema }), async (_req, res) => res.json(apiSuccessResponse("Payment record voided", await voidEarningsPayment(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.params.paymentId, res.locals.validated.body))));
