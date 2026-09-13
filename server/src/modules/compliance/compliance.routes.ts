import express, { Router } from "express";
import { AdminPermission, ComplianceArea, ComplianceDocumentKind } from "../../generated/prisma/client.js";
import { requireAdminPermission } from "../../middlewares/admin-permission.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { publicSubmissionRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import {
  complianceAccessSchema,
  complianceDocumentParamsSchema,
  complianceFamilyPhotoParamsSchema,
  complianceJoiningParamsSchema,
  complianceListQuerySchema,
  complianceReviewSchema,
  esicComplianceAdminUpdateSchema,
  esicComplianceDraftSchema,
  pfComplianceAdminUpdateSchema,
  pfComplianceDraftSchema,
} from "./compliance.schema.js";
import {
  createComplianceAccess,
  downloadComplianceDocument,
  exportEsicCompliance,
  exportPfCompliance,
  getEmployeeCompliance,
  getEsicComplianceAdmin,
  getPfComplianceAdmin,
  listEsicCompliance,
  listPfCompliance,
  reviewEsicCompliance,
  reviewPfCompliance,
  saveEsicCompliance,
  savePfCompliance,
  submitEsicCompliance,
  submitPfCompliance,
  updateEsicComplianceAdmin,
  updatePfComplianceAdmin,
  uploadComplianceDocument,
} from "./compliance.service.js";

function token(req: express.Request) {
  return req.get("X-Employee-Compliance-Token");
}

