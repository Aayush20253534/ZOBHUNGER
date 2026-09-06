import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type {
  CreateJobApplicationInput,
  JobApplicationParams,
  JobSlugParams,
  ListJobsQuery,
} from "./jobs.schema.js";
import {
  getPublicJob,
  listPublicJobs,
  submitJobApplication,
} from "./jobs.service.js";

export const listJobsController: RequestHandler = async (_req, res) => {
  const query = res.locals.validated.query as ListJobsQuery;
  const jobs = await listPublicJobs(query);

  res.status(200).json(apiSuccessResponse("Jobs retrieved", jobs));
};

export const getJobController: RequestHandler = async (_req, res) => {
  const { slug } = res.locals.validated.params as JobSlugParams;
  const job = await getPublicJob(slug);

  res.status(200).json(apiSuccessResponse("Job retrieved", job));
};

export const createJobApplicationController: RequestHandler = async (_req, res) => {
  const { jobId } = res.locals.validated.params as JobApplicationParams;
  const input = res.locals.validated.body as CreateJobApplicationInput;
  const application = await submitJobApplication(jobId, input);

  res.status(201).json(
    apiSuccessResponse("Your application has been submitted.", application),
  );
};
