interface ExecutionScene {
  title: string;
  alt: string;
  caption: string;
  steps: readonly [string, string, string];
}

function createVisual(id: string, scene: ExecutionScene) {
  const base = `/images/execution/${id}`;

  return {
    ...scene,
    id,
    src: `${base}-1200.webp`,
    srcSet: `${base}-600.webp 600w, ${base}-960.webp 960w, ${base}-1200.webp 1200w, ${base}-1536.webp 1536w`,
    width: 1200,
    height: 800,
    sourceLabel: "AI-generated scene",
  } as const;
}

// Illustrative service scenes, not photographs or evidence of client campaigns.
// Reuse the descriptions and steps when building service and editorial stories.
export const executionVisuals = {
  verification: createVisual("verification", {
    title: "Verification services",
    alt: "AI-generated illustration of a ZOBHUNGER verification executive reviewing business documents and a tablet checklist with a business owner.",
    caption: "An executive reviews the agreed information with the applicant, records the checks and flags details that need clarification.",
    steps: ["Agree the checks", "Verify the information", "Share clear findings"],
  }),
  "brand-deployment": createVisual("brand-deployment", {
    title: "Branding & activation",
    alt: "AI-generated illustration of ZOBHUNGER executives placing a promotional sticker at a shop and handing a leaflet to a shopper in an Indian market.",
    caption: "A coordinated field team places approved branding and introduces the campaign to shoppers through direct leaflet distribution.",
    steps: ["Plan the campaign", "Deploy and engage", "Review the activity"],
  }),
  survey: createVisual("survey", {
    title: "Consumer surveys",
    alt: "Illustration of a ZOBHUNGER researcher recording a shopper's survey responses on a tablet outside a grocery shop.",
    caption: "A field researcher explains the survey, listens to the shopper and records structured responses.",
    steps: ["Explain the survey", "Record responses", "Review field submissions"],
  }),
  audit: createVisual("audit", {
    title: "Retail audits",
    alt: "Illustration of a ZOBHUNGER auditor checking a grocery shelf with a tablet and photographing an availability gap.",
    caption: "An auditor checks product availability and displays, then captures evidence for the visit report.",
    steps: ["Visit the outlet", "Check stock and displays", "Capture evidence"],
  }),
  "seller-onboarding": createVisual("seller-onboarding", {
    title: "Seller onboarding",
    alt: "Illustration of a ZOBHUNGER executive helping a shop owner work through an online product listing on a laptop.",
    caption: "An executive helps the seller understand registration and prepare products for online listing.",
    steps: ["Explain online selling", "Assist registration", "Check listing readiness"],
  }),
  "qr-deployment": createVisual("qr-deployment", {
    title: "QR deployment",
    alt: "Illustration of a ZOBHUNGER executive placing a QR display at a shop counter while the merchant checks it with a phone.",
    caption: "An executive places the QR display, explains its use and helps the merchant check a scan.",
    steps: ["Place the QR display", "Explain its use", "Check a test scan"],
  }),
  sampling: createVisual("sampling", {
    title: "Market sampling",
    alt: "Illustration of a ZOBHUNGER promoter offering a sealed product sample to a shopper in a local market.",
    caption: "A promoter approaches the shopper, introduces the product and offers a sample before asking for feedback.",
    steps: ["Approach the customer", "Offer a sealed sample", "Collect feedback"],
  }),
  "field-executives": createVisual("field-executives", {
    title: "Card and field executives",
    alt: "Illustration of two ZOBHUNGER field executives explaining a card-service brochure to a customer in a neighbourhood market.",
    caption: "Field executives explain the offering, answer questions and record enquiries for follow-up.",
    steps: ["Explain the offering", "Answer questions", "Record follow-up"],
  }),
  "workforce-hiring": createVisual("workforce-hiring", {
    title: "Workforce recruitment",
    alt: "AI illustration of a ZOBHUNGER recruiter discussing a role with a candidate and reviewing a screening checklist.",
    caption: "A recruiter listens to the candidate, checks role suitability and explains the next step.",
    steps: ["Explain the role", "Screen the candidate", "Coordinate joining"],
  }),
  "operations-coordination": createVisual("operations-coordination", {
    title: "Operations coordination",
    alt: "AI illustration of two ZOBHUNGER coordinators reviewing field updates on a laptop and noting the next action.",
    caption: "Coordinators review field updates, resolve questions and assign the next action.",
    steps: ["Receive field updates", "Assign the follow-up", "Review completion"],
  }),
  "product-demonstration": createVisual("product-demonstration", {
    title: "In-store product demonstrations",
    alt: "AI illustration of a ZOBHUNGER promoter explaining a portable speaker while a shopper tries its controls in an electronics store.",
    caption: "A promoter demonstrates the product, invites the shopper to try it and answers questions.",
    steps: ["Introduce the product", "Demonstrate its use", "Answer shopper questions"],
  }),
  "last-mile-delivery": createVisual("last-mile-delivery", {
    title: "Delivery workforce",
    alt: "AI illustration of a ZOBHUNGER coordinator scanning a parcel during a handover to a delivery rider at a dispatch point.",
    caption: "A coordinator checks the parcel handover with a rider before the delivery assignment begins.",
    steps: ["Brief the assignment", "Check the handover", "Support the route"],
  }),
  "mobility-onboarding": createVisual("mobility-onboarding", {
    title: "Mobility partner onboarding",
    alt: "AI illustration of a ZOBHUNGER executive guiding a prospective mobility partner through registration on a tablet beside a parked scooter.",
    caption: "An executive guides the partner through registration and explains the steps before activation.",
    steps: ["Explain the opportunity", "Support registration", "Check activation readiness"],
  }),
} as const;

export type ExecutionVisualId = keyof typeof executionVisuals;
export type ExecutionVisualAsset = ReturnType<typeof createVisual>;
