import { observeOperation } from "../../observability/operation-metrics.js";
import { Prisma, TechnicalOpportunityApplicationStatus, TechnicalOpportunityStatus } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import type { TechnicalOpportunityInput, TechnicalOpportunityListQuery, TechnicalOpportunityMatchQuery, TechnicalOpportunitySubmitInput } from "./technical-opportunities.schema.js";
import {
  createTechnicalOpportunity,
  createTechnicalOpportunityApplication,
  findTechnicalOpportunity,
  findVerifiedTechnicalStudent,
  listTechnicalOpportunities,
  listVerifiedTechnicalStudentsForMatching,
  technicalOpportunitySummary,
  updateTechnicalOpportunity,
  updateTechnicalOpportunityApplicationStatus,
} from "./technical-opportunities.repository.js";

function norm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(value: string) {
  return new Set(norm(value).split(/\s+/).filter((item) => item.length > 1));
}

function fuzzyMatch(left: string, right: string) {
  const a = norm(left);
  const b = norm(right);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const at = tokens(a);
  const bt = tokens(b);
  let common = 0;
  for (const token of at) if (bt.has(token)) common += 1;
  return common >= Math.min(2, Math.max(1, Math.min(at.size, bt.size)));
}

function opportunityPreference(type: string) {
  if (type === "JOB") return "jobs";
  if (type === "INTERNSHIP") return "internships";
  if (type === "APPRENTICESHIP") return "apprenticeships";
  return "training";
}

export function scoreTechnicalStudent(opportunity: {
  opportunityType: string;
  eligibleQualifications: string[];
  eligibleTradesBranches: string[];
  eligiblePassingYears: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  eligibleStates: string[];
  city?: string | null;
  state?: string | null;
  location: string;
}, student: {
  qualification: string;
  tradeBranch: string;
  passingYear: string;
  skills: string[];
  certifications: string[];
  currentCity: string;
  currentState: string;
  preferredLocations: string[];
  preferredOpportunityTypes: string[];
}) {
  const reasons: string[] = [];
  const qualificationConstrained = opportunity.eligibleQualifications.length > 0;
  if (qualificationConstrained && !opportunity.eligibleQualifications.includes(student.qualification)) return null;

  const tradeConstrained = opportunity.eligibleTradesBranches.length > 0;
  const tradeMatched = !tradeConstrained || opportunity.eligibleTradesBranches.some((trade) => fuzzyMatch(trade, student.tradeBranch));
  if (!tradeMatched) return null;

  const yearConstrained = opportunity.eligiblePassingYears.length > 0;
  if (yearConstrained && !opportunity.eligiblePassingYears.includes(student.passingYear)) return null;

  const locationConstrained = opportunity.eligibleStates.length > 0;
  const locationText = [student.currentState, student.currentCity, ...student.preferredLocations];
  const locationMatched = !locationConstrained || opportunity.eligibleStates.some((state) => locationText.some((item) => fuzzyMatch(state, item)));
  if (!locationMatched) return null;

  const skillPool = [...student.skills, ...student.certifications];
  const requiredMatches = opportunity.requiredSkills.filter((skill) => skillPool.some((candidateSkill) => fuzzyMatch(skill, candidateSkill)));
  if (opportunity.requiredSkills.length > 0 && requiredMatches.length === 0) return null;
  const preferredMatches = opportunity.preferredSkills.filter((skill) => skillPool.some((candidateSkill) => fuzzyMatch(skill, candidateSkill)));

  let score = 55;
  if (qualificationConstrained) { score += 8; reasons.push("Qualification eligible"); }
  else reasons.push("Qualification open");
  if (tradeConstrained) { score += 12; reasons.push(`Trade match: ${student.tradeBranch}`); }
  else reasons.push(`Technical branch: ${student.tradeBranch}`);
  if (yearConstrained) { score += 7; reasons.push(`Passing batch ${student.passingYear}`); }
  if (student.preferredOpportunityTypes.includes(opportunityPreference(opportunity.opportunityType))) {
    score += 8;
    reasons.push("Opportunity preference matched");
  }
  const directLocation = [opportunity.city, opportunity.state, opportunity.location].filter((value): value is string => Boolean(value));
  if (directLocation.some((place) => locationText.some((item) => fuzzyMatch(place, item)))) {
    score += 5;
    reasons.push("Location preference aligned");
  } else if (locationConstrained) {
    score += 3;
    reasons.push("Eligible state matched");
  }
  if (opportunity.requiredSkills.length > 0) {
    score += Math.round(7 * requiredMatches.length / opportunity.requiredSkills.length);
    reasons.push(`${requiredMatches.length}/${opportunity.requiredSkills.length} required skills matched`);
  }
  if (opportunity.preferredSkills.length > 0 && preferredMatches.length > 0) {
    score += Math.round(5 * preferredMatches.length / opportunity.preferredSkills.length);
    reasons.push(`${preferredMatches.length} preferred skill${preferredMatches.length === 1 ? "" : "s"} matched`);
  }
  return { score: Math.min(100, score), reasons };
}

