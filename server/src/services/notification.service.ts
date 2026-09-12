import { env } from "../config/env.js";
import { sendCorporateEmail } from "./email.service.js";

type Department = "MAIN_ADMIN" | "HR" | "TECHNICAL" | "PLACEMENT_CELL" | "LEGAL";

function publicApp(path = "/") {
  const origin = env.PUBLIC_APP_URL ?? env.CLIENT_ORIGIN.split(",")[0].trim();
  return new URL(path, origin.endsWith("/") ? origin : `${origin}/`).toString();
}

function teamEmail(department: Department) {
  switch (department) {
    case "HR": return env.HR_TEAM_EMAIL;
    case "TECHNICAL": return env.TECH_TEAM_EMAIL;
    case "PLACEMENT_CELL": return env.PLACEMENT_TEAM_EMAIL;
    case "LEGAL": return env.LEGAL_TEAM_EMAIL;
    default: return env.SALES_TEAM_EMAIL;
  }
}

function enquiryDepartment(service?: string | null): Department {
  if (service === "legal-privacy-compliance") return "LEGAL";
  if (service === "website-application-development") return "TECHNICAL";
  return "MAIN_ADMIN";
}

function reference(value: string) {
  return value.length > 18 ? value.slice(-12).toUpperCase() : value.toUpperCase();
}

function statusWords(status: string) {
  return status.toLowerCase().replaceAll("_", " ").replace(/(^|\s)\S/g, char => char.toUpperCase());
}

async function sendInternalCaseEmail(input: {
  department: Department;
  subject: string;
  title: string;
  intro: string;
  referenceId: string;
  details?: Array<{ label: string; value: string }>;
  requestId?: string;
  idempotencyKey: string;
}) {
  const recipient = teamEmail(input.department);
  if (!recipient) return false;
  return sendCorporateEmail({
    to: recipient,
    subject: input.subject,
    requestId: input.requestId,
    idempotencyKey: input.idempotencyKey,
    content: {
      eyebrow: `${statusWords(input.department)} operations`,
      title: input.title,
      intro: input.intro,
      details: [{ label: "Reference", value: reference(input.referenceId) }, ...(input.details ?? [])],
      action: { label: "Open Requests & Intake", url: publicApp("/admin/intake") },
      note: "This message is for internal operational follow-up. Review the source record in the secure Admin Portal before taking action.",
      signoff: "ZOBHUNGER Operations",
    },
  });
}

async function sendReceipt(input: {
  to: string;
  subject: string;
  eyebrow: string;
  title: string;
  intro: string;
  referenceId: string;
  details?: Array<{ label: string; value: string }>;
  paragraphs?: string[];
  action?: { label: string; url: string };
  note?: string;
  requestId?: string;
  idempotencyKey: string;
}) {
  return sendCorporateEmail({
    to: input.to,
    subject: input.subject,
    requestId: input.requestId,
    idempotencyKey: input.idempotencyKey,
    content: {
      eyebrow: input.eyebrow,
      title: input.title,
      intro: input.intro,
      paragraphs: input.paragraphs,
      details: [{ label: "Reference", value: reference(input.referenceId) }, ...(input.details ?? [])],
      action: input.action,
      note: input.note ?? "Keep this reference if you need to contact the ZOBHUNGER team about your submission.",
    },
  });
}

export function notifyNewEnquiry(
  enquiry: {
    id: string;
    name: string;
    companyName: string | null;
    email: string;
    phone: string;
    serviceRequired: string | null;
    message: string;
  },
  requestId?: string,
) {
  const department = enquiryDepartment(enquiry.serviceRequired);
  return Promise.allSettled([
    sendInternalCaseEmail({
      department,
      requestId,
      referenceId: enquiry.id,
      idempotencyKey: `enquiry-${enquiry.id}-internal`,
      subject: "New website enquiry | ZOBHUNGER",
      title: "New website enquiry received",
      intro: `${enquiry.name} submitted an enquiry through the public website.`,
      details: [
        { label: "Company", value: enquiry.companyName ?? "Not provided" },
        { label: "Email", value: enquiry.email },
        { label: "Phone", value: enquiry.phone },
        { label: "Service", value: enquiry.serviceRequired ?? "General enquiry" },
      ],
    }),
    sendReceipt({
      to: enquiry.email,
      requestId,
      idempotencyKey: `enquiry-${enquiry.id}-receipt`,
      subject: "We received your ZOBHUNGER enquiry",
      eyebrow: "Enquiry received",
      title: "Your request is with the right team",
      intro: `Thank you, ${enquiry.name}. We have received your enquiry and routed it for review.`,
      referenceId: enquiry.id,
      details: [{ label: "Service", value: enquiry.serviceRequired ?? "General enquiry" }],
      paragraphs: ["A team member will review the information you submitted and contact you using the details provided when a follow-up is required."],
    }),
  ]);
}

