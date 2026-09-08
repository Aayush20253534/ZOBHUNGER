import { executionVisuals } from "@/data/execution-visuals";

/** Homepage copy adapted from the client's Phase 1 brief. No invented performance figures. */
export const home = {
  hero: {
    eyebrow: "India’s workforce & field execution partner",
    title: "Build, deploy & execute with the right workforce.",
    description:
      "ZOBHUNGER helps businesses build and deploy workforce, sales, promoter and field teams around the work that needs to happen in market.",
    engagements: [
      { title: "Permanent", description: "Build your core team" },
      { title: "Contract", description: "Support a defined period" },
      { title: "Project-based", description: "Deliver a specific brief" },
      { title: "On-demand", description: "Plan for changing needs" },
    ],
    image: executionVisuals["field-executives"],
  },
  solutions: {
    eyebrow: "Our services",
    title: "Services built around the work you need done.",
    description:
      "From workforce deployment and sales teams to retail execution and brand activation, connect people with a clear operating plan.",
  },
  why: {
    eyebrow: "Why ZOBHUNGER",
    title: "One partner. From workforce to execution.",
    description:
      "Bring hiring, deployment and field delivery into one coordinated plan, with teams shaped around the assignment rather than a generic staffing brief.",
    benefits: [
      {
        id: "platform",
        title: "Connected execution",
        description:
          "Keep workforce, deployment and delivery aligned to one operating brief.",
      },
      {
        id: "services",
        title: "Multiple service models",
        description:
          "Connect staffing, sales, promoters, retail, activation and operations as needed.",
      },
      {
        id: "locations",
        title: "Market-led coordination",
        description:
          "Plan people and activity around the locations where the work needs to happen.",
      },
      {
        id: "hiring",
        title: "Requirement-led hiring",
        description:
          "Define the role, skills and availability before candidate sourcing begins.",
      },
      {
        id: "management",
        title: "On-ground coordination",
        description:
          "Connect onboarding, responsibilities and field activity to the assignment plan.",
      },
      {
        id: "reporting",
        title: "Structured reporting",
        description:
          "Agree the execution updates and review points that matter to the engagement.",
      },
    ],
  },
  process: {
    eyebrow: "How it works",
    title: "From your brief to work on the ground.",
    description:
      "A clear process, with the requirements agreed before the team gets to work.",
    steps: [
      {
        title: "Share your requirement",
        description:
          "Tell us the roles, team size, locations, duration and work you need done.",
        checkpoint: "A clear requirement brief",
      },
      {
        title: "We source & screen",
        description:
          "We identify candidates and screen them against the agreed role requirements.",
        checkpoint: "Candidates aligned with the role",
      },
      {
        title: "Hire & deploy",
        description:
          "Confirm the team, coordinate onboarding and prepare people for the assignment.",
        checkpoint: "A team ready for the assignment",
      },
      {
        title: "Manage & track",
        description:
          "Coordinate the work and review attendance and activity against the project plan.",
        checkpoint: "An agreed set of work updates",
      },
      {
        title: "Performance & reporting",
        description:
          "Review progress, share updates and discuss what the next stage needs.",
        checkpoint: "Reporting and a plan for the next stage",
      },
    ],
  },
  industries: {
    eyebrow: "Industries we serve",
    title: "Built for the way different markets operate.",
    description:
      "From retail counters and sales territories to operations and customer acquisition, teams are structured around how the sector actually works.",
  },
  audiences: {
    business: {
      title: "Build a team for the work ahead.",
      description:
        "Tell us what you want to achieve. We’ll help shape the workforce or execution solution around your requirements.",
      points: [
        "Recruitment & staffing",
        "Sales & promoter teams",
        "Retail & business operations",
      ],
    },
    worker: {
      title: "Put your skills to work.",
      description:
        "Explore sales, promoter, field and operations roles. Start with the kind of work you do and the location that suits you.",
      points: [
        "Sales & field work",
        "Promoter & campaign roles",
        "Telecalling & operations",
      ],
    },
  },
  technology: {
    eyebrow: "Our technology vision",
    title: "Connecting businesses, workers and execution.",
    description:
      "We’re building dedicated tools to bring requirements, people and progress together. The portals below are planned for future releases.",
    portals: [
      {
        id: "client",
        title: "Client portal",
        description:
          "A planned workspace for your business to coordinate requirements and keep track of the team.",
        features: [
          "Requirements & hiring progress",
          "Candidate review & deployment",
          "Attendance & performance reports",
        ],
      },
      {
        id: "worker",
        title: "Worker portal",
        description:
          "A planned place for workers to manage their profile and stay connected to their assignments.",
        features: [
          "Profile & job applications",
          "Attendance & assigned tasks",
          "Earnings information",
        ],
      },
      {
        id: "admin",
        title: "Operations dashboard",
        description:
          "Planned internal tools to coordinate hiring, deployment and reporting across projects.",
        features: [
          "Lead & candidate management",
          "Workforce deployment",
          "Project performance & reports",
        ],
      },
    ],
  },
  cta: {
    title: "Need a workforce or business execution solution?",
    description:
      "Tell us what you’re building, where you need support and when you want to start. We’ll take it from there.",
  },
} as const;

/** Sector examples explain the offering; they are not customer or coverage claims. */
export const homeIndustryDescriptions = {
  fmcg: "Promoters, merchandising & field sales",
  retail: "Store teams, audits & execution",
  "e-commerce": "Operations, support & seasonal teams",
  "bfsi-fintech": "Acquisition, field teams & telecalling",
  telecom: "Sales, promoters & customer outreach",
  logistics: "Operations & flexible workforce",
  "food-beverage": "Sampling, sales & market activation",
  "consumer-electronics": "Product demos & in-store promoters",
  manufacturing: "Staffing & business support",
  healthcare: "Support operations & staffing",
  startups: "Hiring, sales & remote teams",
} as const;