export async function getTechnicalOpportunityList(query: TechnicalOpportunityListQuery) {
  const [{ items, total }, summary] = await Promise.all([listTechnicalOpportunities(query), technicalOpportunitySummary()]);
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)), summary };
}

export function getTechnicalOpportunitySummary() {
  return technicalOpportunitySummary();
}

export async function getTechnicalOpportunity(id: string) {
  const opportunity = await findTechnicalOpportunity(id);
  if (!opportunity) throw new HttpError(404, "Technical opportunity not found", { code: "TECHNICAL_OPPORTUNITY_NOT_FOUND" });
  return opportunity;
}

export async function addTechnicalOpportunity(input: TechnicalOpportunityInput, context: { actorUserId: string; ipAddress?: string; userAgent?: string }) {
  const opportunity = await createTechnicalOpportunity(input, context);
  return opportunity;
}

export async function editTechnicalOpportunity(
  id: string,
  input: TechnicalOpportunityInput,
  context: { actorUserId: string; ipAddress?: string; userAgent?: string },
) {
  await getTechnicalOpportunity(id);
  const opportunity = await updateTechnicalOpportunity(id, input, context);
  if (!opportunity) throw new HttpError(404, "Technical opportunity not found", { code: "TECHNICAL_OPPORTUNITY_NOT_FOUND" });
  return opportunity;
}

export async function getTechnicalOpportunityMatches(id: string, query: TechnicalOpportunityMatchQuery) {
  const opportunity = await getTechnicalOpportunity(id);
  const { students, truncated } = await observeOperation("technical.match_candidates", () =>
    listVerifiedTechnicalStudentsForMatching(query, id, {
      eligibleQualifications: opportunity.eligibleQualifications,
      eligiblePassingYears: opportunity.eligiblePassingYears,
    }),
  );
  const scoredMatches = students.flatMap((student) => {
    const match = scoreTechnicalStudent(opportunity, student);
    if (!match || match.score < query.minScore) return [];
    return [{
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        mobileNumber: student.mobileNumber,
        qualification: student.qualification,
        tradeBranch: student.tradeBranch,
        passingYear: student.passingYear,
        skills: student.skills,
        certifications: student.certifications,
        currentCity: student.currentCity,
        currentState: student.currentState,
        preferredLocations: student.preferredLocations,
        preferredOpportunityTypes: student.preferredOpportunityTypes,
        institute: student.institute,
      },
      score: match.score,
      reasons: match.reasons,
      application: student.applications[0] ?? null,
    }];
  }).sort((a, b) => b.score - a.score || a.student.fullName.localeCompare(b.student.fullName));
  return {
    opportunity,
    matches: scoredMatches.slice(0, query.limit),
    totalMatches: scoredMatches.length,
    scannedCandidates: students.length,
    candidatePoolTruncated: truncated,
  };
}