export function notifyNewRequirement(
  requirement: {
    id: string;
    companyName: string;
    contactPerson: string;
    businessEmail: string;
    mobileNumber: string;
    serviceRequired: string;
    workforceCount: number;
    jobLocation: string;
    projectDuration: string;
  },
  requestId?: string,
) {
  return Promise.allSettled([
    sendInternalCaseEmail({
      department: "MAIN_ADMIN",
      requestId,
      referenceId: requirement.id,
      idempotencyKey: `requirement-${requirement.id}-internal`,
      subject: "New workforce requirement | ZOBHUNGER",
      title: "New workforce requirement received",
      intro: `${requirement.companyName} submitted a workforce requirement for operational review.`,
      details: [
        { label: "Contact", value: requirement.contactPerson },
        { label: "Service", value: requirement.serviceRequired },
        { label: "Workforce", value: String(requirement.workforceCount) },
        { label: "Primary location", value: requirement.jobLocation },
      ],
    }),
    sendReceipt({
      to: requirement.businessEmail,
      requestId,
      idempotencyKey: `requirement-${requirement.id}-receipt`,
      subject: "Workforce requirement received | ZOBHUNGER",
      eyebrow: "Business requirement",
      title: "Your workforce brief has been received",
      intro: `Thank you, ${requirement.contactPerson}. We have recorded the requirement for ${requirement.companyName}.`,
      referenceId: requirement.id,
      details: [
        { label: "Service", value: requirement.serviceRequired },
        { label: "Workforce", value: String(requirement.workforceCount) },
        { label: "Location", value: requirement.jobLocation },
        { label: "Duration", value: requirement.projectDuration },
      ],
      paragraphs: ["Our operations team will review deployment feasibility and contact you for any clarification or next step."],
    }),
  ]);
}

export function notifyRequirementStatus(requirement: {
  id: string;
  companyName: string;
  contactPerson: string;
  businessEmail: string;
  status: string;
  revision?: number;
}) {
  const status = statusWords(requirement.status);
  return sendReceipt({
    to: requirement.businessEmail,
    idempotencyKey: `requirement-${requirement.id}-status-${requirement.status}-r${requirement.revision ?? 0}`,
    subject: `Workforce requirement update: ${status} | ZOBHUNGER`,
    eyebrow: "Requirement update",
    title: `Requirement status: ${status}`,
    intro: `Hello ${requirement.contactPerson}, the workforce requirement for ${requirement.companyName} has been updated.`,
    referenceId: requirement.id,
    details: [{ label: "Current status", value: status }],
    paragraphs: [requirement.status === "CONTACTED"
      ? "A ZOBHUNGER team member has begun follow-up on your requirement."
      : requirement.status === "QUALIFIED"
        ? "The requirement has passed initial review and can proceed into hiring and deployment planning."
        : requirement.status === "CLOSED"
          ? "This requirement has been closed in our operations system. Contact the team if you need to discuss a new requirement."
          : "The requirement has been recorded and is awaiting the next operational step."],
  });
}

