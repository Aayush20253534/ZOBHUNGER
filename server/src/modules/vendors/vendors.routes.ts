import express, { Router } from "express";
import { publicSubmissionRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { notifyVendorStatus, notifyVendorSubmitted } from "../../services/notification.service.js";
import { vendorDownloadParamsSchema, vendorIdSchema, vendorQuerySchema, vendorRecordSchema, vendorReviewSchema, vendorSubmissionSchema, vendorUploadParamsSchema } from "./vendors.schema.js";
import { downloadVendorDocument, getVendor, listVendors, reviewVendor, startVendorApplication, submitVendorApplication, updateVendorRecord, uploadVendorDocument } from "./vendors.service.js";

export const vendorsRouter = Router();
vendorsRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
vendorsRouter.post("/", publicSubmissionRateLimiter, validate({ body: vendorSubmissionSchema }), async (_req, res) => {
  res.status(201).json(apiSuccessResponse("Vendor details saved. Attach your documents and finish submission.", await startVendorApplication(res.locals.validated.body)));
});
vendorsRouter.put("/:id/documents/:kind", publicSubmissionRateLimiter, validate({ params: vendorUploadParamsSchema }), express.raw({ type: "application/pdf", limit: "2mb" }), async (req, res) => {
  res.json(apiSuccessResponse("Document attached", await uploadVendorDocument(res.locals.validated.params.id, res.locals.validated.params.kind, req.get("X-Upload-Token"), req.body, req.get("Content-Type"), req.get("X-File-Name"))));
});
vendorsRouter.post("/:id/submit", publicSubmissionRateLimiter, validate({ params: vendorIdSchema }), async (req, res) => {
  const result = await submitVendorApplication(res.locals.validated.params.id, req.get("X-Upload-Token"));
  if (result.created) void notifyVendorSubmitted(result);
  res.json(apiSuccessResponse("Vendor application submitted for review", result));
});

// Mounted behind requireAuth + requireRole(ADMIN) in the existing admin router.
export const adminVendorsRouter = Router();
adminVendorsRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
adminVendorsRouter.get("/", validate({ query: vendorQuerySchema }), async (_req, res) => res.json(apiSuccessResponse("Vendor applications and records", await listVendors(res.locals.validated.query))));
adminVendorsRouter.get("/:id", validate({ params: vendorIdSchema }), async (_req, res) => res.json(apiSuccessResponse("Vendor application", await getVendor(res.locals.validated.params.id))));
adminVendorsRouter.post("/:id/review", portalWrite, validate({ params: vendorIdSchema, body: vendorReviewSchema }), async (_req, res) => {
  const result = await reviewVendor(res.locals.validated.params.id, res.locals.authUser.id, res.locals.validated.body);
  void notifyVendorStatus({ id: result.application.id, companyName: result.application.companyName, contactName: result.application.contactName, email: result.application.email, status: result.application.status, vendorCode: result.application.vendorCode, updatedAt: result.application.updatedAt });
  res.json(apiSuccessResponse("Vendor decision saved", result));
});
adminVendorsRouter.patch("/:id/record", portalWrite, validate({ params: vendorIdSchema, body: vendorRecordSchema }), async (_req, res) => res.json(apiSuccessResponse("Vendor record updated", await updateVendorRecord(res.locals.validated.params.id, res.locals.authUser.id, res.locals.validated.body))));
adminVendorsRouter.get("/:id/documents/:documentId", validate({ params: vendorDownloadParamsSchema }), async (_req, res) => {
  const document = await downloadVendorDocument(res.locals.validated.params.id, res.locals.validated.params.documentId, res.locals.authUser.id);
  res.set({ "Cache-Control": "private, no-store", "Content-Type": document.mimeType, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox" });
  res.send(document.bytes);
});
