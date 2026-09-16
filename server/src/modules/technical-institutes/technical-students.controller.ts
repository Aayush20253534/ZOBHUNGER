import type { Request, RequestHandler, Response } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { notifyNewTechnicalStudentRegistration } from "../../services/notification.service.js";
import type {
  PublicTechnicalStudentRegistrationInput,
  TechnicalStudentAdminInstituteParams,
  TechnicalStudentAdminListQuery,
  TechnicalStudentAdminParams,
  TechnicalStudentCoreInput,
  TechnicalStudentImportQuery,
} from "./technical-students.schema.js";
import {
  addTechnicalStudentForAdmin,
  editTechnicalStudentForAdmin,
  getTechnicalStudentForAdmin,
  getTechnicalStudentSummaryForAdmin,
  getTechnicalStudentsForAdmin,
  importTechnicalStudentsForAdmin,
  publicTechnicalInstitutePartner,
  registerTechnicalStudent,
  setTechnicalStudentStatusForAdmin,
} from "./technical-students.service.js";

function adminId(res: Response): string {
  return (res.locals.authUser as { id: string }).id;
}

function auditContext(req: Request, res: Response) {
  return {
    actorUserId: adminId(res),
    ipAddress: req.ip,
    userAgent: req.get("user-agent")?.slice(0, 500),
  };
}

function fileName(req: Request) {
  const header = req.get("X-File-Name");
  if (!header) return undefined;
  try { return decodeURIComponent(header).slice(0, 180); } catch { return header.slice(0, 180); }
}

export const publicTechnicalInstitutePartnerController: RequestHandler = async (_req, res) => {
  const { partnershipCode } = res.locals.validated.params as { partnershipCode: string };
  const data = await publicTechnicalInstitutePartner(partnershipCode);
  res.status(200).json(apiSuccessResponse("Technical institute partnership verified", data));
};

export const registerTechnicalStudentController: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as PublicTechnicalStudentRegistrationInput;
  const data = await registerTechnicalStudent(input);
  void notifyNewTechnicalStudentRegistration({
    studentId: data.student.id,
    fullName: input.fullName,
    email: input.email,
    qualification: input.qualification,
    tradeBranch: input.tradeBranch,
    passingYear: input.passingYear,
    institutionName: data.institute.institutionName,
  }, res.locals.requestId);
  res.status(201).json(apiSuccessResponse(
    "Your technical student profile has been registered and is awaiting institute verification.",
    data,
  ));
};

export const listTechnicalStudentsAdminController: RequestHandler = async (_req, res) => {
  const { id } = res.locals.validated.params as TechnicalStudentAdminInstituteParams;
  const data = await getTechnicalStudentsForAdmin(id, res.locals.validated.query as TechnicalStudentAdminListQuery);
  res.status(200).json(apiSuccessResponse("Technical student roster retrieved", data));
};

export const technicalStudentSummaryAdminController: RequestHandler = async (_req, res) => {
  const { id } = res.locals.validated.params as TechnicalStudentAdminInstituteParams;
  const data = await getTechnicalStudentSummaryForAdmin(id);
  res.status(200).json(apiSuccessResponse("Technical student summary retrieved", data));
};

export const getTechnicalStudentAdminController: RequestHandler = async (_req, res) => {
  const { id, studentId } = res.locals.validated.params as TechnicalStudentAdminParams;
  const data = await getTechnicalStudentForAdmin(id, studentId);
  res.status(200).json(apiSuccessResponse("Technical student record retrieved", data));
};

export const createTechnicalStudentAdminController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as TechnicalStudentAdminInstituteParams;
  const data = await addTechnicalStudentForAdmin(id, res.locals.validated.body as TechnicalStudentCoreInput, auditContext(req, res));
  res.status(201).json(apiSuccessResponse("Technical student added to the institute roster", data));
};

export const updateTechnicalStudentAdminController: RequestHandler = async (req, res) => {
  const { id, studentId } = res.locals.validated.params as TechnicalStudentAdminParams;
  const data = await editTechnicalStudentForAdmin(id, studentId, res.locals.validated.body as TechnicalStudentCoreInput, auditContext(req, res));
  res.status(200).json(apiSuccessResponse("Technical student record updated", data));
};

export const updateTechnicalStudentStatusAdminController: RequestHandler = async (req, res) => {
  const { id, studentId } = res.locals.validated.params as TechnicalStudentAdminParams;
  const { status } = res.locals.validated.body as { status: "PENDING" | "VERIFIED" | "INACTIVE" };
  const data = await setTechnicalStudentStatusForAdmin(id, studentId, status, auditContext(req, res));
  res.status(200).json(apiSuccessResponse("Technical student status updated", data));
};

export const importTechnicalStudentsAdminController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as TechnicalStudentAdminInstituteParams;
  const { mode } = res.locals.validated.query as TechnicalStudentImportQuery;
  const data = await importTechnicalStudentsForAdmin({
    instituteId: id,
    mode,
    buffer: req.body,
    mimeType: req.get("Content-Type"),
    fileName: fileName(req),
    ...auditContext(req, res),
  });
  res.status(200).json(apiSuccessResponse(mode === "import" ? "Technical student import completed" : "Technical student file validated", data));
};
