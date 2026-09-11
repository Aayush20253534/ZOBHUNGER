import { deliverySteps } from "@/data/company";
import type { ExecutionVisualId } from "@/data/execution-visuals";
import type { SolutionSlug } from "@/types/solution-detail.types";

type Three<T> = readonly [T, T, T];

export type ExecutionStoryContent = {
  title: string;
  description: string;
  actions: Three<{ title: string; description: string }>;
  outcome: string;
} & (
  | { visualId: ExecutionVisualId }
  | {
      record: {
        title: string;
        fields: Three<{ label: string; value: string }>;
        handoff: string;
      };
    }
);

// Illustrative assignments explain the work without implying campaign results
// or a live reporting portal. Scope and reporting are agreed with each client.
const fieldStories = {
  verification: {
    title: "Every check connects to a clear finding.",
    description: "A verification assignment brings the agreed information, source checks and field observations into one review.",
    visualId: "verification",
    actions: [
      { title: "Confirm the scope", description: "Agree the checklist, required permissions, information and locations before starting." },
      { title: "Carry out the checks", description: "Review the documents, coordinate source enquiries and complete the agreed field visits." },
      { title: "Review and report", description: "Record supporting findings, highlight mismatches and share outstanding items for review." },
    ],
    outcome: "Completed checks, recorded findings and open clarifications in the agreed reporting format.",
  },
  branding: {
    title: "From approved artwork to a visible market presence.",
    description: "Executives coordinate sticker placement and leaflet distribution around the outlet plan and campaign brief.",
    visualId: "brand-deployment",
    actions: [
      { title: "Prepare the activity", description: "Confirm artwork, approved locations, permissions, materials and team responsibilities." },
      { title: "Deploy the campaign", description: "Place stickers at agreed points and introduce the campaign through flyer distribution and customer engagement." },
      { title: "Review the handover", description: "Collect placement records, activity updates and permitted photos, then flag any locations needing follow-up." },
    ],
    outcome: "Location-wise placement status, distribution updates and a clear record of campaign activity.",
  },
  workforce: {
    title: "Build the team that carries the brief into the market.",
    description:
      "A field-team assignment shows how hiring connects to the people representing your business on ground.",
    visualId: "field-executives",
    actions: [
      { title: "Define the role", description: "Agree the locations, customer conversations, skills and working schedule." },
      { title: "Select and prepare", description: "Review suitability, confirm availability and explain the assignment to the selected team." },
      { title: "Coordinate joining", description: "Confirm where each executive reports, who supports them and how work updates are shared." },
    ],
    outcome: "Candidate progress, joining readiness and deployment updates for the agreed roles.",
  },
  sellers: {
    title: "Turn a seller conversation into a clear next step.",
    description:
      "An executive works alongside the shop owner, from explaining the platform to checking what is needed for a first listing.",
    visualId: "seller-onboarding",
    actions: [
      { title: "Explain the opportunity", description: "Walk through the selling process and the information the platform requires." },
      { title: "Assist registration", description: "Guide the seller through the approved forms and flag missing information." },
      { title: "Check listing readiness", description: "Review product details with the seller and record the remaining follow-up." },
    ],
    outcome: "Registration stage, open requirements and listing-readiness notes for each assigned seller.",
  },
  qr: {
    title: "A deployment ends with the merchant knowing what to do.",
    description:
      "The counter visit includes placement, explanation and a scan check so the display is ready for its intended use.",
    visualId: "qr-deployment",
    actions: [
      { title: "Confirm and place", description: "Match the assigned display to the merchant and agree a visible counter position." },
      { title: "Explain the handover", description: "Show the merchant how the display is used and answer practical questions." },
      { title: "Check the scan", description: "Help verify the displayed merchant details and record the deployment status." },
    ],
    outcome: "Outlet visit status, placement confirmation and any scan or handover issues needing follow-up.",
  },
  conversations: {
    title: "Make each field conversation useful.",
    description:
      "Card and field executives introduce the approved offering, understand the customer's questions and agree the next action.",
    visualId: "field-executives",
    actions: [
      { title: "Introduce the offering", description: "Use the approved brochure and explain the purpose of the conversation." },
      { title: "Understand the enquiry", description: "Listen to the customer's needs and answer questions using the product brief." },
      { title: "Record the next action", description: "Capture the agreed enquiry details and hand off follow-up to the assigned team." },
    ],
    outcome: "Customer enquiries, common questions and follow-up actions, using the agreed reporting format.",
  },
  telecaller: {
    title: "Turn a calling list into a managed customer journey.",
    description:
      "A trained telecaller team combines a clear opening, useful qualification and disciplined follow-up so every conversation has a visible next step.",
    visualId: "telecaller-telesales",
    actions: [
      { title: "Prepare the conversation", description: "Review the audience, product brief, approved script and outcome options before the campaign starts." },
      { title: "Call and qualify", description: "Speak with prospects or customers, answer the first questions and capture the agreed call outcome." },
      { title: "Follow up and convert", description: "Prioritise callbacks, appointments and qualified opportunities, then share the activity record with your team." },
    ],
    outcome: "Call outcomes, qualified leads, appointments and follow-up actions in the agreed reporting format.",
  },
  sampling: {
    title: "Approach. Introduce. Put a sample in hand.",
    description:
      "The promoter makes the first approach, explains the product and offers a sealed sample in a real market setting.",
    visualId: "sampling",
    actions: [
      { title: "Invite the shopper", description: "Start with a friendly introduction and check whether the shopper wants to take part." },
      { title: "Hand over the sample", description: "Explain the product using the campaign brief and offer the sealed sample." },
      { title: "Listen and record", description: "Ask for feedback, note questions and update the agreed distribution record." },
    ],
    outcome: "Sampling activity, customer feedback and practical observations from the campaign location.",
  },
  surveys: {
    title: "Bring the customer's voice into a structured record.",
    description:
      "A researcher approaches shoppers in the assigned market and follows a consistent questionnaire on a tablet.",
    visualId: "survey",
    actions: [
      { title: "Explain and invite", description: "Introduce the research purpose and confirm the shopper is willing to participate." },
      { title: "Ask and capture", description: "Follow the agreed questions, listen without prompting and record the answers." },
      { title: "Review the submission", description: "Check for missing responses and flag entries that need clarification." },
    ],
    outcome: "Structured responses, visit notes and submission-quality checks for review.",
  },
  audits: {
    title: "Make the shelf condition visible beyond the store.",
    description:
      "An auditor follows the outlet checklist, checks product availability and captures the observations behind the visit report.",
    visualId: "audit",
    actions: [
      { title: "Start with the checklist", description: "Confirm the assigned outlet, products and display standards for the visit." },
      { title: "Inspect the shelf", description: "Check availability, placement and display condition against the agreed criteria." },
      { title: "Capture the evidence", description: "Record findings and permitted photographs, then flag gaps for review." },
    ],
    outcome: "Outlet observations, checklist findings and photo evidence of issues requiring attention.",
  },
  operations: {
    title: "Keep each task connected to an owner and a next action.",
    description:
      "An operations team supports the work behind field activity by reviewing updates, resolving gaps and coordinating handovers.",
    record: {
      title: "A field update reaches operations",
      fields: [
        { label: "Incoming work", value: "Outlet visit notes and activity records" },
        { label: "Review needed", value: "Missing details or an unresolved enquiry" },
        { label: "Next owner", value: "Assigned coordinator or field executive" },
      ],
      handoff: "Clarify the record → confirm the next action → include it in the review",
    },
    actions: [
      { title: "Receive and organise", description: "Bring incoming work into the agreed queue and identify who owns each item." },
      { title: "Check and coordinate", description: "Review completeness and route questions to the person who can resolve them." },
      { title: "Close the handover", description: "Record the outcome or outstanding action so the next team has the context it needs." },
    ],
    outcome: "Work completed, pending items, assigned follow-up and quality observations in the agreed updates.",
  },
  digital: {
    title: "Make every screen and integration serve the product goal.",
    description:
      "A digital build connects the user journey, interface, engineering and production handover instead of treating them as separate pieces.",
    visualId: "digital-development",
    actions: [
      { title: "Shape the product", description: "Translate the business requirement into users, journeys, features and a practical first scope." },
      { title: "Design and engineer", description: "Build the interface, application logic, APIs and integrations around the agreed product flow." },
      { title: "Test and launch", description: "Review the important journeys across devices, resolve release issues and verify the production deployment." },
    ],
    outcome: "A responsive, production-ready digital product with a clear scope, tested user journeys and an agreed path for future improvements.",
  },
  gig: {
    title: "Give a short assignment a clear start and finish.",
    description:
      "A market-survey assignment illustrates how a flexible team can be briefed for a defined task, location and work period.",
    visualId: "survey",
    actions: [
      { title: "Match the assignment", description: "Confirm the task, dates, location and the executive's suitability and availability." },
      { title: "Brief the visit", description: "Explain the questionnaire, contact person and completion requirements before work begins." },
      { title: "Review the handback", description: "Check the submitted work and note any clarification needed before closing the assignment." },
    ],
    outcome: "Assignment readiness, submitted activity and any outstanding items at handover.",
  },
} as const satisfies Record<string, ExecutionStoryContent>;