export const employeeComplianceRouter = Router();
employeeComplianceRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
employeeComplianceRouter.post("/access", publicSubmissionRateLimiter, validate({ body: complianceAccessSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Employee compliance access verified", await createComplianceAccess(res.locals.validated.body)));
});
employeeComplianceRouter.get("/profile", async (req, res) => {
  res.json(apiSuccessResponse("Employee compliance profile", await getEmployeeCompliance(token(req))));
});
employeeComplianceRouter.put("/pf", publicSubmissionRateLimiter, validate({ body: pfComplianceDraftSchema }), async (req, res) => {
  res.json(apiSuccessResponse("PF / EPFO draft saved", await savePfCompliance(token(req), res.locals.validated.body)));
});
employeeComplianceRouter.post("/pf/submit", publicSubmissionRateLimiter, async (req, res) => {
  res.json(apiSuccessResponse("PF / EPFO details submitted for review", await submitPfCompliance(token(req))));
});
employeeComplianceRouter.put("/esic", publicSubmissionRateLimiter, validate({ body: esicComplianceDraftSchema }), async (req, res) => {
  res.json(apiSuccessResponse("ESIC draft saved", await saveEsicCompliance(token(req), res.locals.validated.body)));
});
employeeComplianceRouter.post("/esic/submit", publicSubmissionRateLimiter, async (req, res) => {
  res.json(apiSuccessResponse("ESIC details submitted for review", await submitEsicCompliance(token(req))));
});
employeeComplianceRouter.put("/pf/document", publicSubmissionRateLimiter, express.raw({ type: ["application/pdf", "image/jpeg", "image/png"], limit: "5mb" }), async (req, res) => {
  res.json(apiSuccessResponse("PF document saved", await uploadComplianceDocument(token(req), ComplianceArea.PF_EPFO, ComplianceDocumentKind.PF_DOCUMENT, req.body, req.get("Content-Type"), req.get("X-File-Name"))));
});
employeeComplianceRouter.put("/esic/document", publicSubmissionRateLimiter, express.raw({ type: ["application/pdf", "image/jpeg", "image/png"], limit: "5mb" }), async (req, res) => {
  res.json(apiSuccessResponse("ESIC document saved", await uploadComplianceDocument(token(req), ComplianceArea.ESIC, ComplianceDocumentKind.ESIC_DOCUMENT, req.body, req.get("Content-Type"), req.get("X-File-Name"))));
});
employeeComplianceRouter.put("/esic/family/:joiningId/:familyMemberId/photo", publicSubmissionRateLimiter, validate({ params: complianceFamilyPhotoParamsSchema }), express.raw({ type: ["image/jpeg", "image/png"], limit: "5mb" }), async (req, res) => {
  const { joiningId, familyMemberId } = res.locals.validated.params;
  const profile = await getEmployeeCompliance(token(req));
  if (profile.employee.id !== joiningId) return res.status(403).json({ success: false, message: "Employee compliance record mismatch", error: { code: "COMPLIANCE_RECORD_MISMATCH" } });
  res.json(apiSuccessResponse("Family member photo saved", await uploadComplianceDocument(token(req), ComplianceArea.ESIC, ComplianceDocumentKind.FAMILY_MEMBER_PHOTO, req.body, req.get("Content-Type"), req.get("X-File-Name"), familyMemberId)));
});

export const adminPfComplianceRouter = Router();
adminPfComplianceRouter.use(requireAdminPermission(AdminPermission.PF_VIEW));
adminPfComplianceRouter.get("/", validate({ query: complianceListQuerySchema }), async (_req, res) => {
  res.json(apiSuccessResponse("PF / EPFO compliance records", await listPfCompliance(res.locals.validated.query)));
});
adminPfComplianceRouter.get("/export.xlsx", requireAdminPermission(AdminPermission.PF_EXPORT), validate({ query: complianceListQuerySchema }), async (_req, res) => {
  const bytes = await exportPfCompliance(res.locals.authUser.id, res.locals.validated.query);
  res.set({ "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="zobhunger-pf-epfo-compliance.xlsx"', "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.send(bytes);
});
adminPfComplianceRouter.get("/:joiningId", validate({ params: complianceJoiningParamsSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("PF / EPFO compliance record", await getPfComplianceAdmin(res.locals.validated.params.joiningId, res.locals.authUser.id)));
});
adminPfComplianceRouter.put("/:joiningId", requireAdminPermission(AdminPermission.PF_UPDATE), portalWrite, validate({ params: complianceJoiningParamsSchema, body: pfComplianceAdminUpdateSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("PF / EPFO department-controlled fields updated", await updatePfComplianceAdmin(res.locals.validated.params.joiningId, res.locals.authUser.id, res.locals.validated.body)));
});
adminPfComplianceRouter.post("/:joiningId/review", requireAdminPermission(AdminPermission.PF_VERIFY), portalWrite, validate({ params: complianceJoiningParamsSchema, body: complianceReviewSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("PF / EPFO review updated", await reviewPfCompliance(res.locals.validated.params.joiningId, res.locals.authUser.id, res.locals.validated.body)));
});
adminPfComplianceRouter.get("/:joiningId/documents/:documentId", validate({ params: complianceDocumentParamsSchema }), async (_req, res) => {
  const file = await downloadComplianceDocument(res.locals.validated.params.joiningId, res.locals.validated.params.documentId, res.locals.authUser.id, ComplianceArea.PF_EPFO);
  res.set({ "Content-Type": file.mimeType, "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.send(file.bytes);
});

export const adminEsicComplianceRouter = Router();
adminEsicComplianceRouter.use(requireAdminPermission(AdminPermission.ESIC_VIEW));
adminEsicComplianceRouter.get("/", validate({ query: complianceListQuerySchema }), async (_req, res) => {
  res.json(apiSuccessResponse("ESIC compliance records", await listEsicCompliance(res.locals.validated.query)));
});
adminEsicComplianceRouter.get("/export.xlsx", requireAdminPermission(AdminPermission.ESIC_EXPORT), validate({ query: complianceListQuerySchema }), async (_req, res) => {
  const bytes = await exportEsicCompliance(res.locals.authUser.id, res.locals.validated.query);
  res.set({ "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="zobhunger-esic-compliance.xlsx"', "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.send(bytes);
});
adminEsicComplianceRouter.get("/:joiningId", validate({ params: complianceJoiningParamsSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("ESIC compliance record", await getEsicComplianceAdmin(res.locals.validated.params.joiningId, res.locals.authUser.id)));
});
adminEsicComplianceRouter.put("/:joiningId", requireAdminPermission(AdminPermission.ESIC_UPDATE), portalWrite, validate({ params: complianceJoiningParamsSchema, body: esicComplianceAdminUpdateSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("ESIC department-controlled fields updated", await updateEsicComplianceAdmin(res.locals.validated.params.joiningId, res.locals.authUser.id, res.locals.validated.body)));
});
adminEsicComplianceRouter.post("/:joiningId/review", requireAdminPermission(AdminPermission.ESIC_VERIFY), portalWrite, validate({ params: complianceJoiningParamsSchema, body: complianceReviewSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("ESIC review updated", await reviewEsicCompliance(res.locals.validated.params.joiningId, res.locals.authUser.id, res.locals.validated.body)));
});
adminEsicComplianceRouter.get("/:joiningId/documents/:documentId", validate({ params: complianceDocumentParamsSchema }), async (_req, res) => {
  const file = await downloadComplianceDocument(res.locals.validated.params.joiningId, res.locals.validated.params.documentId, res.locals.authUser.id, ComplianceArea.ESIC);
  res.set({ "Content-Type": file.mimeType, "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.send(file.bytes);
});
