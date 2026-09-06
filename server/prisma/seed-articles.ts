/** Original editorial samples for layout review, not approved company publications. */
export interface SeedArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
  points?: string[];
}

export interface SeedArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingMinutes: number;
  takeaway: string;
  sections: SeedArticleSection[];
  isPublished: boolean;
  isSample: boolean;
}

function guide(
  input: Omit<SeedArticle, "readingMinutes" | "isPublished" | "isSample">,
): SeedArticle {
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
    readingMinutes: Math.max(1, Math.ceil(words / 200)),
    isPublished: true,
    isSample: true,
  };
}

export const seedArticles: SeedArticle[] = [
  guide({
    slug: "write-a-clear-workforce-brief",
    title: "A better team starts with a clearer brief.",
    category: "Hiring Trends",
    excerpt:
      "Turn a request for more people into a practical plan for roles, locations and the work ahead.",
    takeaway:
      "Agree what the team needs to do before deciding how many people to hire.",
    sections: [
      {
        id: "start-with-the-work",
        heading: "Start with the work, then the role",
        paragraphs: [
          "A job title can mean different things across businesses. Before asking for a field executive or a promoter, describe a typical working day. Who will the person meet? What needs to be completed? What information should come back to the team?",
          "Separate essential responsibilities from tasks that would simply be helpful. That distinction gives the sourcing conversation a clearer starting point and makes candidate discussions more consistent.",
        ],
      },
      {
        id: "make-the-brief-useful",
        heading: "Make the brief useful to everyone involved",
        paragraphs: [
          "Give the hiring and delivery teams the same version of the requirement. Include the operating context, not just the headcount. If something is undecided, mark it as a question instead of allowing different teams to make different assumptions.",
        ],
        points: [
          "Roles, responsibilities and essential skills",
          "Locations, schedules and reporting relationships",
          "Team size, duration and expected start",
          "Equipment, training and support needed for the assignment",
        ],
      },
      {
        id: "review-before-sourcing",
        heading: "Review the open questions before sourcing",
        paragraphs: [
          "A short review can identify missing details such as travel expectations or the person responsible for onboarding. Keep a named owner for changes to the brief. When the requirement changes, share the update with everyone working on it rather than relying on a separate conversation.",
        ],
      },
    ],
  }),
  guide({
    slug: "agree-useful-work-updates",
    title: "Make work updates useful to the people reading them.",
    category: "Workforce Management",
    excerpt:
      "Choose the information, frequency and ownership of updates before an assignment begins.",
    takeaway:
      "Every recurring update should help someone understand progress or make a decision.",
    sections: [
      {
        id: "define-the-purpose",
        heading: "Define the purpose of each update",
        paragraphs: [
          "An attendance record, a task update and a project review answer different questions. Treating them as one report can leave the reader with lots of information and little clarity. Start by asking what each person needs to know and what they will do with that information.",
          "The useful reporting rhythm depends on the assignment. A daily operating task may need a different review cycle from a short campaign. Agree that rhythm with the people doing and managing the work.",
        ],
      },
      {
        id: "agree-a-format",
        heading: "Agree a small, repeatable format",
        paragraphs: [
          "Use a consistent set of fields so updates can be understood without a fresh explanation each time. Keep room for context when a task cannot be completed as planned.",
        ],
        points: [
          "The assignment, location and reporting period",
          "Work completed against the agreed plan",
          "Open issues and the support needed",
          "The person responsible for the next action",
        ],
      },
      {
        id: "close-the-loop",
        heading: "Close the loop after a review",
        paragraphs: [
          "A report is more useful when a concern receives a response. Record who will act on a blocker and when the team will review it again. Revisit the format after the first few reporting cycles: remove information nobody uses and clarify fields that different people interpret differently.",
        ],
      },
    ],
  }),
  guide({
    slug: "define-the-sales-role",
    title: "Define the sales role before building the sales team.",
    category: "Sales Hiring",
    excerpt:
      "Bring the customer, territory and sales activity into the hiring conversation.",
    takeaway:
      "Screen against the real sales assignment, using the same expectations for every candidate.",
    sections: [
      {
        id: "describe-the-assignment",
        heading: "Describe the sales assignment",
        paragraphs: [
          "Inside sales, field sales and channel development involve different working environments. Describe the customer the team will speak to, the product or service they will explain and the stage of the sales conversation they will own.",
          "Include the practical context too. A territory plan, expected travel and the language needed for customer conversations can be as relevant to the brief as previous experience.",
        ],
      },
      {
        id: "make-screening-consistent",
        heading: "Make screening consistent",
        paragraphs: [
          "Prepare role-relevant questions before reviewing candidates. A discussion about how someone prepares for a customer meeting can be more useful when everyone is given the same scenario and evaluated against the same expectations.",
        ],
        points: [
          "Customer type and territory responsibilities",
          "Product knowledge needed at joining",
          "Communication and follow-up expectations",
          "The support and reporting structure available",
        ],
      },
      {
        id: "prepare-the-first-week",
        heading: "Prepare the first week of work",
        paragraphs: [
          "Confirm who will provide the product briefing, introduce the reporting tools and answer questions from the new team. Give people a clear route for escalating customer issues. Review the assignment after joining so the team and the business can resolve gaps in the original brief.",
        ],
      },
    ],
  }),
  guide({
    slug: "plan-a-short-term-assignment",
    title: "Give a short assignment a complete brief.",
    category: "Gig Economy",
    excerpt:
      "Short projects still need clear tasks, working arrangements and a shared definition of completion.",
    takeaway:
      "A short duration should make the scope clearer, not leave it open to interpretation.",
    sections: [
      {
        id: "set-the-boundaries",
        heading: "Set the boundaries of the assignment",
        paragraphs: [
          "Start with the task and its expected result. Describe where the work happens, the period of engagement and which activities are included. If the requirement could expand, explain how a change will be discussed rather than assuming additional tasks fit the original brief.",
          "A clear brief is useful to the person completing the assignment and to the person reviewing it. Both should understand what completion looks like.",
        ],
      },
      {
        id: "confirm-the-practical-details",
        heading: "Confirm the practical details",
        paragraphs: [
          "Before work begins, agree the arrangements directly with the people involved. Keep unresolved details visible so they can be settled before the assignment starts.",
        ],
        points: [
          "Tasks, locations and working schedules",
          "Tools, access and any necessary briefing",
          "The contact for questions or changes",
          "Agreed engagement terms and the completion review",
        ],
      },
      {
        id: "review-and-handover",
        heading: "Plan the review and handover",
        paragraphs: [
          "For a short project, the handover may be as simple as a task summary and a list of open items. Decide who receives it and how completion will be reviewed. Capture changes made during the assignment so the next person or team receives the current picture.",
        ],
      },
    ],
  }),
  guide({
    slug: "prepare-a-retail-visit-checklist",
    title: "Build a retail visit checklist around the store.",
    category: "Retail Execution",
    excerpt:
      "Connect outlet visits, observations and follow-up actions with the purpose of the campaign.",
    takeaway:
      "A store visit should leave the team with clear observations and an owner for follow-up.",
    sections: [
      {
        id: "define-the-visit",
        heading: "Define what the visit is for",
        paragraphs: [
          "A merchandising check and a product demonstration have different purposes. Explain the objective of the outlet visit before creating a checklist. The team needs to know which observations matter and which activities have been agreed with the store.",
          "Check the location, visit schedule and appropriate store contact. That preparation gives the person visiting a practical starting point and reduces avoidable uncertainty on arrival.",
        ],
      },
      {
        id: "choose-the-checks",
        heading: "Choose the checks that support the objective",
        paragraphs: [
          "Keep the checklist specific enough that different people can use it consistently. Where a check cannot be completed, allow the team to record a reason and the support needed.",
        ],
        points: [
          "Outlet details and the purpose of the visit",
          "Agreed display, availability or activity checks",
          "Observations recorded in the agreed format",
          "Store feedback, unresolved issues and next actions",
        ],
      },
      {
        id: "use-the-observations",
        heading: "Use the observations after the visit",
        paragraphs: [
          "A completed checklist is the start of the follow-up. Decide which issues the field team can resolve and which need another owner. Review recurring questions with the team and update the brief when the store context changes. Keep the format useful for the next visit.",
        ],
      },
    ],
  }),
  guide({
    slug: "brief-a-promoter-campaign",
    title: "Give every promoter the same campaign starting point.",
    category: "Trade Marketing",
    excerpt:
      "Align the product story, customer interaction and day-to-day campaign coordination.",
    takeaway:
      "A shared campaign briefing helps the team represent the product consistently.",
    sections: [
      {
        id: "align-the-message",
        heading: "Align the product message",
        paragraphs: [
          "A campaign brief should explain the product, the intended audience and the purpose of the interaction. Give promoters the approved information they can share and a clear contact for questions they cannot answer.",
          "Walk through the interaction from greeting to handover. The aim is to make the team comfortable with the product story and the activity, while leaving room for a natural customer conversation.",
        ],
      },
      {
        id: "prepare-the-location",
        heading: "Prepare the location and working arrangements",
        paragraphs: [
          "Confirm the venue or outlet arrangements alongside the people plan. Materials, schedules and local coordination belong in the same brief as the campaign message.",
        ],
        points: [
          "Locations, dates and the activity schedule",
          "Approved product information and demonstration materials",
          "On-site contacts and the route for raising issues",
          "The activity updates the campaign team needs",
        ],
      },
      {
        id: "learn-from-the-team",
        heading: "Learn from the team during the campaign",
        paragraphs: [
          "Give promoters a simple way to share repeated customer questions and practical issues. Review these observations with the campaign owner. When a briefing changes, communicate the same update to every location so the next activity starts from a shared understanding.",
        ],
      },
    ],
  }),
  guide({
    slug: "adapt-your-brief-to-the-industry",
    title: "The same role can mean different work in another industry.",
    category: "Industry Insights",
    excerpt:
      "Use your operating environment to shape responsibilities, skills and the support a team needs.",
    takeaway:
      "Use the industry as context, then define the specific assignment rather than relying on a job title.",
    sections: [
      {
        id: "explain-the-setting",
        heading: "Explain the operating setting",
        paragraphs: [
          "An operations role in a retail environment will not necessarily match an operations role in a remote support team. Explain where the work takes place, who the team interacts with and which part of the business depends on the assignment.",
          "Use examples from a normal working day. They help a hiring or execution partner understand the setting without assuming that a familiar job title covers every detail.",
        ],
      },
      {
        id: "identify-the-differences",
        heading: "Identify what makes the assignment different",
        paragraphs: [
          "Discuss the practical conditions alongside the skills. A useful brief makes it clear which knowledge is essential on day one and which topics will be covered during onboarding.",
        ],
        points: [
          "Customer, outlet or internal team interactions",
          "The working environment and equipment involved",
          "Schedules, location coverage and coordination",
          "Role-specific induction and supervision needs",
        ],
      },
      {
        id: "connect-the-services",
        heading: "Connect the services around the work",
        paragraphs: [
          "Some requirements combine hiring with training, field activity or ongoing coordination. Set out which parts are needed and who owns each one. This gives the business a way to review the whole assignment while keeping individual responsibilities clear.",
        ],
      },
    ],
  }),
];
