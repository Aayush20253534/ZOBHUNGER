import type { RequestHandler } from "express";
import { isAllowedOrigin } from "../config/cors.js";
import { HttpError } from "../utils/http-error.js";

export const portalWrite: RequestHandler = (req, _res, next) => {
  if (req.get("X-Requested-With") !== "XMLHttpRequest") return next(new HttpError(403, "Submit this action from the portal", { code: "PORTAL_REQUEST_REQUIRED" }));
  const fetchSite = req.get("Sec-Fetch-Site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return next(new HttpError(403, "Cross-site portal writes are not allowed", { code: "CROSS_SITE_WRITE_BLOCKED" }));
  const origin = req.get("Origin");
  if (origin && !isAllowedOrigin(origin)) return next(new HttpError(403, "This origin cannot modify portal data", { code: "ORIGIN_NOT_ALLOWED" }));
  next();
};