export async function submitTechnicalStudentToOpportunity(
  id: string,
  input: TechnicalOpportunitySubmitInput,
  context: { actorUserId: string; ipAddress?: string; userAgent?: string },
) {
  const opportunity = await getTechnicalOpportunity(id);
  if (opportunity.status !== TechnicalOpportunityStatus.OPEN) {
    throw new HttpError(409, "Open the technical opportunity before submitting candidates", { code: "TECHNICAL_OPPORTUNITY_NOT_OPEN" });
  }
  if (opportunity.applicationDeadline && opportunity.applicationDeadline.getTime() < Date.now()) {
    throw new HttpError(409, "The application deadline for this opportunity has passed", { code: "TECHNICAL_OPPORTUNITY_DEADLINE_PASSED" });
  }
  const student = await findVerifiedTechnicalStudent(input.studentId);
  if (!student) throw new HttpError(404, "Verified technical student not found", { code: "TECHNICAL_STUDENT_NOT_FOUND" });
  const match = scoreTechnicalStudent(opportunity, student);
  if (!match) throw new HttpError(409, "The student does not satisfy this opportunity's eligibility rules", { code: "TECHNICAL_STUDENT_NOT_ELIGIBLE" });
  try {
    return await createTechnicalOpportunityApplication({
      opportunityId: id,
      studentId: input.studentId,
      matchScore: match.score,
      matchReasons: match.reasons,
      note: input.note,
      ...context,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "This student has already been submitted for the opportunity", { code: "TECHNICAL_OPPORTUNITY_APPLICATION_EXISTS" });
    }
    throw error;
  }
}

export async function setTechnicalOpportunityApplicationStatus(
  opportunityId: string,
  applicationId: string,
  status: keyof typeof TechnicalOpportunityApplicationStatus,
  context: { actorUserId: string; ipAddress?: string; userAgent?: string },
) {
  const opportunity = await getTechnicalOpportunity(opportunityId);
  const current = opportunity.applications.find((item) => item.id === applicationId);
  if (!current) throw new HttpError(404, "Technical opportunity application not found", { code: "TECHNICAL_OPPORTUNITY_APPLICATION_NOT_FOUND" });
  const nextStatus = TechnicalOpportunityApplicationStatus[status];
  const transitions: Record<TechnicalOpportunityApplicationStatus, TechnicalOpportunityApplicationStatus[]> = {
    SUBMITTED: [TechnicalOpportunityApplicationStatus.REVIEWED, TechnicalOpportunityApplicationStatus.SHORTLISTED, TechnicalOpportunityApplicationStatus.REJECTED],
    REVIEWED: [TechnicalOpportunityApplicationStatus.SHORTLISTED, TechnicalOpportunityApplicationStatus.REJECTED],
    SHORTLISTED: [TechnicalOpportunityApplicationStatus.SELECTED, TechnicalOpportunityApplicationStatus.REJECTED],
    SELECTED: [TechnicalOpportunityApplicationStatus.JOINED, TechnicalOpportunityApplicationStatus.REJECTED],
    REJECTED: [],
    JOINED: [],
  };
  if (current.status !== nextStatus && !transitions[current.status].includes(nextStatus)) {
    throw new HttpError(409, `Cannot move an application from ${current.status} to ${nextStatus}`, { code: "TECHNICAL_OPPORTUNITY_INVALID_STATUS_TRANSITION" });
  }
  const application = await updateTechnicalOpportunityApplicationStatus({
    opportunityId,
    applicationId,
    status: nextStatus,
    ...context,
  });
  if (!application) throw new HttpError(404, "Technical opportunity application not found", { code: "TECHNICAL_OPPORTUNITY_APPLICATION_NOT_FOUND" });
  return application;
}
