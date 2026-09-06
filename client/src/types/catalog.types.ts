export interface SolutionSummary {
  slug: string;
  title: string;
  label: string;
  description: string;
  services: readonly string[];
}

export interface IndustrySummary {
  slug: string;
  title: string;
  description?: string;
}
