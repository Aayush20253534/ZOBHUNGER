import type { Request, RequestHandler, Response } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import {
  activateAdminInvitation,
  adminAccessConfiguration,
  createDepartmentAdmin,
  inspectAdminInvitation,
  listAdminUsers,
  resendDepartmentAdminInvitation,
  updateDepartmentAdminAccess,
  updateDepartmentAdminStatus,
} from "./admin-access.service.js";
import type {
  ActivateAdminInvitationInput,
  AdminUserParams,
  CreateAdminUserInput,
  InspectAdminInvitationInput,
  ListAdminUsersQuery,
  UpdateAdminAccessInput,
  UpdateAdminStatusInput,
} from "./admin-access.schema.js";

function actorId(res: Response) {
  return (res.locals.authUser as { id: string }).id;
}
function audit(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get("user-agent")?.slice(0, 500) };
}

export const adminAccessConfigController: RequestHandler = async (_req, res) => {
  res.json(apiSuccessResponse("Administrator access configuration", adminAccessConfiguration()));
};

export const listAdminUsersController: RequestHandler = async (_req, res) => {
  res.json(apiSuccessResponse("Administrator accounts retrieved", await listAdminUsers(res.locals.validated.query as ListAdminUsersQuery)));
};

export const createAdminUserController: RequestHandler = async (req, res) => {
  const result = await createDepartmentAdmin(res.locals.validated.body as CreateAdminUserInput, actorId(res), audit(req));
  res.status(201).json(apiSuccessResponse(result.invitationDelivered ? "Administrator invitation sent" : "Administrator created; invitation email delivery is pending", result));
};

export const updateAdminAccessController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as AdminUserParams;
  const result = await updateDepartmentAdminAccess(id, res.locals.validated.body as UpdateAdminAccessInput, actorId(res), audit(req));
  res.json(apiSuccessResponse("Administrator access updated", result));
};

export const updateAdminStatusController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as AdminUserParams;
  const body = res.locals.validated.body as UpdateAdminStatusInput;
  const result = await updateDepartmentAdminStatus(id, body.isActive, actorId(res), audit(req));
  res.json(apiSuccessResponse(body.isActive ? "Administrator enabled" : "Administrator disabled", result));
};

export const resendAdminInvitationController: RequestHandler = async (req, res) => {
  const { id } = res.locals.validated.params as AdminUserParams;
  const result = await resendDepartmentAdminInvitation(id, actorId(res), audit(req));
  res.json(apiSuccessResponse(result.delivered ? "Fresh administrator invitation sent" : "Fresh invitation created; email delivery is pending", result));
};

export const inspectAdminInvitationController: RequestHandler = async (_req, res) => {
  const body = res.locals.validated.body as InspectAdminInvitationInput;
  res.json(apiSuccessResponse("Administrator invitation verified", await inspectAdminInvitation(body.token)));
};

export const activateAdminInvitationController: RequestHandler = async (req, res) => {
  const body = res.locals.validated.body as ActivateAdminInvitationInput;
  res.json(apiSuccessResponse("Administrator account activated", await activateAdminInvitation(body.token, body.password, audit(req))));
};
