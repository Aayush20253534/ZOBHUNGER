export type VendorCategory = "WORKFORCE" | "RECRUITMENT" | "MARKETING" | "OPERATIONS" | "SPECIALIZED";
export type VendorDocumentKind = "COMPANY_PROFILE" | "REGISTRATION" | "TAX" | "MSME" | "OTHER";
export type VendorStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED";
export interface VendorInput {
  companyName: string; organizationType: string; establishedYear: number | null;
  registrationNumber: string; gstNumber: string; msmeNumber: string;
  addressLine: string; city: string; state: string; postalCode: string; country: string;
  contactName: string; contactRole: string; email: string; phone: string; alternatePhone: string; website: string;
  serviceCategories: VendorCategory[]; specializedServices: string; serviceDescription: string;
  yearsExperience: number; teamSize: number; coverage: string[]; industries: string[];
  projectExperience: string; notableClients: string; capacityNotes: string; consent: boolean;
}
export interface VendorDocument { id: string; kind: VendorDocumentKind; fileName: string; size: number; createdAt?: string }
export interface VendorReceipt { id: string; submitted: boolean; submittedAt: string | null; uploadToken: string | null; uploadExpiresAt: string; documents: VendorDocument[] }
export interface VendorSummary {
  id: string; companyName: string; organizationType: string; city: string; state: string; country: string;
  contactName: string; email: string; phone: string; serviceCategories: VendorCategory[]; yearsExperience: number; teamSize: number;
  status: VendorStatus; vendorCode: string | null; submittedAt: string | null; approvedAt: string | null;
  createdAt: string; updatedAt: string; revision: number; accountManager: string | null; documents: VendorDocument[];
}
export interface VendorDetail extends VendorSummary, Omit<VendorInput, "consent"> {
  consentAt: string; reviewedAt: string | null; reviewNotes: string | null; internalNotes: string | null;
  history: { id: string; action: string; createdAt: string; metadata?: { from?: string; to?: string; notes?: string; fields?: string[]; kind?: string } | null }[];
}
export interface VendorList { items: VendorSummary[]; total: number; page: number; totalPages: number; counts: Partial<Record<VendorStatus, number>> }
export interface VendorRecordInput {
  contactName: string; contactRole: string; email: string; phone: string; alternatePhone: string; website: string;
  teamSize: number; coverage: string[]; capacityNotes: string; accountManager: string; internalNotes: string;
}
