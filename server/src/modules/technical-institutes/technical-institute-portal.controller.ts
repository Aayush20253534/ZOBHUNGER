import type { Request, RequestHandler, Response } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type { TechnicalStudentAdminListQuery, TechnicalStudentCoreInput, TechnicalStudentImportQuery } from "./technical-students.schema.js";
import type { TechnicalInstitutePortalApplicationQuery, TechnicalInstitutePortalMatchQuery, TechnicalInstitutePortalOpportunityQuery, TechnicalInstitutePortalSubmitInput } from "./technical-institute-portal.schema.js";
import {
  addTechnicalInstitutePortalStudent,
  editTechnicalInstitutePortalStudent,
  exportTechnicalInstitutePortalReport,
  getTechnicalInstitutePortalApplications,
  getTechnicalInstitutePortalDashboard,
  getTechnicalInstitutePortalOpportunities,
  getTechnicalInstitutePortalOpportunityMatches,
  getTechnicalInstitutePortalReports,
  getTechnicalInstitutePortalStudents,
  importTechnicalInstitutePortalStudents,
  setTechnicalInstitutePortalStudentStatus,
  submitTechnicalInstitutePortalCandidate,
} from "./technical-institute-portal.service.js";

function userId(res: Response) { return (res.locals.authUser as { id: string }).id; }
function auditContext(req: Request, res: Response) { return { actorUserId: userId(res), ipAddress: req.ip, userAgent: req.get("user-agent")?.slice(0, 500) }; }

export const technicalInstitutePortalDashboardController: RequestHandler = async (_req, res) => {
  const data = await getTechnicalInstitutePortalDashboard(userId(res));
  res.status(200).json(apiSuccessResponse("Technical institute dashboard retrieved", data));
};

export const technicalInstitutePortalStudentsController: RequestHandler = async (_req, res) => {
  const data = await getTechnicalInstitutePortalStudents(userId(res), res.locals.validated.query as TechnicalStudentAdminListQuery);
  res.status(200).json(apiSuccessResponse("Technical institute students retrieved", data));
};

export const createTechnicalInstitutePortalStudentController: RequestHandler = async (req, res) => {
  const data = await addTechnicalInstitutePortalStudent(userId(res), res.locals.validated.body as TechnicalStudentCoreInput, auditContext(req, res));
  res.status(201).json(apiSuccessResponse("Technical student added", data));
};

export const updateTechnicalInstitutePortalStudentController: RequestHandler = async (req, res) => {
  const { studentId } = res.locals.validated.params as { studentId: string };
  const data = await editTechnicalInstitutePortalStudent(userId(res), studentId, res.locals.validated.body as TechnicalStudentCoreInput, auditContext(req, res));
  res.status(200).json(apiSuccessResponse("Technical student updated", data));
};

export const updateTechnicalInstitutePortalStudentStatusController: RequestHandler = async (req, res) => {
  const { studentId } = res.locals.validated.params as { studentId: string };
  const { status } = res.locals.validated.body as { status: "PENDING" | "VERIFIED" | "INACTIVE" };
  const data = await setTechnicalInstitutePortalStudentStatus(userId(res), studentId, status, auditContext(req, res));
  res.status(200).json(apiSuccessResponse("Technical student status updated", data));
};

export const importTechnicalInstitutePortalStudentsController: RequestHandler = async (req, res) => {
  const query = res.locals.validated.query as TechnicalStudentImportQuery;
  const data = await importTechnicalInstitutePortalStudents({
    userId: userId(res),
    mode: query.mode,
    buffer: Buffer.isBuffer(req.body) ? req.body : Buffer.from([]),
    mimeType: req.get("content-type")?.split(";")[0],
    fileName: req.get("x-file-name")?.slice(0, 180),
    ...auditContext(req, res),
  });
  res.status(query.mode === "import" ? 201 : 200).json(apiSuccessResponse(query.mode === "import" ? "Technical students imported" : "Student import validated", data));
};

export const technicalInstitutePortalOpportunitiesController: RequestHandler = async (_req, res) => {
  const data = await getTechnicalInstitutePortalOpportunities(userId(res), res.locals.validated.query as TechnicalInstitutePortalOpportunityQuery);
  res.status(200).json(apiSuccessResponse("Technical opportunities retrieved", data));
};

export const technicalInstitutePortalOpportunityMatchesController: RequestHandler = async (_req, res) => {
  const { opportunityId } = res.locals.validated.params as { opportunityId: string };
  const data = await getTechnicalInstitutePortalOpportunityMatches(
    userId(res),
    opportunityId,
    res.locals.validated.query as TechnicalInstitutePortalMatchQuery,
  );
  res.status(200).json(apiSuccessResponse("Technical opportunity matches retrieved", data));
};

export const submitTechnicalInstitutePortalCandidateController: RequestHandler = async (req, res) => {
  const { opportunityId } = res.locals.validated.params as { opportunityId: string };
  const data = await submitTechnicalInstitutePortalCandidate(userId(res), opportunityId, res.locals.validated.body as TechnicalInstitutePortalSubmitInput, auditContext(req, res), res.locals.requestId);
  res.status(201).json(apiSuccessResponse("Student submitted to technical opportunity", data));
};

export const technicalInstitutePortalApplicationsController: RequestHandler = async (_req, res) => {
  const data = await getTechnicalInstitutePortalApplications(userId(res), res.locals.validated.query as TechnicalInstitutePortalApplicationQuery);
  res.status(200).json(apiSuccessResponse("Technical institute applications retrieved", data));
};

export const technicalInstitutePortalReportsController: RequestHandler = async (_req, res) => {
  const data = await getTechnicalInstitutePortalReports(userId(res));
  res.status(200).json(apiSuccessResponse("Technical institute placement report retrieved", data));
};

export const technicalInstitutePortalReportExportController: RequestHandler = async (_req, res) => {
  const data = await exportTechnicalInstitutePortalReport(userId(res));
  res.set("Content-Type", "text/csv; charset=utf-8");
  res.set("Content-Disposition", `attachment; filename="${data.fileName}"`);
  res.set("Cache-Control", "no-store");
  res.status(200).send(data.csv);
};
