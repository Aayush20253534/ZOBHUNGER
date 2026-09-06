import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type { CreateEnquiryInput } from "./enquiries.schema.js";
import { submitEnquiry } from "./enquiries.service.js";

export const createEnquiryController: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as CreateEnquiryInput;
  const enquiry = await submitEnquiry(input);

  res.status(201).json(
    apiSuccessResponse("Thanks. Your enquiry has been submitted.", enquiry),
  );
};
