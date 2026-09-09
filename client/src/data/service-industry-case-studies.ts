import type { IndustrySlug, SolutionSlug } from "@/types/solution-detail.types";

export interface BriefCaseStudy {
  title: string;
  industry: string;
  service: string;
  about: string;
  challenges: readonly string[];
  solution: readonly string[];
  results: readonly string[];
}

const solutionCaseStudies: Readonly<Partial<Record<SolutionSlug, BriefCaseStudy>>> = {
  "workforce-solutions": {
    title: "High-Volume Operational Hiring",
    industry: "Staffing & Outsourcing",
    service: "Recruitment, staffing & workforce deployment",
    about:
      "A multi-location workforce requirement needed a repeatable way to source, screen and mobilise operational talent without building a permanent recruitment team in every market.",
    challenges: [
      "High hiring volumes across different locations and role types.",
      "Short joining timelines and recurring replacement requirements.",
      "Consistent screening, documentation and joining coordination.",
    ],
    solution: [
      "Local candidate sourcing supported by telecalling and digital recruitment.",
      "Structured screening, document collection and interview coordination.",
      "Joining follow-up and replacement support aligned to the workforce plan.",
    ],
    results: [
      "A more scalable mobilisation process across locations.",
      "Clearer visibility from candidate sourcing through joining.",
      "Flexible replacement support for ongoing workforce requirements.",
    ],
  },
  "sales-force": {
    title: "Merchant Acquisition & Field Sales",
    industry: "Fintech & Financial Services",
    service: "Field sales, lead generation & merchant acquisition",
    about:
      "A digital payments campaign required field teams to identify merchants, explain the proposition and move qualified prospects through onboarding and activation.",
    challenges: [
      "Reaching local merchants across multiple territories.",
      "Explaining a digital product clearly at the point of sale.",
      "Maintaining consistent lead quality and daily field reporting.",
    ],
    solution: [
      "Territory-led merchant prospecting and product demonstrations.",
      "Lead qualification, KYC/document coordination and onboarding follow-up.",
      "Structured field activity tracking and productivity reporting.",
    ],
    results: [
      "Broader merchant reach without a permanent sales team in every city.",
      "A clearer path from field lead to onboarding follow-up.",
      "More consistent visibility into field-sales activity.",
    ],
  },
  "promoter-solutions": {
    title: "In-Store Product Promotion",
    industry: "FMCG & Retail",
    service: "Promoters, demonstrators & event teams",
    about:
      "A consumer brand needed trained people inside stores to explain products, support demonstrations and create direct shopper engagement during a defined campaign period.",
    challenges: [
      "Consistent product communication across multiple outlets.",
      "Shift-wise promoter deployment and attendance coordination.",
      "Capturing useful field feedback from customer interactions.",
    ],
    solution: [
      "Promoter sourcing, briefing and outlet-wise deployment.",
      "Product demonstrations, shopper engagement and basic lead capture.",
      "Attendance, activity and field-feedback coordination.",
    ],
    results: [
      "More structured in-store consumer engagement.",
      "Consistent execution against the campaign brief.",
      "Practical outlet-level feedback for the brand team.",
    ],
  },
  "retail-execution": {
    title: "Multi-Outlet Retail Audit",
    industry: "Retail & Consumer Brands",
    service: "Store audits, merchandising & market checks",
    about:
      "A brand operating across a distributed retail network needed better visibility into product availability, display standards and promotion execution at store level.",
    challenges: [
      "Limited visibility into execution across a large outlet network.",
      "Need for consistent checklists and evidence from every visit.",
      "Comparing availability, display and competitor conditions by location.",
    ],
    solution: [
      "Field-auditor deployment using a standard visit checklist.",
      "Product, display, promotion and competitor checks with photo evidence.",
      "Location-wise reporting for review and corrective action.",
    ],
    results: [
      "Structured retail intelligence from the field.",
      "Better visibility into store-level compliance and availability.",
      "A repeatable audit model for multi-location programmes.",
    ],
  },
  "brand-activation": {
    title: "Consumer Product Sampling Campaign",
    industry: "FMCG & Food",
    service: "Sampling, BTL activation & consumer engagement",
    about:
      "A consumer product campaign required direct interaction with shoppers to introduce the product, encourage trial and capture immediate market feedback.",
    challenges: [
      "Creating meaningful consumer interaction in a short campaign window.",
      "Maintaining consistent brand communication across locations.",
      "Coordinating sampling material, promoters and daily reporting.",
    ],
    solution: [
      "Trained promoter deployment for sampling and product demonstrations.",
      "Consumer education, engagement and feedback collection.",
      "Outlet-level coordination and campaign activity reporting.",
    ],
    results: [
      "Higher opportunity for product trial and direct consumer feedback.",
      "Consistent on-ground activation across participating locations.",
      "Useful market observations for future campaign planning.",
    ],
  },
  "business-operations": {
    title: "Managed Customer & Back-Office Support",
    industry: "Digital & Service Businesses",
    service: "Customer support, telecalling & back-office operations",
    about:
      "A growing operations team needed additional capacity for customer follow-up, data handling and routine support work without expanding every function permanently.",
    challenges: [
      "Variable workload across customer and administrative processes.",
      "Need for consistent scripts, task instructions and hand-offs.",
      "Tracking productivity and completion across a distributed team.",
    ],
    solution: [
      "Role-based staffing for calling, customer support and back-office work.",
      "Task briefing, process hand-offs and reporting aligned to the client workflow.",
      "Ongoing coordination for attendance, workload and replacement needs.",
    ],
    results: [
      "Flexible operations capacity around changing workloads.",
      "A clearer operating rhythm for routine support tasks.",
      "Reduced dependence on permanent hiring for time-bound requirements.",
    ],
  },
  "gig-workforce": {
    title: "Seasonal & Project Workforce Mobilisation",
    industry: "Retail, Logistics & Hyperlocal",
    service: "Short-term assignments, seasonal teams & project staffing",
    about:
      "A time-bound operations programme required temporary manpower across locations, with fast mobilisation and the ability to replace drop-offs during execution.",
    challenges: [
      "Rapid staffing for a fixed campaign or seasonal window.",
      "Different headcount needs by city and work location.",
      "Attrition and replacement needs during short assignments.",
    ],
    solution: [
      "Hyperlocal sourcing and role-based screening for temporary assignments.",
      "Location-wise deployment, joining coordination and attendance support.",
      "Replacement mobilisation when project staffing changed.",
    ],
    results: [
      "Faster access to flexible manpower for short-duration work.",
      "Better alignment between location demand and deployed headcount.",
      "A reusable model for seasonal and project-led operations.",
    ],
  },
};

