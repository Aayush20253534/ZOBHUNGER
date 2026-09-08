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
    srcSet: `${base}-600.webp 600w, ${base}-1200.webp 1200w, ${base}-1536.webp 1536w`,
    width: 1200,
    height: 800,
    sourceLabel: "AI-generated scene",
  } as const;
}

// Illustrative service scenes, not photographs or evidence of client campaigns.
// Reuse the descriptions and steps when building service and editorial stories.
export const executionVisuals = {
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
} as const;

export type ExecutionVisualId = keyof typeof executionVisuals;
export type ExecutionVisualAsset = ReturnType<typeof createVisual>;