export function notifyNewApplication(
  application: {
    id: string;
    name: string;
    email: string;
    job: { title: string; slug: string };
    source?: "WORKER_PORTAL" | "PUBLIC_FORM" | "PLACEMENT_CELL";
  },
  requestId?: string,
) {
  const department: Department = application.source === "PLACEMENT_CELL" ? "PLACEMENT_CELL" : "HR";
  return Promise.allSettled([
    sendInternalCaseEmail({
      department,
      requestId,
      referenceId: application.id,
      idempotencyKey: `application-${application.id}-internal`,
      subject: "New job application | ZOBHUNGER",
      title: "New candidate application received",
      intro: `${application.name} applied for ${application.job.title}.`,
      details: [
        { label: "Candidate", value: application.name },
        { label: "Email", value: application.email },
        { label: "Role", value: application.job.title },
        { label: "Source", value: statusWords(application.source ?? "PUBLIC_FORM") },
      ],
    }),
    sendReceipt({
      to: application.email,
      requestId,
      idempotencyKey: `application-${application.id}-receipt`,
      subject: `Application received: ${application.job.title} | ZOBHUNGER`,
      eyebrow: "Application received",
      title: "Your application is in review",
      intro: `Thank you, ${application.name}. We received your application for ${application.job.title}.`,
      referenceId: application.id,
      details: [{ label: "Role", value: application.job.title }],
      paragraphs: ["The hiring team will review your application against the role requirements. We will contact you if there is a relevant next step."],
      action: { label: "View current openings", url: publicApp("/jobs") },
    }),
  ]);
}

export function notifyJobApplicationStatus(application: {
  id: string;
  name: string;
  email: string;
  status: "SUBMITTED" | "REVIEWED" | "SHORTLISTED" | "REJECTED";
  jobTitle: string;
  revision?: number;
}) {
  const status = statusWords(application.status);
  const paragraphs: Record<typeof application.status, string> = {
    SUBMITTED: "Your application has been returned to the initial review queue.",
    REVIEWED: "The hiring team has completed an initial review of your profile. This is not yet a selection decision.",
    SHORTLISTED: "Your profile has been shortlisted for further consideration. The team will contact you if an interview or additional information is required.",
    REJECTED: "The hiring team will not be progressing this application further. This decision applies to this role only, and you can continue to explore other opportunities.",
  };
  return sendReceipt({
    to: application.email,
    idempotencyKey: `application-${application.id}-status-${application.status}-r${application.revision ?? 0}`,
    subject: `Application update: ${application.jobTitle} | ZOBHUNGER`,
    eyebrow: "Hiring update",
    title: `Application status: ${status}`,
    intro: `Hello ${application.name}, there is an update on your application for ${application.jobTitle}.`,
    referenceId: application.id,
    details: [{ label: "Current status", value: status }, { label: "Role", value: application.jobTitle }],
    paragraphs: [paragraphs[application.status]],
    action: application.status === "REJECTED" ? { label: "Explore other openings", url: publicApp("/jobs") } : undefined,
  });
}

export function notifyNewPartnerApplication(
  application: {
    id: string;
    fullName: string;
    email: string;
    mobileNumber: string;
    currentCity: string;
    currentProfession: string;
    companyName: string;
    totalExperienceYears: number;
    specialization: string;
    contributionPreference: string;
    preferredPartnershipArea: string;
  },
  requestId?: string,
) {
  return Promise.allSettled([
    sendInternalCaseEmail({
      department: "MAIN_ADMIN",
      requestId,
      referenceId: application.id,
      idempotencyKey: `partner-${application.id}-internal`,
      subject: "New business partner application | ZOBHUNGER",
      title: "New independent partner application",
      intro: `${application.fullName} submitted an independent business partner application.`,
      details: [
        { label: "Company", value: application.companyName },
        { label: "City", value: application.currentCity },
        { label: "Specialization", value: application.specialization },
        { label: "Preferred area", value: application.preferredPartnershipArea },
      ],
    }),
    sendReceipt({
      to: application.email,
      requestId,
      idempotencyKey: `partner-${application.id}-receipt`,
      subject: "Partner application received | ZOBHUNGER",
      eyebrow: "Partner application",
      title: "Your partnership profile has been received",
      intro: `Thank you, ${application.fullName}. Your application is now with the ZOBHUNGER team for review.`,
      referenceId: application.id,
      details: [{ label: "Preferred area", value: application.preferredPartnershipArea }],
      paragraphs: ["Submitting an application does not create business portal access. Approved applicants receive separate secure access instructions."],
    }),
  ]);
}

