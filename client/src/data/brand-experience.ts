export interface BrandExperienceGroup {
  id: string;
  title: string;
  description: string;
  brands: readonly string[];
}

/**
 * Brand names below come from the client-provided brand experience brief.
 * Names explicitly flagged by the client for spelling/legal verification are
 * intentionally excluded from the public list until they are confirmed.
 */
export const brandExperienceGroups: readonly BrandExperienceGroup[] = [
  {
    id: "commerce-hyperlocal",
    title: "E-commerce, delivery & hyperlocal",
    description:
      "Experience supporting field execution, onboarding and operational requirements across high-frequency consumer platforms.",
    brands: [
      "Amazon",
      "Flipkart",
      "Zepto",
      "Zomato",
      "Swiggy",
      "Meesho",
      "Delhivery",
      "Shadowfax",
      "Rapido",
      "Ola",
      "Uber",
      "InDrive",
      "Oye Rickshaw",
      "Bikayi",
    ],
  },
  {
    id: "fintech-digital",
    title: "Fintech, payments & digital services",
    description:
      "Customer acquisition, application adoption, merchant outreach and on-ground engagement for digital-first businesses.",
    brands: [
      "Freecharge",
      "MobiKwik",
      "Siply",
      "Paytm",
      "Google Pay",
      "Amazon QR",
      "Airtel",
      "Pine Labs",
      "Tide",
      "Cheq",
      "BharatPe",
    ],
  },
  {
    id: "banking-financial",
    title: "Banking & financial services",
    description:
      "Field-led customer acquisition, lead generation and campaign support across banking, investment and financial services.",
    brands: [
      "Airtel Payments Bank",
      "Axis Bank",
      "YES BANK",
      "Kotak 811",
      "Upstox",
      "Axis Securities",
      "ICICI Securities",
      "Edelweiss",
      "Angel One",
      "5paisa",
      "Motilal Oswal",
      "PwC",
      "WhiteHat Jr.",
    ],
  },
  {
    id: "deployment-audit",
    title: "Deployment & audit",
    description:
      "Manpower deployment and field-audit experience across retail, food and beverage, consumer electronics and brand-led assignments.",
    brands: [
      "Subway",
      "McDonald's",
      "ASUS",
      "Marlboro",
      "Brown-Forman",
      "Jim Beam",
      "Tilaknagar Industries",
      "Pine Labs",
      "Usha",
    ],
  },
  {
    id: "sampling-activation",
    title: "Sampling & consumer activation",
    description:
      "On-ground product sampling, customer interaction, promotion and consumer engagement for activation-led briefs.",
    brands: ["iD Fresh Food"],
  },
] as const;

export const brandExperienceIntro = {
  eyebrow: "Brand experience",
  title: "Experience built in the field.",
  description:
    "ZOBHUNGER has supported assignments across e-commerce, logistics, fintech, banking, retail, food & beverage and digital services through manpower, field operations, auditing, sampling, lead generation, onboarding, training and consumer engagement.",
} as const;

export const featuredBrandExperience = [
  "Amazon",
  "Flipkart",
  "Zepto",
  "Zomato",
  "Swiggy",
  "Paytm",
  "Google Pay",
  "Axis Bank",
  "Upstox",
  "Pine Labs",
  "McDonald's",
  "ASUS",
] as const;
