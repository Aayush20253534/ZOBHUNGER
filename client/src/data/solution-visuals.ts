import type { SolutionSlug } from "@/types/solution-detail.types";

export interface SolutionVisualProfile {
  eyebrow: string;
  title: string;
  description: string;
  stages: readonly [string, string, string, string];
  workModes: readonly [string, string, string];
}

export const solutionVisuals: Record<SolutionSlug, SolutionVisualProfile> = {
  "verification-services": {
    eyebrow: "Verification execution",
    title: "From information to a clear, documented review.",
    description: "Connect the agreed checks, source information and field visits with a structured report for your team's decision.",
    stages: ["Scope", "Check", "Review", "Report"],
    workModes: ["People", "Documents", "Field checks"],
  },
  "workforce-solutions": {
    eyebrow: "Workforce execution",
    title: "From requirement to ready-to-deploy people.",
    description:
      "Turn roles, locations and timelines into a structured sourcing, screening and deployment workflow.",
    stages: ["Requirement", "Source", "Screen", "Deploy"],
    workModes: ["Permanent", "Contract", "Project"],
  },
  "sales-force": {
    eyebrow: "Sales execution",
    title: "Build the team around the market you need to cover.",
    description:
      "Connect hiring, preparation, territory deployment and activity review in one sales execution flow.",
    stages: ["Territory", "Hire", "Activate", "Track"],
    workModes: ["Field sales", "Telesales", "Lead generation"],
  },
  "promoter-solutions": {
    eyebrow: "Promoter execution",
    title: "Put trained people where customers meet your brand.",
    description:
      "Shape the promoter team around the product, venue, audience and duration of the activity.",
    stages: ["Campaign", "Brief", "Deploy", "Engage"],
    workModes: ["In-store", "Events", "Campaigns"],
  },
  "retail-execution": {
    eyebrow: "Retail execution",
    title: "Turn store visits into structured on-ground action.",
    description:
      "Plan outlet coverage, carry out the agreed retail activity and bring field observations back into reporting.",
    stages: ["Outlet plan", "Visit", "Execute", "Report"],
    workModes: ["Merchandising", "Audits", "Surveys"],
  },
  "brand-activation": {
    eyebrow: "Activation execution",
    title: "Move from campaign brief to customer interaction.",
    description:
      "Connect audience, location, people and activity so the campaign can be executed consistently on ground.",
    stages: ["Audience", "Plan", "Activate", "Review"],
    workModes: ["Sampling", "BTL", "Roadshows"],
  },
  "business-operations": {
    eyebrow: "Operations execution",
    title: "Add coordinated capacity behind day-to-day work.",
    description:
      "Define the workflow first, then build and coordinate the team around responsibilities, hand-offs and review points.",
    stages: ["Workflow", "Hire", "Onboard", "Coordinate"],
    workModes: ["Support", "Back office", "Remote teams"],
  },
  "website-application-development": {
    eyebrow: "Digital product delivery",
    title: "From business idea to a product ready to launch.",
    description:
      "Connect discovery, design, engineering and launch so the website or application is built around a real user and business need.",
    stages: ["Discover", "Design", "Build", "Launch"],
    workModes: ["Website", "Web app", "Mobile app"],
  },
  "gig-workforce": {
    eyebrow: "Flexible execution",
    title: "Match short-duration work with a clear assignment flow.",
    description:
      "Define the task, find available people, brief the assignment and review completed work without overbuilding the engagement.",
    stages: ["Task", "Match", "Brief", "Deliver"],
    workModes: ["Daily", "Seasonal", "Project"],
  },
};