const industryCaseStudies: Readonly<Record<IndustrySlug, BriefCaseStudy>> = {
  fmcg: {
    title: "Consumer Sampling & Retail Activation",
    industry: "FMCG",
    service: "Product sampling, promoters & retail activation",
    about:
      "A consumer brand needed direct product trial and stronger in-store visibility across selected outlets during a promotional campaign.",
    challenges: [
      "Reaching consumers consistently across multiple stores.",
      "Keeping product communication and sampling standards uniform.",
      "Collecting useful feedback from on-ground interactions.",
    ],
    solution: [
      "Promoter deployment for product sampling and demonstrations.",
      "Consumer education, feedback capture and outlet coordination.",
      "Daily field reporting around participation and execution observations.",
    ],
    results: [
      "More structured product-trial opportunities.",
      "Direct consumer feedback from participating markets.",
      "Consistent campaign execution at outlet level.",
    ],
  },
  retail: {
    title: "Retail Store Audit & Compliance",
    industry: "Retail",
    service: "Store audits, merchandising & compliance checks",
    about:
      "A multi-store retail programme needed field visibility into product availability, display quality and agreed store standards.",
    challenges: [
      "Different execution quality across outlets.",
      "Need for photo-backed, location-specific observations.",
      "Limited central visibility into store conditions.",
    ],
    solution: [
      "Scheduled outlet visits using a structured audit checklist.",
      "Availability, display, promotion and competitor checks.",
      "Photo and location-supported reporting for central review.",
    ],
    results: [
      "Structured store-level execution data.",
      "Better visibility into compliance gaps.",
      "A repeatable audit process across the outlet network.",
    ],
  },
  "e-commerce": {
    title: "Marketplace Seller Acquisition",
    industry: "E-Commerce",
    service: "Seller outreach, onboarding & marketplace support",
    about:
      "A marketplace expansion programme required continuous outreach to local sellers and MSMEs, many of whom needed assistance understanding registration and platform processes.",
    challenges: [
      "Finding relevant sellers across local markets.",
      "Helping prospects complete documentation and registration.",
      "Following up on incomplete onboarding journeys.",
    ],
    solution: [
      "Field and telesales outreach to prospective sellers.",
      "Registration, documentation and onboarding coordination.",
      "Follow-up support for incomplete applications and activation steps.",
    ],
    results: [
      "Expanded access to local seller networks.",
      "A more consistent onboarding follow-up process.",
      "Scalable seller acquisition across multiple markets.",
    ],
  },
  "bfsi-fintech": {
    title: "Digital Merchant Onboarding & QR Deployment",
    industry: "BFSI & Fintech",
    service: "Merchant acquisition, KYC & field activation",
    about:
      "A digital payments programme needed field teams to educate small merchants, support onboarding and help expand payment acceptance in Tier 2 and Tier 3 markets.",
    challenges: [
      "Merchant awareness and trust around digital payment products.",
      "KYC, documentation and duplicate-check requirements.",
      "Scaling field acquisition across dispersed locations.",
    ],
    solution: [
      "Merchant prospecting, education and assisted onboarding.",
      "KYC/document coordination and field-level quality checks.",
      "QR/POS activation support with structured activity reporting.",
    ],
    results: [
      "Broader merchant reach across local markets.",
      "More consistent verified onboarding workflows.",
      "Improved visibility into field acquisition activity.",
    ],
  },
  telecom: {
    title: "Retailer Outreach & Subscriber Acquisition",
    industry: "Telecom",
    service: "Field sales, retailer engagement & customer acquisition",
    about:
      "A telecom growth campaign required field teams to support retailer engagement, local customer outreach and activation-oriented follow-up.",
    challenges: [
      "High-volume outreach across fragmented local markets.",
      "Keeping product communication consistent across field teams.",
      "Tracking leads and follow-ups from different territories.",
    ],
    solution: [
      "Territory-wise field executive deployment.",
      "Retailer visits, customer outreach and lead capture.",
      "Structured follow-up and daily activity reporting.",
    ],
    results: [
      "A scalable local outreach model.",
      "Better visibility into territory-level activity.",
      "Consistent field communication around the campaign brief.",
    ],
  },
  logistics: {
    title: "Last-Mile Delivery Workforce",
    industry: "Logistics",
    service: "Rider hiring, delivery staffing & replacement support",
    about:
      "A last-mile operation needed a continuous pipeline of delivery executives to support city expansion, seasonal peaks and normal workforce attrition.",
    challenges: [
      "Recurring rider and delivery-executive hiring needs.",
      "Different demand levels by city and operating zone.",
      "Fast replacement requirements when active headcount changed.",
    ],
    solution: [
      "Local candidate sourcing, telecalling and recruitment drives.",
      "Document collection, onboarding coordination and joining follow-up.",
      "Replacement hiring aligned to location-wise demand.",
    ],
    results: [
      "Faster workforce mobilisation for last-mile operations.",
      "Access to local candidate networks across markets.",
      "A flexible model for peak and replacement hiring.",
    ],
  },
  "food-beverage": {
    title: "Restaurant Audit & Customer Experience Survey",
    industry: "Food & Beverage",
    service: "Outlet audits, mystery visits & customer feedback",
    about:
      "A food-service operation needed independent field observations around outlet execution, customer experience and promotion visibility.",
    challenges: [
      "Understanding actual outlet-level execution.",
      "Reviewing service and promotion standards consistently.",
      "Collecting structured feedback across multiple locations.",
    ],
    solution: [
      "Planned outlet and mystery-audit visits.",
      "Customer experience, display and compliance observations.",
      "Structured feedback reporting for location-wise review.",
    ],
    results: [
      "Clearer visibility into outlet execution.",
      "Comparable observations across participating locations.",
      "Field insights that support operational follow-up.",
    ],
  },
  "consumer-electronics": {
    title: "Retail Display & Product Availability Audit",
    industry: "Consumer Electronics",
    service: "Retail audit, merchandising & field verification",
    about:
      "A consumer-electronics brand needed regular checks across retail outlets to understand product visibility, stock presence and display compliance.",
    challenges: [
      "Maintaining display standards across distributed stores.",
      "Verifying product availability and promotion visibility.",
      "Capturing reliable field evidence from every visit.",
    ],
    solution: [
      "Field audits using a standard product and display checklist.",
      "Photo-backed availability, merchandising and competitor observations.",
      "Location-wise reporting for retail teams.",
    ],
    results: [
      "Better store-level execution visibility.",
      "Structured evidence for merchandising reviews.",
      "A repeatable process for ongoing retail checks.",
    ],
  },
  manufacturing: {
    title: "Bulk Workforce Deployment for Operations",
    industry: "Manufacturing",
    service: "Blue-collar staffing & workforce coordination",
    about:
      "A production-led operation required additional associates and helpers for a defined workload period, with documentation and joining coordination managed consistently.",
    challenges: [
      "High-volume sourcing within practical joining timelines.",
      "Role fit, document readiness and shift requirements.",
      "Replacement needs during ongoing operations.",
    ],
    solution: [
      "Local bulk sourcing and basic role screening.",
      "Document collection, shift-wise joining and attendance coordination.",
      "Replacement support around changing workforce demand.",
    ],
    results: [
      "A more structured bulk-mobilisation workflow.",
      "Flexible staffing aligned to production demand.",
      "Reduced operational disruption from replacement requirements.",
    ],
  },
  healthcare: {
    title: "Field Outreach & Support Staffing",
    industry: "Healthcare",
    service: "Field teams, support roles & data collection",
    about:
      "A healthcare outreach programme needed trained field and support staff to coordinate visits, collect approved information and maintain a consistent engagement process.",
    challenges: [
      "Sensitive, process-led interactions across multiple locations.",
      "Need for clear role instructions and documentation discipline.",
      "Consistent reporting from distributed field activity.",
    ],
    solution: [
      "Role-based field and support staffing against the approved brief.",
      "Structured visit workflows, data collection and escalation paths.",
      "Activity reporting and coordination with the central operations team.",
    ],
    results: [
      "More consistent field execution against the defined workflow.",
      "Clearer activity visibility for the central team.",
      "Flexible staffing for time-bound outreach requirements.",
    ],
  },
  startups: {
    title: "Rapid Go-to-Market Field Team",
    industry: "Startups",
    service: "Field sales, onboarding & project workforce",
    about:
      "An expanding business needed to test and grow new markets quickly without creating a permanent operating team in every launch city.",
    challenges: [
      "Entering multiple markets with limited local infrastructure.",
      "Testing acquisition and onboarding workflows quickly.",
      "Adjusting headcount as the launch plan evolved.",
    ],
    solution: [
      "Project-based field team deployment by city.",
      "Lead generation, onboarding and structured market feedback.",
      "Flexible workforce scaling as campaign requirements changed.",
    ],
    results: [
      "Faster access to on-ground execution capacity.",
      "Practical market feedback during expansion.",
      "Lower dependence on permanent teams during early-stage rollout.",
    ],
  },
};

export function getSolutionCaseStudy(slug: SolutionSlug) {
  return solutionCaseStudies[slug];
}

export function getIndustryCaseStudy(slug: IndustrySlug) {
  return industryCaseStudies[slug];
}
