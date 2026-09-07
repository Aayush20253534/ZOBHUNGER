import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type { ActivatePlacementCellInput } from "./placement-cell-access.schema.js";
import { activatePlacementCellAccount, getPlacementCellPortalProfile } from "./placement-cells.service.js";

export const activatePlacementCellController: RequestHandler = async (_req, res) => {
  const data = await activatePlacementCellAccount(res.locals.validated.body as ActivatePlacementCellInput);
  res.status(200).json(apiSuccessResponse("Institution partner account activated", data));
};

export const placementCellPortalProfileController: RequestHandler = async (_req, res) => {
  const user = res.locals.authUser as { id: string };
  const profile = await getPlacementCellPortalProfile(user.id);
  res.status(200).json(apiSuccessResponse("Institution partner profile retrieved", { profile }));
};
