import { HttpError } from "../../utils/http-error.js";
import { notifyTechnicalOpportunityApplication } from "../../services/notification.service.js";
import { getTechnicalInstitutePortalProfile } from "./technical-institute-access.service.js";
import { scoreTechnicalStudent, submitTechnicalStudentToOpportunity } from "./technical-opportunities.service.js";
import {
  technicalInstitutePortalDashboard,
  technicalInstitutePortalOpportunityData,
  listTechnicalInstitutePortalApplications,
  findPortalTechnicalStudent,
  technicalInstitutePortalReportRows,
} from "./technical-institute-portal.repository.js";
import type {
  TechnicalInstitutePortalApplicationQuery,
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
  const { items, total, students, applications } = await technicalInstitutePortalOpportunityData(profile.id, query);
  const byOpportunity = new Map<string, typeof applications>();
  for (const application of applications) {
    const list = byOpportunity.get(application.opportunityId) ?? [];
    list.push(application);
    byOpportunity.set(application.opportunityId, list);
  }
  const enriched = items.map((opportunity) => {
    const matches = students.flatMap((student) => {
      const match = scoreTechnicalStudent(opportunity, student);
      if (!match || match.score < query.minScore) return [];
      const application = (byOpportunity.get(opportunity.id) ?? []).find((item) => item.studentId === student.id) ?? null;
      return [{ student, score: match.score, reasons: match.reasons, application }];
    }).sort((a, b) => b.score - a.score || a.student.fullName.localeCompare(b.student.fullName));
    return {
      ...opportunity,
      eligibleCount: matches.length,
      submittedCount: matches.filter((item) => item.application).length,
      bestMatchScore: matches[0]?.score ?? null,
      matches: matches.slice(0, 30),
    };
  });
  return { items: enriched, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
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
  const [dashboard, rows] = await Promise.all([
    technicalInstitutePortalDashboard(profile.id),
    technicalInstitutePortalReportRows(profile.id),
  ]);
  const statusCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const employerCounts: Record<string, number> = {};
  for (const row of rows) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
    typeCounts[row.opportunity.opportunityType] = (typeCounts[row.opportunity.opportunityType] ?? 0) + 1;
    employerCounts[row.opportunity.employerName] = (employerCounts[row.opportunity.employerName] ?? 0) + 1;
  }
  const conversionRate = rows.length ? Math.round((dashboard.applications.joined / rows.length) * 1000) / 10 : 0;
  return {
    profile: { institutionName: profile.institutionName, partnershipCode: profile.partnershipCode },
    dashboard,
    statusCounts,
    typeCounts,
    conversionRate,
    topEmployers: Object.entries(employerCounts).map(([employer, count]) => ({ employer, count })).sort((a, b) => b.count - a.count).slice(0, 6),
  };
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function exportTechnicalInstitutePortalReport(userId: string) {
  const profile = await getTechnicalInstitutePortalProfile(userId);
  const rows = await technicalInstitutePortalReportRows(profile.id);
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