export const solutionFieldStories = {
  "website-application-development": [{ id: "digital-product", label: "Product design & delivery", story: fieldStories.digital }],
  "verification-services": [{ id: "verification", label: "Document & field checks", story: fieldStories.verification }],
  "workforce-solutions": [{ id: "workforce", label: "Field team deployment", story: fieldStories.workforce }],
  "sales-force": [
    { id: "sellers", label: "Seller onboarding", story: fieldStories.sellers },
    { id: "qr", label: "QR deployment", story: fieldStories.qr },
    { id: "conversations", label: "Card & field executives", story: fieldStories.conversations },
  ],
  "telecaller-telesales-services": [{ id: "telecaller", label: "Calling & follow-up", story: fieldStories.telecaller }],
  "promoter-solutions": [{ id: "sampling", label: "Customer engagement", story: fieldStories.sampling }],
  "retail-execution": [
    { id: "audits", label: "Store audits", story: fieldStories.audits },
    { id: "surveys", label: "Consumer surveys", story: fieldStories.surveys },
  ],
  "brand-activation": [{ id: "branding", label: "Branding & distribution", story: fieldStories.branding }, { id: "sampling", label: "Market sampling", story: fieldStories.sampling }],
  "business-operations": [{ id: "operations", label: "Coordination & handover", story: fieldStories.operations }],
  "gig-workforce": [{ id: "gig", label: "A short field assignment", story: fieldStories.gig }],
} as const satisfies Record<SolutionSlug, readonly {
  id: string;
  label: string;
  story: ExecutionStoryContent;
}[]>;

