import express, { Router } from "express";
import { publicSubmissionRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import {
  employeeDocumentDownloadParamsSchema,
  employeeDocumentParamsSchema,
  employeeJoiningIdSchema,
  employeeJoiningQuerySchema,
  employeeJoiningReviewSchema,
  employeeJoiningSubmissionSchema,
  employeeOfferActionSchema,
  employeeOfferSchema,
} from "./employee-joining.schema.js";
import {
  approveEmployeeOffer,
  downloadEmployeeDocument,
  exportEmployeeJoiningsCsv,
  getEmployeeJoining,
  getEmployeeOfferPdf,
  issueEmployeeOffer,
  listEmployeeJoinings,
  reviewEmployeeJoining,
  saveEmployeeOffer,
  startEmployeeJoining,
  submitEmployeeJoining,
  uploadEmployeeJoiningDocument,
  uploadEmployeeOfferSignature,
} from "./employee-joining.service.js";

export const employeeJoiningRouter = Router();
employeeJoiningRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
employeeJoiningRouter.post("/", publicSubmissionRateLimiter, validate({ body: employeeJoiningSubmissionSchema }), async (_req, res) => {
  res.status(201).json(apiSuccessResponse("Employee joining details saved. Attach the required documents to complete submission.", await startEmployeeJoining(res.locals.validated.body)));
});
employeeJoiningRouter.put("/:id/documents/:kind", publicSubmissionRateLimiter, validate({ params: employeeDocumentParamsSchema }), express.raw({ type: ["application/pdf", "image/jpeg", "image/png"], limit: "5mb" }), async (req, res) => {
  res.json(apiSuccessResponse("Employee document attached", await uploadEmployeeJoiningDocument(res.locals.validated.params.id, res.locals.validated.params.kind, req.get("X-Upload-Token"), req.body, req.get("Content-Type"), req.get("X-File-Name"))));
});
employeeJoiningRouter.post("/:id/submit", publicSubmissionRateLimiter, validate({ params: employeeJoiningIdSchema }), async (req, res) => {
  res.json(apiSuccessResponse("Employee joining form submitted for HR review", await submitEmployeeJoining(res.locals.validated.params.id, req.get("X-Upload-Token"))));
});

// Mounted behind ADMIN authentication + MFA by admin.routes.ts.
export const adminEmployeeJoiningRouter = Router();
adminEmployeeJoiningRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
adminEmployeeJoiningRouter.get("/", validate({ query: employeeJoiningQuerySchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Employee joining records", await listEmployeeJoinings(res.locals.validated.query)));
});
adminEmployeeJoiningRouter.get("/export.csv", async (_req, res) => {
  const bytes = await exportEmployeeJoiningsCsv(res.locals.authUser.id);
  res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="zobhunger-employee-records.csv"', "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.send(bytes);
});
adminEmployeeJoiningRouter.get("/:id", validate({ params: employeeJoiningIdSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Employee joining record", await getEmployeeJoining(res.locals.validated.params.id, res.locals.authUser.id)));
});
adminEmployeeJoiningRouter.post("/:id/review", portalWrite, validate({ params: employeeJoiningIdSchema, body: employeeJoiningReviewSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("HR review saved", await reviewEmployeeJoining(res.locals.validated.params.id, res.locals.authUser.id, res.locals.validated.body)));
});
adminEmployeeJoiningRouter.get("/:id/documents/:documentId", validate({ params: employeeDocumentDownloadParamsSchema }), async (_req, res) => {
  const file = await downloadEmployeeDocument(res.locals.validated.params.id, res.locals.validated.params.documentId, res.locals.authUser.id);
  res.set({ "Content-Type": file.mimeType, "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.send(file.bytes);
});
adminEmployeeJoiningRouter.put("/:id/offer", portalWrite, validate({ params: employeeJoiningIdSchema, body: employeeOfferSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Offer letter draft saved", await saveEmployeeOffer(res.locals.validated.params.id, res.locals.authUser.id, res.locals.validated.body)));
});
adminEmployeeJoiningRouter.put("/:id/offer/signature", portalWrite, validate({ params: employeeJoiningIdSchema }), express.raw({ type: "image/jpeg", limit: "1mb" }), async (req, res) => {
  res.json(apiSuccessResponse("Authorized signature attached", await uploadEmployeeOfferSignature(res.locals.validated.params.id, res.locals.authUser.id, req.body, req.get("Content-Type"), req.get("X-File-Name"))));
});
adminEmployeeJoiningRouter.post("/:id/offer/approve", portalWrite, validate({ params: employeeJoiningIdSchema, body: employeeOfferActionSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Offer letter approved", await approveEmployeeOffer(res.locals.validated.params.id, res.locals.authUser.id, res.locals.validated.body)));
});
adminEmployeeJoiningRouter.post("/:id/offer/issue", portalWrite, validate({ params: employeeJoiningIdSchema, body: employeeOfferActionSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Offer letter issued and emailed to the employee", await issueEmployeeOffer(res.locals.validated.params.id, res.locals.authUser.id, res.locals.validated.body)));
});
adminEmployeeJoiningRouter.get("/:id/offer-letter.pdf", validate({ params: employeeJoiningIdSchema }), async (_req, res) => {
  const file = await getEmployeeOfferPdf(res.locals.validated.params.id, res.locals.authUser.id);
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.send(file.bytes);
});
