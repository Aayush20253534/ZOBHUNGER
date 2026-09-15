import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type { ActivateTechnicalInstituteInput } from "./technical-institute-access.schema.js";
import { activateTechnicalInstituteAccount, getTechnicalInstitutePortalProfile } from "./technical-institute-access.service.js";

export const activateTechnicalInstituteController: RequestHandler = async (_req, res) => {
  const data = await activateTechnicalInstituteAccount(res.locals.validated.body as ActivateTechnicalInstituteInput);
  res.status(200).json(apiSuccessResponse("Technical institute partner account activated", data));
};

export const technicalInstitutePortalProfileController: RequestHandler = async (_req, res) => {
  const user = res.locals.authUser as { id: string };
  const profile = await getTechnicalInstitutePortalProfile(user.id);
  res.status(200).json(apiSuccessResponse("Technical institute partner profile retrieved", { profile }));
};
