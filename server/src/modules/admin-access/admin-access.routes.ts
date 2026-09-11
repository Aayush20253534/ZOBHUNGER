import { Router } from "express";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  activateAdminInvitationController,
  adminAccessConfigController,
  createAdminUserController,
  inspectAdminInvitationController,
  listAdminUsersController,
  resendAdminInvitationController,
  updateAdminAccessController,
  updateAdminStatusController,
} from "./admin-access.controller.js";
import {
  activateAdminInvitationSchema,
  adminUserParamsSchema,
  createAdminUserSchema,
  inspectAdminInvitationSchema,
  listAdminUsersQuerySchema,
  updateAdminAccessSchema,
  updateAdminStatusSchema,
} from "./admin-access.schema.js";

/** Mounted after ADMIN auth, MFA and ADMIN_USERS_MANAGE permission. */
export const adminAccessRouter = Router();
adminAccessRouter.get("/config", adminAccessConfigController);
adminAccessRouter.get("/users", validate({ query: listAdminUsersQuerySchema }), listAdminUsersController);
adminAccessRouter.post("/users", portalWrite, validate({ body: createAdminUserSchema }), createAdminUserController);
adminAccessRouter.patch("/users/:id/access", portalWrite, validate({ params: adminUserParamsSchema, body: updateAdminAccessSchema }), updateAdminAccessController);
adminAccessRouter.patch("/users/:id/status", portalWrite, validate({ params: adminUserParamsSchema, body: updateAdminStatusSchema }), updateAdminStatusController);
adminAccessRouter.post("/users/:id/invitation", portalWrite, validate({ params: adminUserParamsSchema }), resendAdminInvitationController);

/** Public one-time activation endpoints. Token possession is the credential. */
export const adminInvitationRouter = Router();
adminInvitationRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); res.set("Referrer-Policy", "no-referrer"); next(); });
adminInvitationRouter.post("/inspect", validate({ body: inspectAdminInvitationSchema }), inspectAdminInvitationController);
adminInvitationRouter.post("/activate", portalWrite, validate({ body: activateAdminInvitationSchema }), activateAdminInvitationController);
