import type { ExecutionVisualId } from "@/data/execution-visuals";
import type { SolutionSlug } from "@/types/solution-detail.types";

interface HomeExecutionStory {
  id: ExecutionVisualId;
  label: string;
  heading: string;
  stepDetails: readonly [string, string, string];
  visibility: string;
  serviceSlug: SolutionSlug;
  caseStudySlug?: string;
}

export const homeExecutionStories: readonly HomeExecutionStory[] = [
  {
    id: "survey",
    label: "Surveys",
    heading: "Capture useful answers from the market.",
    stepDetails: [
      "Introduce the purpose and confirm the shopper is willing to take part.",
      "Use a consistent questionnaire to capture responses on a tablet.",
      "Check responses for completeness before compiling the field update.",
    ],
    visibility: "Structured responses, field notes and submission-quality checks.",
    serviceSlug: "retail-execution",
    caseStudySlug: "consumer-survey-market-research",
  },
  {
    id: "audit",
    label: "Audits",
    heading: "Check the shelf. Record the evidence.",
    stepDetails: [
      "Visit assigned stores with a checklist aligned to the audit brief.",
      "Review product availability, shelf placement and promotional displays.",
      "Record observations and photographs for the outlet review.",
    ],
    visibility: "Outlet observations and photo evidence of stock or display gaps.",
    serviceSlug: "retail-execution",
    caseStudySlug: "retail-store-audit-compliance",
  },
  {
    id: "seller-onboarding",
    label: "Seller onboarding",
    heading: "Help local sellers get ready to sell online.",
    stepDetails: [
      "Explain the registration process and the information the seller needs.",
      "Help complete forms and coordinate the required documentation.",
      "Follow up on open steps and help prepare the first product listings.",
    ],
    visibility: "Registration progress, open requirements and listing-readiness updates.",
    serviceSlug: "sales-force",
    caseStudySlug: "marketplace-seller-acquisition",
  },
  {
    id: "qr-deployment",
    label: "QR deployment",
    heading: "Place the QR. Explain it. Check the scan.",
    stepDetails: [
      "Agree an accessible counter location and place the merchant's display.",
      "Show the merchant how customers can use the code at checkout.",
      "Verify the merchant details, check a scan and record deployment status.",
    ],
    visibility: "Deployment status, merchant handover and scan-check updates.",
    serviceSlug: "sales-force",
    caseStudySlug: "digital-merchant-onboarding-qr-deployment",
  },
  {
    id: "sampling",
    label: "Sampling",
    heading: "Introduce the product. Put a sample in hand.",
    stepDetails: [
      "Start a friendly conversation and invite the shopper to try the product.",
      "Hand over a sealed sample and explain the product's intended use.",
      "Ask for the shopper's response and capture a short activity update.",
    ],
    visibility: "Distribution activity, customer feedback and outlet-level notes.",
    serviceSlug: "brand-activation",
    caseStudySlug: "consumer-product-sampling",
  },
  {
    id: "field-executives",
    label: "Field executives",
    heading: "Take the conversation into the market.",
    stepDetails: [
      "Introduce the offering with the approved brochure or product demo.",
      "Answer questions and understand the customer's interest and needs.",
      "Record enquiries and agree the next steps for the follow-up team.",
    ],
    visibility: "Customer enquiries, questions and follow-up status.",
    serviceSlug: "sales-force",
  },
];
