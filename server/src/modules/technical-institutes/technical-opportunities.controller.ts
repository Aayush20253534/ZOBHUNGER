import type { Request, RequestHandler, Response } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { notifyTechnicalOpportunityApplication } from "../../services/notification.service.js";
import type {
  TechnicalOpportunityInput,
  TechnicalOpportunityListQuery,
  TechnicalOpportunityMatchQuery,
  TechnicalOpportunitySubmitInput,
} from "./technical-opportunities.schema.js";
import {
  addTechnicalOpportunity,
  editTechnicalOpportunity,
  getTechnicalOpportunity,
  getTechnicalOpportunityList,
  getTechnicalOpportunityMatches,
  getTechnicalOpportunitySummary,
  setTechnicalOpportunityApplicationStatus,
  submitTechnicalStudentToOpportunity,
} from "./technical-opportunities.service.js";

function adminId(res: Response) { return (res.locals.authUser as { id: string }).id; }
function auditContext(req: Request, res: Response) { return { actorUserId: adminId(res), ipAddress: req.ip, userAgent: req.get("user-agent")?.slice(0, 500) }; }

export const listTechnicalOpportunitiesAdminController: RequestHandler = async (_req, res) => {
  const data = await getTechnicalOpportunityList(res.locals.validated.query as TechnicalOpportunityListQuery);
  res.status(200).json(apiSuccessResponse("Technical opportunities retrieved", data));
};

export const technicalOpportunitySummaryAdminController: RequestHandler = async (_req, res) => {
  const data = await getTechnicalOpportunitySummary();
  res.status(200).json(apiSuccessResponse("Technical opportunity summary retrieved", data));
};

export const getTechnicalOpportunityAdminController: RequestHandler = async (_req, res) => {
  const { id } = res.locals.validated.params as { id: string };
  const data = await getTechnicalOpportunity(id);
  res.status(200).json(apiSuccessResponse("Technical opportunity retrieved", data));
};

export const createTechnicalOpportunityAdminController: RequestHandler = async (req, res) => {
  const data = await addTechnicalOpportunity(res.locals.validated.body as TechnicalOpportunityInput, auditContext(req, res));
  res.status(201).json(apiSuccessResponse("Technical opportunity created", data));
};

export const updateTechnicalOpportunityAdminController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as { id: string };
  const data = await editTechnicalOpportunity(id, res.locals.validated.body as TechnicalOpportunityInput, auditContext(req, res));
  res.status(200).json(apiSuccessResponse("Technical opportunity updated", data));
};

export const technicalOpportunityMatchesAdminController: RequestHandler = async (_req, res) => {
  const { id } = res.locals.validated.params as { id: string };
  const data = await getTechnicalOpportunityMatches(id, res.locals.validated.query as TechnicalOpportunityMatchQuery);
  res.status(200).json(apiSuccessResponse("Eligible technical talent matched", data));
};

export const submitTechnicalOpportunityCandidateAdminController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as { id: string };
  const data = await submitTechnicalStudentToOpportunity(id, res.locals.validated.body as TechnicalOpportunitySubmitInput, auditContext(req, res));
  void notifyTechnicalOpportunityApplication(data, res.locals.requestId);
  res.status(201).json(apiSuccessResponse("Technical candidate submitted to opportunity", data));
};

export const updateTechnicalOpportunityApplicationStatusAdminController: RequestHandler = async (req, res) => {
  const { id, applicationId } = res.locals.validated.params as { id: string; applicationId: string };
  const { status } = res.locals.validated.body as { status: "SUBMITTED" | "REVIEWED" | "SHORTLISTED" | "SELECTED" | "REJECTED" | "JOINED" };
  const data = await setTechnicalOpportunityApplicationStatus(id, applicationId, status, auditContext(req, res));
  void notifyTechnicalOpportunityApplication(data, res.locals.requestId);
  res.status(200).json(apiSuccessResponse("Technical opportunity application status updated", data));
};
