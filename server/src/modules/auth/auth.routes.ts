import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { businessLoginController, loginController, logoutController, meController, placementCellLoginController, registerController } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { passwordRecoveryRouter } from "./password-recovery.routes.js";

export const authRouter = Router();
authRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
authRouter.post("/business-login", authRateLimiter, validate({ body: loginSchema }), businessLoginController);
authRouter.use("/business", passwordRecoveryRouter);
authRouter.post("/register", authRateLimiter, validate({ body: registerSchema }), registerController);
authRouter.post("/login", authRateLimiter, validate({ body: loginSchema }), loginController);
authRouter.post("/placement-cell-login", authRateLimiter, validate({ body: loginSchema }), placementCellLoginController);
authRouter.post("/logout", logoutController);
authRouter.get("/me", requireAuth, meController);
