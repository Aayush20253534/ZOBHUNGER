export type ComplianceStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "NEEDS_CORRECTION" | "RESUBMITTED" | "VERIFIED" | "PROCESSED";

export interface EmployeeComplianceMaster {
  id: string;
  employeeNumber: string;
  projectCode: string;
  projectAssignment: string;
  fullName: string;
  fatherGuardianName: string;
  personalEmail: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  currentAddress: { line1: string; line2: string; city: string; state: string; postalCode: string };
  permanentAddress: { line1: string; line2: string; city: string; state: string; postalCode: string };
  aadhaarNumber: string;
  panNumber: string;
  bankAccountHolder: string;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
  bankBranch: string;
  uanNumber: string;
  offer: { department: string; designation: string; joiningDate: string; monthlyGrossSalary: number } | null;
  joiningDocuments: Array<{ id: string; kind: string; fileName: string; mimeType: string; size: number }>;
}



export interface AdminComplianceMaster {
  id: string;
  employeeNumber: string;
  projectCode: string;
  projectAssignment: string;
  fullName: string;
  fatherGuardianName: string;
  personalEmail: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  currentAddress: { line1: string; line2: string; city: string; state: string; postalCode: string };
  permanentAddress: { line1: string; line2: string; city: string; state: string; postalCode: string };
  aadhaarNumber: string;
  employeePhotoAvailable: boolean;
  offer: { department: string; designation: string; joiningDate: string; monthlyGrossSalary: number } | null;
  panNumber?: string;
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  bankBranch?: string;
  uanNumber?: string;
}

export interface ComplianceHistoryItem {
  id: string;
  action: string;
  metadata: unknown;
  createdAt: string;
  actor: { email: string; adminDepartment: string | null } | null;
}

export interface PfComplianceRecord {
  id: string;
  joiningId: string;
  appointmentDate: string;
  epfWages: number | null;
  monthlyGross: number | null;
  department: string | null;
  designation: string | null;
  husbandName: string | null;
  presentDistrict: string | null;
  permanentDistrict: string | null;
  bankAccountType: string | null;
  existingUanNumber: string;
  existingUanLast4: string | null;
  status: ComplianceStatus;
  correctionRemarks: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  verifiedAt: string | null;
  processedAt: string | null;
  revision: number;
  updatedAt: string;
}

export interface EsicFamilyMember {
  id?: string;
  nameAsAadhaar: string;
  relationship: string;
  dateOfBirth: string;
  residesWithEmployee: boolean;
  address: string;
  aadhaarNumber: string;
  aadhaarLast4?: string;
  sortOrder?: number;
}

export interface EsicComplianceRecord {
  id: string;
  joiningId: string;
  esiApplicable: boolean | null;
  esiNumber: string;
  esiNumberLast4: string | null;
  nomineeName: string | null;
  nomineeRelationship: string | null;
  nomineeAddress: string | null;
  nomineeMobile: string | null;
  nomineeEmail: string | null;
  status: ComplianceStatus;
  correctionRemarks: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  verifiedAt: string | null;
  processedAt: string | null;
  revision: number;
  updatedAt: string;
  familyMembers: EsicFamilyMember[];
}

export interface ComplianceDocumentSummary {
  id: string;
  area: "PF_EPFO" | "ESIC";
  kind: string;
  familyMemberId: string | null;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface EmployeeComplianceProfile {
  employee: EmployeeComplianceMaster;
  pf: PfComplianceRecord | null;
  esic: EsicComplianceRecord | null;
  documents: ComplianceDocumentSummary[];
}

export interface PfComplianceInput {
  appointmentDate: string;
  epfWages: number | null;
  monthlyGross: number | null;
  department: string;
  designation: string;
  husbandName: string;
  presentDistrict: string;
  permanentDistrict: string;
  bankAccountType: "" | "SAVINGS" | "CURRENT";
  existingUanNumber: string;
}

export interface EsicComplianceInput {
  esiApplicable: boolean | null;
  esiNumber: string;
  nomineeName: string;
  nomineeRelationship: string;
  nomineeAddress: string;
  nomineeMobile: string;
  nomineeEmail: string;
  familyMembers: EsicFamilyMember[];
}
