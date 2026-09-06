import assert from "node:assert/strict";
import test from "node:test";
import {
  listApplicationsQuerySchema,
  listRequirementsQuerySchema,
  updateApplicationStatusSchema,
  updateJobStatusSchema,
  updateRequirementStatusSchema,
} from "../src/modules/admin/admin.schema.js";
import { listArticlesQuerySchema } from "../src/modules/articles/articles.schema.js";

test("admin pagination is coerced and bounded", () => {
  const parsed = listRequirementsQuerySchema.parse({ page: "3", pageSize: "50", status: "NEW" });
  assert.equal(parsed.page, 3);
  assert.equal(parsed.pageSize, 50);
  assert.equal(parsed.status, "NEW");

  assert.equal(listRequirementsQuerySchema.safeParse({ pageSize: 101 }).success, false);
});

test("admin status schemas reject unsupported values", () => {
  assert.equal(updateRequirementStatusSchema.safeParse({ status: "ARCHIVED" }).success, false);
  assert.equal(updateJobStatusSchema.safeParse({ status: "PUBLISHED" }).success, false);
  assert.equal(updateApplicationStatusSchema.safeParse({ status: "HIRED" }).success, false);
});

test("application admin filters accept supported status and job reference", () => {
  const parsed = listApplicationsQuerySchema.parse({ status: "SHORTLISTED", jobId: "field-sales-executive" });
  assert.equal(parsed.status, "SHORTLISTED");
  assert.equal(parsed.jobId, "field-sales-executive");
});

test("article query applies pagination defaults", () => {
  const parsed = listArticlesQuerySchema.parse({});
  assert.equal(parsed.page, 1);
  assert.equal(parsed.pageSize, 6);
});
