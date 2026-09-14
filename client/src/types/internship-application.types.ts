export interface InternshipApplicationInput {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  qualification: string;
  institution: string;
  fieldOfStudy: string;
  graduationYear: number | null;
  preferredRole: string;
  preferredLocation: string;
  availability: string;
  skills: string[];
  portfolioUrl: string;
  coverNote: string;
  consent: boolean;
}

export interface InternshipApplicationReceipt {
  id: string;
  createdAt: string;
  resumeUploaded: boolean;
  resumeUploadToken: string | null;
  resumeUploadExpiresAt: string | null;
}
