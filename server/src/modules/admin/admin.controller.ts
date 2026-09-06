import type { Request, RequestHandler, Response } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type {
  EntityIdParams,
  ListAdminJobsQuery,
  ListApplicationsQuery,
  ListEnquiriesQuery,
  ListRequirementsQuery,
  UpdateApplicationStatusInput,
  UpdateJobStatusInput,
  UpdateRequirementStatusInput,
} from "./admin.schema.js";
import {
  changeApplicationStatus,
  changeJobStatus,
  changeRequirementStatus,
  listApplicationsForAdmin,
  listEnquiriesForAdmin,
  listJobsForAdmin,
  listRequirementsForAdmin,
} from "./admin.service.js";

function auditContext(req: Request, actorUserId: string) {
  return {
    actorUserId,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")?.slice(0, 500),
  };
}

function adminId(res: Response): string {
  return (res.locals.authUser as { id: string }).id;
}

export const listEnquiriesController: RequestHandler = async (_req, res) => {
  const data = await listEnquiriesForAdmin(
    res.locals.validated.query as ListEnquiriesQuery,
  );
  res.status(200).json(apiSuccessResponse("Enquiries retrieved", data));
};

export const listRequirementsController: RequestHandler = async (_req, res) => {
  const data = await listRequirementsForAdmin(
    res.locals.validated.query as ListRequirementsQuery,
  );
  res.status(200).json(apiSuccessResponse("Requirements retrieved", data));
};

export const listJobsController: RequestHandler = async (_req, res) => {
  const data = await listJobsForAdmin(
    res.locals.validated.query as ListAdminJobsQuery,
  );
  res.status(200).json(apiSuccessResponse("Admin jobs retrieved", data));
};

export const listApplicationsController: RequestHandler = async (_req, res) => {
  const data = await listApplicationsForAdmin(
    res.locals.validated.query as ListApplicationsQuery,
  );
  res.status(200).json(apiSuccessResponse("Applications retrieved", data));
};

export const updateRequirementStatusController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as EntityIdParams;
  const result = await changeRequirementStatus(
    id,
    res.locals.validated.body as UpdateRequirementStatusInput,
    auditContext(req, adminId(res)),
  );
  res.status(200).json(
    apiSuccessResponse(
      result.changed ? "Requirement status updated" : "Requirement status unchanged",
      result.entity,
    ),
  );
};

export const updateJobStatusController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as EntityIdParams;
  const result = await changeJobStatus(
    id,
    res.locals.validated.body as UpdateJobStatusInput,
    auditContext(req, adminId(res)),
  );
  res.status(200).json(
    apiSuccessResponse(
      result.changed ? "Job status updated" : "Job status unchanged",
      result.entity,
    ),
  );
};

export const updateApplicationStatusController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as EntityIdParams;
  const result = await changeApplicationStatus(
    id,
    res.locals.validated.body as UpdateApplicationStatusInput,
    auditContext(req, adminId(res)),
  );
  res.status(200).json(
    apiSuccessResponse(
      result.changed ? "Application status updated" : "Application status unchanged",
      result.entity,
    ),
  );
};
