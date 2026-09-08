import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { validate } from "../../middlewares/validate.middleware.js";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { recoveryEmailConfigured } from "../../services/email.service.js";
import { apiSuccessResponse, apiErrorResponse } from "../../utils/api-response.js";
import { HttpError } from "../../utils/http-error.js";
import { logger } from "../../utils/logger.js";
import { requestRecoverySchema, resetPasswordSchema } from "./password-recovery.schema.js";
import { requestBusinessRecovery, resetBusinessPassword } from "./password-recovery.service.js";

export const passwordRecoveryRouter = Router();
const recoveryLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false,
  handler: (_req, res) => { res.status(429).json(apiErrorResponse("Please wait before requesting another recovery email.", { code: "RECOVERY_RATE_LIMITED" })); },
});
passwordRecoveryRouter.post("/forgot-password", recoveryLimiter, validate({ body: requestRecoverySchema }), (_req, res) => {
  if (!recoveryEmailConfigured()) throw new HttpError(503, "Account recovery is temporarily unavailable. Please contact ZOBHUNGER support.", { code: "RECOVERY_UNAVAILABLE" });
  // The response does not reveal account existence or wait on recipient-specific delivery.
  const requestId = res.locals.requestId;
  void requestBusinessRecovery(res.locals.validated.body.email, requestId).catch(() => logger.warn("business.recovery_failed", { requestId }));
  res.status(202).json(apiSuccessResponse("If an active business account uses this email, a recovery link will be sent. Check your inbox and spam folder.", { accepted: true }));
});
passwordRecoveryRouter.post("/reset-password", authRateLimiter, validate({ body: resetPasswordSchema }), async (_req, res) => {
  const { token, password } = res.locals.validated.body;
  const result = await resetBusinessPassword(token, password);
  res.json(apiSuccessResponse("Password updated. Sign in with your new password.", result));
});
