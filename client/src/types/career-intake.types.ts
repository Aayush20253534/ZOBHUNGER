export interface CareerEducation { qualification: string; institution: string; fieldOfStudy: string; graduationYear: number | null }
export interface CareerExperience { company: string; title: string; startMonth: string; endMonth: string; current: boolean; description: string }
export interface CareerProfileInput {
  fullName: string; email: string; phone: string; city: string; state: string;
  preferredRole: string; experienceYears: number; education: CareerEducation[];
  workExperience: CareerExperience[]; skills: string[]; preferredLocations: string[];
  availability: string; portfolioUrl: string; coverNote: string; consent: boolean;
}
export interface CareerReceipt {
  id: string; createdAt: string; resumeUploaded: boolean;
  resumeUploadToken: string | null; resumeUploadExpiresAt: string | null;
}
