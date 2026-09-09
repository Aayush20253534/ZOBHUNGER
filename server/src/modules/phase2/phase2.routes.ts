import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { HttpError } from "../../utils/http-error.js";
import { notifyNewRequirement } from "../../services/notification.service.js";
import { createBusinessRequirementSchema } from "../business/business-requirements.schema.js";
import * as schema from "./phase2.schema.js";
import { getDraft, listDrafts, removeDraft, saveDraft, submitDraft } from "./drafts.service.js";
import { businessOwned, changeLinkedJob, createLinkedJob, qualifyRequirement, requirementJobs } from "./linked-jobs.service.js";
import { approvalDetail, approvalQueue, decideApproval } from "./approvals.service.js";
import { getReport, operationsSummary, reportCsv } from "./reports.service.js";
const portalWrite: RequestHandler = (req, _res, next) => req.get("X-Requested-With") === "XMLHttpRequest" ? next() : next(new HttpError(403, "Submit this change from the portal.", { code: "PORTAL_REQUEST_REQUIRED" }));
function router(admin: boolean) {
  const result = Router(); const access = [requireAuth, requireRole(admin ? "ADMIN" : "BUSINESS")];
  result.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  const pageQuery = z.object({ page: schema.page }).strict();
  if (!admin) {
    const draftId = z.object({ id: z.string().uuid() });
    result.get("/requirement-drafts", ...access, validate({ query: pageQuery }), async (_req, res) => res.json(apiSuccessResponse("Drafts retrieved", await listDrafts(res.locals.authUser.id, res.locals.validated.query.page))));
    result.get("/requirement-drafts/:id", ...access, validate({ params: draftId }), async (_req, res) => res.json(apiSuccessResponse("Draft retrieved", await getDraft(res.locals.authUser.id, res.locals.validated.params.id))));
    result.put("/requirement-drafts/:id", ...access, portalWrite, validate({ params: draftId, body: schema.saveDraftSchema }), async (_req, res) => res.json(apiSuccessResponse("Draft saved", await saveDraft(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
    result.delete("/requirement-drafts/:id", ...access, portalWrite, validate({ params: draftId, body: schema.revisionSchema }), async (_req, res) => res.json(apiSuccessResponse("Draft removed", await removeDraft(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body.revision))));
    result.post("/requirement-drafts/:id/submit", ...access, portalWrite, validate({ params: draftId, body: z.object({ revision: schema.revision, brief: createBusinessRequirementSchema }).strict() }), async (_req, res) => {
      const data = await submitDraft(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body.revision, res.locals.validated.body.brief);
      if (data.created) void notifyNewRequirement(data.requirement, res.locals.requestId);
      res.status(data.created ? 201 : 200).json(apiSuccessResponse("Requirement received", { id: data.requirement.id, revision: data.requirement.revision, status: data.requirement.status, replayed: !data.created }));
    });
    result.get("/requirements/:id/jobs", ...access, validate({ params: schema.idParams, query: pageQuery }), async (_req, res) => res.json(apiSuccessResponse("Linked openings retrieved", await requirementJobs({ userId: res.locals.authUser.id, admin }, res.locals.validated.params.id, res.locals.validated.query.page))));
    result.get("/operations-summary", ...access, async (_req, res) => res.json(apiSuccessResponse("Operations summary retrieved", await operationsSummary(res.locals.authUser.id))));
  } else {
    result.get("/requirement-jobs", ...access, validate({ query: schema.listQuery }), async (_req, res) => {
      const { query, page } = res.locals.validated.query; const search = query.replace(/[\\%_]/g, "\\$&");
      const where = { AND: [businessOwned, ...(search ? [{ OR: [{ companyName: { contains: search, mode: "insensitive" as const } }, { serviceRequired: { contains: search, mode: "insensitive" as const } }, { id: { contains: search, mode: "insensitive" as const } }] }] : [])] };
      const total = await prisma.workforceRequirement.count({ where }), totalPages = Math.max(1, Math.ceil(total / 9)), current = Math.min(page, totalPages);
      const items = await prisma.workforceRequirement.findMany({ where, select: { id: true, companyName: true, serviceRequired: true, jobLocation: true, workforceCount: true, status: true, revision: true, _count: { select: { jobs: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 9, skip: (current - 1) * 9 });
      res.json(apiSuccessResponse("Hiring briefs retrieved", { items, total, totalPages, page: current }));
    });
    result.get("/requirement-jobs/:id", ...access, validate({ params: schema.idParams, query: pageQuery }), async (_req, res) => res.json(apiSuccessResponse("Linked openings retrieved", await requirementJobs({ userId: res.locals.authUser.id, admin }, res.locals.validated.params.id, res.locals.validated.query.page))));
    result.post("/requirement-jobs/:id/qualify", ...access, portalWrite, validate({ params: schema.idParams, body: schema.revisionSchema }), async (_req, res) => res.json(apiSuccessResponse("Requirement qualified", await qualifyRequirement(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body.revision))));
    result.post("/requirement-jobs/:id/jobs", ...access, portalWrite, validate({ params: schema.idParams, body: schema.createLinkedJobSchema }), async (_req, res) => {
      const data = await createLinkedJob(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body);
      res.status(data.created ? 201 : 200).json(apiSuccessResponse("Job draft created", data));
    });
    result.put("/requirement-jobs/jobs/:id", ...access, portalWrite, validate({ params: schema.idParams, body: schema.editLinkedJobSchema }), async (_req, res) => res.json(apiSuccessResponse("Job saved as draft", await changeLinkedJob(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
    result.post("/requirement-jobs/jobs/:id/status", ...access, portalWrite, validate({ params: schema.idParams, body: schema.linkedJobStatusSchema }), async (_req, res) => res.json(apiSuccessResponse("Job status saved", await changeLinkedJob(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
  }
  result.get("/attendance-approvals", ...access, validate({ query: schema.approvalQuerySchema }), async (_req, res) => res.json(apiSuccessResponse("Attendance approvals retrieved", await approvalQueue({ userId: res.locals.authUser.id, admin }, res.locals.validated.query))));
  result.get("/attendance-approvals/:id", ...access, validate({ params: schema.idParams, query: schema.historyQuerySchema }), async (_req, res) => res.json(apiSuccessResponse("Attendance decision history retrieved", await approvalDetail({ userId: res.locals.authUser.id, admin }, res.locals.validated.params.id, res.locals.validated.query.page))));
  if (!admin) result.post("/attendance-approvals/:id/decision", ...access, portalWrite, validate({ params: schema.idParams, body: schema.approvalDecisionSchema }), async (_req, res) => res.json(apiSuccessResponse("Attendance decision saved", await decideApproval(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body))));
  result.get("/reports", ...access, validate({ query: schema.reportQuerySchema }), async (_req, res) => res.json(apiSuccessResponse("Report retrieved", await getReport({ userId: res.locals.authUser.id, admin }, res.locals.validated.query))));
  result.get("/reports/print", ...access, validate({ query: schema.reportQuerySchema }), async (_req, res) => res.json(apiSuccessResponse("Print report retrieved", await getReport({ userId: res.locals.authUser.id, admin }, res.locals.validated.query, "print"))));
  result.get("/reports/export", ...access, validate({ query: schema.reportQuerySchema }), async (_req, res) => {
    const report = await getReport({ userId: res.locals.authUser.id, admin }, res.locals.validated.query, "csv");
    res.set("Content-Disposition", `attachment; filename="zobhunger-${report.type}-${report.from}-${report.to}.csv"`);
    res.type("text/csv; charset=utf-8").send(reportCsv(report));
  });
  return result;
}
export const businessPhase2Router = router(false);
export const adminPhase2Router = router(true);
