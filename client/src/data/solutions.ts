import type { SolutionSummary } from "@/types/catalog.types";

export const solutions = [
  {
    slug: "workforce-solutions",
    title: "ZOBHUNGER Workforce",
    label: "Workforce",
    description:
      "Recruitment and staffing for permanent, contract and project roles.",
    leadKind: "workforce",
    services: ["Bulk hiring", "Contract staffing", "Recruitment & RPO"],
  },
  {
    slug: "sales-force",
    title: "ZOBHUNGER Sales Force",
    label: "Sales Force",
    description: "Build field sales, telesales and business development teams.",
    leadKind: "workforce",
    services: ["Field sales", "Telesales", "Lead generation"],
  },
  {
    slug: "telecaller-telesales-services",
    title: "ZOBHUNGER Telecaller & Telesales",
    label: "Telecaller & Telesales",
    description:
      "Trained telecallers for telesales, lead generation, customer engagement and business conversion.",
    leadKind: "workforce",
    services: ["Outbound calling", "Lead follow-up", "Appointment booking"],
  },
  {
    slug: "promoter-solutions",
    title: "ZOBHUNGER Promoter",
    label: "Promoters",
    description:
      "People to represent your brand in stores, at events and on campaigns.",
    leadKind: "workforce",
    services: ["In-store promoters", "Demonstrators", "Event teams"],
  },
  {
    slug: "retail-execution",
    title: "ZOBHUNGER Retail",
    label: "Retail Execution",
    description:
      "Support merchandising, store audits and product availability checks.",
    leadKind: "workforce",
    services: ["Merchandising", "Store audits", "Market surveys"],
  },
  {
    slug: "brand-activation",
    title: "ZOBHUNGER Activate",
    label: "Brand Activation",
    description:
      "Execute branding, advertising, sticker deployment, flyer distribution and consumer campaigns.",
    leadKind: "workforce",
    services: ["Product sampling", "Sticker deployment", "Branding campaigns"],
  },
  {
    slug: "business-operations",
    title: "ZOBHUNGER Operations",
    label: "Operations",
    description:
      "Recruit teams for customer support, telecalling and back-office work.",
    leadKind: "workforce",
    services: ["Customer support", "Back office", "Remote teams"],
  },
  {
    slug: "gig-workforce",
    title: "ZOBHUNGER Gig",
    label: "Gig Workforce",
    description:
      "Find people for short assignments, seasonal demand and project work.",
    leadKind: "workforce",
    services: ["Daily assignments", "Seasonal teams", "Project staffing"],
  },
  {
    slug: "verification-services",
    title: "ZOBHUNGER Verification",
    label: "Verification",
    description: "Reliable checks for candidates, employees, documents, businesses and on-ground information.",
    leadKind: "workforce",
    services: ["Background checks", "KYC & business", "Field verification"],
  },
  {
    slug: "website-application-development",
    title: "ZOBHUNGER Digital",
    label: "Web & App Development",
    description:
      "Design and build business websites, web platforms, mobile applications and API integrations.",
    leadKind: "digital",
    services: ["Business websites", "Web applications", "Mobile applications"],
  },
] as const satisfies readonly SolutionSummary[];

export const workforceSolutions = solutions.filter(
  (solution) => solution.leadKind === "workforce",
);

export type PublicSolutionSlug = (typeof solutions)[number]["slug"];

export function solutionHref(slug: PublicSolutionSlug) {
  return `/${slug}` as const;
}

/** Route prefixes used by navigation and any other service-aware UI. */
export const solutionRoutePrefixes = solutions.map((solution) =>
  solutionHref(solution.slug),
);
