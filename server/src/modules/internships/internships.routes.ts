import express, { Router } from "express";
import { publicSubmissionRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { notifyInternshipApplicationStatus, notifyInternshipApplicationSubmitted } from "../../services/notification.service.js";
import { entityIdParamsSchema } from "../admin/admin.schema.js";
import { careerQuerySchema, careerReviewSchema, type CareerSubmission } from "../careers/careers.schema.js";
import { getCareerApplication, getCareerResume, listCareerApplications, reviewCareerApplication, submitCareerProfile, uploadCareerResume } from "../careers/careers.service.js";
import { internshipSubmissionSchema, type InternshipSubmission } from "./internships.schema.js";
import { createInternshipDocumentPaymentSchema } from "../internship-payments/internship-payments.schema.js";
import { cancelInternshipDocumentPayment, createInternshipDocumentPayment, getInternshipDocumentPayment, refreshInternshipDocumentPayment, resendInternshipDocumentReceipt } from "../internship-payments/internship-payments.service.js";

const internshipScope = {
  applicationType: "INTERNSHIP",
  tokenScope: "internship-resume",
  storageScope: "internship-resumes",
  auditPrefix: "internship",
  notFoundMessage: "Internship application not found",
} as const;

async function getInternshipApplicationWithPayment(id: string) {
  const [application, documentPayment] = await Promise.all([
    getCareerApplication(id, internshipScope),
    getInternshipDocumentPayment(id),
  ]);
  return { ...application, documentPayment };
}

function asCareerSubmission(input: InternshipSubmission): CareerSubmission {
  return {
    requestKey: input.requestKey,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    city: input.city,
    state: input.state,
    preferredRole: input.preferredRole,
    experienceYears: 0,
    education: [{
      qualification: input.qualification,
      institution: input.institution,
      fieldOfStudy: input.fieldOfStudy,
      graduationYear: input.graduationYear,
    }],
    workExperience: [],
    skills: input.skills,
    preferredLocations: [input.preferredLocation],
    availability: input.availability,
    portfolioUrl: input.portfolioUrl,
    coverNote: input.coverNote,
    consent: true,
  };
}

export const internshipsRouter = Router();
internshipsRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
internshipsRouter.post("/", publicSubmissionRateLimiter, validate({ body: internshipSubmissionSchema }), async (_req, res) => {
  const input = res.locals.validated.body as InternshipSubmission;
  const result = await submitCareerProfile(asCareerSubmission(input), internshipScope);
  if (result.created) void notifyInternshipApplicationSubmitted({
    id: result.id,
    fullName: input.fullName,
    email: input.email,
    preferredRole: input.preferredRole,
    preferredLocation: input.preferredLocation,
  }, res.locals.requestId);
  res.status(result.created ? 201 : 200).json(apiSuccessResponse("Your internship application is saved for HR review", result));
});
internshipsRouter.put("/:id/resume", publicSubmissionRateLimiter, validate({ params: entityIdParamsSchema }), express.raw({ type: "application/pdf", limit: "2mb" }), async (req, res) => {
  res.json(apiSuccessResponse("Resume attached", await uploadCareerResume(res.locals.validated.params.id, req.get("X-Upload-Token"), req.body, req.get("Content-Type"), req.get("X-File-Name"), internshipScope)));
});

export const adminInternshipsRouter = Router();
adminInternshipsRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
adminInternshipsRouter.get("/", validate({ query: careerQuerySchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Internship applications", await listCareerApplications(res.locals.validated.query, internshipScope)));
});
adminInternshipsRouter.get("/:id", validate({ params: entityIdParamsSchema }), async (_req, res) => {
  res.json(apiSuccessResponse("Internship application", await getInternshipApplicationWithPayment(res.locals.validated.params.id)));
});
adminInternshipsRouter.post("/:id/review", portalWrite, validate({ params: entityIdParamsSchema, body: careerReviewSchema }), async (_req, res) => {
  await reviewCareerApplication(res.locals.validated.params.id, res.locals.authUser.id, res.locals.validated.body, internshipScope);
  const application = await getInternshipApplicationWithPayment(res.locals.validated.params.id);
  void notifyInternshipApplicationStatus({
    id: application.id,
    fullName: application.fullName,
    email: application.email,
    preferredRole: application.preferredRole,
    status: application.status as "REVIEWED" | "SHORTLISTED" | "CONTACTED" | "HIRED" | "REJECTED",
    updatedAt: application.updatedAt,
  });
  res.json(apiSuccessResponse("Internship review saved", { application }));
});
adminInternshipsRouter.post("/:id/hard-copy-payment", portalWrite, validate({ params: entityIdParamsSchema, body: createInternshipDocumentPaymentSchema }), async (_req, res) => {
  await createInternshipDocumentPayment(res.locals.validated.params.id, res.locals.authUser.id, res.locals.validated.body);
  const documentPayment = await getInternshipDocumentPayment(res.locals.validated.params.id);
  res.status(201).json(apiSuccessResponse("Secure payment request created and shared", { documentPayment }));
});
adminInternshipsRouter.post("/:id/hard-copy-payment/cancel", portalWrite, validate({ params: entityIdParamsSchema }), async (_req, res) => {
  await cancelInternshipDocumentPayment(res.locals.validated.params.id, res.locals.authUser.id);
  const documentPayment = await getInternshipDocumentPayment(res.locals.validated.params.id);
  res.json(apiSuccessResponse("Payment request cancelled", { documentPayment }));
});
adminInternshipsRouter.post("/:id/hard-copy-payment/refresh", portalWrite, validate({ params: entityIdParamsSchema }), async (_req, res) => {
  await refreshInternshipDocumentPayment(res.locals.validated.params.id, res.locals.authUser.id);
  const documentPayment = await getInternshipDocumentPayment(res.locals.validated.params.id);
  res.json(apiSuccessResponse("Payment status refreshed from Cashfree", { documentPayment }));
});
adminInternshipsRouter.post("/:id/hard-copy-payment/resend-receipt", portalWrite, validate({ params: entityIdParamsSchema }), async (_req, res) => {
  await resendInternshipDocumentReceipt(res.locals.validated.params.id, res.locals.authUser.id);
  const documentPayment = await getInternshipDocumentPayment(res.locals.validated.params.id);
  res.json(apiSuccessResponse("Payment receipt email sent", { documentPayment }));
});

adminInternshipsRouter.get("/:id/resume", validate({ params: entityIdParamsSchema }), async (_req, res) => {
  const file = await getCareerResume(res.locals.validated.params.id, res.locals.authUser.id, internshipScope);
  res.set({ "Content-Type": file.resumeMimeType, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.resumeFileName)}`, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox", "Cache-Control": "private, no-store" });
  res.send(file.bytes);
});
