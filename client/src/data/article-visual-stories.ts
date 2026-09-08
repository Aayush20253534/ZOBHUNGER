import type { ExecutionVisualId } from "@/data/execution-visuals";
import type { SolutionSlug } from "@/types/solution-detail.types";

export interface ArticleVisualStory {
  cover: ExecutionVisualId;
  coverCaption: string;
  service: SolutionSlug;
  serviceLabel: string;
  example: {
    sectionId: string;
    visual: ExecutionVisualId;
    title: string;
    situation: string;
    brief: string;
    action: string;
    review: string;
  };
  workflow: {
    sectionId: string;
    title: string;
    steps: readonly [
      { title: string; description: string },
      { title: string; description: string },
      { title: string; description: string },
      { title: string; description: string },
    ];
    feedback: string;
  };
}

// Editorial illustrations and hypothetical assignments, not client campaign
// evidence. Explicit slug mappings keep unrelated future articles unchanged.
const articleVisualStories = {
  "build-a-field-workforce-that-performs-from-day-one": {
    cover: "workforce-hiring",
    coverCaption: "A practical screening conversation connects the candidate's experience with the work expected from day one.",
    service: "workforce-solutions",
    serviceLabel: "Workforce Solutions",
    example: {
      sectionId: "start-with-outcomes",
      visual: "qr-deployment",
      title: "A QR visit makes the role concrete.",
      situation: "Imagine hiring an executive for merchant visits. Writing the expected handover into the brief gives screening and training a practical starting point.",
      brief: "Place the assigned QR display, explain its use and check the scan with the merchant.",
      action: "The executive confirms the outlet, positions the display and walks the merchant through the handover.",
      review: "A visit record identifies what was placed, whether the scan was checked and any open issue.",
    },
    workflow: {
      sectionId: "design-the-first-week",
      title: "Make the first assignment a learning sequence.",
      steps: [
        { title: "Brief the role", description: "Explain the task, location and completion criteria." },
        { title: "Rehearse the task", description: "Practise the customer conversation and reporting format." },
        { title: "Support the visit", description: "Give the first activity a clear contact for questions." },
        { title: "Review readiness", description: "Check the handover before independent deployment." },
      ],
      feedback: "If the first record is unclear, clarify the brief and repeat the relevant practice before the next assignment.",
    },
  },
  "operating-system-for-distributed-workforce-management": {
    cover: "operations-coordination",
    coverCaption: "Coordinators turn field updates into clear actions, with a shared understanding of the record and its next owner.",
    service: "business-operations",
    serviceLabel: "Business Operations",
    example: {
      sectionId: "separate-presence-from-productivity",
      visual: "audit",
      title: "An outlet visit needs a usable handover.",
      situation: "An auditor reports at a store and finds a shelf gap. The coordinator needs enough context to decide who should take the next action.",
      brief: "Check the assigned products and displays against the outlet checklist.",
      action: "The auditor records the finding with the outlet details and a permitted shelf photograph.",
      review: "The coordinator checks the evidence, assigns the issue and tracks whether clarification is still needed.",
    },
    workflow: {
      sectionId: "make-escalations-explicit",
      title: "Keep the issue connected to its owner.",
      steps: [
        { title: "Receive the record", description: "Bring the field update and its context together." },
        { title: "Check the gap", description: "Identify missing details or work needing support." },
        { title: "Assign the action", description: "Route the issue to the person who can resolve it." },
        { title: "Confirm the update", description: "Record the response and any remaining follow-up." },
      ],
      feedback: "When information is missing, return a specific clarification request to the field executive and keep the original issue visible.",
    },
  },
  "design-a-sales-hiring-engine-for-market-expansion": {
    cover: "seller-onboarding",
    coverCaption: "Market expansion depends on executives who can explain the offering and guide the customer's next step.",
    service: "sales-force",
    serviceLabel: "Sales Force",
    example: {
      sectionId: "hire-for-conversation",
      visual: "field-executives",
      title: "Turn a role play into a field-ready conversation.",
      situation: "Give a candidate a short product brief and a customer question. Observe how they listen, explain and agree a useful next action.",
      brief: "Introduce the approved offering clearly and understand what the customer needs to know.",
      action: "The executive uses the brochure, answers within the product brief and checks the customer's interest.",
      review: "The enquiry record captures the question, the agreed follow-up and the person responsible for it.",
    },
    workflow: {
      sectionId: "track-leading-signals",
      title: "Connect territory activity to the next conversation.",
      steps: [
        { title: "Plan coverage", description: "Set the assigned accounts and visit priorities." },
        { title: "Hold the conversation", description: "Explain the offering and listen to the enquiry." },
        { title: "Agree a next step", description: "Record the required demonstration, information or follow-up." },
        { title: "Review progress", description: "Look for gaps in coverage, understanding or handover." },
      ],
      feedback: "Repeated questions can guide coaching and improve the product briefing for the next round of visits.",
    },
  },
  "gig-workforce-at-scale-speed-quality-control": {
    cover: "last-mile-delivery",
    coverCaption: "From a delivery handover to a market visit, flexible assignments need a clear task and a check before work begins.",
    service: "gig-workforce",
    serviceLabel: "Gig Workforce",
    example: {
      sectionId: "make-quality-observable",
      visual: "qr-deployment",
      title: "Define what closes a short deployment task.",
      situation: "A temporary executive is assigned a merchant QR visit. A clear completion record helps the reviewer understand the handover.",
      brief: "Visit the assigned merchant, place the display and explain the scan check.",
      action: "The executive follows the task instructions, checks the details with the merchant and reports any problem.",
      review: "The submission separates placement, merchant handover and scan-check status so unresolved work can be clarified.",
    },
    workflow: {
      sectionId: "verify-before-deploy",
      title: "Prepare a short assignment before sending the team.",
      steps: [
        { title: "Define the task", description: "Make the location, work period and handover specific." },
        { title: "Check suitability", description: "Confirm the skills and availability the task requires." },
        { title: "Brief completion", description: "Explain the materials, contact person and evidence needed." },
        { title: "Confirm readiness", description: "Resolve open questions before the assignment starts." },
      ],
      feedback: "A missing material or unclear instruction goes back to the coordinator before the executive begins the visit.",
    },
  },
  "retail-execution-that-reaches-the-shelf": {
    cover: "audit",
    coverCaption: "The checklist, shelf observation and visit record work together to make retail execution reviewable.",
    service: "retail-execution",
    serviceLabel: "Retail Execution",
    example: {
      sectionId: "capture-evidence",
      visual: "audit",
      title: "Make a shelf gap understandable to the reviewer.",
      situation: "During an assigned store check, an auditor cannot find a listed product in its expected shelf position.",
      brief: "Check the specified product and display condition at the assigned outlet.",
      action: "The auditor follows the checklist and captures a permitted photograph showing the shelf context.",
      review: "The record links the outlet, product, observation and image so the issue can be routed to an appropriate owner.",
    },
    workflow: {
      sectionId: "design-the-visit",
      title: "Give every store visit a consistent sequence.",
      steps: [
        { title: "Confirm the outlet", description: "Match the visit to its assigned store and checklist." },
        { title: "Inspect and act", description: "Check the shelf and perform the agreed store activity." },
        { title: "Capture the finding", description: "Pair the observation with relevant context and evidence." },
        { title: "Route the follow-up", description: "Assign a next action for gaps that remain open." },
      ],
      feedback: "If a submission does not show the required condition, request a specific correction before drawing a conclusion from it.",
    },
  },
  "trade-marketing-from-brief-to-storefront": {
    cover: "sampling",
    coverCaption: "The customer sees one interaction; the team coordinates the approach, sample handover and feedback behind it.",
    service: "brand-activation",
    serviceLabel: "Brand Activation",
    example: {
      sectionId: "match-people-to-format",
      visual: "sampling",
      title: "Show the promoter what a good sample handover looks like.",
      situation: "At the assigned market location, a promoter approaches a shopper with a tray of sealed samples and the campaign's product introduction.",
      brief: "Invite willing shoppers, explain the product and record the agreed activity and feedback.",
      action: "The promoter starts the conversation, offers a sealed sample and gives the shopper space to ask questions.",
      review: "The activity update brings together distribution, customer response and any material or location issues.",
    },
    workflow: {
      sectionId: "capture-the-right-data",
      title: "Carry the customer interaction into the campaign review.",
      steps: [
        { title: "Set the record", description: "Agree the location, activity and information that matters." },
        { title: "Capture the activity", description: "Record the sample handover using the agreed format." },
        { title: "Listen to feedback", description: "Note relevant questions and customer responses." },
        { title: "Review the campaign", description: "Bring activity, feedback and operational gaps together." },
      ],
      feedback: "A shortage of samples should reach the coordinator with the location and material details needed to plan the next action.",
    },
  },
  "last-mile-execution-as-competitive-advantage": {
    cover: "qr-deployment",
    coverCaption: "A market rollout reaches the client through individual visits, clear handovers and useful field feedback.",
    service: "sales-force",
    serviceLabel: "Sales Force",
    example: {
      sectionId: "strategy-meets-friction",
      visual: "seller-onboarding",
      title: "A local conversation reveals the next requirement.",
      situation: "A shop owner wants to start selling online, but the product information needed for a first listing is incomplete.",
      brief: "Explain the onboarding steps and help the assigned seller understand the information required.",
      action: "The executive walks through the registration and listing requirements with the shop owner.",
      review: "The handover records the seller's stage, missing details and agreed follow-up so the next visit has a purpose.",
    },
    workflow: {
      sectionId: "execution-as-learning",
      title: "Let the next plan learn from the last visit.",
      steps: [
        { title: "Observe locally", description: "Notice the customer's questions and practical constraints." },
        { title: "Record the context", description: "Connect the observation to the task and location." },
        { title: "Review the pattern", description: "Look for recurring needs across field updates." },
        { title: "Refine the brief", description: "Adjust the next visit, material or training priority." },
      ],
      feedback: "Recurring listing questions can inform a clearer seller briefing before the next market rollout.",
    },
  },
} as const satisfies Record<string, ArticleVisualStory>;

export function getArticleVisualStory(slug: string): ArticleVisualStory | undefined {
  if (!Object.hasOwn(articleVisualStories, slug)) return undefined;
  return articleVisualStories[slug as keyof typeof articleVisualStories];
}

// Keep search and estimated reading time aware of the visible story content.
export function getArticleVisualText(slug: string): string {
  const story = getArticleVisualStory(slug);
  if (!story) return "";
  return [
    story.coverCaption,
    story.serviceLabel,
    story.example.title,
    story.example.situation,
    story.example.brief,
    story.example.action,
    story.example.review,
    story.workflow.title,
    ...story.workflow.steps.flatMap((step) => [step.title, step.description]),
    story.workflow.feedback,
  ].join(" ");
}
