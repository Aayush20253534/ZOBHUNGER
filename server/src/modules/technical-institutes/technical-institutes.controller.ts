import type { Request, RequestHandler, Response } from "express";
import { notifyNewTechnicalInstituteApplication } from "../../services/notification.service.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type {
  CreateTechnicalInstituteApplicationInput,
  ReviewTechnicalInstituteApplicationInput,
  TechnicalInstituteAdminListQuery,
  TechnicalInstituteAdminParams,
} from "./technical-institutes.schema.js";
import {
  getTechnicalInstituteAdminSummary,
  getTechnicalInstituteForAdmin,
  issueTechnicalInstitutePortalAccess,
  listTechnicalInstitutesForAdmin,
  reviewTechnicalInstituteApplication,
  submitTechnicalInstituteApplication,
} from "./technical-institutes.service.js";

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

export const createTechnicalInstituteApplicationController: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as CreateTechnicalInstituteApplicationInput;
  const application = await submitTechnicalInstituteApplication(input);
  void notifyNewTechnicalInstituteApplication({ ...application, ...input }, res.locals.requestId);
  res.status(201).json(apiSuccessResponse(
    "Your ITI & Polytechnic College Cell partnership request has been submitted for review.",
    application,
  ));
};

export const technicalInstituteAdminSummaryController: RequestHandler = async (_req, res) => {
  const data = await getTechnicalInstituteAdminSummary();
  res.status(200).json(apiSuccessResponse("Technical institute partnership summary retrieved", data));
};

export const listTechnicalInstitutesAdminController: RequestHandler = async (_req, res) => {
  const data = await listTechnicalInstitutesForAdmin(
    res.locals.validated.query as TechnicalInstituteAdminListQuery,
  );
  res.status(200).json(apiSuccessResponse("Technical institute partnerships retrieved", data));
};

export const getTechnicalInstituteAdminController: RequestHandler = async (_req, res) => {
  const { id } = res.locals.validated.params as TechnicalInstituteAdminParams;
  const data = await getTechnicalInstituteForAdmin(id);
  res.status(200).json(apiSuccessResponse("Technical institute partnership retrieved", data));
};

export const reviewTechnicalInstituteAdminController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as TechnicalInstituteAdminParams;
  const result = await reviewTechnicalInstituteApplication(
    id,
    res.locals.validated.body as ReviewTechnicalInstituteApplicationInput,
    auditContext(req, res),
  );
  res.status(200).json(apiSuccessResponse(
    result.changed ? "Technical institute partnership review updated" : "Technical institute partnership review unchanged",
    result.entity,
  ));
};

export const issueTechnicalInstitutePortalAccessAdminController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as TechnicalInstituteAdminParams;
  const data = await issueTechnicalInstitutePortalAccess(id, auditContext(req, res));
  res.status(200).json(apiSuccessResponse(
    data.portalAccess === "ACTIVATION"
      ? "Technical institute activation email sent"
      : "Technical institute portal access confirmed",
    data,
  ));
};
