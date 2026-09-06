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
    "ZOBHUNGER is building an integrated platform that helps businesses hire, deploy and manage workforce and business execution teams.",
  mission: "Make workforce management faster, smarter and more scalable.",
  vision:
    "Create a connected ecosystem for businesses and workforce across India.",
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
        "Agree responsibilities and useful reporting around the assignment, with connected tools planned for future releases.",
    },
  ],
} as const;

/** This describes the product direction; none of these portals is a live account area. */
export const technologyPortals = [
  {
    id: "client",
    title: "Client portal",
    audience: "For business teams",
    description:
      "A planned workspace to bring your requirements, hiring decisions and workforce updates together.",
    features: [
      "Submit requirements",
      "Track hiring",
      "Candidate approval",
      "Workforce deployment",
      "Attendance",
      "Performance reports",
      "Campaign reports",
    ],
  },
  {
    id: "worker",
    title: "Worker portal",
    audience: "For people doing the work",
    description:
      "A planned place to manage a profile, explore work and stay connected to assignments.",
    features: [
      "Profile",
      "Job search",
      "Job application",
      "Attendance",
      "Tasks",
      "Earnings",
    ],
  },
  {
    id: "admin",
    title: "Admin portal",
    audience: "For internal operations",
    description:
      "Planned tools to coordinate business enquiries, candidates and project delivery across the team.",
    features: [
      "Lead management",
      "Client management",
      "Recruiter management",
      "Candidate management",
      "Workforce deployment",
      "Attendance",
      "Performance",
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