export function notifyPartnerApplicationStatus(application: {
  id: string;
  fullName: string;
  email: string;
  status: string;
  updatedAt?: Date;
}) {
  if (application.status === "APPROVED") return Promise.resolve(false);
  const status = statusWords(application.status);
  return sendReceipt({
    to: application.email,
    idempotencyKey: `partner-${application.id}-status-${application.status}-${application.updatedAt?.getTime() ?? 0}`,
    subject: `Partner application update: ${status} | ZOBHUNGER`,
    eyebrow: "Partner application update",
    title: `Application status: ${status}`,
    intro: `Hello ${application.fullName}, your ZOBHUNGER partner application has been updated.`,
    referenceId: application.id,
    details: [{ label: "Current status", value: status }],
    paragraphs: [application.status === "REJECTED" || application.status === "CLOSED"
      ? "The current application will not proceed further. You can contact the team if you need clarification about a future collaboration."
      : "The team is continuing its review. We will contact you if further information or a next step is required."],
  });
}

export function notifyNewPlacementCellApplication(
  application: {
    id: string; institutionName: string; institutionType: string; placementCellName: string;
    contactPersonName: string; designation: string; officialEmail: string; mobileNumber: string;
    city: string; state: string; numberOfStudents: number; coursesDepartments: string;
    preferredOpportunityTypes: string[];
  },
  requestId?: string,
) {
  return Promise.allSettled([
    sendInternalCaseEmail({
      department: "PLACEMENT_CELL",
      requestId,
      referenceId: application.id,
      idempotencyKey: `placement-${application.id}-internal`,
      subject: "New institution partnership request | ZOBHUNGER",
      title: "New institution onboarding request",
      intro: `${application.institutionName} submitted a Placement Cell & Institution Partnership request.`,
      details: [
        { label: "Contact", value: `${application.contactPersonName} · ${application.designation}` },
        { label: "Location", value: `${application.city}, ${application.state}` },
        { label: "Students", value: String(application.numberOfStudents) },
        { label: "Opportunities", value: application.preferredOpportunityTypes.join(", ") },
      ],
    }),
    sendReceipt({
      to: application.officialEmail,
      requestId,
      idempotencyKey: `placement-${application.id}-receipt`,
      subject: "Institution partnership request received | ZOBHUNGER",
      eyebrow: "Institution partnership",
      title: "Your onboarding request has been received",
      intro: `Thank you, ${application.contactPersonName}. We received the partnership request for ${application.institutionName}.`,
      referenceId: application.id,
      paragraphs: ["The Placement Cell team will review the institution details. Portal access is provisioned only after approval and will arrive through a separate secure activation email."],
    }),
  ]);
}

export function notifyPlacementCellStatus(application: {
  id: string;
  institutionName: string;
  contactPersonName: string;
  officialEmail: string;
  status: string;
  updatedAt?: Date;
}) {
  if (application.status === "APPROVED") return Promise.resolve(false);
  const status = statusWords(application.status);
  return sendReceipt({
    to: application.officialEmail,
    idempotencyKey: `placement-${application.id}-status-${application.status}-${application.updatedAt?.getTime() ?? 0}`,
    subject: `Institution partnership update: ${status} | ZOBHUNGER`,
    eyebrow: "Institution partnership update",
    title: `Partnership status: ${status}`,
    intro: `Hello ${application.contactPersonName}, the request for ${application.institutionName} has been updated.`,
    referenceId: application.id,
    details: [{ label: "Current status", value: status }],
    paragraphs: [application.status === "REJECTED"
      ? "The current onboarding request will not proceed to institution portal activation."
      : "The request is under review. We will contact you if additional information is required."],
  });
}

