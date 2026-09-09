import { BriefcaseBusiness, Megaphone, Settings2, Sparkles, UsersRound } from "lucide-react";

export const vendorCategories = [
  { value: "WORKFORCE", label: "Manpower & Workforce Solutions", shortLabel: "Workforce", icon: UsersRound, description: "Deployment, staffing and flexible workforce capacity." },
  { value: "RECRUITMENT", label: "Recruitment & Talent Sourcing", shortLabel: "Recruitment", icon: BriefcaseBusiness, description: "Candidate sourcing, screening and recruitment support." },
  { value: "MARKETING", label: "Advertising & Marketing", shortLabel: "Marketing", icon: Megaphone, description: "Branding, advertising, campaigns and market activation." },
  { value: "OPERATIONS", label: "Business & Operational Support", shortLabel: "Operations", icon: Settings2, description: "Customer support, field work and business processes." },
  { value: "SPECIALIZED", label: "Other Specialized Services", shortLabel: "Specialist services", icon: Sparkles, description: "Expert capabilities shaped around client requirements." },
] as const;
export const vendorOrganizations = [
  { value: "COMPANY", label: "Company" }, { value: "AGENCY", label: "Agency" }, { value: "MSME", label: "MSME" },
  { value: "STARTUP", label: "Startup" }, { value: "PARTNERSHIP", label: "Partnership firm" },
  { value: "SOLE_PROPRIETOR", label: "Sole proprietor" }, { value: "OTHER", label: "Other service provider" },
] as const;
export const vendorDocuments = [
  { kind: "COMPANY_PROFILE", label: "Company profile / capability deck", required: true, hint: "Your services, team and relevant work. Required to submit." },
  { kind: "REGISTRATION", label: "Business registration document", required: false, hint: "Registration or incorporation proof, if available." },
  { kind: "TAX", label: "GST / tax document", required: false, hint: "Relevant business tax document, if applicable." },
  { kind: "MSME", label: "MSME / Udyam certificate", required: false, hint: "Include this if your business has an MSME registration." },
  { kind: "OTHER", label: "Other supporting document", required: false, hint: "A relevant certification, portfolio or experience document." },
] as const;
export const vendorStatusLabel = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, letter => letter.toUpperCase());
export const vendorCategoryLabel = (value: string) => vendorCategories.find(item => item.value === value)?.label ?? value;
export const vendorDocumentLabel = (value: string) => vendorDocuments.find(item => item.kind === value)?.label ?? value;
