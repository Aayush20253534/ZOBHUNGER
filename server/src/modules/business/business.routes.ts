import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { HttpError } from "../../utils/http-error.js";
import { businessProfileSchema, type BusinessProfileInput } from "./business.schema.js";
import { getBusinessProfile, saveBusinessProfile } from "./business.service.js";
import { dashboardQuerySchema, requirementIdSchema, type DashboardQuery } from "./business-dashboard.schema.js";
import { getBusinessDashboard, getBusinessRequirement } from "./business-dashboard.service.js";

export const businessRouter = Router();
businessRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
// Guard real routes individually so missing routes still return 404. Build and
// deployment probes must not mistake a router-wide 401 for a mounted endpoint.
const businessAccess = [requireAuth, requireRole("BUSINESS")];
businessRouter.get("/workspace", ...businessAccess, async (_req, res) => {
  const user = res.locals.authUser;
  const profile = await getBusinessProfile(user.id);
  res.json(apiSuccessResponse("Business workspace retrieved", { user, profile }));
});
businessRouter.get("/profile", ...businessAccess, async (_req, res) => {
  const profile = await getBusinessProfile(res.locals.authUser.id);
  res.json(apiSuccessResponse("Company profile retrieved", { profile }));
});
businessRouter.put("/profile", ...businessAccess, (req, _res, next) => {
  // A cross-site HTML form cannot supply this header. CORS allows only configured origins.
  if (req.get("X-Requested-With") !== "XMLHttpRequest") return next(new HttpError(403, "Please submit this form from the business portal", { code: "PORTAL_REQUEST_REQUIRED" }));
  next();
}, validate({ body: businessProfileSchema }), async (_req, res) => {
  const profile = await saveBusinessProfile(res.locals.authUser.id, res.locals.validated.body as BusinessProfileInput);
  res.json(apiSuccessResponse("Company profile saved", { profile }));
});
businessRouter.get("/dashboard", ...businessAccess, validate({ query: dashboardQuerySchema }), async (_req, res) => {
  const data = await getBusinessDashboard(res.locals.authUser.id, res.locals.validated.query as DashboardQuery);
  res.json(apiSuccessResponse("Business dashboard retrieved", data));
});
businessRouter.get("/requirements/:id", ...businessAccess, validate({ params: requirementIdSchema }), async (_req, res) => {
  const { id } = res.locals.validated.params as { id: string };
  res.json(apiSuccessResponse("Requirement retrieved", await getBusinessRequirement(res.locals.authUser.id, id)));
});
