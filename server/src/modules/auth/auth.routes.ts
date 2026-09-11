import { requireRole } from "../../middlewares/role.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { Router } from "express";
import { requirePasswordChangeSession } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { adminMfaConfirmController, adminMfaSetupController, changeBusinessPasswordController, businessLoginController, loginController, logoutController, meController, placementCellLoginController, registerController } from "./auth.controller.js";
import { adminMfaConfirmSchema, businessLoginSchema, changeBusinessPasswordSchema, loginSchema, registerSchema } from "./auth.schema.js";
import { passwordRecoveryRouter } from "./password-recovery.routes.js";
import { workerAccessRouter } from "../workers/worker-access.routes.js";
import { adminInvitationRouter } from "../admin-access/admin-access.routes.js";

export const authRouter = Router();
authRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
authRouter.use("/worker", workerAccessRouter);
authRouter.use("/admin-access", authRateLimiter, adminInvitationRouter);
authRouter.post("/business-login", authRateLimiter, validate({ body: businessLoginSchema }), businessLoginController);
authRouter.use("/business", passwordRecoveryRouter);
authRouter.post("/register", authRateLimiter, validate({ body: registerSchema }), registerController);
authRouter.post("/login", authRateLimiter, validate({ body: loginSchema }), loginController);
authRouter.post("/placement-cell-login", authRateLimiter, validate({ body: loginSchema }), placementCellLoginController);
authRouter.post("/logout", portalWrite, logoutController);
authRouter.get("/me", requirePasswordChangeSession, meController);
authRouter.post("/admin-mfa/setup", requirePasswordChangeSession, requireRole("ADMIN"), portalWrite, adminMfaSetupController);
authRouter.post("/admin-mfa/confirm", requirePasswordChangeSession, requireRole("ADMIN"), portalWrite, validate({ body: adminMfaConfirmSchema }), adminMfaConfirmController);

authRouter.post("/business/change-password", authRateLimiter, requirePasswordChangeSession, requireRole("BUSINESS"), portalWrite, validate({ body: changeBusinessPasswordSchema }), changeBusinessPasswordController);
