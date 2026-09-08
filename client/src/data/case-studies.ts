export interface CaseStudy {
  slug: string;
  category: string;
  industry: string;
  clientType: string;
  title: string;
  services: readonly string[];
  about: string;
  challenges: readonly string[];
  solution: readonly string[];
  results: readonly string[];
}

export const caseStudies: readonly CaseStudy[] = [
  {
    slug: "digital-merchant-onboarding-qr-deployment",
    category: "Fintech & Merchant Acquisition",
    industry: "Fintech & Digital Payments",
    clientType: "UPI, QR payment and fintech platforms",
    title: "Digital Merchant Onboarding & QR Deployment",
    services: ["Merchant onboarding", "QR deployment", "KYC & verification", "Field sales"],
    about:
      "Digital-payment platforms need reliable merchant adoption beyond large urban centres. The project model focuses on educating local merchants, completing onboarding and supporting active payment acceptance across distributed markets.",
    challenges: [
      "Expand merchant acquisition across multiple cities and Tier 2 / Tier 3 markets.",
      "Educate Kirana stores and small businesses about digital payments.",
      "Complete KYC while reducing duplicate or invalid onboarding.",
    ],
    solution: [
      "Deploy trained field executives for merchant prospecting and acquisition.",
      "Support QR deployment, activation, KYC and document verification.",
      "Use field-level quality checks and activity reporting for visibility.",
    ],
    results: [
      "Faster multi-location merchant acquisition support.",
      "More structured verification through KYC and quality checks.",
      "Centralised visibility into field onboarding activity.",
    ],
  },
  {
    slug: "marketplace-seller-acquisition",
    category: "E-Commerce & Seller Acquisition",
    industry: "E-Commerce",
    clientType: "Marketplace and seller ecosystems",
    title: "Marketplace Seller Acquisition",
    services: ["Seller outreach", "Marketplace onboarding", "Documentation", "Telesales follow-up"],
    about:
      "Marketplace growth depends on continuously identifying and enabling MSMEs, manufacturers, retailers and local businesses that may need help understanding online selling and completing registration.",
    challenges: [
      "Identify relevant sellers across fragmented local markets.",
      "Explain marketplace participation and registration requirements clearly.",
      "Reduce drop-off during documentation and incomplete applications.",
    ],
    solution: [
      "Deploy field and telesales teams to identify and educate potential sellers.",
      "Support registration, documentation and onboarding coordination.",
      "Follow up on incomplete applications and listing-readiness steps.",
    ],
    results: [
      "Expanded access to local MSMEs and sellers.",
      "Faster lead generation and follow-up.",
      "A scalable acquisition model across multiple locations.",
    ],
  },
  {
    slug: "last-mile-delivery-workforce",
    category: "Logistics & Last-Mile Delivery",
    industry: "Logistics & Hyperlocal Delivery",
    clientType: "Delivery, quick-commerce and logistics platforms",
    title: "Last-Mile Delivery Workforce",
    services: ["Rider hiring", "Delivery workforce", "Warehouse manpower", "Replacement hiring"],
    about:
      "Delivery operations need a continuous supply of riders and operational manpower, especially during city expansion, seasonal peaks and periods of high workforce attrition.",
    challenges: [
      "Mobilise riders and delivery executives quickly across locations.",
      "Handle high attrition and recurring replacement requirements.",
      "Coordinate documents, joining and operational readiness at scale.",
    ],
    solution: [
      "Use local sourcing, telecalling and recruitment drives for candidate acquisition.",
      "Coordinate document collection, interviews, training and joining follow-up.",
      "Provide replacement hiring and location-specific workforce support.",
    ],
    results: [
      "Faster workforce mobilisation.",
      "Access to local candidate networks.",
      "Flexible scaling based on city, demand and seasonal requirements.",
    ],
  },
  {
    slug: "mobility-partner-onboarding",
    category: "Mobility & Transportation",
    industry: "Mobility, Transportation & EV",
    clientType: "Cab, bike, auto and electric-mobility platforms",
    title: "Driver & Mobility Partner Onboarding",
    services: ["Driver acquisition", "Vehicle partner onboarding", "KYC", "Training & activation"],
    about:
      "Mobility businesses need city-wise acquisition of drivers, riders and vehicle partners while maintaining document readiness, KYC and activation discipline.",
    challenges: [
      "Reach suitable drivers and vehicle partners across local markets.",
      "Coordinate documentation and KYC before activation.",
      "Support rapid city expansion without a permanent acquisition team everywhere.",
    ],
    solution: [
      "Source bike, auto, cab and electric-mobility partners locally.",
      "Coordinate document verification, KYC and onboarding support.",
      "Provide training and activation follow-up before deployment.",
    ],
    results: [
      "A repeatable city-by-city partner acquisition model.",
      "Improved onboarding readiness before activation.",
      "Flexible field support for mobility expansion.",
    ],
  },
  {
    slug: "retail-store-audit-compliance",
    category: "Retail Audit & Field Operations",
    industry: "FMCG, Electronics & Retail",
    clientType: "Consumer brands and distributed retail networks",
    title: "Retail Store Audit & Compliance",
    services: ["Store audits", "Planogram checks", "Photo verification", "Competitive intelligence"],
    about:
      "Brands operating across many retail outlets need reliable visibility into product availability, displays, promotions and execution standards at store level.",
    challenges: [
      "Maintain consistent execution across a distributed outlet network.",
      "Collect evidence that can be reviewed centrally.",
      "Identify availability, display and promotion gaps quickly.",
    ],
    solution: [
      "Deploy field auditors for structured store visits.",
      "Check availability, planogram compliance, promotions and competitor activity.",
      "Use photo, GPS and timestamp-backed reporting where required.",
    ],
    results: [
      "Structured store-level field intelligence.",
      "Improved visibility into retail execution gaps.",
      "A repeatable audit model across locations.",
    ],
  },
  {
    slug: "consumer-product-sampling",
    category: "FMCG & Brand Activation",
    industry: "FMCG & Food / Beverage",
    clientType: "Consumer product and retail brands",
    title: "Consumer Product Sampling & Promotion",
    services: ["Product sampling", "Promoters", "Retail demonstrations", "Consumer feedback"],
    about:
      "Consumer brands often need direct shopper interaction to drive product trial, explain the proposition and collect immediate feedback in retail environments.",
    challenges: [
      "Create consistent consumer interaction across participating outlets.",
      "Maintain campaign messaging and demonstration quality.",
      "Capture useful field feedback alongside promotion activity.",
    ],
    solution: [
      "Deploy trained promoters for sampling and product demonstrations.",
      "Support consumer education, engagement and sales-conversion activity.",
      "Collect feedback and coordinate outlet-level execution reporting.",
    ],
    results: [
      "More opportunities for direct product trial.",
      "Immediate consumer feedback from the field.",
      "Consistent retail-level brand activation.",
    ],
  },
  {
    slug: "consumer-survey-market-research",
    category: "Surveys & Research Projects",
    industry: "Market Research, Government & Public Projects",
    clientType: "Research, consumer-insight and field-data programmes",
    title: "Large-Scale Consumer & Field Survey",
    services: ["Consumer surveys", "Field research", "Data collection", "GPS / photo validation"],
    about:
      "Location-specific decisions require structured field data from consumers, retailers, households or beneficiaries, collected consistently across the target geography.",
    challenges: [
      "Deploy temporary survey teams according to geography and project scope.",
      "Keep questionnaires and collection standards consistent in the field.",
      "Improve confidence in location-wise data and verification.",
    ],
    solution: [
      "Deploy field researchers for consumer, retailer and household surveys.",
      "Use digital form-based collection for structured responses.",
      "Support field verification with GPS and photo evidence where required.",
    ],
    results: [
      "Structured location-wise market intelligence.",
      "Scalable data collection across project geographies.",
      "Clearer field verification for research teams.",
    ],
  },
  {
    slug: "managed-workforce-staffing",
    category: "Staffing & Managed Workforce",
    industry: "Staffing & Outsourcing",
    clientType: "White-, grey- and blue-collar workforce programmes",
    title: "Managed Workforce & High-Volume Staffing",
    services: ["Bulk hiring", "Screening & joining", "Attendance coordination", "Payroll support"],
    about:
      "Large workforce programmes involve more than sourcing. Clients also need screening, joining support, attendance coordination, replacement management and structured workforce administration.",
    challenges: [
      "Fill high-volume requirements across different roles and locations.",
      "Manage short joining timelines and recurring replacement needs.",
      "Coordinate documentation, attendance and workforce administration.",
    ],
    solution: [
      "Combine local recruitment networks, telecalling and digital sourcing.",
      "Support screening, document collection, joining and replacement hiring.",
      "Coordinate attendance, payroll-support inputs and workforce reporting.",
    ],
    results: [
      "A more scalable workforce mobilisation model.",
      "Flexible support across operational role categories.",
      "Reduced coordination load for ongoing workforce requirements.",
    ],
  },
] as const;

export const caseStudyCategories = caseStudies.map((study) => study.category);

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
