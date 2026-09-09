import type { RequestHandler } from "express";
import { HttpError } from "../utils/http-error.js";

export const portalWrite: RequestHandler = (req, _res, next) => {
  if (req.get("X-Requested-With") !== "XMLHttpRequest") return next(new HttpError(403, "Submit this action from the portal", { code: "PORTAL_REQUEST_REQUIRED" }));
  next();
};
