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
  return sendOperationalEmail({
    requestId,
    subject: `New independent business partner application: ${application.fullName}`,
    text: [
      `Partner application ID: ${application.id}`,
      `Name: ${application.fullName}`,
      `Email: ${application.email}`,
      `Phone: ${application.mobileNumber}`,
      `City: ${application.currentCity}`,
      `Profession: ${application.currentProfession}`,
      `Company / business: ${application.companyName}`,
      `Experience: ${application.totalExperienceYears} years`,
      `Specialization: ${application.specialization}`,
      `Contribution: ${application.contributionPreference}`,
      `Preferred partnership area: ${application.preferredPartnershipArea}`,
      "",
      "Open the admin dashboard to review the complete profile.",
    ].join("\n"),
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
  return sendOperationalEmail({
    requestId,
    subject: `New institution partnership onboarding: ${application.institutionName}`,
    text: [
      `Institution partnership application ID: ${application.id}`,
      `Institution: ${application.institutionName}`,
      `Institution type: ${application.institutionType}`,
      `Placement Cell / Career Services: ${application.placementCellName}`,
      `Contact: ${application.contactPersonName} (${application.designation})`,
      `Official email: ${application.officialEmail}`,
      `Phone: ${application.mobileNumber}`,
      `Location: ${application.city}, ${application.state}`,
      `Students: ${application.numberOfStudents}`,
      `Courses / departments: ${application.coursesDepartments}`,
      `Preferred opportunities: ${application.preferredOpportunityTypes.join(", ")}`,
      "",
      "Review and approval are required before Institution Partner Portal access is provisioned.",
    ].join("\n"),
  });
}
