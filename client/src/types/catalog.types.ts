export type SolutionLeadKind = "workforce" | "digital";

export interface SolutionSummary {
  slug: string;
  title: string;
  label: string;
  description: string;
  services: readonly string[];
  leadKind: SolutionLeadKind;
}

export interface IndustrySummary {
  slug: string;
  title: string;
  description?: string;
}
