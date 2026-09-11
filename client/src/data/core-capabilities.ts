export interface CoreCapability {
  id: string;
  title: string;
  description: string;
}

export const coreCapabilities: readonly CoreCapability[] = [
  {
    id: "manpower-deployment",
    title: "Manpower Deployment",
    description:
      "End-to-end deployment and management of field staff, promoters, sales executives and other manpower requirements.",
  },
  {
    id: "field-audit",
    title: "Field Audit",
    description:
      "On-ground audits, outlet verification, staff verification, compliance checks and structured reporting.",
  },
  {
    id: "sampling-activation",
    title: "Sampling & Activation",
    description:
      "Product sampling, brand activation, customer interaction and on-ground promotional campaign execution.",
  },
  {
    id: "lead-generation",
    title: "Lead Generation",
    description:
      "Qualified lead generation through field sales, customer acquisition and targeted project-led campaigns.",
  },
  {
    id: "telecaller-telesales",
    title: "Telecaller & Telesales Services",
    description:
      "Trained telecallers for telesales, lead generation, customer engagement, follow-up and business conversion.",
  },
  {
    id: "consumer-engagement",
    title: "Consumer Engagement",
    description:
      "Direct customer interaction, product awareness, application installation, onboarding and conversion support.",
  },
  {
    id: "seller-onboarding-training",
    title: "Seller Onboarding & Training",
    description:
      "Seller acquisition, onboarding, product listing, process training and ongoing field-level support.",
  },
] as const;

export const brandStrengths = [
  "Pan-India field execution",
  "Trained workforce",
  "Real-time reporting",
  "On-ground operations",
  "Scalable deployment",
  "End-to-end campaign management",
] as const;

export const capabilitySummary = {
  eyebrow: "Core capabilities",
  title: "Execution capabilities that move work forward.",
  description:
    "ZOBHUNGER combines manpower, field execution and operational support to help brands run projects consistently across markets.",
} as const;
