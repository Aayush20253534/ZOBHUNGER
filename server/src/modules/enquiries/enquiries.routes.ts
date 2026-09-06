import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { createEnquiryController } from "./enquiries.controller.js";
import { createEnquirySchema } from "./enquiries.schema.js";

export const enquiriesRouter = Router();
enquiriesRouter.post("/", validate({ body: createEnquirySchema }), createEnquiryController);
