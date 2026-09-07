export const placementSteps = [
  {
    title: "Register Your Institution",
    description:
      "College, University or Institution submits its details through the onboarding process.",
  },
  {
    title: "Get Portal Login Access",
    description:
      "After approval, the institution receives dedicated access to the ZOBHUNGER Institution Partner Portal.",
  },
  {
    title: "Upload Candidate Details",
    description:
      "Authorized representatives can add candidate qualification, skills, interests, location and availability.",
  },
  {
    title: "Match Candidates With Opportunities",
    description:
      "Candidates can be considered for relevant opportunities based on their profile and opportunity requirements.",
  },
] as const;

export const studentOpportunities = [
  { id: "full-time", title: "Full-Time Jobs" },
  { id: "part-time", title: "Part-Time Jobs" },
  { id: "freelance", title: "Freelance Opportunities" },
  { id: "task", title: "Task-Based Work" },
  { id: "internship", title: "Internship Opportunities" },
  { id: "apprenticeship", title: "Apprenticeship Opportunities" },
  { id: "remote", title: "Remote Jobs" },
  { id: "hybrid", title: "Hybrid Jobs" },
  { id: "flexible", title: "Flexible Working Opportunities" },
  { id: "project", title: "Project-Based Opportunities" },
] as const;

export const earnWhileLearning = [
  "Flexible working opportunities",
  "Task-based assignments",
  "Freelance projects",
  "Project-based work",
  "Payment based on completed and approved work",
  "Weekly payout opportunities where applicable",
  "Work according to skills and availability",
] as const;

export const careerDevelopment = [
  "Training Opportunities",
  "Skill Development Programs",
  "Industry Exposure",
  "Market and Industry Overview",
  "Career Guidance Opportunities",
  "Practical Work Experience",
  "Certification Programs",
  "Free Certification Opportunities",
  "Paid Certification Opportunities",
] as const;

export const candidateProfileFactors = [
  "Qualification",
  "Skills",
  "Interests",
  "Location",
  "Availability",
  "Experience",
  "Preferred Work Type",
] as const;

export const portalFeatures = [
  "Upload candidate details",
  "Add multiple student profiles",
  "View available opportunities",
  "Track candidate applications",
  "Manage candidate records",
  "Update candidate information",
  "Check opportunity status",
  "View relevant job and internship opportunities",
] as const;
