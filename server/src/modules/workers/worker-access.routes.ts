import { Router } from "express";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { HttpError } from "../../utils/http-error.js";
import { logger } from "../../utils/logger.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { workerEmailConfigured } from "../../services/worker-email.service.js";
import { setAuthCookie } from "../auth/auth.controller.js";
import { consumeWorkerToken, loginWorker, requestWorkerEmail } from "./worker-access.service.js";
import { workerEmailSchema, workerLoginSchema, workerResetSchema, workerTokenSchema } from "./workers.schema.js";

export const workerAccessRouter = Router();
workerAccessRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
workerAccessRouter.use(authRateLimiter, portalWrite);
workerAccessRouter.post("/register", (_req, _res) => {
  throw new HttpError(403, "Worker self-registration is closed. Submit your profile for review first; approved workers receive next-step communication from our team.", { code: "WORKER_REVIEW_REQUIRED" });
});
workerAccessRouter.post("/login", validate({ body: workerLoginSchema }), async (_req, res) => {
  const { email, password } = res.locals.validated.body; const user = await loginWorker(email, password);
  setAuthCookie(res, user); res.json(apiSuccessResponse("Worker signed in", { user }));
});
for (const [path, purpose] of [["/resend-verification", "EMAIL_VERIFICATION"], ["/forgot-password", "PASSWORD_RESET"]] as const) {
  workerAccessRouter.post(path, validate({ body: workerEmailSchema }), async (_req, res) => {
    if (!workerEmailConfigured()) throw new HttpError(503, "Email is temporarily unavailable. Try again later or contact our team.", { code: "WORKER_EMAIL_UNAVAILABLE" });
    const { email, next } = res.locals.validated.body;
    res.status(202).json(apiSuccessResponse("If an eligible worker account needs this email, a link will be sent. Please check your inbox and spam folder.", { accepted: true }));
    // Keep both the response and provider latency independent of account existence.
    const requestId = res.locals.requestId;
    void requestWorkerEmail(email, purpose, next, requestId).catch(() => logger.warn("worker.email_request_failed", { requestId }));
  });
}
workerAccessRouter.post("/verify-email", validate({ body: workerTokenSchema }), async (_req, res) => res.json(apiSuccessResponse("Worker email verified", await consumeWorkerToken(res.locals.validated.body.token, "EMAIL_VERIFICATION"))));
workerAccessRouter.post("/reset-password", validate({ body: workerResetSchema }), async (_req, res) => res.json(apiSuccessResponse("Worker password reset. Sign in with your new password.", await consumeWorkerToken(res.locals.validated.body.token, "PASSWORD_RESET", res.locals.validated.body.password))));
