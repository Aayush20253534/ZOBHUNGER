export interface SeedJob {
  slug: string;
  title: string;
  responsibilities: string[];
  requirements: string[];
  location: string;
  category: string;
  engagementType: string;
  description: string;
  createdAt: string;
  isDemo: boolean;
}

export const seedJobs: readonly SeedJob[] = [
  {
    slug: "demo-field-sales-lucknow",
    title: "Field Sales Executive",
    responsibilities: [
      "Visit the outlets assigned to your territory.",
      "Introduce the product range and record customer interest.",
      "Share visit notes and follow-up requirements with the sales team.",
    ],
    requirements: [
      "Comfortable speaking with customers in the field.",
      "Able to organise outlet visits and follow-ups.",
      "Familiarity with the local area is useful.",
    ],
    location: "Lucknow",
    category: "Sales",
    engagementType: "Full-time",
    description: "Visit assigned outlets and support the local sales team.",
    createdAt: "2026-09-01T09:00:00.000Z",
    isDemo: true,
  },
  {
    slug: "demo-brand-promoter-delhi",
    title: "In-store Brand Promoter",
    responsibilities: [
      "Introduce products to visitors at the assigned store.",
      "Support product demonstrations and campaign activity.",
      "Record common customer questions and activity updates.",
    ],
    requirements: [
      "Clear communication and a customer-friendly approach.",
      "Willingness to learn the product information.",
      "Availability for the agreed store and campaign schedule.",
    ],
    location: "Delhi",
    category: "Promoter",
    engagementType: "Contract",
    description:
      "Introduce products and assist customers during an in-store campaign.",
    createdAt: "2026-09-02T09:00:00.000Z",
    isDemo: true,
  },
  {
    slug: "demo-telecaller-prayagraj",
    title: "Telecalling Executive",
    responsibilities: [
      "Make outreach calls using the agreed brief.",
      "Record enquiries and arrange relevant follow-ups.",
      "Keep contact notes organised and up to date.",
    ],
    requirements: [
      "Confident phone communication and listening skills.",
      "Comfortable entering accurate notes on a computer.",
      "Able to follow a calling brief and escalation process.",
    ],
    location: "Prayagraj",
    category: "Telecalling",
    engagementType: "Full-time",
    description: "Handle outreach calls and keep enquiry records up to date.",
    createdAt: "2026-09-03T09:00:00.000Z",
    isDemo: true,
  },
  {
    slug: "demo-retail-auditor-mumbai",
    title: "Retail Audit Associate",
    responsibilities: [
      "Visit stores and complete the assigned checklist.",
      "Record product availability and merchandising observations.",
      "Submit clear notes for each completed outlet visit.",
    ],
    requirements: [
      "Attention to detail when following a checklist.",
      "Comfortable travelling between assigned local outlets.",
      "Able to use a smartphone for work updates.",
    ],
    location: "Mumbai",
    category: "Field Work",
    engagementType: "Project-based",
    description: "Complete store checklists and record product availability.",
    createdAt: "2026-09-04T09:00:00.000Z",
    isDemo: true,
  },
  {
    slug: "demo-operations-pune",
    title: "Operations Associate",
    responsibilities: [
      "Check business records against the assigned guidelines.",
      "Support routine data and back-office tasks.",
      "Flag incomplete information for review.",
    ],
    requirements: [
      "Careful data entry and record-keeping skills.",
      "Comfortable with basic computer-based tasks.",
      "Able to organise work against a daily task list.",
    ],
    location: "Pune",
    category: "Operations",
    engagementType: "Contract",
    description: "Support data verification and day-to-day back-office tasks.",
    createdAt: "2026-09-05T09:00:00.000Z",
    isDemo: true,
  },
  {
    slug: "demo-recruiter-bengaluru",
    title: "Recruitment Coordinator",
    responsibilities: [
      "Coordinate candidate screening and interview schedules.",
      "Share joining and interview information with candidates.",
      "Keep candidate communication records up to date.",
    ],
    requirements: [
      "Clear written and spoken communication.",
      "Good organisation and follow-up habits.",
      "Comfortable maintaining candidate records.",
    ],
    location: "Bengaluru",
    category: "Recruitment",
    engagementType: "Full-time",
    description: "Coordinate candidate screening and interview schedules.",
    createdAt: "2026-09-06T09:00:00.000Z",
    isDemo: true,
  },
];
