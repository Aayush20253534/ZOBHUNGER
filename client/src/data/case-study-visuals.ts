import type { ExecutionVisualId } from "@/data/execution-visuals";
import type { SolutionSlug } from "@/types/solution-detail.types";

export type CaseStageIcon = "map" | "conversation" | "checklist" | "qr" | "shop" | "person" | "delivery" | "camera" | "sample" | "record" | "phone";
interface CaseStage {
  icon: CaseStageIcon;
  title: string;
  action: string;
  record: string;
}

export interface CaseStudyVisualStory {
  cover: ExecutionVisualId;
  caption: string;
  introduction: string;
  stages: readonly [CaseStage, CaseStage, CaseStage, CaseStage];
  handoverTitle: string;
  handover: readonly [
    { title: string; detail: string },
    { title: string; detail: string },
    { title: string; detail: string },
  ];
  feedback: string;
  service: SolutionSlug;
  serviceLabel: string;
  articleSlug: string;
}

// Representative operating models. The images and suggested reporting items
// illustrate the work; they do not assert measured results from client campaigns.
const caseStudyVisuals = {
  "digital-merchant-onboarding-qr-deployment": {
    cover: "qr-deployment",
    caption: "At the merchant counter: place the display, explain payment acceptance and check the scan together.",
    introduction: "Follow a merchant visit from the first conversation to a checked QR handover and an actionable field update.",
    stages: [
      { icon: "conversation", title: "Meet the merchant", action: "Visit the assigned outlet, explain the offering and understand the merchant's questions.", record: "Outlet and interest recorded" },
      { icon: "record", title: "Support onboarding", action: "Guide registration and coordinate the required documents through the approved process.", record: "Application and pending items" },
      { icon: "qr", title: "Place and explain", action: "Position the assigned QR display at the counter and demonstrate how it is used.", record: "Placement and handover note" },
      { icon: "checklist", title: "Check and follow up", action: "Check the scan with the merchant and route any activation issue to its owner.", record: "Scan check and next action" },
    ],
    handoverTitle: "A merchant visit the client can follow.",
    handover: [
      { title: "Onboarding progress", detail: "Outlet reference, application stage and items still needed." },
      { title: "Deployment record", detail: "Display placement, merchant explanation and agreed verification evidence." },
      { title: "Open actions", detail: "Scan or activation issues, the assigned owner and the follow-up." },
    ],
    feedback: "If activation is incomplete, keep the visit open for a specific follow-up instead of treating placement alone as completion.",
    service: "sales-force",
    serviceLabel: "Sales Force",
    articleSlug: "last-mile-execution-as-competitive-advantage",
  },
  "marketplace-seller-acquisition": {
    cover: "seller-onboarding",
    caption: "At a local shop: help the seller understand registration and prepare a first product listing.",
    introduction: "A seller needs a guided path from interest to a complete application and a clear next step toward listing readiness.",
    stages: [
      { icon: "map", title: "Find suitable sellers", action: "Identify relevant businesses in the assigned market and introduce online selling.", record: "Business fit and interest" },
      { icon: "conversation", title: "Explain the process", action: "Walk through participation, registration and the information the seller needs to prepare.", record: "Questions and agreed next step" },
      { icon: "shop", title: "Assist registration", action: "Support the application and help organise the product details needed for listing.", record: "Application and listing readiness" },
      { icon: "phone", title: "Close the gaps", action: "Follow up through the field or telesales team on missing details and stalled applications.", record: "Pending items and follow-up owner" },
    ],
    handoverTitle: "A seller pipeline with a next action.",
    handover: [
      { title: "Seller stage", detail: "Contacted, interested or in registration, using the agreed tracking format." },
      { title: "Readiness gaps", detail: "Outstanding documentation, product information and seller questions." },
      { title: "Follow-up plan", detail: "The field or telesales owner and the next conversation required." },
    ],
    feedback: "Return incomplete applications to the right owner with the exact information needed to move the seller forward.",
    service: "sales-force",
    serviceLabel: "Sales Force",
    articleSlug: "design-a-sales-hiring-engine-for-market-expansion",
  },
  "last-mile-delivery-workforce": {
    cover: "last-mile-delivery",
    caption: "At the dispatch point: a coordinator checks a parcel handover with a rider before the assignment begins.",
    introduction: "The delivery handover shown here depends on work that starts earlier: local sourcing, readiness checks and a supported first shift.",
    stages: [
      { icon: "map", title: "Source locally", action: "Plan the city and shift requirement, then reach candidates through local hiring channels.", record: "Location and shift availability" },
      { icon: "person", title: "Check readiness", action: "Coordinate screening, required documents and the operational induction.", record: "Candidate readiness and gaps" },
      { icon: "delivery", title: "Support joining", action: "Confirm reporting details and help the rider understand the first assignment and handover.", record: "Joining and assignment update" },
      { icon: "phone", title: "Maintain coverage", action: "Track joining gaps and coordinate location-specific replacement requirements.", record: "Open roles and replacement action" },
    ],
    handoverTitle: "Workforce readiness by operating location.",
    handover: [
      { title: "Hiring pipeline", detail: "Candidate stage, assigned location and availability for the required shift." },
      { title: "Joining readiness", detail: "Completed induction steps and outstanding requirements before reporting." },
      { title: "Coverage follow-up", detail: "Joining exceptions, replacement needs and the responsible coordinator." },
    ],
    feedback: "A joining gap returns to local sourcing with the role, location and timing needed for a useful replacement.",
    service: "gig-workforce",
    serviceLabel: "Gig Workforce",
    articleSlug: "gig-workforce-at-scale-speed-quality-control",
  },
  "mobility-partner-onboarding": {
    cover: "mobility-onboarding",
    caption: "At a partner support point: an executive explains the registration steps to a prospective rider.",
    introduction: "City expansion needs partners who understand the opportunity and have completed the checks needed before activation.",
    stages: [
      { icon: "conversation", title: "Reach local partners", action: "Connect with suitable drivers or vehicle partners and explain the programme requirements.", record: "Partner interest and city" },
      { icon: "record", title: "Guide registration", action: "Help the partner understand the application and coordinate the required documents.", record: "Application and document stage" },
      { icon: "checklist", title: "Prepare for activation", action: "Coordinate required verification and training, with clear ownership of outstanding items.", record: "Readiness checklist" },
      { icon: "phone", title: "Confirm the next step", action: "Follow up on activation status and route unresolved onboarding questions.", record: "Activation status and follow-up" },
    ],
    handoverTitle: "A clear view of partner readiness.",
    handover: [
      { title: "City pipeline", detail: "Partner type, programme location and current application stage." },
      { title: "Readiness record", detail: "Verification and training progress against the agreed checklist." },
      { title: "Activation follow-up", detail: "Outstanding requirements and the person coordinating the next step." },
    ],
    feedback: "Keep an unresolved verification or training item visible until the appropriate team confirms the next step.",
    service: "sales-force",
    serviceLabel: "Sales Force",
    articleSlug: "operating-system-for-distributed-workforce-management",
  },
  "retail-store-audit-compliance": {
    cover: "audit",
    caption: "At the shelf: compare the agreed checklist with what is in store and capture the finding in context.",
    introduction: "A useful audit connects a specific outlet observation to evidence that a central reviewer can understand and act on.",
    stages: [
      { icon: "map", title: "Confirm the outlet", action: "Match the store visit to the assigned outlet, product list and audit checklist.", record: "Outlet and visit context" },
      { icon: "checklist", title: "Inspect the shelf", action: "Check availability, display positions and promotion execution against the brief.", record: "Checklist observations" },
      { icon: "camera", title: "Capture the finding", action: "Record permitted photographs and the location or time context required by the project.", record: "Evidence linked to the finding" },
      { icon: "record", title: "Review and route", action: "Check the submission and assign a follow-up for availability or display gaps.", record: "Issue and action owner" },
    ],
    handoverTitle: "Store observations ready for review.",
    handover: [
      { title: "Visit coverage", detail: "Outlet reference and the checks included in the assignment." },
      { title: "Observation record", detail: "Product or display condition paired with the relevant evidence." },
      { title: "Action list", detail: "Gaps needing attention, clarification requests and the next owner." },
    ],
    feedback: "When evidence is unclear, request the specific missing context before treating an observation as a confirmed store issue.",
    service: "retail-execution",
    serviceLabel: "Retail Execution",
    articleSlug: "retail-execution-that-reaches-the-shelf",
  },
  "consumer-product-sampling": {
    cover: "sampling",
    caption: "In the market: the promoter approaches a willing shopper, introduces the product and offers a sealed sample.",
    introduction: "Follow the customer interaction from the opening conversation to sample distribution and feedback that informs the campaign review.",
    stages: [
      { icon: "checklist", title: "Brief the promoter", action: "Confirm the location, product introduction, sample materials and campaign record.", record: "Location and material readiness" },
      { icon: "conversation", title: "Approach the shopper", action: "Invite a willing customer to hear about the product and explain what the sample is.", record: "Customer interaction" },
      { icon: "sample", title: "Offer the sample", action: "Hand over a sealed sample, explain its use and give the shopper space to ask questions.", record: "Distribution activity" },
      { icon: "record", title: "Listen and report", action: "Capture the agreed feedback and report sample availability or outlet issues.", record: "Response and campaign follow-up" },
    ],
    handoverTitle: "The customer response behind the activity.",
    handover: [
      { title: "Activity summary", detail: "Participating location and distribution recorded in the agreed format." },
      { title: "Shopper feedback", detail: "Relevant questions, reactions and product explanation needs." },
      { title: "Campaign follow-up", detail: "Material shortages, location issues and actions for the coordinator." },
    ],
    feedback: "Use recurring shopper questions and material gaps to improve the next briefing and prepare the next location.",
    service: "brand-activation",
    serviceLabel: "Brand Activation",
    articleSlug: "trade-marketing-from-brief-to-storefront",
  },
  "consumer-survey-market-research": {
    cover: "survey",
    caption: "Beside a local shop: a researcher explains the survey, listens and records the shopper's response.",
    introduction: "Consistent field research makes the questionnaire, customer conversation and submission review part of the same process.",
    stages: [
      { icon: "map", title: "Prepare the visit", action: "Brief the team on the target geography, questionnaire and collection requirements.", record: "Assigned location and form" },
      { icon: "conversation", title: "Explain and ask", action: "Introduce the purpose, confirm willingness to participate and follow the questionnaire.", record: "Participation and responses" },
      { icon: "record", title: "Capture consistently", action: "Record answers in the agreed digital form with the required visit context.", record: "Structured field submission" },
      { icon: "checklist", title: "Review the submission", action: "Check completeness and route inconsistent or missing entries for clarification.", record: "Reviewed data and open queries" },
    ],
    handoverTitle: "Field responses with reviewable context.",
    handover: [
      { title: "Response set", detail: "Answers organised by the agreed questionnaire and location fields." },
      { title: "Visit context", detail: "Project-approved location or validation information attached to the submission." },
      { title: "Quality review", detail: "Completeness checks, clarification requests and unresolved entries." },
    ],
    feedback: "Return a questionable entry with a clear query; use repeated collection issues to improve the researcher's briefing.",
    service: "retail-execution",
    serviceLabel: "Retail Execution",
    articleSlug: "gig-workforce-at-scale-speed-quality-control",
  },
  "managed-workforce-staffing": {
    cover: "workforce-hiring",
    caption: "During screening: a recruiter checks the candidate's fit and explains the assignment before joining.",
    introduction: "A managed workforce programme connects recruitment to joining support and the records needed to coordinate an ongoing team.",
    stages: [
      { icon: "checklist", title: "Define the requirement", action: "Agree the roles, locations, start dates and screening criteria with the client.", record: "Role and deployment brief" },
      { icon: "person", title: "Source and screen", action: "Reach suitable candidates and check their experience, availability and role fit.", record: "Screened candidate pipeline" },
      { icon: "record", title: "Coordinate joining", action: "Support documentation, reporting instructions and the candidate's first-day readiness.", record: "Joining and readiness update" },
      { icon: "phone", title: "Support the workforce", action: "Coordinate attendance inputs, workforce queries and replacement requirements.", record: "Workforce updates and open actions" },
    ],
    handoverTitle: "One view from hiring to ongoing support.",
    handover: [
      { title: "Hiring progress", detail: "Role and location requirements linked to candidate and joining stages." },
      { title: "Workforce records", detail: "Agreed attendance and administration inputs for client review." },
      { title: "Continuity actions", detail: "Replacement requirements, pending queries and coordinator ownership." },
    ],
    feedback: "Feed replacement needs and recurring joining questions into the next sourcing and onboarding cycle.",
    service: "workforce-solutions",
    serviceLabel: "Workforce Solutions",
    articleSlug: "build-a-field-workforce-that-performs-from-day-one",
  },
} as const satisfies Record<string, CaseStudyVisualStory>;

export function getCaseStudyVisualStory(slug: string): CaseStudyVisualStory | undefined {
  return Object.hasOwn(caseStudyVisuals, slug)
    ? caseStudyVisuals[slug as keyof typeof caseStudyVisuals]
    : undefined;
}