export const deliveryJourneyStories = [
  {
    id: "brief", label: "Share the brief",
    story: {
      title: deliverySteps[0].title,
      description: deliverySteps[0].description,
      record: {
        title: "Start with a workable assignment",
        fields: [
          { label: "Activity", value: "Survey, audit, onboarding or campaign work" },
          { label: "Coverage", value: "Markets, outlets and roles to be covered" },
          { label: "Timing", value: "Start date, work period and rollout stages" },
        ],
        handoff: "Your requirement becomes the sourcing and execution brief",
      },
      actions: [
        { title: "Describe the work", description: "Explain the activity and what successful completion should include." },
        { title: "Map the coverage", description: "Identify the locations, role mix and working arrangements." },
        { title: "Agree the checkpoints", description: "Define the timeline, contact people and updates needed during delivery." },
      ],
      outcome: "A shared brief that gives sourcing, deployment and reporting the same starting point.",
    },
  },
  {
    id: "source", label: "Source people",
    story: {
      title: deliverySteps[1].title,
      description: deliverySteps[1].description,
      record: {
        title: "Match people to the requirement",
        fields: [
          { label: "Role fit", value: "Relevant experience and communication skills" },
          { label: "Location fit", value: "The assignment's market and travel needs" },
          { label: "Availability", value: "Joining date, shifts and assignment duration" },
        ],
        handoff: "Potential candidates move into screening against the brief",
      },
      actions: [
        { title: "Use the role brief", description: "Shape candidate sourcing around the agreed skills and responsibilities." },
        { title: "Check practical fit", description: "Discuss the location, schedule and type of engagement with candidates." },
        { title: "Prepare for screening", description: "Organise the information needed for a consistent suitability review." },
      ],
      outcome: "Candidate availability and role-fit information to support the next selection step.",
    },
  },
  {
    id: "select", label: "Screen & select",
    story: {
      title: deliverySteps[2].title,
      description: deliverySteps[2].description,
      record: {
        title: "Make the selection criteria clear",
        fields: [
          { label: "Suitability", value: "Experience and understanding of the role" },
          { label: "Task readiness", value: "Relevant questions or an agreed task exercise" },
          { label: "Confirmation", value: "Selection decision and joining availability" },
        ],
        handoff: "Confirmed people move into the assignment briefing",
      },
      actions: [
        { title: "Review suitability", description: "Assess candidates against the role requirements and agreed criteria." },
        { title: "Coordinate decisions", description: "Arrange the client's involvement where interviews or approvals are needed." },
        { title: "Confirm the team", description: "Resolve open questions and confirm the people moving toward deployment." },
      ],
      outcome: "Selection decisions, team confirmation and any open joining requirements.",
    },
  },
  {
    id: "deploy", label: "Brief & deploy",
    story: {
      title: deliverySteps[3].title,
      description: deliverySteps[3].description,
      visualId: "field-executives",
      actions: [
        { title: "Prepare the interaction", description: "Explain the product, approved message, task checklist and expected handover." },
        { title: "Confirm the assignment", description: "Share the locations, schedule, reporting contact and required materials." },
        { title: "Begin the field work", description: "Executives carry out the agreed activity and raise questions with their coordinator." },
      ],
      outcome: "Team readiness, deployment status and practical issues that need support at the start.",
    },
  },
  {
    id: "track", label: "Capture updates",
    story: {
      title: deliverySteps[4].title,
      description: deliverySteps[4].description,
      visualId: "survey",
      actions: [
        { title: "Record the work", description: "Capture attendance and the activity details agreed for the assignment." },
        { title: "Check completeness", description: "Review submissions for missing information, unclear entries or support needs." },
        { title: "Follow up on gaps", description: "Ask the responsible person for clarification and keep the action connected to the record." },
      ],
      outcome: "Attendance and activity updates, submission checks and the open items requiring attention.",
    },
  },
  {
    id: "review", label: "Review & improve",
    story: {
      title: deliverySteps[5].title,
      description: deliverySteps[5].description,
      record: {
        title: "Turn field updates into next actions",
        fields: [
          { label: "Work reviewed", value: "Activity records and agreed quality checks" },
          { label: "Open issues", value: "Coverage gaps, enquiries or operational needs" },
          { label: "Next plan", value: "Follow-up owners and any scope or team changes" },
        ],
        handoff: "Review findings feed the next briefing and round of work",
      },
      actions: [
        { title: "Bring the updates together", description: "Summarise progress using the reporting format and frequency agreed with the client." },
        { title: "Discuss what needs attention", description: "Review observations, unresolved items and changes in the workload." },
        { title: "Agree the next plan", description: "Confirm follow-up responsibilities and adjust the next stage of work where needed." },
      ],
      outcome: "A progress review with clear follow-up actions and an agreed plan for the next stage.",
    },
  },
] as const satisfies readonly {
  id: string;
  label: string;
  story: ExecutionStoryContent;
}[];
