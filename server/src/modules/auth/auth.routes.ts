import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { loginController, logoutController, meController, placementCellLoginController, registerController } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

export const authRouter = Router();
authRouter.post("/register", authRateLimiter, validate({ body: registerSchema }), registerController);
authRouter.post("/login", authRateLimiter, validate({ body: loginSchema }), loginController);
authRouter.post("/placement-cell-login", authRateLimiter, validate({ body: loginSchema }), placementCellLoginController);
authRouter.post("/logout", logoutController);
authRouter.get("/me", requireAuth, meController);
