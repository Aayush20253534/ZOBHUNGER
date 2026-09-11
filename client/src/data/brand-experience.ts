export interface BrandExperienceGroup {
  id: string;
  title: string;
  description: string;
  brands: readonly string[];
}

/** Brand names below come from the client-provided brand experience brief. */
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
      "KiranKart",
      "Bikayi",
      "Locooff",
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
      "PagarBook",
      "BharatPe",
      "Tonetag",
      "VacoBinary",
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
      // The brief spells this brand "Malboro"; the public-facing trademark is "Marlboro".
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

// The compact marquee is intentionally sourced from the complete grouped list,
// so a partner added to the brief appears in both logo sliders automatically.
export const featuredBrandExperience = Array.from(
  new Set(brandExperienceGroups.flatMap((group) => group.brands)),
) as readonly string[];
