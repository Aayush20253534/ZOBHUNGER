import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { notifyNewPartnerApplication } from "../../services/notification.service.js";
import type { CreatePartnerApplicationInput } from "./partners.schema.js";
import { submitPartnerApplication, uploadPartnerResume } from "./partners.service.js";

export const createPartnerApplicationController: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as CreatePartnerApplicationInput;
  const application = await submitPartnerApplication(input);
  if (application.created) void notifyNewPartnerApplication({ ...application, ...input }, res.locals.requestId);

  res.status(application.created ? 201 : 200).json(
    apiSuccessResponse("Your partner application has been submitted.", application),
  );
};

export const uploadPartnerResumeController: RequestHandler = async (req, res) => {
  const id = req.params.id as string;
  const result = await uploadPartnerResume({
    id,
    uploadToken: req.get("x-upload-token"),
    fileName: req.get("x-file-name"),
    mimeType: req.get("content-type"),
    body: req.body as Buffer,
  });

  res.status(200).json(apiSuccessResponse("Resume uploaded successfully.", result));
};
