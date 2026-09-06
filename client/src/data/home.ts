/** Homepage copy adapted from the client's Phase 1 brief. No invented performance figures. */
export const home = {
  hero: {
    eyebrow: "India’s workforce & business execution platform",
    title: "Build, deploy & manage your workforce.",
    emphasis: "All in one platform.",
    description:
      "ZOBHUNGER helps businesses hire, deploy and manage workforce, sales teams, promoters, field executives, marketing teams and business operations across India.",
    engagements: ["Permanent", "Contract", "Project-based", "On-demand"],
    image: {
      src: "/images/home/workforce-team-1280.webp",
      srcSet:
        "/images/home/workforce-team-640.webp 640w, /images/home/workforce-team-1280.webp 1280w, /images/home/workforce-team-2400.webp 2400w",
      alt: "Two colleagues reviewing a tablet together in a bright workspace.",
    },
  },
  solutions: {
    eyebrow: "Our solutions",
    title: "The right people. The right execution.",
    description:
      "From building a sales team to running a retail campaign, find the support your business needs in one place.",
  },
  why: {
    eyebrow: "Why ZOBHUNGER",
    title: "One partner for workforce and business execution.",
    description:
      "Your requirement connects hiring, deployment and delivery. Bring those conversations together, with a team built around your work.",
    benefits: [
      {
        id: "platform",
        title: "One platform",
        description:
          "Bring staffing and business execution into one coordinated plan.",
      },
      {
        id: "services",
        title: "Multiple services",
        description:
          "Connect recruitment, sales, promoters, retail and operations.",
      },
      {
        id: "locations",
        title: "Multi-city workforce",
        description:
          "Plan roles and deployment around the locations your business needs.",
      },
      {
        id: "hiring",
        title: "Focused hiring",
        description:
          "Define the role and screening criteria before sourcing begins.",
      },
      {
        id: "management",
        title: "Workforce management",
        description:
          "Coordinate onboarding, responsibilities and day-to-day team support.",
      },
      {
        id: "attendance",
        title: "Attendance tracking",
        description:
          "Agree the attendance records and work updates your project needs.",
      },
      {
        id: "reporting",
        title: "Performance reporting",
        description:
          "Set reporting expectations around the activities that matter to you.",
      },
      {
        id: "scale",
        title: "Scalable teams",
        description:
          "Shape team size and engagement around campaigns, projects and demand.",
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
      },
      {
        title: "We source & screen",
        description:
          "We identify candidates and screen them against the agreed role requirements.",
      },
      {
        title: "Hire & deploy",
        description:
          "Confirm the team, coordinate onboarding and prepare people for the assignment.",
      },
      {
        title: "Manage & track",
        description:
          "Coordinate the work and review attendance and activity against the project plan.",
      },
      {
        title: "Performance & reporting",
        description:
          "Review progress, share updates and discuss what the next stage needs.",
      },
    ],
  },
  industries: {
    eyebrow: "Industries we serve",
    title: "Different industries. One connected approach.",
    description:
      "Build your team around the way your sector works, from shop floors and sales territories to support operations.",
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