export function notifyCareerProfileSubmitted(application: {
  id: string;
  fullName: string;
  email: string;
  preferredRole: string;
  city: string;
}, requestId?: string) {
  return Promise.allSettled([
    sendInternalCaseEmail({
      department: "HR",
      requestId,
      referenceId: application.id,
      idempotencyKey: `career-${application.id}-internal`,
      subject: "New career profile | ZOBHUNGER",
      title: "New career profile submitted",
      intro: `${application.fullName} submitted a profile for HR review.`,
      details: [{ label: "Preferred role", value: application.preferredRole }, { label: "City", value: application.city }, { label: "Email", value: application.email }],
    }),
    sendReceipt({
      to: application.email,
      requestId,
      idempotencyKey: `career-${application.id}-receipt`,
      subject: "Career profile received | ZOBHUNGER",
      eyebrow: "Career profile",
      title: "Your profile is with our HR team",
      intro: `Thank you, ${application.fullName}. Your career profile has been received for review.`,
      referenceId: application.id,
      details: [{ label: "Preferred role", value: application.preferredRole }],
      paragraphs: ["Submitting a career profile does not guarantee a role or interview. HR will contact you when your profile matches a relevant requirement."],
      action: { label: "Explore current openings", url: publicApp("/jobs") },
    }),
  ]);
}

export function notifyCareerProfileStatus(application: {
  id: string;
  fullName: string;
  email: string;
  preferredRole: string;
  status: "REVIEWED" | "SHORTLISTED" | "CONTACTED" | "HIRED" | "REJECTED";
  updatedAt: Date;
}) {
  const status = statusWords(application.status);
  const copy: Record<typeof application.status, string> = {
    REVIEWED: "HR has completed an initial review of your career profile.",
    SHORTLISTED: "Your profile has been shortlisted for relevant opportunities. The team will contact you when a suitable next step is available.",
    CONTACTED: "The HR team has marked your profile for active follow-up. Please watch the contact details you provided for communication.",
    HIRED: "Your career profile has reached the hired stage in the ZOBHUNGER workflow. Any employment-specific documents or instructions will be shared separately.",
    REJECTED: "The current career profile will not proceed further at this time. You can continue to explore future openings on the website.",
  };
  return sendReceipt({
    to: application.email,
    idempotencyKey: `career-${application.id}-status-${application.status}-${application.updatedAt.getTime()}`,
    subject: `Career profile update: ${status} | ZOBHUNGER`,
    eyebrow: "Career update",
    title: `Profile status: ${status}`,
    intro: `Hello ${application.fullName}, there is an update on your ZOBHUNGER career profile.`,
    referenceId: application.id,
    details: [{ label: "Preferred role", value: application.preferredRole }, { label: "Current status", value: status }],
    paragraphs: [copy[application.status]],
    action: application.status === "REJECTED" ? { label: "Explore current openings", url: publicApp("/jobs") } : undefined,
  });
}

export function notifyVendorSubmitted(application: {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  serviceCategories: string[];
  submittedAt?: Date | null;
}) {
  return Promise.allSettled([
    sendInternalCaseEmail({
      department: "MAIN_ADMIN",
      referenceId: application.id,
      idempotencyKey: `vendor-${application.id}-internal`,
      subject: "New vendor application | ZOBHUNGER",
      title: "New vendor empanelment application",
      intro: `${application.companyName} completed vendor empanelment submission.`,
      details: [{ label: "Contact", value: application.contactName }, { label: "Email", value: application.email }, { label: "Services", value: application.serviceCategories.join(", ") }],
    }),
    sendReceipt({
      to: application.email,
      idempotencyKey: `vendor-${application.id}-receipt`,
      subject: "Vendor application received | ZOBHUNGER",
      eyebrow: "Vendor empanelment",
      title: "Your vendor application is in review",
      intro: `Thank you, ${application.contactName}. We received the completed vendor application for ${application.companyName}.`,
      referenceId: application.id,
      paragraphs: ["The team will review your company profile, service coverage and submitted documents before making an empanelment decision."],
    }),
  ]);
}

export function notifyVendorStatus(application: {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  status: string;
  vendorCode?: string | null;
  updatedAt: Date;
}) {
  const status = statusWords(application.status);
  return sendReceipt({
    to: application.email,
    idempotencyKey: `vendor-${application.id}-status-${application.status}-${application.updatedAt.getTime()}`,
    subject: `Vendor application update: ${status} | ZOBHUNGER`,
    eyebrow: "Vendor empanelment update",
    title: `Vendor status: ${status}`,
    intro: `Hello ${application.contactName}, the vendor application for ${application.companyName} has been updated.`,
    referenceId: application.id,
    details: [{ label: "Current status", value: status }, ...(application.vendorCode ? [{ label: "Vendor code", value: application.vendorCode }] : [])],
    paragraphs: [application.status === "APPROVED"
      ? "Your organisation has been approved into the ZOBHUNGER vendor network. Keep the vendor code for future operational communication."
      : application.status === "REJECTED"
        ? "The current empanelment application will not proceed further."
        : application.status === "SUSPENDED"
          ? "The vendor record is currently suspended. Contact the ZOBHUNGER team if operational clarification is required."
          : "The application remains under operational review."],
  });
}

