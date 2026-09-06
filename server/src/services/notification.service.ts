import { sendOperationalEmail } from "./email.service.js";

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
  return sendOperationalEmail({
    requestId,
    subject: `New ZOBHUNGER enquiry from ${enquiry.name}`,
    text: [
      `Enquiry ID: ${enquiry.id}`,
      `Name: ${enquiry.name}`,
      `Company: ${enquiry.companyName ?? "Not provided"}`,
      `Email: ${enquiry.email}`,
      `Phone: ${enquiry.phone}`,
      `Service: ${enquiry.serviceRequired ?? "Not provided"}`,
      "",
      enquiry.message,
    ].join("\n"),
  });
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
  return sendOperationalEmail({
    requestId,
    subject: `New workforce requirement: ${requirement.companyName}`,
    text: [
      `Requirement ID: ${requirement.id}`,
      `Company: ${requirement.companyName}`,
      `Contact: ${requirement.contactPerson}`,
      `Email: ${requirement.businessEmail}`,
      `Phone: ${requirement.mobileNumber}`,
      `Service: ${requirement.serviceRequired}`,
      `Workforce count: ${requirement.workforceCount}`,
      `Primary location: ${requirement.jobLocation}`,
      `Duration: ${requirement.projectDuration}`,
    ].join("\n"),
  });
}

export function notifyNewApplication(
  application: {
    id: string;
    name: string;
    email: string;
    job: { title: string; slug: string };
  },
  requestId?: string,
) {
  return sendOperationalEmail({
    requestId,
    subject: `New application: ${application.job.title}`,
    text: [
      `Application ID: ${application.id}`,
      `Candidate: ${application.name}`,
      `Email: ${application.email}`,
      `Job: ${application.job.title}`,
      `Job slug: ${application.job.slug}`,
    ].join("\n"),
  });
}
