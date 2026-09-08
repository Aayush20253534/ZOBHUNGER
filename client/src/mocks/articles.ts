import type { Article } from "@/types/article.types";

function article(
  input: Omit<Article, "readingMinutes" | "isPublished" | "isSample">,
): Article {
  const words = [
    input.excerpt,
    input.takeaway,
    ...input.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.points ?? []),
    ]),
  ]
    .join(" ")
    .split(/\s+/).length;

  return {
    ...input,
    readingMinutes: Math.max(4, Math.ceil(words / 190)),
    isPublished: true,
    isSample: false,
  };
}

/**
 * Curated, publishable editorial content for the public ZOBHUNGER website.
 * The articles are deliberately practical and avoid invented client metrics.
 */
export const mockArticles: Article[] = [
  article({
    slug: "build-a-field-workforce-that-performs-from-day-one",
    title: "How to build a field workforce that performs from day one",
    category: "Hiring Trends",
    excerpt:
      "A practical framework for turning a headcount request into a deployment-ready team with clear roles, screening signals, onboarding and ownership.",
    takeaway:
      "The fastest hiring process is not the one that produces the most candidates. It is the one that removes ambiguity before sourcing begins.",
    sections: [
      {
        id: "start-with-outcomes",
        heading: "Start with the outcome, not the designation",
        paragraphs: [
          "Field hiring often begins with a title: promoter, field executive, sales associate, merchandiser or recruiter. The problem is that the same title can describe completely different work across two companies. A field executive may spend one assignment onboarding merchants and another visiting outlets, collecting evidence and closing compliance gaps.",
          "Before discussing headcount, write down what a successful working day should produce. Define the people the employee will interact with, the locations they will cover, the actions they must complete, the proof that confirms completion and the person who receives that proof. That single exercise makes the role easier to source, screen and manage.",
        ],
        points: [
          "Define the task before defining the title.",
          "Separate must-have skills from skills that can be trained.",
          "Specify territory, travel, language and shift expectations early.",
          "Make completion measurable through an observable output or verified action.",
        ],
      },
      {
        id: "screen-for-the-real-job",
        heading: "Screen for the real job, not an idealised résumé",
        paragraphs: [
          "A candidate can look perfect on paper and still struggle with the operating reality of the role. Screening should therefore test the situations the person will actually face. For a field-sales role, that may mean explaining a product to a hesitant retailer. For a retail-audit role, it may mean following a checklist precisely and submitting usable photo evidence.",
          "Use a short, repeatable scorecard. Every interviewer should assess the same capabilities so hiring decisions are comparable instead of depending on who happened to conduct the call. For high-volume roles, this consistency matters more than elaborate interview rounds.",
        ],
      },
      {
        id: "design-the-first-week",
        heading: "Design the first week before the person joins",
        paragraphs: [
          "Joining is not deployment. A person is deployment-ready only when they understand the task, the product or brand context, the reporting flow and the escalation path. The first week should therefore be designed like an operating sequence rather than an HR formality.",
          "A simple structure works well: role briefing, product or project training, tool access, supervised first activity, feedback and independent deployment. This reduces the common gap between people being marked as joined and the business actually receiving productive output.",
        ],
        points: [
          "Give one clear owner for onboarding questions.",
          "Confirm app, dashboard or reporting access before field deployment.",
          "Use a supervised first task to catch misunderstandings early.",
          "Review quality, not only attendance, during the first few days.",
        ],
      },
      {
        id: "plan-for-replacement",
        heading: "Treat replacement capacity as part of workforce planning",
        paragraphs: [
          "Distributed and high-volume work naturally faces attrition, absenteeism and location-specific shortages. Planning only for the ideal headcount makes the operation fragile. Build a small replacement pipeline and define how quickly an inactive position should be refilled.",
          "The objective is not to keep unnecessary people waiting. It is to maintain visibility of qualified candidates and local sourcing channels so a single dropout does not create a week-long gap in execution.",
        ],
      },
      {
        id: "measure-the-hiring-system",
        heading: "Measure the hiring system through deployment quality",
        paragraphs: [
          "Time-to-hire matters, but it should not be the only number. A stronger operating view connects sourcing with joining, activation and early performance. Track where candidates drop out, which locations are consistently difficult, how many hires reach productive deployment and where replacement demand is highest.",
          "When those signals are reviewed together, recruitment becomes part of execution rather than a separate activity that ends on the joining date.",
        ],
      },
    ],
  }),
  article({
    slug: "operating-system-for-distributed-workforce-management",
    title: "The operating system for managing distributed teams across cities",
    category: "Workforce Management",
    excerpt:
      "How to coordinate attendance, tasks, evidence, escalations and performance when the workforce is spread across stores, territories and cities.",
    takeaway:
      "Distributed teams become manageable when every recurring activity has a clear owner, a visible status and an agreed escalation path.",
    sections: [
      {
        id: "one-operating-view",
        heading: "Create one operating view of the workforce",
        paragraphs: [
          "A distributed team becomes difficult to manage when attendance lives in one sheet, task status in another, manager updates in chat threads and client reporting in a separate presentation. The problem is not simply too much data. It is that nobody sees the same version of the operation.",
          "Create one operating view that connects who is deployed, where they are working, what they were assigned, what has been completed and what needs intervention. The underlying tools can differ, but the management view should answer those questions quickly.",
        ],
      },
      {
        id: "separate-presence-from-productivity",
        heading: "Separate attendance from productivity",
        paragraphs: [
          "Presence tells you whether someone reported for work. Productivity tells you whether the required activity happened. Both matter, but they should not be confused. A person can be present at an outlet and still miss the audit, sale, installation or activation that created the business value.",
          "Define the smallest useful proof of work for each assignment. It could be a verified visit, completed form, activation, qualified lead, photo set, merchant onboarding stage or approved checklist. This makes reviews more objective and helps managers focus on exceptions.",
        ],
        points: [
          "Attendance: was the person available where expected?",
          "Activity: was the assigned task attempted or completed?",
          "Quality: did the work meet the required standard?",
          "Outcome: did the activity create the intended business result?",
        ],
      },
      {
        id: "manage-by-exception",
        heading: "Manage by exception instead of chasing every update",
        paragraphs: [
          "Managers should not spend the day asking hundreds of people whether work is on track. A better system highlights deviations: an uncovered location, repeated failed verification, unusually low output, a missing report or a task that has remained open beyond its expected window.",
          "Exception-based management protects attention. Routine work continues without constant intervention while managers spend time on the locations and people that actually need help.",
        ],
      },
      {
        id: "make-escalations-explicit",
        heading: "Make escalation rules explicit",
        paragraphs: [
          "Every field operation encounters issues: store access problems, absent staff, customer objections, stock shortages, device failures or changes in local conditions. The response becomes slow when the team does not know what qualifies as an escalation or who owns the next action.",
          "Define a small escalation ladder with severity, owner and expected response. Keep it simple enough that field staff can use it under pressure. The objective is not bureaucracy. It is preventing important problems from disappearing inside chat messages.",
        ],
      },
      {
        id: "review-the-system",
        heading: "Use weekly reviews to improve the system, not just the score",
        paragraphs: [
          "A weekly review should answer more than whether targets were met. Look for recurring causes: a territory that is consistently understaffed, a task that repeatedly fails quality checks, a training gap or a reporting step that adds work without helping a decision.",
          "The strongest distributed operations improve the process as they scale. They do not simply add more coordinators to compensate for unclear workflows.",
        ],
      },
    ],
  }),
  article({
    slug: "design-a-sales-hiring-engine-for-market-expansion",
    title: "Designing a sales hiring engine for new-market expansion",
    category: "Sales Hiring",
    excerpt:
      "A field-ready approach to territory design, candidate screening, ramp-up and sales-team deployment when a business enters new markets.",
    takeaway:
      "Market expansion becomes easier when territory design, hiring and sales execution are planned as one system rather than three separate projects.",
    sections: [
      {
        id: "design-territories-first",
        heading: "Design the territory before hiring the team",
        paragraphs: [
          "Hiring a sales team before deciding how the market will be covered creates expensive confusion. Start with the customer universe. Identify the types of outlets or accounts, expected travel, language needs, density of opportunities and the amount of follow-up each sale requires.",
          "This tells you whether the territory needs one generalist, multiple executives, a telesales layer or a mix of field and inside sales. It also makes the job proposition more accurate because candidates understand the actual working environment.",
        ],
      },
      {
        id: "hire-for-conversation",
        heading: "Hire for the customer conversation",
        paragraphs: [
          "Sales hiring should test whether the candidate can understand a customer problem, explain value clearly and move the conversation to a useful next step. Previous industry experience can help, but it should not automatically outweigh communication quality, learning ability and local market familiarity.",
          "Use realistic role plays. Ask candidates to explain an unfamiliar product after a short briefing, respond to a common objection or plan a day in a territory. These exercises reveal much more than generic questions about strengths and weaknesses.",
        ],
        points: [
          "Customer communication and listening",
          "Territory discipline and follow-up habits",
          "Ability to learn product and pricing details",
          "Comfort with reporting and using digital tools",
        ],
      },
      {
        id: "build-a-ramp-plan",
        heading: "Build a 30-day ramp plan",
        paragraphs: [
          "A new sales hire should know what good looks like before the first independent customer visit. Break the first month into product learning, assisted conversations, territory familiarisation, independent activity and review.",
          "Early targets should include controllable activities as well as outcomes. A new executive cannot guarantee a conversion on day three, but they can demonstrate preparation, complete planned visits and maintain accurate follow-up records.",
        ],
      },
      {
        id: "track-leading-signals",
        heading: "Track leading signals, not only final sales",
        paragraphs: [
          "Revenue is essential, but it is a lagging indicator. During a market launch, leading signals reveal where the engine is failing: coverage, conversations, qualified opportunities, demonstrations, follow-ups, activations or repeat orders depending on the model.",
          "When those stages are visible, managers can distinguish a weak territory from a training issue or a follow-up problem. That makes coaching far more specific.",
        ],
      },
      {
        id: "scale-what-works",
        heading: "Scale the sales motion only after it becomes repeatable",
        paragraphs: [
          "The temptation in expansion is to add people quickly. A better sequence is to validate the sales motion in a few territories, document what works and then replicate it. The hiring engine should scale a proven operating model, not multiply unresolved problems.",
          "Once the territory structure, screening scorecard, onboarding plan and reporting rhythm are stable, adding new cities becomes considerably more predictable.",
        ],
      },
    ],
  }),
  article({
    slug: "gig-workforce-at-scale-speed-quality-control",
    title: "Gig workforce at scale: balancing speed, quality and control",
    category: "Gig Economy",
    excerpt:
      "How businesses can mobilise flexible workers quickly without losing visibility, verification standards or accountability in the field.",
    takeaway:
      "Flexibility works best when the task is standardised, proof of completion is clear and exceptions are easy to identify.",
    sections: [
      {
        id: "design-for-short-engagements",
        heading: "Design the work for short engagements",
        paragraphs: [
          "Gig models fail when a complex full-time role is simply compressed into a short assignment. Flexible work needs a precise task boundary. The worker should understand what must be done, where it must happen, what evidence is required and what qualifies as completion.",
          "The more distributed the workforce, the more important this clarity becomes. A clear task can be taught quickly, checked consistently and repeated across locations without relying on constant supervision.",
        ],
      },
      {
        id: "verify-before-deploy",
        heading: "Verify before deployment",
        paragraphs: [
          "Speed should not mean skipping basic verification. Match verification to the risk and nature of the assignment: identity and document checks, role eligibility, vehicle or device requirements, language capability or location availability where relevant.",
          "Keep the process proportionate. The objective is to prevent avoidable deployment failures, not create a paperwork marathon that defeats the purpose of flexible staffing.",
        ],
      },
      {
        id: "make-quality-observable",
        heading: "Make quality observable in the workflow",
        paragraphs: [
          "A completion button is not always proof that the task was completed correctly. Build quality signals into the assignment. Depending on the work, that may include geo-tagged evidence, photos, timestamps, form validation, supervisor review, activation status or customer confirmation.",
          "Good verification should answer a simple question: can a reviewer understand what happened without calling the worker for an explanation every time?",
        ],
        points: [
          "Use only the evidence needed for the task.",
          "Automate simple validation where possible.",
          "Route uncertain cases for human review.",
          "Keep a clear correction path instead of simply rejecting work.",
        ],
      },
      {
        id: "protect-worker-experience",
        heading: "Protect the worker experience while tightening control",
        paragraphs: [
          "Control systems become counterproductive when instructions change without notice, approvals are opaque or workers cannot understand why an activity was rejected. Good operations explain expectations before work begins and provide a clear route for support.",
          "Worker experience matters operationally because confusing processes create drop-offs, repeated mistakes and replacement demand. A simpler system is usually easier to scale for both the business and the workforce.",
        ],
      },
      {
        id: "use-flexibility-intentionally",
        heading: "Use flexibility where it creates an advantage",
        paragraphs: [
          "Gig staffing is particularly useful for seasonal peaks, city launches, audits, short campaigns, sampling, data collection and other work where demand changes by location or period. It is less useful when the role depends on deep institutional knowledge or long-term relationship ownership.",
          "The strongest model chooses flexible staffing because it fits the work, not merely because the word gig sounds modern in a strategy meeting.",
        ],
      },
    ],
  }),
  article({
    slug: "retail-execution-that-reaches-the-shelf",
    title: "Retail execution that actually reaches the shelf",
    category: "Retail Execution",
    excerpt:
      "A store-level playbook for turning merchandising plans into verified availability, visibility, compliance and follow-up across outlets.",
    takeaway:
      "A retail plan creates value only when store-level execution is visible, verifiable and connected to a corrective action.",
    sections: [
      {
        id: "translate-strategy-to-store",
        heading: "Translate the strategy into observable store conditions",
        paragraphs: [
          "Retail strategies often use broad goals such as improve visibility, strengthen availability or execute the promotion. Field teams need something more concrete. Translate each goal into conditions that can be observed during a visit: SKU presence, shelf position, display placement, pricing, promotion material, stock status or planogram compliance.",
          "The checklist should reflect the business question. If the objective is availability, do not bury the team under twenty unrelated checks. If the objective is a launch display, make the required placement and evidence unmistakable.",
        ],
      },
      {
        id: "design-the-visit",
        heading: "Design the store visit as a workflow",
        paragraphs: [
          "A good visit has a sequence: confirm outlet, inspect the required conditions, perform the agreed action, capture evidence and raise exceptions. This reduces variation between field executives and makes data easier to compare across locations.",
          "Where possible, pre-populate outlet and campaign information so the field team spends time executing rather than typing information the business already knows.",
        ],
      },
      {
        id: "capture-evidence",
        heading: "Capture evidence that can be reviewed quickly",
        paragraphs: [
          "Photo collection is useful only when the image proves something. Define the angle, subject and context required. Pair visual evidence with structured fields so reviewers can identify the outlet, task and issue without deciphering a gallery of random photographs.",
          "GPS and timestamps can strengthen verification, but they should support the operating process rather than become the entire process. Quality still depends on whether the right activity happened.",
        ],
        points: [
          "Outlet and visit identification",
          "Before/after evidence where an intervention occurred",
          "Structured exception reason when a task cannot be completed",
          "Clear reviewer ownership for disputed or low-quality submissions",
        ],
      },
      {
        id: "close-the-loop",
        heading: "Close the loop on non-compliance",
        paragraphs: [
          "An audit that produces a dashboard but no action is just expensive observation. Define what happens when stock is missing, a display is absent, material is damaged or a store cannot support the planned activity.",
          "Some issues belong to the field executive, some to a distributor, store contact or central team. Routing the issue to the right owner is what converts field intelligence into better execution.",
        ],
      },
      {
        id: "review-by-pattern",
        heading: "Review patterns across outlets, not only individual visits",
        paragraphs: [
          "Once store-level data becomes consistent, patterns start to matter more than isolated exceptions. Compare regions, outlet types, campaigns and time periods. Repeated non-compliance may point to supply, training, material design or commercial issues rather than weak field execution.",
          "The goal is a learning loop: plan, execute, verify, correct and improve the next cycle.",
        ],
      },
    ],
  }),
  article({
    slug: "trade-marketing-from-brief-to-storefront",
    title: "From campaign brief to storefront: a practical trade marketing playbook",
    category: "Trade Marketing",
    excerpt:
      "Plan promoters, sampling, POSM and retail activations as one coordinated execution system instead of a collection of disconnected field tasks.",
    takeaway:
      "Trade marketing becomes measurable when every activation links a campaign objective to a location, task, proof and follow-up action.",
    sections: [
      {
        id: "define-campaign-job",
        heading: "Define the job the campaign must do",
        paragraphs: [
          "A sampling campaign, a product demonstration and a visibility drive may all happen inside stores, but they are designed to create different outcomes. Start by defining the behaviour the campaign should influence: trial, awareness, lead capture, conversion, visibility or retailer participation.",
          "That decision shapes everything downstream, including promoter briefing, outlet selection, materials, data capture and the metrics used in the final review.",
        ],
      },
      {
        id: "match-people-to-format",
        heading: "Match the field team to the activation format",
        paragraphs: [
          "A promoter explaining a technical product needs a different profile from a sampling executive running a high-footfall consumer interaction. Define the communication level, language, product knowledge and physical environment before sourcing.",
          "Short training should focus on the customer conversation, campaign rules, evidence requirements and escalation scenarios. Field teams do not need a forty-slide history of the brand when they need to know what to do at 11:00 tomorrow morning.",
        ],
      },
      {
        id: "build-material-control",
        heading: "Build control around campaign materials",
        paragraphs: [
          "POSM, samples, devices and other assets can become a hidden source of campaign failure. Track what should reach each location, who receives it and what happens to unused or damaged material.",
          "For larger programmes, asset visibility should sit alongside workforce and outlet visibility so the team can distinguish a people problem from a material problem.",
        ],
      },
      {
        id: "capture-the-right-data",
        heading: "Capture only data that helps a decision",
        paragraphs: [
          "Field forms tend to grow over time because every stakeholder adds one more question. Long forms slow the activation and often reduce data quality. Ask whether each field changes a decision, validates execution or supports a required report.",
          "Useful campaign data often includes outlet, attendance, activity volume, stock or material status, customer response, evidence and exceptions. Keep the flow short enough that the field team can complete it reliably.",
        ],
        points: [
          "Coverage: did the planned outlet or venue receive execution?",
          "Activity: what was actually done?",
          "Response: what happened after the interaction?",
          "Quality: did the execution meet the campaign standard?",
        ],
      },
      {
        id: "run-a-post-campaign-review",
        heading: "Run a post-campaign review that improves the next activation",
        paragraphs: [
          "Do not end with a slide containing only total interactions. Compare what was planned with what happened, identify strong and weak locations, review operational blockers and capture what the field team learned from consumers and retailers.",
          "A campaign becomes more valuable when the operational learning survives after the activation ends.",
        ],
      },
    ],
  }),
  article({
    slug: "last-mile-execution-as-competitive-advantage",
    title: "Why last-mile execution is becoming a competitive advantage",
    category: "Industry Insights",
    excerpt:
      "Strategy can be centralised, but growth is often won locally. Here is why workforce coordination, verification and field intelligence increasingly matter to scaling businesses.",
    takeaway:
      "As businesses expand across locations, the advantage shifts from having a plan to being able to reproduce that plan consistently in the field.",
    sections: [
      {
        id: "strategy-meets-friction",
        heading: "The last mile is where strategy meets friction",
        paragraphs: [
          "A central team can design a strong campaign, hiring plan, merchant programme or retail standard. The result still depends on thousands of local moments: whether someone reaches the outlet, understands the brief, gets access, performs the task correctly and reports what happened.",
          "That gap between central intent and local reality is why execution capability becomes more important as a business scales geographically.",
        ],
      },
      {
        id: "local-variation",
        heading: "Local variation changes the operating problem",
        paragraphs: [
          "Cities differ in talent supply, travel time, retailer density, language, customer behaviour and infrastructure. A model that works in one market may need different staffing ratios or operating hours in another.",
          "Strong execution systems standardise the parts that should remain consistent while leaving room for local adaptation. The objective is not identical activity everywhere. It is consistent quality under different local conditions.",
        ],
      },
      {
        id: "visibility-compounds",
        heading: "Execution visibility compounds with scale",
        paragraphs: [
          "When a company operates in five locations, managers may solve problems through direct calls. At fifty or five hundred locations, that method collapses. Structured visibility becomes infrastructure: deployed workforce, task status, verification, exceptions and outcomes need to be available without manual chasing.",
          "This does not require turning every operation into a surveillance system. It requires collecting the minimum reliable signals needed to know where support is required.",
        ],
        points: [
          "Who is deployed and where?",
          "What work was expected and what was completed?",
          "What evidence confirms completion?",
          "Which exceptions need action and who owns them?",
        ],
      },
      {
        id: "flexible-capacity",
        heading: "Flexible capacity changes the economics of expansion",
        paragraphs: [
          "Businesses increasingly need temporary capacity for launches, peaks, audits, campaigns and market tests. A flexible workforce model can reduce the need to build a permanent team before demand is proven, provided quality and compliance are designed into the operating model.",
          "The value comes from matching capacity to work. Flexibility without control creates inconsistency; control without flexibility can make expansion slow and expensive.",
        ],
      },
      {
        id: "execution-as-learning",
        heading: "Treat execution as a source of market learning",
        paragraphs: [
          "Field teams see objections, store conditions, customer reactions and operational constraints before those signals appear in monthly reports. A structured feedback loop turns those observations into useful market intelligence.",
          "The organisations that learn fastest do not separate strategy from execution. They use execution data to refine the next hiring plan, campaign, territory, retail standard or expansion decision.",
        ],
      },
    ],
  }),
];
