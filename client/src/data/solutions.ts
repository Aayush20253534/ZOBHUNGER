import type { SolutionSummary } from "@/types/catalog.types";

export const solutions = [
  {
    slug: "workforce-solutions",
    title: "ZOBHUNGER Workforce",
    label: "Workforce",
    description:
      "Recruitment and staffing for permanent, contract and project roles.",
    services: ["Bulk hiring", "Contract staffing", "Recruitment & RPO"],
  },
  {
    slug: "sales-force",
    title: "ZOBHUNGER Sales Force",
    label: "Sales Force",
    description: "Build field sales, telesales and business development teams.",
    services: ["Field sales", "Telesales", "Lead generation"],
  },
  {
    slug: "promoter-solutions",
    title: "ZOBHUNGER Promoter",
    label: "Promoters",
    description:
      "People to represent your brand in stores, at events and on campaigns.",
    services: ["In-store promoters", "Demonstrators", "Event teams"],
  },
  {
    slug: "retail-execution",
    title: "ZOBHUNGER Retail",
    label: "Retail Execution",
    description:
      "Support merchandising, store audits and product availability checks.",
    services: ["Merchandising", "Store audits", "Market surveys"],
  },
  {
    slug: "brand-activation",
    title: "ZOBHUNGER Activate",
    label: "Brand Activation",
    description:
      "Execute sampling, on-ground campaigns and consumer engagement.",
    services: ["Product sampling", "BTL campaigns", "Roadshows"],
  },
  {
    slug: "business-operations",
    title: "ZOBHUNGER Operations",
    label: "Operations",
    description:
      "Recruit teams for customer support, telecalling and back-office work.",
    services: ["Customer support", "Back office", "Remote teams"],
  },
  {
    slug: "gig-workforce",
    title: "ZOBHUNGER Gig",
    label: "Gig Workforce",
    description:
      "Find people for short assignments, seasonal demand and project work.",
    services: ["Daily assignments", "Seasonal teams", "Project staffing"],
  },
] as const satisfies readonly SolutionSummary[];
