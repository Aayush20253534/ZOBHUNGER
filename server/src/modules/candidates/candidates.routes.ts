import { Router, type RequestHandler } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { HttpError } from "../../utils/http-error.js";
import { candidateParams, candidateQuery, historyQuery, lookupQuery, reviewCandidateSchema, revokeCandidateSchema, shareCandidateSchema,
  type CandidateQuery, type LookupQuery, type ReviewCandidateInput, type ShareCandidateInput } from "./candidates.schema.js";
import { candidateDetail, candidateLookups, listCandidates, reviewCandidate, revokeCandidate, shareCandidate } from "./candidates.service.js";

const privateResponse: RequestHandler = (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); };
const portalWrite: RequestHandler = (req, _res, next) => {
  if (req.get("X-Requested-With") !== "XMLHttpRequest") return next(new HttpError(403, "Submit this review from the portal.", { code: "PORTAL_REQUEST_REQUIRED" }));
  next();
};
export const businessCandidatesRouter = Router();
businessCandidatesRouter.use(privateResponse);
const business = [requireAuth, requireRole("BUSINESS")];
businessCandidatesRouter.get("/", ...business, validate({ query: candidateQuery }), async (_req, res) => {
  res.json(apiSuccessResponse("Candidate pipeline retrieved", await listCandidates({ userId: res.locals.authUser.id, admin: false }, res.locals.validated.query as CandidateQuery)));
});
businessCandidatesRouter.get("/:id", ...business, validate({ params: candidateParams, query: historyQuery }), async (_req, res) => {
  res.json(apiSuccessResponse("Candidate profile retrieved", await candidateDetail({ userId: res.locals.authUser.id, admin: false }, res.locals.validated.params.id, res.locals.validated.query.historyPage)));
});
businessCandidatesRouter.post("/:id/reviews", ...business, portalWrite, validate({ params: candidateParams, body: reviewCandidateSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Review recorded", await reviewCandidate({ userId: res.locals.authUser.id, admin: false }, res.locals.validated.params.id, res.locals.validated.body as ReviewCandidateInput)));
});

// Mounted beneath the existing ADMIN guard. No candidate data is public.
export const adminCandidatesRouter = Router();
adminCandidatesRouter.use(privateResponse);
adminCandidatesRouter.get("/", validate({ query: candidateQuery }), async (_req, res) => {
  res.json(apiSuccessResponse("Shared candidates retrieved", await listCandidates({ userId: res.locals.authUser.id, admin: true }, res.locals.validated.query as CandidateQuery)));
});
for (const kind of ["requirements", "applications"] as const) adminCandidatesRouter.get(`/${kind}`, validate({ query: lookupQuery }), async (_req, res) => {
  res.json(apiSuccessResponse("Sharing options retrieved", await candidateLookups(kind, res.locals.validated.query as LookupQuery)));
});
adminCandidatesRouter.post("/", portalWrite, validate({ body: shareCandidateSchema }), async (_req, res) => {
  const result = await shareCandidate(res.locals.authUser.id, res.locals.validated.body as ShareCandidateInput);
  res.status(result.created ? 201 : 200).json(apiSuccessResponse(result.created ? "Candidate shared" : "Candidate already shared", result));
});
adminCandidatesRouter.get("/:id", validate({ params: candidateParams, query: historyQuery }), async (_req, res) => {
  res.json(apiSuccessResponse("Candidate review retrieved", await candidateDetail({ userId: res.locals.authUser.id, admin: true }, res.locals.validated.params.id, res.locals.validated.query.historyPage)));
});
adminCandidatesRouter.post("/:id/revoke", portalWrite, validate({ params: candidateParams, body: revokeCandidateSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Business access revoked", await revokeCandidate(res.locals.authUser.id, res.locals.validated.params.id, res.locals.validated.body)));
});
