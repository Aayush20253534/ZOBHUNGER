export const workerCategories = [
  {
    title: "Sales jobs",
    category: "Sales",
    description: "Field sales, customer outreach and territory support.",
  },
  {
    title: "Promoter jobs",
    category: "Promoter",
    description: "Product demonstrations, in-store activity and campaigns.",
  },
  {
    title: "Field jobs",
    category: "Field Work",
    description: "Outlet visits, retail audits and work on the ground.",
  },
  {
    title: "Marketing jobs",
    category: "Marketing",
    description: "Brand activity, customer engagement and market execution.",
  },
  {
    title: "Telecalling jobs",
    category: "Telecalling",
    description: "Customer conversations, lead follow-ups and phone support.",
  },
  {
    title: "Recruitment jobs",
    category: "Recruitment",
    description: "Candidate coordination, screening and interview support.",
  },
  {
    title: "Operations jobs",
    category: "Operations",
    description: "Back-office tasks, data work and everyday business support.",
  },
] as const;

export const workerJourney = [
  {
    title: "Create profile",
    description:
      "Bring your skills, preferred location and experience together.",
  },
  {
    title: "Find jobs",
    description: "Explore work by role, location and type of engagement.",
  },
  {
    title: "Apply",
    description: "Read the requirements and share your interest in a role.",
  },
  {
    title: "Get selected",
    description: "Complete the relevant screening and selection steps.",
  },
  {
    title: "Join",
    description: "Confirm the assignment and prepare for the work.",
  },
  {
    title: "Earn",
    description: "Work under the terms agreed for your assignment.",
  },
] as const;

export const jobCategories = workerCategories.map((item) => item.category);
export const jobTypes = [
  "Full-time",
  "Contract",
  "Project-based",
  "Part-time",
  "Gig",
] as const;

// Locations represented by the current demonstration catalogue. When integrating
// the backend, replace this list with the published location catalogue.
export const jobLocations = [
  "Bengaluru",
  "Delhi",
  "Lucknow",
  "Mumbai",
  "Prayagraj",
  "Pune",
] as const;
