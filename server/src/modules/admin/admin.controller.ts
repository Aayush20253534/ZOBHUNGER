import type { Request, RequestHandler, Response } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type {
  EntityIdParams,
  ListAdminJobsQuery,
  ListApplicationsQuery,
  ListPartnerApplicationsQuery,
  ListPlacementCellApplicationsQuery,
  ListEnquiriesQuery,
  ListRequirementsQuery,
  UpdateApplicationStatusInput,
  UpdatePartnerApplicationStatusInput,
  UpdatePlacementCellApplicationStatusInput,
  UpdateJobStatusInput,
  UpdateRequirementStatusInput,
} from "./admin.schema.js";
import {
  changeApplicationStatus,
  changePartnerApplicationStatus,
  changeJobStatus,
  changeRequirementStatus,
  listApplicationsForAdmin,
  listPartnerApplicationsForAdmin,
  listPlacementCellApplicationsForAdmin,
  changePlacementCellApplicationStatus,
  getPartnerResumeForAdmin,
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

export const listPartnerApplicationsController: RequestHandler = async (_req, res) => {
  const data = await listPartnerApplicationsForAdmin(
    res.locals.validated.query as ListPartnerApplicationsQuery,
  );
  res.status(200).json(apiSuccessResponse("Partner applications retrieved", data));
};

export const listPlacementCellApplicationsController: RequestHandler = async (_req, res) => {
  const data = await listPlacementCellApplicationsForAdmin(
    res.locals.validated.query as ListPlacementCellApplicationsQuery,
  );
  res.status(200).json(apiSuccessResponse("Institution partnership applications retrieved", data));
};

export const downloadPartnerResumeController: RequestHandler = async (_req, res) => {
  const { id } = res.locals.validated.params as EntityIdParams;
  const resume = await getPartnerResumeForAdmin(id);
  res.set({
    "Cache-Control": "private, no-store",
    "Content-Type": resume.resumeMimeType,
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(resume.resumeFileName)}`,
    "Content-Security-Policy": "sandbox",
    "X-Content-Type-Options": "nosniff",
  });
  res.status(200).send(resume.bytes);
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


export const updatePartnerApplicationStatusController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as EntityIdParams;
  const result = await changePartnerApplicationStatus(
    id,
    res.locals.validated.body as UpdatePartnerApplicationStatusInput,
    auditContext(req, adminId(res)),
  );
  res.status(200).json(
    apiSuccessResponse(
      result.changed ? "Partner application status updated" : "Partner application status unchanged",
      result.entity,
    ),
  );
};

export const updatePlacementCellApplicationStatusController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as EntityIdParams;
  const result = await changePlacementCellApplicationStatus(
    id,
    res.locals.validated.body as UpdatePlacementCellApplicationStatusInput,
    auditContext(req, adminId(res)),
  );
  res.status(200).json(apiSuccessResponse(
    result.changed ? "Institution partnership application updated" : "Institution partnership application unchanged",
    result.entity,
  ));
};
