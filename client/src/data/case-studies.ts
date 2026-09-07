export interface CaseStudy {
  slug: string;
  brand: string;
  department: string;
  category: string;
  title: string;
  summary: string;
  objective: string;
  execution: readonly string[];
  impact: string;
  capabilities: readonly string[];
}

export const caseStudies: readonly CaseStudy[] = [
  {
    slug: "flipkart-seller-onboarding-training",
    brand: "Flipkart",
    department: "E-commerce & Marketplace Operations",
    category: "Seller onboarding & training",
    title: "Seller Onboarding & Training",
    summary:
      "A field-led seller acquisition, onboarding and education program designed to help marketplace sellers move from outreach to platform adoption.",
    objective:
      "Support Flipkart in expanding and strengthening its seller network through effective seller onboarding, product listing and seller training.",
    execution: [
      "Seller identification and outreach",
      "Seller onboarding support",
      "Product listing assistance",
      "Documentation and process guidance",
      "Seller training and education",
      "Field-level coordination",
      "Follow-up and activation",
    ],
    impact:
      "ZOBHUNGER's field team helped create a structured on-ground process for seller acquisition, onboarding, product listing and training, enabling sellers to understand and adopt the platform more effectively.",
    capabilities: ["Field execution", "Seller onboarding", "Training", "Marketplace activation"],
  },
  {
    slug: "siply-consumer-engagement-digital-gold",
    brand: "Siply",
    department: "Fintech & Consumer Acquisition",
    category: "Consumer engagement & application acquisition",
    title: "Consumer Engagement & Digital Gold Acquisition",
    summary:
      "An on-ground consumer engagement program focused on product awareness, application adoption, onboarding and assisted digital-gold discovery.",
    objective:
      "Increase consumer awareness and encourage users to adopt Siply's digital financial services through direct, field-level engagement.",
    execution: [
      "Consumer engagement",
      "Product awareness",
      "Application installation",
      "User onboarding",
      "Digital gold awareness",
      "Purchase assistance",
      "Field-level customer interaction",
      "Follow-up with potential users",
    ],
    impact:
      "The campaign focused on creating direct consumer interactions and helping users understand the application, complete installation and explore digital gold purchase.",
    capabilities: ["Consumer engagement", "App acquisition", "Onboarding", "Field activation"],
  },
] as const;

export const caseStudyDepartments = Array.from(
  new Set(caseStudies.map((study) => study.department)),
);

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
