import type { IndustryDetailContent } from "@/types/industry-detail.types";
import type { IndustrySlug } from "@/types/solution-detail.types";

export const industriesOverview = {
  heading: "Solutions designed for every industry.",
  description:
    "Find workforce, sales and execution support shaped around your sector. Explore the roles, activities and service combinations your business may need.",
} as const;

/** FMCG follows the client's explicit example; the other sector pages adapt the agreed service catalogue. */
export const industryDetails = {
  fmcg: {
    heading: "FMCG solutions, from shelf to market.",
    description:
      "Coordinate promoters, merchandising, field sales and campaign support around your products and outlets. Bring store execution and customer engagement into one workforce plan.",
    summary:
      "Promoters, merchandising, field sales and activation support for your products and retail coverage.",
    context: [
      { label: "Work settings", value: "Stores, outlets & campaign locations" },
      {
        label: "Team focus",
        value: "Product visibility & customer interaction",
      },
      {
        label: "Planning starts with",
        value: "Products, coverage & activity schedule",
      },
    ],
    servicesHeading: "People and execution for your FMCG programme.",
    servicesDescription:
      "Connect store-level work with the sales and campaign activities around it.",
    services: [
      {
        title: "Sales promoters",
        description:
          "Support product conversations and purchase decisions at the outlets in your promotion plan.",
        solutionSlug: "promoter-solutions",
      },
      {
        title: "Merchandisers",
        description:
          "Coordinate product placement and presentation against the shelf and display brief.",
        solutionSlug: "retail-execution",
      },
      {
        title: "Field sales teams",
        description:
          "Build a team for assigned outlet visits, customer follow-ups and market coverage.",
        solutionSlug: "sales-force",
      },
      {
        title: "Product sampling",
        description:
          "Arrange people for sampling activities that introduce your products to the intended audience.",
        solutionSlug: "brand-activation",
      },
      {
        title: "Retail audits",
        description:
          "Collect agreed observations about product availability, presentation and store execution.",
        solutionSlug: "retail-execution",
      },
      {
        title: "Brand activations",
        description:
          "Coordinate on-ground teams and promotional activities around your campaign brief.",
        solutionSlug: "brand-activation",
      },
    ],
    scenariosHeading: "Support the work behind your market presence.",
    scenarios: [
      {
        title: "A product introduction",
        description:
          "Bring sampling, promoters and demonstrations together around a new product and its target audience.",
      },
      {
        title: "A store execution programme",
        description:
          "Plan merchandising and audit activity across the outlets selected for the programme.",
      },
      {
        title: "Additional market coverage",
        description:
          "Define the territories, outlet visits and field sales roles needed for the next stage of coverage.",
      },
    ],
    briefDescription:
      "A clear product and outlet brief helps connect the right roles with the right activities.",
    briefItems: [
      {
        title: "Products & activities",
        description:
          "Name the products and the promotion, sales or merchandising work you need.",
      },
      {
        title: "Outlets & locations",
        description:
          "Share the store list, cities and coverage expected from the team.",
      },
      {
        title: "People & dates",
        description:
          "Specify role counts, campaign dates and any shift requirements.",
      },
      {
        title: "Checks & updates",
        description:
          "Describe the store checklist and reporting you want to review.",
      },
    ],
    cta: {
      title: "Build your FMCG workforce requirement.",
      description:
        "Tell us your products, outlets, activities and dates. We’ll help you plan the people and execution support.",
      label: "Get an FMCG workforce solution",
    },
  },
  retail: {
    heading: "Retail teams for the work inside your stores.",
    description:
      "Plan people and execution around your store network. Connect in-store promotions, merchandising, audits and seasonal staffing with the work each outlet needs.",
    summary:
      "In-store promoters, merchandising, audits and flexible staffing around your retail operations.",
    context: [
      {
        label: "Work settings",
        value: "Stores, shop floors & outlet networks",
      },
      { label: "Team focus", value: "Store standards & shopper interaction" },
      {
        label: "Planning starts with",
        value: "Outlet coverage, roles & store schedules",
      },
    ],
    servicesHeading: "Support for store teams and retail execution.",
    servicesDescription:
      "Define what each store needs, from customer-facing support to a structured execution checklist.",
    services: [
      {
        title: "In-store promoters",
        description:
          "Arrange people to explain products and assist shoppers during in-store promotions.",
        solutionSlug: "promoter-solutions",
      },
      {
        title: "Merchandising",
        description:
          "Support product arrangement and presentation against the store's merchandising brief.",
        solutionSlug: "retail-execution",
      },
      {
        title: "Store audits",
        description:
          "Review agreed store conditions and operational standards using a defined checklist.",
        solutionSlug: "retail-execution",
      },
      {
        title: "Mystery audits",
        description:
          "Assess agreed aspects of the shopping experience through planned visits.",
        solutionSlug: "retail-execution",
      },
      {
        title: "Product availability checks",
        description:
          "Check whether selected products are available across the outlets in your programme.",
        solutionSlug: "retail-execution",
      },
      {
        title: "Seasonal staffing",
        description:
          "Plan additional people for a defined period of store activity or seasonal workload.",
        solutionSlug: "gig-workforce",
      },
    ],
    scenariosHeading: "Plan for everyday execution and busy periods.",
    scenarios: [
      {
        title: "Store promotions",
        description:
          "Coordinate promoter roles, product preparation and shift coverage for an in-store campaign.",
      },
      {
        title: "Outlet checks",
        description:
          "Build a visit programme around the stores, standards and product checks you want to review.",
      },
      {
        title: "Seasonal demand",
        description:
          "Set the dates and tasks that need additional staffing during a promotion or busy trading period.",
      },
    ],
    briefDescription:
      "Start with the store list and the work expected at each location.",
    briefItems: [
      {
        title: "Store coverage",
        description: "List the outlets, cities and visit or staffing schedule.",
      },
      {
        title: "Roles & headcount",
        description:
          "Set the number of promoters, support staff or field people required.",
      },
      {
        title: "Product & store brief",
        description:
          "Explain the products, store standards and activities involved.",
      },
      {
        title: "Duration & reporting",
        description:
          "Share shift timings, engagement dates and the updates you need.",
      },
    ],
    cta: {
      title: "What do your stores need next?",
      description:
        "Share your outlets, roles and execution requirements. We’ll help connect the work with the right team.",
      label: "Plan your retail requirement",
    },
  },
  "e-commerce": {
    heading: "E-commerce support for the work behind each order.",
    description:
      "Build customer support, data and back-office capacity around your e-commerce workflow. Plan ongoing teams or additional help for a defined campaign or seasonal workload.",
    summary:
      "Customer support, data work and operations teams for everyday workflows and seasonal requirements.",
    context: [
      {
        label: "Work settings",
        value: "Support desks, back offices & remote teams",
      },
      { label: "Team focus", value: "Customer enquiries & operational tasks" },
      {
        label: "Planning starts with",
        value: "Workload, responsibilities & engagement dates",
      },
    ],
    servicesHeading: "Build capacity across your support workflow.",
    servicesDescription:
      "Choose the roles that match your customer conversations, records and operational tasks.",
    services: [
      {
        title: "Customer support",
        description:
          "Recruit people for the customer queries and support activities defined in your workflow.",
        solutionSlug: "business-operations",
      },
      {
        title: "Telecalling",
        description:
          "Coordinate enquiry follow-ups and structured customer calling around an agreed brief.",
        solutionSlug: "business-operations",
      },
      {
        title: "Data collection",
        description:
          "Gather the records or responses your operational process requires.",
        solutionSlug: "business-operations",
      },
      {
        title: "Data verification",
        description:
          "Review information against the checks and criteria set by your team.",
        solutionSlug: "business-operations",
      },
      {
        title: "Back office support",
        description:
          "Add capacity for record handling, administrative tasks and routine operations.",
        solutionSlug: "business-operations",
      },
      {
        title: "Seasonal operations workforce",
        description:
          "Plan additional staffing for a sales campaign, seasonal period or defined operations project.",
        solutionSlug: "gig-workforce",
      },
    ],
    scenariosHeading: "Match the team to your operating workload.",
    scenarios: [
      {
        title: "Customer enquiry coverage",
        description:
          "Define the customer questions, working hours and hand-offs your support team needs to cover.",
      },
      {
        title: "A time-bound data project",
        description:
          "Set the records, review steps and project duration before arranging the people doing the work.",
      },
      {
        title: "Campaign support",
        description:
          "Prepare extra operations capacity around a known promotion window or seasonal requirement.",
      },
    ],
    briefDescription:
      "Describe the workflow and the responsibilities the new team will own.",
    briefItems: [
      {
        title: "Functions & tasks",
        description:
          "Explain the customer support, calling, data or back-office work involved.",
      },
      {
        title: "Team size & workload",
        description:
          "Share the number of roles and the workload to plan around.",
      },
      {
        title: "Working arrangement",
        description:
          "Specify location or remote requirements, hours and assignment duration.",
      },
      {
        title: "Process & hand-offs",
        description:
          "Define task instructions, review points and the updates your team needs.",
      },
    ],
    cta: {
      title: "Where does your e-commerce team need support?",
      description:
        "Tell us the workflow, team size and duration. We’ll help you plan the operational roles.",
      label: "Build your e-commerce support team",
    },
  },
  "bfsi-fintech": {
    heading: "BFSI and fintech teams for outreach and operations.",
    description:
      "Plan field sales, lead generation, calling and business support around your customer and operational workflows. Define the role responsibilities before building the team.",
    summary:
      "Field sales, outreach, telecalling and business operations teams aligned with your workflow.",
    context: [
      {
        label: "Work settings",
        value: "Field territories, support desks & remote teams",
      },
      { label: "Team focus", value: "Customer outreach & operational support" },
      {
        label: "Planning starts with",
        value: "Role scope, customer segments & work instructions",
      },
    ],
    servicesHeading: "People for outreach, follow-up and support work.",
    servicesDescription:
      "Connect customer-facing roles with the operational support around them.",
    services: [
      {
        title: "Field sales teams",
        description:
          "Organise customer visits and field activity within the territories defined in your brief.",
        solutionSlug: "sales-force",
      },
      {
        title: "Lead generation",
        description:
          "Build capacity for prospect research, outreach and qualification against agreed criteria.",
        solutionSlug: "sales-force",
      },
      {
        title: "Telecalling",
        description:
          "Support structured calling and follow-ups using the work instructions you provide.",
        solutionSlug: "business-operations",
      },
      {
        title: "Customer support",
        description:
          "Recruit people for defined customer queries and support hand-offs.",
        solutionSlug: "business-operations",
      },
      {
        title: "Data verification",
        description:
          "Arrange people to review information against your specified checks and process.",
        solutionSlug: "business-operations",
      },
      {
        title: "Back office support",
        description:
          "Build capacity for administrative tasks, records and day-to-day support operations.",
        solutionSlug: "business-operations",
      },
    ],
    scenariosHeading: "Build the role around the responsibility.",
    scenarios: [
      {
        title: "Defined market coverage",
        description:
          "Specify the customer segments, territories and outreach responsibilities of the field team.",
      },
      {
        title: "Calling and follow-up capacity",
        description:
          "Plan the people, work instructions and update process needed for a structured calling requirement.",
      },
      {
        title: "Operations support",
        description:
          "Identify the tasks and review steps that require additional back-office capacity.",
      },
    ],
    briefDescription:
      "A clear role scope helps separate outreach responsibilities from the decisions owned by your business.",
    briefItems: [
      {
        title: "Roles & responsibilities",
        description:
          "Describe the work each role will do and the hand-offs to your team.",
      },
      {
        title: "Customers & coverage",
        description:
          "Share the segments, locations or outreach channels involved.",
      },
      {
        title: "People & schedule",
        description: "Set the team size, working hours and engagement period.",
      },
      {
        title: "Workflow & review",
        description:
          "Provide the task instructions, review criteria and reporting expectations.",
      },
    ],
    cta: {
      title: "Plan your BFSI or fintech workforce requirement.",
      description:
        "Share your roles, coverage and operational scope. We’ll help organise the staffing requirement.",
      label: "Discuss your team requirement",
    },
  },
  telecom: {
    heading: "Telecom teams for customer reach and field execution.",
    description:
      "Coordinate sales, promotions and outreach around your markets and channels. Build field and support roles that match your customer conversations and coverage plan.",
    summary:
      "Field sales, promoters, customer outreach and support teams for your telecom requirements.",
    context: [
      {
        label: "Work settings",
        value: "Sales territories, outlets & calling teams",
      },
      { label: "Team focus", value: "Customer reach & product conversations" },
      {
        label: "Planning starts with",
        value: "Markets, channels & role requirements",
      },
    ],
    servicesHeading: "Support for your sales and outreach channels.",
    servicesDescription:
      "Bring the field, promotion and support activities into one clear team plan.",
    services: [
      {
        title: "Field sales executives",
        description:
          "Support customer visits and sales activity across assigned locations or territories.",
        solutionSlug: "sales-force",
      },
      {
        title: "Sales promoters",
        description:
          "Arrange people to explain your offering and assist customer conversations at selected locations.",
        solutionSlug: "promoter-solutions",
      },
      {
        title: "Telecalling teams",
        description:
          "Coordinate telephone outreach and enquiry follow-ups around an agreed brief.",
        solutionSlug: "business-operations",
      },
      {
        title: "Lead generation teams",
        description:
          "Build capacity for identifying prospects and supporting initial outreach.",
        solutionSlug: "sales-force",
      },
      {
        title: "Customer support",
        description:
          "Recruit people for the customer queries and support workflows your business defines.",
        solutionSlug: "business-operations",
      },
      {
        title: "Market surveys",
        description:
          "Collect responses and field observations using your agreed questions and locations.",
        solutionSlug: "retail-execution",
      },
    ],
    scenariosHeading: "Connect the market plan to the team on the ground.",
    scenarios: [
      {
        title: "Territory coverage",
        description:
          "Define the locations and field sales responsibilities needed to support your coverage plan.",
      },
      {
        title: "A local promotion",
        description:
          "Coordinate promoter roles, product preparation and customer interactions at selected outlets or venues.",
      },
      {
        title: "Outreach support",
        description:
          "Build a calling or support team around your enquiry volumes and follow-up workflow.",
      },
    ],
    briefDescription:
      "Explain which channels the team will work in and how their activity will be reviewed.",
    briefItems: [
      {
        title: "Markets & channels",
        description:
          "List the territories, outlets or calling channels you need to cover.",
      },
      {
        title: "Roles & people",
        description:
          "Specify sales, promoter and support roles with the required headcount.",
      },
      {
        title: "Product & activity brief",
        description:
          "Describe the offering and the customer interactions expected from each role.",
      },
      {
        title: "Schedule & updates",
        description:
          "Share assignment dates, working hours and activity reporting needs.",
      },
    ],
    cta: {
      title: "Build the team behind your telecom outreach.",
      description:
        "Tell us your markets, channels and roles. We’ll help you put the requirement together.",
      label: "Plan your telecom workforce",
    },
  },
  logistics: {
    heading: "Logistics workforce for operational requirements.",
    description:
      "Plan operational, field and support roles around the work your logistics business needs done. Build ongoing capacity or arrange extra people for a defined period of activity.",
    summary:
      "Operations staff, field roles and flexible support teams around your logistics workflow.",
    context: [
      {
        label: "Work settings",
        value: "Operational locations, field assignments & offices",
      },
      { label: "Team focus", value: "Defined tasks & coordinated hand-offs" },
      {
        label: "Planning starts with",
        value: "Locations, workloads & working schedules",
      },
    ],
    servicesHeading: "People for operational and support tasks.",
    servicesDescription:
      "Define the assignment and the role requirements before planning the workforce.",
    services: [
      {
        title: "Operations staff",
        description:
          "Recruit people for the operational responsibilities defined at your work locations.",
        solutionSlug: "workforce-solutions",
      },
      {
        title: "Temporary staffing",
        description:
          "Plan additional capacity for a specified workload period or project.",
        solutionSlug: "workforce-solutions",
      },
      {
        title: "Field executives",
        description:
          "Arrange people for assigned visits, location-based tasks and field activities.",
        solutionSlug: "gig-workforce",
      },
      {
        title: "Data verification",
        description:
          "Support record checks against the criteria and workflow your operations team supplies.",
        solutionSlug: "business-operations",
      },
      {
        title: "Customer support",
        description:
          "Build a team for defined customer enquiries and support hand-offs.",
        solutionSlug: "business-operations",
      },
      {
        title: "Remote operations teams",
        description:
          "Coordinate roles suited to remote data, calling or back-office work.",
        solutionSlug: "business-operations",
      },
    ],
    scenariosHeading: "Plan capacity around your operating schedule.",
    scenarios: [
      {
        title: "Additional workload",
        description:
          "Set the roles, locations and engagement period needed for a known increase in activity.",
      },
      {
        title: "A field assignment",
        description:
          "Describe the visits, tasks and geographic coverage the field team will handle.",
      },
      {
        title: "Back-office coordination",
        description:
          "Connect record handling and customer support roles to your operational hand-offs.",
      },
    ],
    briefDescription:
      "A location and task brief helps organise the people around the operation.",
    briefItems: [
      {
        title: "Work locations",
        description:
          "Share the sites, offices or field areas where roles are required.",
      },
      {
        title: "Tasks & role criteria",
        description:
          "Describe the responsibilities and experience each role needs.",
      },
      {
        title: "Headcount & timing",
        description: "Set team sizes, shifts and the assignment duration.",
      },
      {
        title: "Coordination needs",
        description:
          "Explain reporting, preparation and the hand-offs to your existing team.",
      },
    ],
    cta: {
      title: "Where does your logistics operation need people?",
      description:
        "Share the locations, roles and working schedule. We’ll help plan the workforce requirement.",
      label: "Build your logistics requirement",
    },
  },
  "food-beverage": {
    heading: "Food and beverage teams for market execution.",
    description:
      "Connect product sampling, promotions and field sales around your brand. Plan the people needed for outlet activity, customer engagement and a defined campaign schedule.",
    summary:
      "Sampling, promoters, field sales and retail execution support for your food and beverage brand.",
    context: [
      {
        label: "Work settings",
        value: "Retail outlets & agreed campaign venues",
      },
      {
        label: "Team focus",
        value: "Product introductions & brand interaction",
      },
      {
        label: "Planning starts with",
        value: "Products, venues & campaign instructions",
      },
    ],
    servicesHeading: "Support your product where customers encounter it.",
    servicesDescription:
      "Shape the team around the promotion, sales or retail activity you want to deliver.",
    services: [
      {
        title: "Product sampling",
        description:
          "Coordinate people for sampling activity at the venues and dates in your campaign brief.",
        solutionSlug: "brand-activation",
      },
      {
        title: "Brand promoters",
        description:
          "Introduce your brand and support product conversations with the intended audience.",
        solutionSlug: "promoter-solutions",
      },
      {
        title: "Field sales teams",
        description:
          "Build a team for outlet visits and sales follow-ups in selected markets.",
        solutionSlug: "sales-force",
      },
      {
        title: "Retail audits",
        description:
          "Collect agreed observations about product availability, presentation and outlet activity.",
        solutionSlug: "retail-execution",
      },
      {
        title: "Brand activations",
        description:
          "Arrange on-ground campaign support around your product and customer engagement plan.",
        solutionSlug: "brand-activation",
      },
      {
        title: "Seasonal support teams",
        description:
          "Plan additional people for a defined promotion window or seasonal campaign.",
        solutionSlug: "gig-workforce",
      },
    ],
    scenariosHeading: "Bring the campaign and outlet requirements together.",
    scenarios: [
      {
        title: "A product sampling campaign",
        description:
          "Set the product brief, venues, dates and promoter roles for an organised sampling activity.",
      },
      {
        title: "Retail visibility work",
        description:
          "Coordinate outlet checks and promotion activity around the locations that matter to your brand.",
      },
      {
        title: "A seasonal activation",
        description:
          "Build a short-term team around a specified campaign calendar and target audience.",
      },
    ],
    briefDescription:
      "Describe the product, activity and preparations the team needs before deployment.",
    briefItems: [
      {
        title: "Product & activity",
        description:
          "Explain the sampling, promotion, sales or retail work you need.",
      },
      {
        title: "Venues & audience",
        description:
          "List the outlets or campaign locations and the audience you want to reach.",
      },
      {
        title: "Team & campaign dates",
        description:
          "Share role counts, working schedules and engagement dates.",
      },
      {
        title: "Preparation & updates",
        description:
          "Provide the activity instructions, venue arrangements and reporting expectations.",
      },
    ],
    cta: {
      title: "Plan your next food and beverage campaign.",
      description:
        "Tell us your product, venues and workforce needs. We’ll help connect the team with the activity.",
      label: "Discuss your campaign requirement",
    },
  },
  "consumer-electronics": {
    heading: "Consumer electronics teams for product conversations.",
    description:
      "Build promoter, demonstration and retail execution support around your products. Connect customer interactions with the display, sales and campaign work behind them.",
    summary:
      "Product demonstrators, in-store promoters, retail checks and sales teams for electronics brands.",
    context: [
      {
        label: "Work settings",
        value: "Retail stores, sales territories & launch venues",
      },
      { label: "Team focus", value: "Product explanation & store execution" },
      {
        label: "Planning starts with",
        value: "Products, role preparation & outlet coverage",
      },
    ],
    servicesHeading: "People who support the product experience.",
    servicesDescription:
      "Define the product message and the execution standards your store or launch programme needs.",
    services: [
      {
        title: "Product demonstrators",
        description:
          "Arrange people to explain product features and demonstrate the agreed use cases.",
        solutionSlug: "promoter-solutions",
      },
      {
        title: "In-store promoters",
        description:
          "Support shopper questions and product conversations at selected retail locations.",
        solutionSlug: "promoter-solutions",
      },
      {
        title: "Visual merchandising",
        description:
          "Coordinate display and product presentation against your merchandising brief.",
        solutionSlug: "retail-execution",
      },
      {
        title: "Store audits",
        description:
          "Review agreed display, availability and store execution criteria through planned visits.",
        solutionSlug: "retail-execution",
      },
      {
        title: "Territory sales teams",
        description:
          "Build sales coverage around the markets, outlets and customer segments you define.",
        solutionSlug: "sales-force",
      },
      {
        title: "Launch campaigns",
        description:
          "Connect promoters and on-ground activities around a product launch programme.",
        solutionSlug: "brand-activation",
      },
    ],
    scenariosHeading:
      "Support the product from introduction to store execution.",
    scenarios: [
      {
        title: "A product demonstration programme",
        description:
          "Define the features, demonstration brief and store roles needed for your product range.",
      },
      {
        title: "A launch activation",
        description:
          "Coordinate the people, venues and customer interactions planned for a product introduction.",
      },
      {
        title: "A retail standards review",
        description:
          "Build store visits around the presentation and availability checks your team wants to assess.",
      },
    ],
    briefDescription:
      "Give the team a clear product brief and the coverage required at each location.",
    briefItems: [
      {
        title: "Products & preparation",
        description:
          "List the products and the knowledge or demonstrations each role needs.",
      },
      {
        title: "Stores & territories",
        description:
          "Share the outlet locations, markets or campaign venues involved.",
      },
      {
        title: "Roles & duration",
        description:
          "Set promoter, sales or field headcount with dates and shifts.",
      },
      {
        title: "Execution standards",
        description:
          "Describe display criteria, visit checklists and the updates you require.",
      },
    ],
    cta: {
      title: "Build the team behind your electronics programme.",
      description:
        "Share your products, locations and execution needs. We’ll help shape the workforce brief.",
      label: "Plan your electronics workforce",
    },
  },
  manufacturing: {
    heading: "Manufacturing workforce built around your role requirements.",
    description:
      "Coordinate recruitment, contract staffing and business support around your work locations. Define the roles, experience and engagement schedule before building the team.",
    summary:
      "Permanent recruitment, contract staffing and operational support for your manufacturing business.",
    context: [
      {
        label: "Work settings",
        value: "Work sites, offices & support operations",
      },
      {
        label: "Team focus",
        value: "Defined role requirements & staffing plans",
      },
      {
        label: "Planning starts with",
        value: "Skills, work locations & engagement period",
      },
    ],
    servicesHeading: "Recruitment and support for your staffing plan.",
    servicesDescription:
      "Match the hiring model and operational roles to the requirements of the assignment.",
    services: [
      {
        title: "Permanent recruitment",
        description:
          "Source and screen candidates against the responsibilities and experience your roles require.",
        solutionSlug: "workforce-solutions",
      },
      {
        title: "Contract staffing",
        description:
          "Build a team around a specified role scope and engagement period.",
        solutionSlug: "workforce-solutions",
      },
      {
        title: "Bulk hiring",
        description:
          "Coordinate sourcing and screening when several people are needed across similar roles.",
        solutionSlug: "workforce-solutions",
      },
      {
        title: "Temporary workforce",
        description:
          "Plan additional people for an agreed workload period or project requirement.",
        solutionSlug: "gig-workforce",
      },
      {
        title: "Data verification",
        description:
          "Support operational record checks against the process defined by your team.",
        solutionSlug: "business-operations",
      },
      {
        title: "Back office support",
        description:
          "Build capacity for administrative responsibilities and routine business operations.",
        solutionSlug: "business-operations",
      },
    ],
    scenariosHeading: "Plan staffing around the work that needs doing.",
    scenarios: [
      {
        title: "Several roles to fill",
        description:
          "Group the roles, skills and joining requirements into a coordinated hiring brief.",
      },
      {
        title: "A defined project period",
        description:
          "Set the locations, headcount and engagement dates for a contract or temporary requirement.",
      },
      {
        title: "Business support capacity",
        description:
          "Identify record handling and office responsibilities that need an additional support team.",
      },
    ],
    briefDescription:
      "Specific role and worksite requirements help focus the candidate search and deployment plan.",
    briefItems: [
      {
        title: "Roles & experience",
        description:
          "Provide the job responsibilities, experience and skills required for selection.",
      },
      {
        title: "Work locations",
        description:
          "Share the site or office locations and role-specific working arrangements.",
      },
      {
        title: "Headcount & engagement",
        description:
          "Specify team sizes, shifts, duration and the expected joining schedule.",
      },
      {
        title: "Onboarding needs",
        description:
          "Explain the preparation, supervision and reporting arrangements for the roles.",
      },
    ],
    cta: {
      title: "Tell us your manufacturing staffing requirement.",
      description:
        "Share the roles, locations, headcount and engagement schedule. We’ll help you plan the hiring work.",
      label: "Build your staffing requirement",
    },
  },
  healthcare: {
    heading: "Healthcare support teams for enquiries and operations.",
    description:
      "Build non-clinical enquiry, outreach and back-office capacity around your healthcare organisation. Define the responsibilities and hand-offs for each support role.",
    summary:
      "Non-clinical enquiry, calling, recruitment and back-office support around your operations.",
    context: [
      {
        label: "Work settings",
        value: "Enquiry desks, offices & remote support roles",
      },
      {
        label: "Team focus",
        value: "Non-clinical customer & administrative support",
      },
      {
        label: "Planning starts with",
        value: "Role boundaries, workflow & staffing needs",
      },
    ],
    servicesHeading: "People for the support work around your organisation.",
    servicesDescription:
      "Plan enquiry and administrative roles around clear work instructions and hand-offs.",
    services: [
      {
        title: "Customer enquiry teams",
        description:
          "Recruit people to handle the non-clinical enquiries and support tasks your workflow defines.",
        solutionSlug: "business-operations",
      },
      {
        title: "Telecalling",
        description:
          "Coordinate structured outreach and follow-up calls against an agreed activity brief.",
        solutionSlug: "business-operations",
      },
      {
        title: "Support recruitment",
        description:
          "Source candidates for customer support, office coordination and administrative roles.",
        solutionSlug: "workforce-solutions",
      },
      {
        title: "Data collection",
        description:
          "Arrange people for the information-gathering tasks defined in your support process.",
        solutionSlug: "business-operations",
      },
      {
        title: "Data verification",
        description:
          "Support specified record checks using the instructions and review criteria you provide.",
        solutionSlug: "business-operations",
      },
      {
        title: "Back office teams",
        description:
          "Build capacity for administrative tasks, coordination and routine support work.",
        solutionSlug: "business-operations",
      },
    ],
    scenariosHeading: "Connect support roles to a clear workflow.",
    scenarios: [
      {
        title: "Enquiry coverage",
        description:
          "Set the enquiry types, support hours and hand-offs required from the team.",
      },
      {
        title: "An outreach programme",
        description:
          "Define the calling brief, roles and engagement period for a planned outreach activity.",
      },
      {
        title: "Administrative capacity",
        description:
          "Identify the coordination and record-handling tasks that need additional staff.",
      },
    ],
    briefDescription:
      "Describe the support responsibility, including where the role hands work back to your organisation.",
    briefItems: [
      {
        title: "Role scope",
        description:
          "Set the enquiry, calling or administrative responsibilities involved.",
      },
      {
        title: "Team & locations",
        description:
          "Share headcount and whether roles are on-site, office-based or remote.",
      },
      {
        title: "Working schedule",
        description:
          "Specify support hours, engagement dates and the joining requirement.",
      },
      {
        title: "Instructions & hand-offs",
        description:
          "Explain the work process, preparation and internal review or escalation points.",
      },
    ],
    cta: {
      title: "Where does your healthcare support team need capacity?",
      description:
        "Tell us the non-clinical roles, locations and schedule. We’ll help you shape the staffing requirement.",
      label: "Plan your support workforce",
    },
  },
  startups: {
    heading: "Startup teams for your next stage of work.",
    description:
      "Build hiring, sales and business support around the work your startup needs next. Combine ongoing roles with project or remote capacity as your requirements take shape.",
    summary:
      "Recruitment, remote sales, customer support and project teams for the work your startup needs next.",
    context: [
      { label: "Work settings", value: "Office, remote & project assignments" },
      { label: "Team focus", value: "Hiring, customer outreach & operations" },
      {
        label: "Planning starts with",
        value: "The next priority, role scope & duration",
      },
    ],
    servicesHeading: "Build capacity around your business priorities.",
    servicesDescription:
      "Start with the function that needs support, then choose the roles and engagement model.",
    services: [
      {
        title: "Permanent recruitment",
        description:
          "Source and screen candidates for the ongoing roles your business wants to build.",
        solutionSlug: "workforce-solutions",
      },
      {
        title: "Remote sales teams",
        description:
          "Arrange roles for prospecting, sales conversations and follow-ups suited to remote delivery.",
        solutionSlug: "business-operations",
      },
      {
        title: "Lead generation",
        description:
          "Build capacity for prospect research, outreach and qualification around your customer brief.",
        solutionSlug: "sales-force",
      },
      {
        title: "Customer support",
        description:
          "Recruit people for the customer questions and support workflows you need covered.",
        solutionSlug: "business-operations",
      },
      {
        title: "Back office support",
        description:
          "Add capacity for record handling, coordination and routine administrative tasks.",
        solutionSlug: "business-operations",
      },
      {
        title: "Project-based workforce",
        description:
          "Plan people for a campaign, field activity or assignment with a defined scope and duration.",
        solutionSlug: "gig-workforce",
      },
    ],
    scenariosHeading: "Start with the work that needs a team.",
    scenarios: [
      {
        title: "An ongoing role",
        description:
          "Turn a recurring responsibility into a clear role brief for recruitment and selection.",
      },
      {
        title: "Customer outreach",
        description:
          "Plan sales and lead generation capacity around the customer segment you want to reach.",
      },
      {
        title: "A defined project",
        description:
          "Arrange a team around the dates, locations and tasks of a specific assignment.",
      },
    ],
    briefDescription:
      "A focused first brief helps identify the role or combination of services you need.",
    briefItems: [
      {
        title: "Business priority",
        description:
          "Describe the work to be done and the outcome your team is working towards.",
      },
      {
        title: "Roles & people",
        description:
          "Share the functions, responsibilities and number of people you need.",
      },
      {
        title: "Working arrangement",
        description:
          "Set location or remote needs, working hours and engagement duration.",
      },
      {
        title: "Start & coordination",
        description:
          "Explain the expected start date, preparation and reporting arrangement.",
      },
    ],
    cta: {
      title: "What does your startup need to get done?",
      description:
        "Tell us your next priority, roles and timeline. We’ll help you plan the right support.",
      label: "Build your startup team",
    },
  },
} as const satisfies Record<IndustrySlug, IndustryDetailContent>;