export function notifyEmployeeJoiningSubmitted(application: {
  id: string;
  employeeNumber: string;
  fullName: string;
  personalEmail: string;
  projectAssignment: string;
}) {
  return Promise.allSettled([
    sendInternalCaseEmail({
      department: "HR",
      referenceId: application.id,
      idempotencyKey: `employee-joining-${application.id}-internal`,
      subject: "Employee joining submission | ZOBHUNGER",
      title: "Employee joining form submitted",
      intro: `${application.fullName} completed the employee joining form and document submission.`,
      details: [{ label: "Employee ID", value: application.employeeNumber }, { label: "Assignment", value: application.projectAssignment }, { label: "Email", value: application.personalEmail }],
    }),
    sendReceipt({
      to: application.personalEmail,
      idempotencyKey: `employee-joining-${application.id}-receipt`,
      subject: "Employee joining form received | ZOBHUNGER",
      eyebrow: "Employee joining",
      title: "Your joining details have been submitted",
      intro: `Hello ${application.fullName}, HR has received your completed employee joining form and required documents.`,
      referenceId: application.id,
      details: [{ label: "Employee ID", value: application.employeeNumber }, { label: "Project / assignment", value: application.projectAssignment }],
      paragraphs: ["HR will review the submitted information. Any offer letter or further joining instruction will be sent separately after approval."],
      note: "For your privacy, this email does not repeat Aadhaar, PAN, bank account or other protected information from the joining form.",
    }),
  ]);
}

export function notifyEmployeeJoiningStatus(application: {
  id: string;
  employeeNumber: string;
  fullName: string;
  personalEmail: string;
  projectAssignment: string;
  status: "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  revision: number;
}) {
  const status = statusWords(application.status);
  const message = application.status === "APPROVED"
    ? "HR has approved your joining record. Offer-letter or joining instructions, when applicable, will be issued separately."
    : application.status === "REJECTED"
      ? "HR could not approve the current joining submission. Contact HR using your employee reference for the next step."
      : "HR has started reviewing your joining record and supporting documents.";
  return sendReceipt({
    to: application.personalEmail,
    idempotencyKey: `employee-joining-${application.id}-status-${application.status}-r${application.revision}`,
    subject: `Employee joining update: ${status} | ZOBHUNGER`,
    eyebrow: "Employee joining update",
    title: `Joining status: ${status}`,
    intro: `Hello ${application.fullName}, your employee joining record has been updated.`,
    referenceId: application.id,
    details: [{ label: "Employee ID", value: application.employeeNumber }, { label: "Current status", value: status }],
    paragraphs: [message],
    note: "Sensitive identity and banking information is never included in status-notification emails.",
  });
}

export function notifyIntakeAssignment(input: {
  caseId: string;
  subject: string;
  department: Department;
  assignedEmail: string;
  revision: number;
}) {
  return sendCorporateEmail({
    to: input.assignedEmail,
    subject: "Intake case assigned to you | ZOBHUNGER",
    idempotencyKey: `intake-${input.caseId}-assigned-${input.assignedEmail.toLowerCase()}-r${input.revision}`,
    content: {
      eyebrow: `${statusWords(input.department)} operations`,
      title: "A case has been assigned to you",
      intro: input.subject,
      details: [{ label: "Case reference", value: reference(input.caseId) }, { label: "Department", value: statusWords(input.department) }],
      action: { label: "Open assigned case", url: publicApp(`/admin/intake?assignment=MINE&case=${encodeURIComponent(input.caseId)}`) },
      note: "Sign in with your administrator account before opening protected case details.",
      signoff: "ZOBHUNGER Operations",
    },
  });
}
