import { brandingServices, verificationDetails } from "@/data/service-expansion";
import type {
  SolutionDetailContent,
  SolutionSlug,
} from "@/types/solution-detail.types";

/** Service names follow the client's brief. Supporting copy describes the proposed service scope. */
export const solutionDetails = {
  "verification-services": verificationDetails,
  "workforce-solutions": {
    heading: "Workforce solutions built for scale.",
    description:
      "Hire for permanent roles, contract assignments or a growing project. Bring recruitment, screening and deployment together around your workforce requirement.",
    bestFor:
      "Businesses building a new team, filling several roles or planning staffing across locations.",
    facts: [
      { label: "Engagement", value: "Permanent, contract & project roles" },
      { label: "Team needs", value: "Blue-collar, white-collar & remote" },
      { label: "Hiring support", value: "Individual roles, bulk hiring & RPO" },
    ],
    servicesHeading: "Recruitment and staffing for the way you work.",
    servicesDescription:
      "Choose the hiring model that fits the role, duration and size of your requirement.",
    services: [
      {
        title: "Permanent recruitment",
        description:
          "Source and screen candidates for long-term positions in your business.",
      },
      {
        title: "Contract staffing",
        description:
          "Build a team around a defined assignment, work scope and engagement period.",
      },
      {
        title: "Temporary staffing",
        description:
          "Plan short-term staffing for additional workload, campaigns or temporary requirements.",
      },
      {
        title: "Bulk hiring",
        description:
          "Coordinate sourcing and screening when you need several people across similar roles.",
      },
      {
        title: "Project-based hiring",
        description:
          "Match the team and hiring schedule to a specific project and its delivery needs.",
      },
      {
        title: "Blue collar hiring",
        description:
          "Recruit for on-ground, store and operational roles with clear job requirements.",
      },
      {
        title: "White collar hiring",
        description:
          "Find candidates for sales, support, recruitment and business operations positions.",
      },
      {
        title: "Gig workforce",
        description:
          "Arrange people for short assignments, seasonal demand and defined tasks.",
      },
      {
        title: "Remote workforce",
        description:
          "Build teams for roles that can be delivered remotely with an agreed workflow.",
      },
      {
        title: "Recruitment process outsourcing",
        description:
          "Coordinate an agreed part of your recruitment process, from sourcing through candidate screening and hiring support.",
      },
    ],
    focus: {
      id: "who-we-hire",
      label: "Who we hire",
      heading: "Different roles. One clear hiring brief.",
      description:
        "Start with the work to be done and the skills it needs. We’ll use that brief to shape the candidate search.",
      items: [
        {
          title: "On-ground workforce",
          description:
            "Store, field and operational roles, with location and shift requirements defined up front.",
        },
        {
          title: "Business professionals",
          description:
            "Sales, recruitment, customer support and back-office roles aligned with your team's responsibilities.",
        },
        {
          title: "Remote teams",
          description:
            "Telecalling, recruitment, sales and operations roles suited to a coordinated remote workflow.",
        },
      ],
    },
    process: {
      heading: "Our hiring process.",
      description:
        "A shared brief keeps sourcing, selection and deployment aligned.",
      steps: [
        {
          title: "Requirement",
          description:
            "Define roles, headcount, locations, skills and the expected start date.",
        },
        {
          title: "Sourcing",
          description:
            "Identify candidates against the agreed role requirements.",
        },
        {
          title: "Screening",
          description:
            "Review suitability, experience and availability for the assignment.",
        },
        {
          title: "Selection",
          description:
            "Coordinate interviews and confirm the people moving forward.",
        },
        {
          title: "Deployment",
          description: "Prepare the selected team for onboarding and joining.",
        },
      ],
    },
    industrySlugs: [
      "fmcg",
      "retail",
      "e-commerce",
      "bfsi-fintech",
      "telecom",
      "logistics",
      "food-beverage",
      "consumer-electronics",
      "manufacturing",
      "healthcare",
      "startups",
    ],
    relatedSlugs: ["sales-force", "business-operations"],
    cta: {
      title: "What kind of team do you need?",
      description:
        "Share the roles, number of people, locations and hiring timeline. We’ll help shape the next steps.",
      label: "Tell us your workforce requirement",
    },
  },
  "sales-force": {
    heading: "Build high-performance sales teams.",
    description:
      "Build a field sales, telesales or business development team around your market. Define the territory, customer and sales activity, then put the right roles in place.",
    bestFor:
      "Businesses entering a market, expanding sales coverage or building a dedicated outreach team.",
    facts: [
      {
        label: "Sales channels",
        value: "Field, telephone & business outreach",
      },
      {
        label: "Team structure",
        value: "Executives, officers & territory teams",
      },
      { label: "Planning focus", value: "Market, territory & activity goals" },
    ],
    servicesHeading: "Sales roles across the customer journey.",
    servicesDescription:
      "Choose the team you need for prospecting, customer conversations and field execution.",
    services: [
      {
        title: "Field sales executives",
        description:
          "Support customer visits, outlet coverage and sales activity in assigned locations.",
      },
      {
        title: "Sales officers",
        description:
          "Recruit people to coordinate day-to-day sales responsibilities in your market.",
      },
      {
        title: "Business development executives",
        description:
          "Build outreach capacity for prospecting, new business conversations and follow-ups.",
      },
      {
        title: "Territory sales teams",
        description:
          "Organise sales roles around defined markets, territories and customer segments.",
      },
      {
        title: "Telesales teams",
        description:
          "Coordinate product conversations and sales follow-ups through telephone outreach.",
      },
      {
        title: "Telecalling teams",
        description:
          "Support structured calling, enquiry handling and customer follow-up activities.",
      },
      {
        title: "Lead generation teams",
        description:
          "Build a team for prospect research, outreach and lead qualification against your brief.",
      },
    ],
    focus: {
      id: "planning",
      label: "Team planning",
      heading: "Define the market before building the team.",
      description:
        "A useful sales brief explains who the team will speak to and what they need to accomplish.",
      items: [
        {
          title: "Your customers",
          description:
            "Identify the customer segments, products and conversations the team will handle.",
        },
        {
          title: "Your coverage",
          description:
            "Set the locations, territories and channels that need sales support.",
        },
        {
          title: "Your activities",
          description:
            "Agree the outreach tasks, training needs and reporting expectations for the assignment.",
        },
      ],
    },
    process: {
      heading: "From hiring to sales execution.",
      description:
        "Build the role, prepare the team and review the work against agreed activities.",
      steps: [
        {
          title: "Hire",
          description:
            "Source and screen candidates for the sales roles you need.",
        },
        {
          title: "Train",
          description:
            "Coordinate preparation around your product, customer and sales approach.",
        },
        {
          title: "Deploy",
          description:
            "Assign the team to the agreed territories and channels.",
        },
        {
          title: "Track",
          description:
            "Review activity and follow-up against the project plan.",
        },
        {
          title: "Perform",
          description:
            "Discuss progress, support needs and the next priorities.",
        },
      ],
    },
    industrySlugs: [
      "fmcg",
      "retail",
      "bfsi-fintech",
      "telecom",
      "consumer-electronics",
      "startups",
    ],
    relatedSlugs: ["workforce-solutions", "promoter-solutions"],
    cta: {
      title: "Ready to build your sales team?",
      description:
        "Tell us your market, locations, sales roles and team size. We’ll help you plan the requirement.",
      label: "Build your sales team",
    },
  },
  "telecaller-telesales-services": {
    heading: "Conversations that move customers forward.",
    description:
      "Deploy trained telecallers for telesales, lead generation, customer engagement and business conversion. We build the calling team, prepare the conversation and keep follow-ups moving.",
    bestFor:
      "Businesses that need consistent outbound outreach, responsive customer calling or a dedicated telephone sales team.",
    facts: [
      { label: "Channels", value: "Inbound, outbound & follow-up calls" },
      { label: "Team model", value: "Dedicated, campaign or project teams" },
      { label: "Focus", value: "Qualified conversations & conversion" },
    ],
    servicesHeading: "Trained calling teams for every customer conversation.",
    servicesDescription:
      "Choose a focused calling service or combine multiple workstreams into one managed telecaller and telesales team.",
    services: [
      {
        title: "Telecalling / outbound calling",
        description:
          "Reach prospects and customers with a clear script, approved offer and structured call outcome tracking.",
      },
      {
        title: "Telesales",
        description:
          "Build telephone sales capacity for product conversations, objection handling and order or application conversion.",
      },
      {
        title: "Lead generation",
        description:
          "Research, contact and qualify prospects against your customer profile and hand over actionable leads.",
      },
      {
        title: "Lead follow-up & conversion",
        description:
          "Keep warm leads moving with timely callbacks, context from earlier conversations and clear next actions.",
      },
      {
        title: "Customer calling & support",
        description:
          "Handle customer questions, service callbacks and routine support conversations with a helpful, consistent tone.",
      },
      {
        title: "Sales calling",
        description:
          "Run focused sales campaigns around a product, territory, customer segment or seasonal offer.",
      },
      {
        title: "Appointment / demo booking",
        description:
          "Qualify interest and schedule sales meetings, product demos or service appointments for your team.",
      },
      {
        title: "Verification & feedback calling",
        description:
          "Confirm information, collect structured feedback and flag records that need a human review.",
      },
      {
        title: "Inbound & outbound call handling",
        description:
          "Combine responsive inbound coverage with proactive outbound activity in one coordinated operating model.",
      },
      {
        title: "Dedicated telecaller / telesales manpower",
        description:
          "Add a trained, supervised calling team that works to your hours, tools, reporting format and campaign goals.",
      },
    ],
    focus: {
      id: "planning",
      label: "Calling programme design",
      heading: "Make every call part of a clear customer journey.",
      description:
        "The strongest calling programmes align the audience, the conversation and the follow-up before the first dial.",
      items: [
        {
          title: "Audience & offer",
          description:
            "Define who the team will call, why the conversation matters and what a successful outcome looks like.",
        },
        {
          title: "Script & training",
          description:
            "Prepare the team with product context, call guidance, objection handling and the right escalation path.",
        },
        {
          title: "Follow-up & reporting",
          description:
            "Set outcome codes, callback rules and reporting checkpoints so the team can improve conversion over time.",
        },
      ],
    },
    process: {
      heading: "From brief to a calling team that delivers.",
      description:
        "A clear operating brief gives the team the context and support needed to have better conversations.",
      steps: [
        {
          title: "Brief",
          description:
            "Confirm the audience, offer, call volume, working hours and success measures.",
        },
        {
          title: "Train",
          description:
            "Prepare the team on the product, script, CRM workflow and quality expectations.",
        },
        {
          title: "Call",
          description:
            "Start inbound, outbound or mixed calling with supervised early conversations.",
        },
        {
          title: "Follow up",
          description:
            "Prioritise callbacks, appointments and qualified opportunities against the agreed rules.",
        },
        {
          title: "Review",
          description:
            "Review call outcomes, quality signals and conversion trends with your team.",
        },
      ],
    },
    industrySlugs: [
      "e-commerce",
      "bfsi-fintech",
      "telecom",
      "healthcare",
      "retail",
      "startups",
    ],
    relatedSlugs: ["sales-force", "business-operations", "workforce-solutions"],
    cta: {
      title: "Need a trained calling team?",
      description:
        "Share your audience, offer, call volume and conversion goal. We’ll help you plan the right telecaller or telesales engagement.",
      label: "Plan your calling team",
    },
  },
  "promoter-solutions": {
    heading: "Promoters for every brand and campaign.",
    description:
      "Put people behind your product in stores, at events and across campaigns. Build a promoter team around the audience, venue and duration of your activation.",
    bestFor:
      "Brands planning product demonstrations, in-store promotions or an event campaign.",
    facts: [
      { label: "Settings", value: "Stores, events & campaign venues" },
      {
        label: "Engagement",
        value: "Daily, weekly, monthly or campaign-based",
      },
      {
        label: "Team focus",
        value: "Product knowledge & customer interaction",
      },
    ],
    servicesHeading: "The right people to represent your brand.",
    servicesDescription:
      "Choose the promoter role that matches your product and the kind of customer interaction you need.",
    services: [
      {
        title: "Sales promoters",
        description:
          "Support product conversations and purchase decisions at the point of sale.",
      },
      {
        title: "Brand promoters",
        description:
          "Introduce your brand and communicate its proposition to the intended audience.",
      },
      {
        title: "Product demonstrators",
        description:
          "Explain product features and demonstrate how the product works.",
      },
      {
        title: "Brand ambassadors",
        description:
          "Represent your brand with a consistent message across agreed customer interactions.",
      },
      {
        title: "Event promoters",
        description:
          "Support visitor engagement, product introductions and promotional activities at events.",
      },
      {
        title: "In-store promoters",
        description:
          "Assist shoppers with product information and demonstrations inside retail stores.",
      },
    ],
    focus: {
      id: "engagement-options",
      label: "Engagement options",
      heading: "A team for the duration you need.",
      description:
        "Match the engagement to your store schedule, promotion window or campaign calendar.",
      items: [
        {
          title: "Daily",
          description:
            "Plan promoter support for a specific day, event or short activity.",
        },
        {
          title: "Weekly",
          description:
            "Cover a week of promotions or a defined run of store activities.",
        },
        {
          title: "Monthly",
          description:
            "Build continuity for a longer in-store or promotional requirement.",
        },
        {
          title: "Campaign-based",
          description:
            "Coordinate the team around the start, end and scope of a campaign.",
        },
      ],
    },
    process: {
      heading: "From campaign brief to customer conversations.",
      description:
        "Prepare the role, message and venue requirements before the team is deployed.",
      steps: [
        {
          title: "Brief",
          description:
            "Define your product, audience, locations and campaign dates.",
        },
        {
          title: "Select",
          description: "Source and screen promoters suited to the assignment.",
        },
        {
          title: "Prepare",
          description:
            "Coordinate product information and the customer interaction brief.",
        },
        {
          title: "Deploy",
          description:
            "Assign the team to the agreed stores or campaign venues.",
        },
        {
          title: "Review",
          description:
            "Review campaign activity and the updates agreed in your brief.",
        },
      ],
    },
    industrySlugs: [
      "fmcg",
      "retail",
      "food-beverage",
      "consumer-electronics",
      "telecom",
    ],
    relatedSlugs: ["retail-execution", "brand-activation"],
    cta: {
      title: "Put the right people behind your next promotion.",
      description:
        "Share your product, venues, dates and promoter requirement. We’ll help you plan the team.",
      label: "Hire promoters",
    },
  },
  "retail-execution": {
    heading: "Improve retail execution across every store.",
    description:
      "Support what happens on the shelf and the shop floor. Coordinate merchandising, store checks and market observations around the standards your brand needs.",
    bestFor:
      "Businesses that need store-level execution, merchandising support or a clearer view of retail conditions.",
    facts: [
      { label: "Work setting", value: "Stores, outlets & retail markets" },
      { label: "Activities", value: "Merchandising, audits & market checks" },
      {
        label: "Planning focus",
        value: "Store list, checklist & reporting scope",
      },
    ],
    servicesHeading: "Practical support for retail execution.",
    servicesDescription:
      "Define the stores and the checks that matter, then choose the services your programme needs.",
    services: [
      {
        title: "Merchandising",
        description:
          "Support the presentation and placement of your products against an agreed store brief.",
      },
      {
        title: "Store audits",
        description:
          "Review store conditions and agreed operational or brand standards using a defined checklist.",
      },
      {
        title: "Retail audits",
        description:
          "Collect structured observations about retail execution across selected outlets.",
      },
      {
        title: "Mystery audits",
        description:
          "Assess agreed aspects of the customer experience through planned store visits.",
      },
      {
        title: "Product availability checks",
        description:
          "Check whether specified products are available at the outlets in your programme.",
      },
      {
        title: "Shelf management",
        description:
          "Support agreed product arrangement, shelf presentation and upkeep activities.",
      },
      {
        title: "Visual merchandising",
        description:
          "Coordinate displays and product presentation against your visual merchandising brief.",
      },
      {
        title: "Competitor analysis",
        description:
          "Collect agreed market observations on competing products, presentation and retail activity.",
      },
      {
        title: "Market surveys",
        description:
          "Gather responses and observations using the questions and locations defined in your brief.",
      },
    ],
    focus: {
      id: "planning",
      label: "Execution planning",
      heading: "Make the store brief specific.",
      description:
        "Clear coverage and checklists make observations easier to review and act on.",
      items: [
        {
          title: "Store coverage",
          description:
            "List the outlets, locations and visit schedule that your programme should cover.",
        },
        {
          title: "Execution checklist",
          description:
            "Agree the products, display standards and observations that each visit should address.",
        },
        {
          title: "Reporting scope",
          description:
            "Define the records, summaries and update frequency you need from the work.",
        },
      ],
    },
    process: {
      heading: "A clear plan for every store visit.",
      description:
        "Start with the checklist and build the field activity around it.",
      steps: [
        {
          title: "Scope",
          description:
            "Confirm stores, services, coverage and the programme schedule.",
        },
        {
          title: "Prepare",
          description: "Agree the checklist and brief the execution team.",
        },
        {
          title: "Execute",
          description:
            "Carry out the assigned merchandising, audits or checks.",
        },
        {
          title: "Review",
          description:
            "Review observations and discuss the next actions with your team.",
        },
      ],
    },
    industrySlugs: [
      "fmcg",
      "retail",
      "food-beverage",
      "consumer-electronics",
      "telecom",
    ],
    relatedSlugs: ["promoter-solutions", "sales-force"],
    cta: {
      title: "What needs to happen in your stores?",
      description:
        "Share your outlet locations, execution needs and programme schedule. We’ll help define the field requirement.",
      label: "Improve your retail execution",
    },
  },
  "brand-activation": {
    heading: "Take your brand to the market.",
    description:
      "Bring your brand into the places your audience visits. Coordinate branding and advertising, sticker deployment, flyer distribution, sampling and promotional campaigns with one execution team.",
    bestFor:
      "Brands planning a product introduction, local campaign or direct consumer engagement programme.",
    facts: [
      { label: "Channels", value: "On-ground campaigns & events" },
      { label: "Venues", value: "Malls, colleges & campaign locations" },
      { label: "Team focus", value: "Sampling, demonstrations & engagement" },
    ],
    servicesHeading: "Campaign support, where your audience is.",
    servicesDescription:
      "Build the activation around your audience, venue and the experience you want people to have.",
    services: [
      ...brandingServices,
      {
        title: "Product sampling",
        description:
          "Organise sampling activities that introduce your product to the intended audience.",
      },
      {
        title: "Product demonstration",
        description:
          "Help customers understand your product through guided, practical demonstrations.",
      },
      {
        title: "Mall activation",
        description:
          "Plan promotional teams and customer engagement activity for agreed mall locations.",
      },
      {
        title: "College activation",
        description:
          "Coordinate campus-focused promotions around the audience and campaign brief.",
      },
      {
        title: "Roadshows",
        description:
          "Support a series of on-ground promotional activities across selected locations.",
      },
      {
        title: "Events",
        description:
          "Arrange people and promotional support for your event's defined activities.",
      },
      {
        title: "Consumer engagement",
        description:
          "Build direct product and brand conversations into the campaign experience.",
      },
    ],
    focus: {
      id: "planning",
      label: "Campaign planning",
      heading: "Give the campaign a clear starting point.",
      description:
        "An effective activation brief connects the audience, the place and the activity.",
      items: [
        {
          title: "Audience & message",
          description:
            "Define who you want to reach and what they should understand about your product.",
        },
        {
          title: "Venues & dates",
          description:
            "Identify the campaign locations, schedule and venue arrangements required.",
        },
        {
          title: "People & activities",
          description:
            "Agree promoter roles, product preparation and the activities to be delivered.",
        },
      ],
    },
    process: {
      heading: "From campaign idea to on-ground activity.",
      description:
        "Turn the brief into a practical plan for the team and venue.",
      steps: [
        {
          title: "Brief",
          description:
            "Confirm your audience, message, venues and campaign goals.",
        },
        {
          title: "Plan",
          description:
            "Agree the activity, team requirement and delivery schedule.",
        },
        {
          title: "Activate",
          description:
            "Prepare and deploy the people carrying out the campaign.",
        },
        {
          title: "Review",
          description:
            "Review activity updates and discuss the campaign's next steps.",
        },
      ],
    },
    industrySlugs: [
      "fmcg",
      "retail",
      "food-beverage",
      "consumer-electronics",
      "startups",
    ],
    relatedSlugs: ["promoter-solutions", "gig-workforce"],
    cta: {
      title: "Tell us about your next campaign.",
      description:
        "Share your product, audience, locations and dates. We’ll help shape the people and execution requirement.",
      label: "Launch your campaign",
    },
  },
  "business-operations": {
    heading: "Build your business operations team.",
    description:
      "Create the capacity your day-to-day work needs. Build teams for outreach, customer support, data work and back-office operations, including roles suited to remote delivery.",
    bestFor:
      "Businesses building support capacity, running an outreach programme or setting up remote operations.",
    facts: [
      { label: "Functions", value: "Outreach, support & back-office work" },
      { label: "Team options", value: "Dedicated roles & remote teams" },
      {
        label: "Planning focus",
        value: "Workflow, workload & responsibilities",
      },
    ],
    servicesHeading: "People for the work behind your business.",
    servicesDescription:
      "Choose the functions you need and define how the team will fit into your workflow.",
    services: [
      {
        title: "Content moderation",
        description: "Review content against your approved guidelines, flag exceptions and coordinate the agreed escalation workflow.",
      },
      {
        title: "Onboarding & KYC support",
        description: "Help collect onboarding information, coordinate required documents and follow up on incomplete submissions.",
      },
      {
        title: "Hyperlocal business operations",
        description: "Coordinate local outreach, field follow-ups and operational tasks around your locations and business needs.",
      },
      {
        title: "Lead generation",
        description:
          "Support prospect research, outreach and lead qualification against your requirements.",
      },
      {
        title: "Telecalling",
        description:
          "Build a team for structured calling, enquiry handling and scheduled follow-ups.",
      },
      {
        title: "Telesales",
        description:
          "Support sales conversations and product follow-ups through telephone outreach.",
      },
      {
        title: "Customer support",
        description:
          "Recruit people to handle agreed customer queries and support workflows.",
      },
      {
        title: "Data collection",
        description:
          "Gather the records, responses or information defined in your operational brief.",
      },
      {
        title: "Data verification",
        description:
          "Review submitted information against the checks and criteria your process requires.",
      },
      {
        title: "Back office support",
        description:
          "Build capacity for administrative tasks, record handling and routine operations.",
      },
      {
        title: "Remote recruitment teams",
        description:
          "Coordinate remote roles for sourcing, screening and recruitment follow-ups.",
      },
      {
        title: "Remote sales teams",
        description:
          "Build remote capacity for prospecting, sales conversations and customer follow-up.",
      },
    ],
    focus: {
      id: "planning",
      label: "Workflow planning",
      heading: "Fit the team into your workflow.",
      description:
        "Define the responsibilities and hand-offs before you add operational capacity.",
      items: [
        {
          title: "Work scope",
          description:
            "Describe the tasks, expected workload and responsibilities the team will own.",
        },
        {
          title: "Ways of working",
          description:
            "Agree working hours, location needs and the tools or information required for the role.",
        },
        {
          title: "Review & hand-offs",
          description:
            "Set the update frequency, quality checks and escalation points for the work.",
        },
      ],
    },
    process: {
      heading: "From work scope to a coordinated team.",
      description:
        "Build the operating brief first, then prepare the people who will carry it out.",
      steps: [
        {
          title: "Scope",
          description: "Define the function, workload and team requirement.",
        },
        {
          title: "Hire",
          description:
            "Source and screen candidates for the agreed responsibilities.",
        },
        {
          title: "Onboard",
          description:
            "Coordinate the workflow, task instructions and required preparation.",
        },
        {
          title: "Coordinate",
          description:
            "Support the team's day-to-day work and agreed hand-offs.",
        },
        {
          title: "Review",
          description:
            "Review activity, quality checks and changing workload needs.",
        },
      ],
    },
    industrySlugs: [
      "e-commerce",
      "bfsi-fintech",
      "telecom",
      "logistics",
      "healthcare",
      "startups",
    ],
    relatedSlugs: ["workforce-solutions", "sales-force"],
    cta: {
      title: "Where does your business need more capacity?",
      description:
        "Tell us the function, workload, team size and working arrangement. We’ll help you plan the roles.",
      label: "Build your operations team",
    },
  },
  "gig-workforce": {
    heading: "Workforce on demand.",
    description:
      "Build a team around a short assignment, seasonal requirement or project. Define the work, location and duration, then plan the workforce your assignment needs.",
    bestFor:
      "Businesses planning short activities, seasonal peaks or work with a defined start and finish.",
    facts: [
      { label: "Duration", value: "A day, a week, a month or a project" },
      { label: "Role types", value: "Promoters, field, sales & operations" },
      { label: "Planning focus", value: "Tasks, locations & assignment dates" },
    ],
    servicesHeading: "Flexible roles for a defined assignment.",
    servicesDescription:
      "Choose the people you need for the work, then set the scope and engagement period.",
    services: [
      {
        title: "Promoters",
        description:
          "Arrange people for product introductions, demonstrations and short promotional activities.",
      },
      {
        title: "Sales executives",
        description:
          "Support a defined sales activity, outreach requirement or market assignment.",
      },
      {
        title: "Field executives",
        description:
          "Build a team for on-ground tasks, visits and location-based assignments.",
      },
      {
        title: "Telecallers",
        description:
          "Add calling capacity for a campaign, outreach run or follow-up requirement.",
      },
      {
        title: "Recruiters",
        description:
          "Support sourcing, screening and recruitment coordination for a defined hiring requirement.",
      },
      {
        title: "Operations staff",
        description:
          "Add people for project work, seasonal workload and agreed operational tasks.",
      },
    ],
    focus: {
      id: "engagement-options",
      label: "Engagement options",
      heading: "Start with how long you need the team.",
      description:
        "Set the assignment dates and workload so the engagement can be planned around them.",
      items: [
        {
          title: "One day",
          description:
            "Staff a defined activity, visit programme or single-day event.",
        },
        {
          title: "One week",
          description:
            "Cover a short run of tasks or a week-long campaign requirement.",
        },
        {
          title: "One month",
          description:
            "Plan workforce support for a month of project or campaign work.",
        },
        {
          title: "Seasonal work",
          description:
            "Prepare additional capacity for a defined period of seasonal demand.",
        },
        {
          title: "Project-based work",
          description:
            "Build the engagement around the scope and schedule of a specific project.",
        },
      ],
    },
    process: {
      heading: "A clear brief for a flexible team.",
      description:
        "A short assignment still needs clear roles, preparation and reporting expectations.",
      steps: [
        {
          title: "Define",
          description:
            "Share the tasks, headcount, locations and assignment dates.",
        },
        {
          title: "Match",
          description:
            "Source candidates and review their suitability and availability.",
        },
        {
          title: "Deploy",
          description:
            "Brief the selected people and coordinate the assignment start.",
        },
        {
          title: "Review",
          description:
            "Review completed activity and any continuing workforce needs.",
        },
      ],
    },
    industrySlugs: [
      "retail",
      "e-commerce",
      "fmcg",
      "logistics",
      "food-beverage",
      "startups",
    ],
    relatedSlugs: ["promoter-solutions", "business-operations"],
    cta: {
      title: "What work needs a team?",
      description:
        "Share the assignment, number of people, location and dates. We’ll help you plan the requirement.",
      label: "Find workforce now",
    },
  },
  "website-application-development": {
    heading: "Website & application development built around your business.",
    description:
      "Turn an idea or business requirement into a responsive website, web platform or mobile application. We bring planning, UX/UI, engineering, integrations, testing and launch into one practical delivery flow.",
    bestFor:
      "Businesses that need a new website, customer or partner portal, internal web platform, mobile application or API-connected digital product.",
    facts: [
      { label: "Builds", value: "Websites, web apps, mobile apps & APIs" },
      { label: "Delivery", value: "UX/UI, engineering, testing & launch" },
      { label: "Engagement", value: "New builds, redesigns & integrations" },
    ],
    servicesHeading: "Digital products designed to solve real business needs.",
    servicesDescription:
      "Start with the outcome you need, then choose the right mix of design, frontend, backend, mobile and integration work.",
    services: [
      {
        title: "Business websites",
        description:
          "Build responsive, fast and professional websites for company presence, services, lead generation and customer communication.",
      },
      {
        title: "Web applications & portals",
        description:
          "Create secure browser-based platforms for customers, partners, teams, workflows, dashboards and operational processes.",
      },
      {
        title: "Mobile application development",
        description:
          "Build practical mobile experiences for Android and iOS around the features, users and workflows your business needs.",
      },
      {
        title: "UI/UX design",
        description:
          "Turn requirements into clear user journeys, wireframes and interfaces that are easy to understand and use.",
      },
      {
        title: "Backend & API development",
        description:
          "Build the server-side logic, databases and APIs that power websites, applications and connected business systems.",
      },
      {
        title: "Third-party integrations",
        description:
          "Connect payments, maps, email, authentication, analytics, cloud services and other APIs required by the product.",
      },
      {
        title: "Redesign, optimisation & support",
        description:
          "Improve an existing digital product with better usability, responsive behaviour, performance and maintainable implementation.",
      },
    ],
    focus: {
      id: "planning",
      label: "Product planning",
      heading: "Build the right product before adding more features.",
      description:
        "A useful digital project starts with the users, business goal and core workflow. We shape the implementation around those priorities rather than adding technology for its own sake.",
      items: [
        {
          title: "Business outcome",
          description:
            "Define what the website or application should help the business achieve and how success will be judged.",
        },
        {
          title: "Users & journeys",
          description:
            "Identify the people using the product, the actions they need to complete and the information they need along the way.",
        },
        {
          title: "Technology & integrations",
          description:
            "Choose an architecture that fits the product today while keeping APIs, integrations and future growth practical.",
        },
      ],
    },
    process: {
      heading: "From idea to a production-ready digital product.",
      description:
        "Each stage produces something reviewable before the project moves forward.",
      steps: [
        {
          title: "Discover",
          description:
            "Understand the business goal, users, features, integrations and project constraints.",
        },
        {
          title: "Design",
          description:
            "Shape the information architecture, user journeys and interface before full development.",
        },
        {
          title: "Build",
          description:
            "Develop the frontend, backend, mobile experience and integrations required by the agreed scope.",
        },
        {
          title: "Test",
          description:
            "Review functionality, responsive behaviour, performance and important user flows before release.",
        },
        {
          title: "Launch",
          description:
            "Deploy the product, verify the production setup and plan the next improvements or support requirements.",
        },
      ],
    },
    industrySlugs: [
      "fmcg",
      "retail",
      "e-commerce",
      "bfsi-fintech",
      "telecom",
      "logistics",
      "food-beverage",
      "consumer-electronics",
      "manufacturing",
      "healthcare",
      "startups",
    ],
    relatedSlugs: ["business-operations", "verification-services", "brand-activation"],
    cta: {
      title: "Have a website or application idea?",
      description:
        "Tell us what you want to build, who will use it, the features you have in mind and any timeline you are working toward. We’ll review the requirement and discuss the right next step.",
      label: "Discuss your digital project",
      leadPath: "contact",
    },
  },
} as const satisfies Record<SolutionSlug, SolutionDetailContent>;
