import { observeOperation } from "../../observability/operation-metrics.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http-error.js";
import { notifyTechnicalOpportunityApplication } from "../../services/notification.service.js";
import { getTechnicalInstitutePortalProfile } from "./technical-institute-access.service.js";
import { getTechnicalOpportunityMatches, submitTechnicalStudentToOpportunity } from "./technical-opportunities.service.js";
import {
  technicalInstitutePortalDashboard,
  technicalInstitutePortalOpportunityData,
  listTechnicalInstitutePortalApplications,
  findPortalTechnicalStudent,
  technicalInstitutePortalReportRows,
  technicalInstitutePortalReportSummary,
} from "./technical-institute-portal.repository.js";
import type {
  TechnicalInstitutePortalApplicationQuery,
  TechnicalInstitutePortalMatchQuery,
  TechnicalInstitutePortalOpportunityQuery,
  TechnicalInstitutePortalSubmitInput,
} from "./technical-institute-portal.schema.js";
import {
  addTechnicalStudentForAdmin,
  editTechnicalStudentForAdmin,
  getTechnicalStudentsForAdmin,
  importTechnicalStudentsForAdmin,
  setTechnicalStudentStatusForAdmin,
} from "./technical-students.service.js";
import type { TechnicalStudentAdminListQuery, TechnicalStudentCoreInput, TechnicalStudentImportQuery } from "./technical-students.schema.js";

export async function getTechnicalInstitutePortalDashboard(userId: string) {
  const profile = await getTechnicalInstitutePortalProfile(userId);
  const dashboard = await technicalInstitutePortalDashboard(profile.id);
  return { profile, ...dashboard };
}

export async function getTechnicalInstitutePortalStudents(userId: string, query: TechnicalStudentAdminListQuery) {
  const profile = await getTechnicalInstitutePortalProfile(userId);
  return getTechnicalStudentsForAdmin(profile.id, query);
}

export async function addTechnicalInstitutePortalStudent(
  userId: string,
  input: TechnicalStudentCoreInput,
  context: { actorUserId: string; ipAddress?: string; userAgent?: string },
) {
  const profile = await getTechnicalInstitutePortalProfile(userId);
  return addTechnicalStudentForAdmin(profile.id, input, { ...context, source: "INSTITUTE_PORTAL" });
}

export async function editTechnicalInstitutePortalStudent(
  userId: string,
  studentId: string,
  input: TechnicalStudentCoreInput,
  context: { actorUserId: string; ipAddress?: string; userAgent?: string },
) {
  const profile = await getTechnicalInstitutePortalProfile(userId);
  return editTechnicalStudentForAdmin(profile.id, studentId, input, context);
}

export async function setTechnicalInstitutePortalStudentStatus(
  userId: string,
  studentId: string,
  status: "PENDING" | "VERIFIED" | "INACTIVE",
  context: { actorUserId: string; ipAddress?: string; userAgent?: string },
) {
  const profile = await getTechnicalInstitutePortalProfile(userId);
  return setTechnicalStudentStatusForAdmin(profile.id, studentId, status, context);
}

