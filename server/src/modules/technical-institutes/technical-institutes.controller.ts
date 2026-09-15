import type { RequestHandler } from "express";
import { notifyNewTechnicalInstituteApplication } from "../../services/notification.service.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type { CreateTechnicalInstituteApplicationInput } from "./technical-institutes.schema.js";
import { submitTechnicalInstituteApplication } from "./technical-institutes.service.js";

export const createTechnicalInstituteApplicationController: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as CreateTechnicalInstituteApplicationInput;
  const application = await submitTechnicalInstituteApplication(input);
  void notifyNewTechnicalInstituteApplication({ ...application, ...input }, res.locals.requestId);
  res.status(201).json(apiSuccessResponse(
    "Your ITI & Polytechnic College Cell partnership request has been submitted for review.",
    application,
  ));
};
