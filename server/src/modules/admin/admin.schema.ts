import { z } from "zod";

const paginationFields = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

const optionalSearch = z.string().trim().min(1).max(160).optional();

export const listEnquiriesQuerySchema = z.object({
  ...paginationFields,
  query: optionalSearch,
});

export const listRequirementsQuerySchema = z.object({
  ...paginationFields,
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CLOSED"]).optional(),
  query: optionalSearch,
});

export const listAdminJobsQuerySchema = z.object({
  ...paginationFields,
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]).optional(),
  query: optionalSearch,
});

export const listPartnerApplicationsQuerySchema = z.object({
  ...paginationFields,
  status: z.enum(["SUBMITTED", "REVIEWED", "CONTACTED", "CLOSED"]).optional(),
  query: optionalSearch,
});

export const listApplicationsQuerySchema = z.object({
  ...paginationFields,
  status: z.enum(["SUBMITTED", "REVIEWED", "SHORTLISTED", "REJECTED"]).optional(),
  jobId: z.string().trim().min(1).max(180).optional(),
  query: optionalSearch,
});

export const entityIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(180),
});

export const updateRequirementStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CLOSED"]),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["SUBMITTED", "REVIEWED", "SHORTLISTED", "REJECTED"]),
});

export const updatePartnerApplicationStatusSchema = z.object({
  status: z.enum(["SUBMITTED", "REVIEWED", "CONTACTED", "CLOSED"]),
});

export type ListEnquiriesQuery = z.infer<typeof listEnquiriesQuerySchema>;
export type ListRequirementsQuery = z.infer<typeof listRequirementsQuerySchema>;
export type ListAdminJobsQuery = z.infer<typeof listAdminJobsQuerySchema>;
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;
export type ListPartnerApplicationsQuery = z.infer<typeof listPartnerApplicationsQuerySchema>;
export type EntityIdParams = z.infer<typeof entityIdParamsSchema>;
export type UpdateRequirementStatusInput = z.infer<typeof updateRequirementStatusSchema>;
export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type UpdatePartnerApplicationStatusInput = z.infer<typeof updatePartnerApplicationStatusSchema>;
