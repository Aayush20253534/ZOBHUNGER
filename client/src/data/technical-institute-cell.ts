export const technicalOpportunityTypes = [
  {
    id: "jobs",
    title: "Jobs",
    description: "Full-time and contractual technical roles matched to qualification, trade, skills and employer requirements.",
  },
  {
    id: "internships",
    title: "Internships",
    description: "Practical industry exposure for eligible ITI, Diploma and Polytechnic students before or after graduation.",
  },
  {
    id: "apprenticeships",
    title: "Apprenticeships",
    description: "Structured apprenticeship opportunities for technical learners and recent pass-outs where employer criteria are met.",
  },
  {
    id: "training",
    title: "Training",
    description: "Skill-development and employer-aligned training pathways designed around technical roles and workplace readiness.",
  },
] as const;

export const technicalCellSteps = [
  {
    title: "Institute onboarding",
    description: "The ITI, Polytechnic or technical institute submits verified institution and placement-contact details.",
  },
  {
    title: "Partnership review",
    description: "ZOBHUNGER reviews the institute profile, available trades or branches and the intended collaboration areas.",
  },
  {
    title: "Student talent mapping",
    description: "After onboarding, technical students can be organised by qualification, trade, skills, passing year and eligibility.",
  },
  {
    title: "Opportunity connection",
    description: "Verified students are matched to active jobs, internships, apprenticeships and training using qualification, trade, batch, skills and location criteria.",
  },
] as const;

export const technicalBranches = [
  "Electrician",
  "Fitter",
  "Welder",
  "Electronics",
  "Mechanical",
  "Civil",
  "Automobile",
  "Computer Science",
  "Electrical",
  "Electronics & Communication",
  "Industrial Maintenance",
  "Other Technical Trades",
] as const;

export const instituteBenefits = [
  "Dedicated technical-hiring partnership channel",
  "Qualification and trade-led opportunity matching",
  "Jobs, internships, apprenticeships and training",
  "Support for campus and technical recruitment drives",
  "Structured student sourcing for employer requirements",
  "A foundation for placement and outcome tracking",
] as const;
