import { market } from "@/data/market";
import type { SolutionSlug } from "@/types/solution-detail.types";

/** Public copy adapted from the client brief. Examples are not delivery guarantees. */
export const businessNeeds = [
  {
    id: "workforce",
    title: "Need workforce?",
    description:
      "Recruitment and staffing for ongoing roles, seasonal demand or a defined project. Start with the people and skills your business needs.",
    services: ["Recruitment", "Contract staffing", "Temporary teams"],
    solutionSlug: "workforce-solutions",
    linkLabel: "Explore workforce solutions",
  },
  {
    id: "sales",
    title: "Need sales teams?",
    description:
      "Build a sales and lead generation team around your product, customer and territory, with clear responsibilities for each role.",
    services: ["Field sales", "Lead generation", "Telecalling"],
    solutionSlug: "sales-force",
    linkLabel: "Explore sales teams",
  },
  {
    id: "promoters",
    title: "Need promoters?",
    description:
      "Bring your product closer to customers with in-store promoters, product demonstrations and campaign support.",
    services: ["In-store promoters", "Product demos", "Campaign teams"],
    solutionSlug: "promoter-solutions",
    linkLabel: "Explore promoter solutions",
  },
  {
    id: "execution",
    title: "Need market execution?",
    description:
      "Coordinate the work that happens in outlets and in the field, from merchandising and retail audits to trade marketing activity.",
    services: ["Merchandising", "Retail audits", "Trade marketing"],
    solutionSlug: "retail-execution",
    linkLabel: "Explore retail execution",
  },
  {
    id: "verification",
    title: "Need reliable verification?",
    description: "Review people, documents, business details and field information with a clear verification checklist and documented findings.",
    services: ["Candidate checks", "KYC & business", "Field verification"],
    solutionSlug: "verification-services",
    linkLabel: "Explore verification services",
  },
  {
    id: "branding",
    title: "Need your brand on the ground?",
    description: "Bring branding and advertising into local markets with sticker deployment, flyer distribution and promotional campaigns.",
    services: ["Sticker deployment", "Flyer distribution", "Brand activation"],
    solutionSlug: "brand-activation",
    linkLabel: "Explore branding & activation",
  },
  {
    id: "digital",
    title: "Need a website or application?",
    description:
      "Turn a business idea into a responsive website, web platform or mobile application with UX/UI, backend, API and launch support.",
    services: ["Business websites", "Web applications", "Mobile applications"],
    solutionSlug: "website-application-development",
    linkLabel: "Explore web & app development",
  },
] as const satisfies readonly {
  id: string;
  title: string;
  description: string;
  services: readonly string[];
  solutionSlug: SolutionSlug;
  linkLabel: string;
}[];

export const briefChecklist = [
  {
    title: "The work",
    description: "Roles, responsibilities, skills and the outcome you want.",
  },
  {
    title: "The locations",
    description: "Cities, outlets or territories, with the team size for each.",
  },
  {
    title: "The timeline",
    description: "Your expected start date, duration and any rollout stages.",
  },
  {
    title: "The operating plan",
    description: "Working hours, supervision and the updates you need.",
  },
] as const;

export const deliverySteps = [
  {
    title: "Client shares requirement",
    description:
      "Start with the work to be done. Define the roles, team size, locations, project duration and expected start date.",
    checkpoint: "A clear requirement brief",
  },
  {
    title: "ZOBHUNGER sources candidates",
    description:
      "Candidate sourcing is shaped around the role requirements, location and type of engagement agreed for the project.",
    checkpoint: "Candidates aligned with the brief",
  },
  {
    title: "Screening and selection",
    description:
      "Review skills, suitability and availability. Agree how candidates will be evaluated and where your team needs to be involved.",
    checkpoint: "Selection criteria and team confirmation",
  },
  {
    title: "Training and deployment",
    description:
      "Prepare the selected team for the assignment. Coordinate role briefings, product knowledge, joining details and deployment locations.",
    checkpoint: "A team ready for the assignment",
  },
  {
    title: "Attendance and performance tracking",
    description:
      "Agree the attendance records, activity updates and performance measures relevant to the work, together with who reviews them.",
    checkpoint: "An agreed set of work updates",
  },
  {
    title: "Reporting and management",
    description:
      "Review progress against the brief, discuss operational needs and plan changes to the team or scope as the project develops.",
    checkpoint: "Reporting and a plan for the next stage",
  },
] as const;

export const company = {
  description:
    "ZOBHUNGER is an integrated workforce, sales and business execution platform that helps businesses hire, deploy and coordinate teams around real operating requirements.",
  mission: "Make workforce management faster, smarter and more scalable.",
  vision:
    `Create a connected ecosystem for businesses, partners and workforce, serving clients ${market.clientReach.scope} while expanding execution capabilities from ${market.primaryMarket.name}.`,
  principles: [
    {
      title: "Start with the requirement",
      description:
        "Understand the work, the location and the team before choosing a solution.",
    },
    {
      title: "Connect hiring with execution",
      description:
        "Think beyond filling a role to how the team will be deployed, supported and managed.",
    },
    {
      title: "Make progress visible",
      description:
        "Agree responsibilities and useful reporting around the assignment, with connected tools that keep requirements, people and progress visible.",
    },
  ],
} as const;

/** Live role-based workspaces available to authorised users. */
export const technologyPortals = [
  {
    id: "client",
    title: "Business portal",
    audience: "For approved business teams",
    description:
      "A connected workspace for requirements, candidate decisions, deployment activity and business-side approvals.",
    features: [
      "Company profile",
      "Requirements & drafts",
      "Candidate review",
      "Workforce deployment",
      "Attendance approvals",
      "Reports",
    ],
  },
  {
    id: "worker",
    title: "Worker portal",
    audience: "For candidates and active workers",
    description:
      "A personal workspace to build a profile, explore opportunities and stay connected to applications and active assignments.",
    features: [
      "Profile & CV",
      "Job search",
      "Applications",
      "Assignments",
      "Attendance",
      "Earnings",
    ],
  },
  {
    id: "institution",
    title: "Institution partner portal",
    audience: "For approved placement teams",
    description:
      "A dedicated workspace for institution representatives to coordinate candidate records and relevant opportunities.",
    features: [
      "Institution profile",
      "Candidate records",
      "Opportunity visibility",
      "Candidate matching",
      "Application activity",
      "Partner access",
    ],
  },
  {
    id: "admin",
    title: "Operations portal",
    audience: "For authorised ZOBHUNGER teams",
    description:
      "Internal tools for coordinating enquiries, accounts, candidates, deployments, attendance and operational reporting.",
    features: [
      "Business & partner review",
      "Candidate management",
      "Deployment management",
      "Attendance operations",
      "Earnings administration",
      "Reporting",
    ],
  },
] as const;

export const businessQuestions = [
  {
    question: "Can one requirement include more than one location?",
    answer:
      "Yes. Add each location in the requirement form and use the details field to explain the team size or work needed at each one.",
  },
  {
    question: "What if I need a mix of services?",
    answer:
      "Choose the main service in the form, then describe the other roles or activities in your brief. You can also use the enquiry form if you are still deciding.",
  },
  {
    question: "Do I need to know every detail before starting?",
    answer:
      "Share what you know about the roles, locations and duration. The expected start date is optional, and you can explain any open questions in the requirement details.",
  },
] as const;
