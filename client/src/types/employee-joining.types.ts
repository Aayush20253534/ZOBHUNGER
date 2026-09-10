export type EmployeeDocumentKind = "PHOTO" | "AADHAAR" | "PAN" | "BANK_PROOF" | "ADDRESS_PROOF" | "EDUCATION" | "EXPERIENCE" | "OTHER";

export interface PreviousEmploymentInput {
  company: string;
  designation: string;
  startDate: string;
  endDate: string;
  current: boolean;
  lastMonthlySalary: number | null;
  reasonForLeaving: string;
}

export interface EmployeeJoiningInput {
  projectCode: string;
  projectAssignment: string;
  fullName: string;
  fatherGuardianName: string;
  personalEmail: string;
  phone: string;
  alternatePhone: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  maritalStatus: "" | "SINGLE" | "MARRIED" | "OTHER" | "PREFER_NOT_TO_SAY";
  bloodGroup: "" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  shirtSize: "" | "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";
  currentAddressLine1: string;
  currentAddressLine2: string;
  currentCity: string;
  currentState: string;
  currentPostalCode: string;
  permanentSameAsCurrent: boolean;
  permanentAddressLine1: string;
  permanentAddressLine2: string;
  permanentCity: string;
  permanentState: string;
  permanentPostalCode: string;
  emergencyContactName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  aadhaarNumber: string;
  panNumber: string;
  bankAccountHolder: string;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
  bankBranch: string;
  upiId: string;
  uanNumber: string;
  highestQualification: string;
  institution: string;
  boardUniversity: string;
  graduationYear: number | null;
  grade: string;
  previousEmployment: PreviousEmploymentInput[];
  consent: boolean;
}

export interface EmployeeJoiningReceipt {
  id: string;
  employeeNumber: string | null;
  submitted: boolean;
  submittedAt: string | null;
  uploadToken: string | null;
  uploadExpiresAt: string | null;
  documents: Array<{ id: string; kind: EmployeeDocumentKind; fileName: string; mimeType: string; size: number }>;
}
