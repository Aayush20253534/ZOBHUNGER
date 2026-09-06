import type { SolutionSlug } from "@/types/solution-detail.types";

export interface IndustryContentItem {
  title: string;
  description: string;
}

export interface IndustryService extends IndustryContentItem {
  solutionSlug: SolutionSlug;
}

export interface IndustryDetailContent {
  heading: string;
  description: string;
  summary: string;
  context: readonly { label: string; value: string }[];
  servicesHeading: string;
  servicesDescription: string;
  services: readonly IndustryService[];
  scenariosHeading: string;
  scenarios: readonly IndustryContentItem[];
  briefDescription: string;
  briefItems: readonly IndustryContentItem[];
  cta: { title: string; description: string; label: string };
}
