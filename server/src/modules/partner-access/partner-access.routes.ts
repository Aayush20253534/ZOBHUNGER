import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { entityIdParamsSchema } from "../admin/admin.schema.js";
import { partnerReviewQuery, partnerReviewSchema, reissueCredentialsSchema } from "./partner-access.schema.js";
import { getPartnerReview, listPartnerReviews, reissuePartnerCredentials, reviewPartner } from "./partner-access.service.js";

// Mounted behind the admin router's authentication and role checks.
export const adminPartnerAccessRouter = Router();
adminPartnerAccessRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
adminPartnerAccessRouter.get("/", validate({ query: partnerReviewQuery }), async (_req, res) => {
  res.json(apiSuccessResponse("Partner applications", await listPartnerReviews(res.locals.validated.query)));
});
adminPartnerAccessRouter.get("/:id", validate({ params: entityIdParamsSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Partner application", await getPartnerReview(res.locals.validated.params.id)));
});
adminPartnerAccessRouter.post("/:id/review", portalWrite, validate({ params: entityIdParamsSchema, body: partnerReviewSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Partner review saved", await reviewPartner(res.locals.validated.params.id, res.locals.authUser.id, res.locals.validated.body)));
});
adminPartnerAccessRouter.post("/:id/credentials", portalWrite, validate({ params: entityIdParamsSchema, body: reissueCredentialsSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Temporary credentials reissued", await reissuePartnerCredentials(res.locals.validated.params.id, res.locals.authUser.id, res.locals.validated.body.expectedUpdatedAt)));
});
