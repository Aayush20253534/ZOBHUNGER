import type { SolutionDetailContent } from "@/types/solution-detail.types";

// Company figures and capability copy supplied by the client on 9 September 2026.
// These are editorial content, not values derived from the business dashboard.
export const companyScale = {
  fieldForce: "15,000+",
  clients: "70+",
  pinCodes: "12,000+",
  offices: "5",
  platform: "100%",
  sectors: "FMCG, FMEG, Alcobev, FMCD, CPG, E-commerce, FinTech, Healthcare, Banking, Retail, Manufacturing & Other Industries",
} as const;

export const verificationServices = [
  { title: "Candidate & Employee Verification", description: "Review candidate and employee information against the checks agreed for your hiring or workforce programme." },
  { title: "Identity & Document Verification", description: "Check submitted identity details and supporting documents, recording mismatches and missing information." },
  { title: "Address Verification", description: "Coordinate address checks and field visits, with visit observations recorded for your review." },
  { title: "Employment & Experience Verification", description: "Check declared employment history, roles and experience through the agreed verification process." },
  { title: "Background Verification", description: "Bring the selected background checks together in a structured review with clear findings and open items." },
  { title: "KYC & Business Verification", description: "Support customer, merchant and business onboarding with the document and business checks in your brief." },
  { title: "Field & On-Ground Verification", description: "Deploy executives to agreed locations to confirm field information and capture permitted visit evidence." },
  { title: "Custom Verification", description: "Build a verification checklist around your business requirements, locations and reporting needs." },
] as const;

export const brandingServices = [
  { title: "Branding & Advertising", description: "Coordinate local brand visibility and advertising activity around your audience, message and campaign locations." },
  { title: "Sticker Deployment", description: "Place approved stickers at agreed outlets and positions, then record placement and completion details." },
  { title: "Flyer/Pamphlet Distribution", description: "Brief distribution teams, plan routes and introduce your offer to the intended audience." },
  { title: "Promotional Campaigns", description: "Organise promotional teams and below-the-line activity for product launches, offers and customer engagement." },
  { title: "On-ground Branding & Marketing Activities", description: "Bring outlet branding, market visits and customer interactions into one coordinated execution plan." },
  { title: "Customized Brand Activation Services", description: "Shape a combination of activities around your business requirement, venue, timeline and audience." },
] as const;

export const businessSupportServices = [
  { label: "Recruitment", slug: "workforce-solutions" },
  { label: "Onboarding", slug: "sales-force" },
  { label: "KYC", slug: "verification-services" },
  { label: "Telecalling", slug: "business-operations" },
  { label: "Sales", slug: "sales-force" },
  { label: "Field operations", slug: "retail-execution" },
  { label: "Content moderation", slug: "business-operations" },
  { label: "Hyperlocal operations", slug: "gig-workforce" },
] as const;

export const verificationDetails = {
  heading: "Clear checks. Confident decisions.",
  description: "We provide reliable and transparent verification services to help businesses make confident decisions. Connect document checks, candidate reviews and on-ground verification in one coordinated workflow.",
  bestFor: "Businesses reviewing candidates, employees, customers, merchants or field information before the next decision.",
  facts: [
    { label: "Coverage", value: "People, documents, businesses & locations" },
    { label: "Execution", value: "Desk-based reviews & on-ground checks" },
    { label: "Handover", value: "Findings, evidence & items needing clarification" },
  ],
  servicesHeading: "Our verification services.",
  servicesDescription: "Choose individual checks or combine them into a workflow tailored to your business requirements.",
  services: verificationServices,
  focus: {
    id: "planning",
    label: "Your verification brief",
    heading: "Define the checks. Make the process transparent.",
    description: "Agree what needs to be verified and how findings will be reviewed before the assignment begins.",
    items: [
      { title: "Scope & authorisation", description: "Confirm the checks, required permissions, supporting information and people involved." },
      { title: "Locations & timelines", description: "Plan the volume, visit locations, contact arrangements and expected turnaround." },
      { title: "Evidence & reporting", description: "Agree the reporting format, evidence to capture and process for incomplete or conflicting details." },
    ],
  },
  process: {
    heading: "From the first brief to a clear review.",
    description: "A consistent process keeps each check connected to its supporting information and next action.",
    steps: [
      { title: "Scope", description: "Agree the verification checklist, required permissions and reporting needs." },
      { title: "Check", description: "Review documents, contact the relevant sources and complete agreed field visits." },
      { title: "Review", description: "Check findings for completeness and flag differences or missing information." },
      { title: "Report", description: "Share the recorded findings and open items for your team's decision." },
    ],
  },
  industrySlugs: ["bfsi-fintech", "e-commerce", "retail", "healthcare", "manufacturing"],
  relatedSlugs: ["workforce-solutions", "business-operations", "retail-execution"],
  cta: {
    title: "What would you like to verify?",
    description: "Tell us the checks, volume, locations and timeline. We’ll help shape a practical verification plan.",
    label: "Discuss verification needs",
  },
} as const satisfies SolutionDetailContent;
