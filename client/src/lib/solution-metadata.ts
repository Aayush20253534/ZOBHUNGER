import type { Metadata } from "next";
import { solutionDetails } from "@/data/solution-details";
import { getPageMetadata } from "@/lib/page-metadata";
import type { SolutionSlug } from "@/types/solution-detail.types";

export function getSolutionMetadata(slug: SolutionSlug): Metadata {
  const { heading, description } = solutionDetails[slug];
  return getPageMetadata(heading.replace(/\.$/, ""), description, `/${slug}`);
}