export async function importTechnicalInstitutePortalStudents(input: {
  userId: string;
  mode: TechnicalStudentImportQuery["mode"];
  buffer: Buffer;
  mimeType?: string;
  fileName?: string;
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const profile = await getTechnicalInstitutePortalProfile(input.userId);
  const { userId: _userId, ...importInput } = input;
  return importTechnicalStudentsForAdmin({ instituteId: profile.id, ...importInput });
}

export async function getTechnicalInstitutePortalOpportunities(userId: string, query: TechnicalInstitutePortalOpportunityQuery) {
  const profile = await getTechnicalInstitutePortalProfile(userId);
  const { items, total, applicationCounts } = await technicalInstitutePortalOpportunityData(profile.id, query);
  const submittedByOpportunity = new Map(applicationCounts.map((row) => [row.opportunityId, row._count._all]));
  return {
    items: items.map((opportunity) => ({
      ...opportunity,
      submittedCount: submittedByOpportunity.get(opportunity.id) ?? 0,
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getTechnicalInstitutePortalOpportunityMatches(
  userId: string,
  opportunityId: string,
  query: TechnicalInstitutePortalMatchQuery,
) {
  const profile = await getTechnicalInstitutePortalProfile(userId);
  const result = await getTechnicalOpportunityMatches(opportunityId, {
    ...query,
    instituteId: profile.id,
  });
  return {
    matches: result.matches,
    totalMatches: result.totalMatches,
    scannedCandidates: result.scannedCandidates,
    candidatePoolTruncated: result.candidatePoolTruncated,
  };
}

export async function submitTechnicalInstitutePortalCandidate(
  userId: string,
  opportunityId: string,
  input: TechnicalInstitutePortalSubmitInput,
  context: { actorUserId: string; ipAddress?: string; userAgent?: string },
  requestId?: string,
) {
  const profile = await getTechnicalInstitutePortalProfile(userId);
  const student = await findPortalTechnicalStudent(profile.id, input.studentId);
  if (!student) {
    throw new HttpError(404, "This student is not part of your technical institute roster", { code: "TECHNICAL_STUDENT_NOT_IN_INSTITUTE" });
  }
  if (student.status !== "VERIFIED") {
    throw new HttpError(409, "Verify the student profile before submitting it to an opportunity", { code: "TECHNICAL_STUDENT_VERIFICATION_REQUIRED" });
  }
  const application = await submitTechnicalStudentToOpportunity(opportunityId, input, context);
  void notifyTechnicalOpportunityApplication(application, requestId);
  return application;
}

export async function getTechnicalInstitutePortalApplications(userId: string, query: TechnicalInstitutePortalApplicationQuery) {
  const profile = await getTechnicalInstitutePortalProfile(userId);
  const { items, total } = await listTechnicalInstitutePortalApplications(profile.id, query);
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
}

export async function getTechnicalInstitutePortalReports(userId: string) {
  const profile = await getTechnicalInstitutePortalProfile(userId);
  const [dashboard, summary] = await Promise.all([
    technicalInstitutePortalDashboard(profile.id),
    technicalInstitutePortalReportSummary(profile.id),
  ]);
  const conversionRate = dashboard.applications.total
    ? Math.round((dashboard.applications.joined / dashboard.applications.total) * 1000) / 10
    : 0;
  return {
    profile: { institutionName: profile.institutionName, partnershipCode: profile.partnershipCode },
    dashboard,
    statusCounts: summary.statusCounts,
    typeCounts: summary.typeCounts,
    conversionRate,
    topEmployers: summary.topEmployers,
  };
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function exportTechnicalInstitutePortalReport(userId: string) {
  const profile = await getTechnicalInstitutePortalProfile(userId);
  const rows = await observeOperation("technical.report_export_rows", () => technicalInstitutePortalReportRows(profile.id, env.TECHNICAL_REPORT_EXPORT_MAX_ROWS + 1));
  if (rows.length > env.TECHNICAL_REPORT_EXPORT_MAX_ROWS) {
    throw new HttpError(413, `This report exceeds the ${env.TECHNICAL_REPORT_EXPORT_MAX_ROWS.toLocaleString("en-IN")} row export safety limit. Narrow the dataset before exporting.`, { code: "TECHNICAL_REPORT_EXPORT_TOO_LARGE" });
  }
  const header = ["Student", "Email", "Mobile", "Qualification", "Trade / Branch", "Passing Year", "Opportunity", "Employer", "Type", "Location", "Compensation", "Match Score", "Status", "Submitted", "Updated", "Joined"];
  const body = rows.map((row) => [
    row.student.fullName,
    row.student.email,
    row.student.mobileNumber,
    row.student.qualification,
    row.student.tradeBranch,
    row.student.passingYear,
    row.opportunity.title,
    row.opportunity.employerName,
    row.opportunity.opportunityType,
    row.opportunity.location,
    row.opportunity.compensation ?? "",
    row.matchScore,
    row.status,
    row.createdAt.toISOString(),
    row.updatedAt.toISOString(),
    row.joinedAt?.toISOString() ?? "",
  ]);
  return {
    fileName: `${(profile.partnershipCode ?? "technical-institute").toLowerCase()}-placement-report.csv`,
    csv: `\uFEFF${[header, ...body].map((row) => row.map(csvCell).join(",")).join("\r\n")}`,
  };
}
