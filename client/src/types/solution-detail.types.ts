import type { industries } from "@/data/industries";
import type { solutions } from "@/data/solutions";

export type SolutionSlug = (typeof solutions)[number]["slug"];
export type IndustrySlug = (typeof industries)[number]["slug"];

export interface SolutionContentItem {
  title: string;
  description: string;
}

export interface SolutionDetailContent {
  heading: string;
  description: string;
  bestFor: string;
  facts: readonly { label: string; value: string }[];
  servicesHeading: string;
  servicesDescription: string;
  services: readonly SolutionContentItem[];
  focus: {
    id: "who-we-hire" | "engagement-options" | "planning";
    label: string;
    heading: string;
    description: string;
    items: readonly SolutionContentItem[];
  };
  process: {
    heading: string;
    description: string;
    steps: readonly SolutionContentItem[];
  };
  industrySlugs: readonly IndustrySlug[];
  relatedSlugs: readonly SolutionSlug[];
  cta: { title: string; description: string; label: string };
}
