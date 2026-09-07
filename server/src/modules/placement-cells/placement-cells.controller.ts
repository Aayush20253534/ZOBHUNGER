import type { RequestHandler } from "express";
import { notifyNewPlacementCellApplication } from "../../services/notification.service.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type { CreatePlacementCellApplicationInput } from "./placement-cells.schema.js";
import { submitPlacementCellApplication } from "./placement-cells.service.js";

export const createPlacementCellApplicationController: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as CreatePlacementCellApplicationInput;
  const application = await submitPlacementCellApplication(input);
  void notifyNewPlacementCellApplication({ ...application, ...input }, res.locals.requestId);
  res.status(201).json(apiSuccessResponse(
    "Your Placement Cell onboarding request has been submitted for review.",
    application,
  ));
};
