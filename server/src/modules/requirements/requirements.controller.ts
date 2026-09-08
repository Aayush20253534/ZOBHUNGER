import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type { CreateRequirementInput } from "./requirements.schema.js";
import { submitRequirement } from "./requirements.service.js";
import { notifyNewRequirement } from "../../services/notification.service.js";

export const createRequirementController: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as CreateRequirementInput;
  const requirement = await submitRequirement(input, res.locals.authUser);
  void notifyNewRequirement(requirement, res.locals.requestId);

  res.status(201).json(
    apiSuccessResponse("Your workforce requirement has been submitted.", requirement),
  );
};
